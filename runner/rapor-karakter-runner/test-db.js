import { db } from './src/db/index.js'
import { formSubmissions } from './src/db/schema.js'
import { eq } from 'drizzle-orm'

async function run() {
  const [submission] = await db.select().from(formSubmissions).where(eq(formSubmissions.id, 6)).limit(1)
  console.log(JSON.stringify(submission, null, 2))
}
run()
