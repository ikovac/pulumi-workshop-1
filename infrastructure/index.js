'use strict';

const pulumi = require('@pulumi/pulumi');
const aws = require('@pulumi/aws');
const awsx = require('@pulumi/awsx');
const mime = require('mime');
const path = require('path');
const readDirRecursive = require('fs-readdir-recursive');
const command = require('@pulumi/command');

const config = new pulumi.Config('db');

const vpc = new awsx.ec2.Vpc('vpc', {
  numberOfAvailabilityZones: 2,
  tags: { Name: 'pulumi-workshop-vpc' }
});

const dbSecurityGroup = new aws.ec2.SecurityGroup('db-security-group', {
  vpcId: vpc.id,
  ingress: [{
    protocol: 'tcp',
    fromPort: 5432,
    toPort: 5432,
    cidrBlocks: ['0.0.0.0/0']
  }]
});

const dbSubnetGroup = new aws.rds.SubnetGroup('db-subnet-group', {
  subnetIds: vpc.publicSubnetIds
});

const db = new aws.rds.Instance('postgres-db', {
  identifier: 'pulumi-workshop',
  allocatedStorage: 20,
  dbSubnetGroupName: dbSubnetGroup.name,
  engine: 'postgres',
  engineVersion: '13.3',
  instanceClass: 'db.t3.micro',
  publiclyAccessible: true,
  skipFinalSnapshot: true,
  maintenanceWindow: 'Mon:07:00-Mon:07:30',
  vpcSecurityGroupIds: [dbSecurityGroup.id],
  name: config.require('name'),
  username: config.require('user'),
  password: config.requireSecret('password'),
});

const listener = new awsx.elasticloadbalancingv2.NetworkListener('nginx', {
  port: 3000,
  vpc
});

const cluster = new awsx.ecs.Cluster('cluster', {
  vpc,
  name: 'pulumi-workshop-cluster'
});

// WARNING: Docker image must be built for linux!!!
const service = new awsx.ecs.FargateService('server', {
  desiredCount: 1,
  subnets: vpc.publicSubnetIds,
  cluster,
  taskDefinitionArgs: {
    container: {
      image: 'ikovac01/pulumi-workshop-server:latest',
      memory: 512,
      portMappings: [listener],
      environment: [
        { name: 'DATABASE_HOST', value: db.address },
        { name: 'DATABASE_PORT', value: db.port.apply(port => String(port)) },
        { name: 'DATABASE_NAME', value: db.dbName },
        { name: 'DATABASE_USER', value: db.username },
        { name: 'DATABASE_PASSWORD', value: db.password }
      ]
    }
  }
});

const addServerUrlEnv = new command.local.Command('add-server-url-env', {
  create: listener.endpoint.hostname.apply(host => {
    return `echo VITE_SERVER_URL=http://${host}:3000 > .env`;
  }),
  dir: '../app/frontend'
});

const buildClient = new command.local.Command('build-frontend', {
  create: 'npm run build',
  dir: '../app/frontend'
}, { dependsOn: [addServerUrlEnv] });

const siteBucket = new aws.s3.Bucket('site-bucket', {
  bucket: 'pulumi-workshop-frontend',
  website: {
    indexDocument: 'index.html',
    errorDocument: 'index.html'
  }
}, { dependsOn: [buildClient] });

const siteBucketPolicy = new aws.s3.BucketPolicy('bucket-policy', {
  bucket: siteBucket.bucket,
  policy: siteBucket.bucket.apply(publicReadPolicyForBucket)
});

class DeployFrontend extends pulumi.ComponentResource {
  constructor(name, args, options) {
    super('aws:s3:deploy-frontend', name, args, options);
    const { dir, bucket } = args;
    const files = readDirRecursive(dir);
    console.log('Files: ', files);
    files.forEach(file => {
      const filePath = path.relative(process.cwd(), path.join(dir, file));
      const object = new aws.s3.BucketObject(file, {
        key: file,
        bucket,
        source: new pulumi.asset.FileAsset(filePath),
        contentType: mime.getType(filePath)
      }, { parent: this });
    });

    this.registerOutputs();
  }
}

siteBucket.id.apply(bucket => {
  const deployFrontend = new DeployFrontend('deploy-frontend', {
    dir: '../app/frontend/dist',
    bucket
  });
});

function publicReadPolicyForBucket(name) {
  return {
    Version: '2012-10-17',
    Statement: [{
      Effect: 'Allow',
      Principal: '*',
      Action: ['s3:GetObject'],
      Resource: [`arn:aws:s3:::${name}/*`]
    }]
  };
}

exports.endpoint = pulumi.interpolate `http://${listener.endpoint.hostname}:3000`;
exports.bucketName = siteBucket.id;
exports.bucketUrl = pulumi.interpolate `http://${siteBucket.websiteEndpoint}`
exports.dbHost = db.address;
