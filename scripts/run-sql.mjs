import { readFile } from 'node:fs/promises'
import { Client } from 'pg'

const [, , file] = process.argv
if (!file) {
  console.error('Usage: node scripts/run-sql.mjs <path-to-sql-file>')
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

const sql = await readFile(file, 'utf8')
const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } })
await client.connect()
try {
  await client.query(sql)
  console.log(`OK: ${file}`)
} catch (err) {
  console.error(`FAIL: ${file}`)
  console.error(err.message)
  process.exitCode = 1
} finally {
  await client.end()
}
