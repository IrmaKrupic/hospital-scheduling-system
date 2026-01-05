const { Pool } = require('pg');
require('dotenv').config();

// Use standard PostgreSQL connection for Node.js backend
// For serverless/edge runtime, you would use @neondatabase/serverless
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false },
  // Connection pool settings
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection could not be established
});

// Handle pool errors gracefully without killing the server
pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err.message);
  // Don't exit - let the server continue and try to reconnect on next query
});

// Handle client errors
pool.on('connect', (client) => {
  client.on('error', (err) => {
    console.error('Database client error:', err.message);
  });
});

// Helper function for queries
const query = async (text, params) => {
  try {
    const res = await pool.query(text, params);
    return res.rows; // Return rows array for compatibility
  } catch (error) {
    console.error('Query error:', error.message);
    throw error;
  }
};

// Tagged template literal support
const tag = async (strings, ...values) => {
  let text = strings[0];
  const params = [];
  
  for (let i = 0; i < values.length; i++) {
    params.push(values[i]);
    text += `$${params.length}`;
    if (strings[i + 1]) {
      text += strings[i + 1];
    }
  }
  
  return query(text, params);
};

// Export both query function and tagged template function
// Default export is the tagged template function (sql``)
// Named exports include query and pool
const sql = tag;
sql.query = query;
sql.pool = pool;

module.exports = sql;
module.exports.query = query;
module.exports.pool = pool;
