import {Pool} from '@neondatabase/serverless';

let pool;

function toPostgres(sql) {
  let index = 0;
  return sql
    .replace(/\?/g, () => `$${++index}`)
    .replace(/\bNOW\(\)/gi, 'CURRENT_TIMESTAMP');
}

export function db() {
  if (!pool) {
    if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not configured.');
    pool = new Pool({connectionString: process.env.DATABASE_URL, max: 5});
  }
  return {
    async getConnection() {
      const client = await pool.connect();
      return {
        query: (sql, params = []) => client.query(toPostgres(sql), params),
        execute: (sql, params = []) => client.query(toPostgres(sql), params),
        beginTransaction: () => client.query('BEGIN'),
        commit: () => client.query('COMMIT'),
        rollback: () => client.query('ROLLBACK'),
        release: () => client.release(),
      };
    },
  };
}

export async function query(sql, params = []) {
  const result = await poolOrInit().query(toPostgres(sql), params);
  return result.rows;
}

function poolOrInit() {
  if (!pool) {
    if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not configured.');
    pool = new Pool({connectionString: process.env.DATABASE_URL, max: 5});
  }
  return pool;
}
