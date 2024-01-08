const pgp = require('pg-promise')({});
require('dotenv').config();

const db = pgp({
  host: process.env.AWS_HOST,
  user: process.env.AWS_USER,
  password: process.env.AWS_PASSWORD,
  port: process.env.AWS_PORT,
  database: process.env.AWS_DB_NAME,
  ssl: {
    rejectUnauthorized: false,
  },
});

module.exports = { db, pgp };
