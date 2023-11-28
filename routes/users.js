const express = require('express');
const { keysToCamel } = require('../common/utils');
const { db } = require('../server/db');

const userRouter = express.Router();

userRouter.get('/', async (req, res) => {
  try {
    const allUsers = await db.query(`SELECT * FROM users;`);
    res.status(200).json(keysToCamel(allUsers));
  } catch (err) {
    console.log(err);
    res.status(500).send(err.message);
  }
});


userRouter.get('/pending-accounts', async (req, res) => {
  try {
    const pendingAccounts = await db.query(`SELECT * FROM users WHERE approved = FALSE;`);
    res.status(200).json(keysToCamel(pendingAccounts));
  } catch (err) {
    console.log(err);
    res.status(500).send(err.message);
  }
});


userRouter.post('/', async (req, res) => {
  try {
    const { id, email, type, approved } = req.params;
  } catch (err) {

  }
});

userRouter.put('/:uid', async (req, res) => {
  try {

  } catch (err) {

  }
});

userRouter.delete('/:uid', async (req, res) => {
  try {

  } catch (err) {

  }
});
