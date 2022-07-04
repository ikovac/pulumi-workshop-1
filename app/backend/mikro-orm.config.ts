import * as dotenv from 'dotenv';
import Post from './src/entity';

dotenv.config();

const {
  DATABASE_HOST,
  DATABASE_PORT,
  DATABASE_NAME,
  DATABASE_USER,
  DATABASE_PASSWORD
} = process.env;

export default {
  type: 'postgresql',
  host: DATABASE_HOST,
  port: Number(DATABASE_PORT),
  dbName: DATABASE_NAME,
  user: DATABASE_USER,
  password: DATABASE_PASSWORD,
  entities: [Post],
  migrations: {
    path: `${process.cwd()}/src/database/migrations`,
    disableForeignKeys: false,
    pattern: /^\d+[\w-]+\.ts$/,
    fileName: (timestamp: string) => `${timestamp}-new-migration`
  }
};