const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  query_timeout: 10000,    // fail queries that never get a server response
  statement_timeout: 10000, // cancel server-side statements after 10s
});

pool.on('connect', () => {
  console.log('New client connected to PostgreSQL');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
});

/**
 * Execute a query with optional parameters.
 * @param {string} text  - SQL query string
 * @param {Array}  params - query parameters
 * @returns {Promise<QueryResult>}
 */
const query = async (text, params) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === 'development') {
      console.log('Executed query', { text: text.substring(0, 80), duration, rows: result.rowCount });
    }
    return result;
  } catch (err) {
    console.error('Database query error:', err.message, { text: text.substring(0, 80) });
    throw err;
  }
};

/**
 * Get a client from the pool for transactions.
 * @returns {Promise<PoolClient>}
 */
const getClient = async () => {
  const client = await pool.connect();
  const release = client.release.bind(client);

  // Warn if a client is held for more than 5 seconds without being released
  const timeout = setTimeout(() => {
    console.error('A client has been checked out for more than 5 seconds!');
  }, 5000);

  client.release = (err) => {
    clearTimeout(timeout);
    client.release = release; // restore original so double-release is safe
    return release(err);
  };

  return client;
};

module.exports = { query, getClient, pool };
