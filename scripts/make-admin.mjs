import { readFile } from 'node:fs/promises'
import { Client } from 'pg'

const email = process.argv[2]
if (!email) {
  console.error('Usage: node scripts/make-admin.mjs <email>')
  process.exit(1)
}

// Read PG_CONNECTION_STRING from .env.local if it isn't already in the environment.
if (!process.env.PG_CONNECTION_STRING) {
  try {
    const env = await readFile('.env.local', 'utf8')
    const line = env.split('\n').find(l => l.startsWith('PG_CONNECTION_STRING='))
    if (line) process.env.PG_CONNECTION_STRING = line.slice('PG_CONNECTION_STRING='.length).trim()
  } catch {}
}

const connectionString = process.env.PG_CONNECTION_STRING
if (!connectionString) {
  console.error('PG_CONNECTION_STRING env var required')
  process.exit(1)
}

const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } })
await client.connect()
try {
  const res = await client.query(
    `update profiles set role = 'admin'
     where id = (select id from auth.users where email = $1)`,
    [email],
  )
  if (res.rowCount === 0) console.log(`No account found for ${email}`)
  else console.log(`${email} is now an admin`)
} catch (err) {
  console.error(`Failed: ${err.message}`)
  process.exitCode = 1
} finally {
  await client.end()
}
