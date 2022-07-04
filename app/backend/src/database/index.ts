import { MikroORM } from '@mikro-orm/core';
import type { PostgreSqlDriver } from '@mikro-orm/postgresql';
import Post from '../entity';

function connect() {
  const {
    DATABASE_HOST,
    DATABASE_PORT,
    DATABASE_NAME,
    DATABASE_USER,
    DATABASE_PASSWORD
  } = process.env;

  return MikroORM.init<PostgreSqlDriver>({
    entities: [Post],
    type: 'postgresql',
    host: DATABASE_HOST,
    port: Number(DATABASE_PORT),
    dbName: DATABASE_NAME,
    user: DATABASE_USER,
    password: DATABASE_PASSWORD
  });
}

export default { connect };
