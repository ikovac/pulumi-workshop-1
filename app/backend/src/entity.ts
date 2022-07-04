import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity()
class Post {
  @PrimaryKey()
  id: number;

  @Property()
  title: string;

  @Property()
  content: string;

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();
  
  constructor(title: string, content: string) {
    this.title = title;
    this.content = content;
  }
}

export default Post;