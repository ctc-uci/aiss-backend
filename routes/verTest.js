const express = require('express');
const { keysToCamel } = require('../common/utils');
const { db } = require('../server/db');

const testRouter = express();

testRouter.get('/', async (req, res) => {
  try {
    const allUsers = await db.query(`SELECT * FROM users;`);
    res.status(200).json(keysToCamel(allUsers));
  } catch (err) {
    res.status(500).send(err.message);
  }
});

module.exports = testRouter;
