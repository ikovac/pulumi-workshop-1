import { Migration } from '@mikro-orm/migrations';

export class Migration20220703165109 extends Migration {
  async up(): Promise<void> {
    const knex = this.getKnex();

    const createPostTable = knex.schema.createTable('post', table => {
      table.increments('id');
      table.string('title').notNullable();
      table.string('content').notNullable();
      table.timestamp('created_at', { useTz: true })
        .notNullable()
        .defaultTo(knex.fn.now());
      table.timestamp('updated_at', { useTz: true })
        .notNullable()
        .defaultTo(knex.fn.now());
    });

    this.addSql(createPostTable.toQuery());
  }

  async down(): Promise<void> {
    const knex = this.getKnex();
    this.addSql(knex.schema.dropTable('post').toQuery());
  }
}
