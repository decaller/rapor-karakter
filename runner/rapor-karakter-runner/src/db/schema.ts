import { pgTable, serial, text, timestamp, jsonb } from 'drizzle-orm/pg-core'

export const todos = pgTable('todos', {
  id: serial().primaryKey(),
  title: text().notNull(),
  createdAt: timestamp('created_at').defaultNow(),
})

export const formSubmissions = pgTable('form_submissions', {
  id: serial().primaryKey(),
  formId: text('form_id').notNull(),
  sessionId: text('session_id'),
  reportId: text('report_id'),
  reportUrl: text('report_url'),
  data: jsonb('data').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
})
