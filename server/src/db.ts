import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: 'tiri',
  host: 'localhost',
  database: 'tictactoe_db',
  password: '1584254900',
  port: 5432,
});

export default pool;