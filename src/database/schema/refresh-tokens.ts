import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { usuarios } from './usuarios';
import { sql } from 'drizzle-orm';

export const refreshTokens = sqliteTable('refresh_tokens', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  token: text('token').notNull().unique(),
  usuarioId: integer('usuario_id')
    .references(() => usuarios.id)
    .notNull(),
  expiresAt: text('expires_at').notNull(),
  revoked: integer('revoked', { mode: 'boolean' }).default(false),
  createdAt: text('created_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});
