import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import { RequestContext } from '@mikro-orm/core';
import database from './database';
import * as dotenv from 'dotenv';
import Post from './entity';

dotenv.config();

(async function main() {
  const app = express();
  const orm = await database.connect();
  const postRepository = orm.em.getRepository(Post);

  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use((req, res, next) => {
    RequestContext.create(orm.em, next);
  });

  const router = express.Router();
  router.get('/', async (req, res) => {
    const posts = await postRepository.findAll();
    return res.json({ data: posts });
  });

  router.post('/', async (req, res) => {
    const { title, content } = req.body;
    const post = new Post(title, content);
    await postRepository.persistAndFlush(post);
    res.json({ data: post });
  });

  app.use('/api/posts', router);

  app.listen(3000, () => {
    console.log('App is listening on port 3000');
  });
})();
