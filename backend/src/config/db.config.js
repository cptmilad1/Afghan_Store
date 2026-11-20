const { Pool } = require('pg');
const config = require('./env');

const pool = new Pool({
  host: config.db.host || "localhost",
  port: config.db.port || 6000,
  database: 'Afgan-connect',
  user: 'postgres',
  password: "postgres",
  ssl: config.db.ssl ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err.message);
});

const query = (text, params = []) => pool.query(text, params);

const withTransaction = async (callback) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  pool,
  query,
  withTransaction,
};
