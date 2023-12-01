const express = require('express');
const { keysToCamel } = require('../common/utils');
const { db } = require('../server/db');

const userRouter = express.Router();

userRouter.get('/', async (req, res) => {
  try {
    const allUsers = await db.query(`SELECT * FROM users;`);
    res.status(200).json(keysToCamel(allUsers));
  } catch (err) {
    res.status(500).send(err.message);
  }
});

userRouter.get('/pending-accounts', async (req, res) => {
  try {
    const pendingAccounts = await db.query(`SELECT * FROM users WHERE approved = FALSE;`);
    res.status(200).json(keysToCamel(pendingAccounts));
  } catch (err) {
    res.status(500).send(err.message);
  }
});

userRouter.post('/', async (req, res) => {
  try {
    const { id, email, type, approved } = req.body;
    await db.query(`INSERT INTO users (id, email, "type", approved) VALUES ($1, $2, $3, $4);`, [
      id,
      email,
      type,
      approved,
    ]);
    res.status(201).json({
      status: 'Success',
    });
  } catch (err) {
    res.status(500).json({
      status: 'Failed',
      msg: err.message,
    });
  }
});

userRouter.put('/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    const updatedApproval = await db.query(
      `UPDATE users SET approved = TRUE WHERE id = $1 RETURNING *;`,
      [uid],
    );
    return res.status(200).send(updatedApproval[0]);
  } catch (err) {
    return res.status(500).send(err.message);
  }
});

userRouter.delete('/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    await db.query(`DELETE FROM users WHERE id = $1;`, [uid]);
    res.status(200).send('Deleted user');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

module.exports = userRouter;
