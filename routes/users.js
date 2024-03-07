const express = require('express');
const { keysToCamel } = require('../common/utils');
const { db } = require('../server/db');

const userRouter = express.Router();

const admin = require('../firebase');

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
    const pendingAccounts = await db.query(
      `SELECT * FROM users WHERE approved = FALSE ORDER BY first_name ASC;`,
    );
    res.status(200).json(keysToCamel(pendingAccounts));
  } catch (err) {
    res.status(500).send(err.message);
  }
});

userRouter.get('/approved-accounts', async (req, res) => {
  try {
    const pendingAccounts = await db.query(
      `SELECT * FROM users WHERE approved = TRUE ORDER BY first_name ASC;`,
    );
    res.status(200).json(keysToCamel(pendingAccounts));
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// logInWithEmailAndPassword() needs to get specific user id
userRouter.get('/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    const user = await db.query(`SELECT * FROM users WHERE id = $1;`, [uid]);
    res.status(200).json(keysToCamel(user));
  } catch (err) {
    res.status(500).send(err.message);
  }
});

userRouter.post('/create', async (req, res) => {
  try {
    const { id, email, type, approved, approvedOn, firstName, lastName } = req.body;
    await db.query(
      `INSERT INTO users (id, email, "type", approved, approved_on, first_name, last_name) VALUES ($1, $2, $3, $4, $5, $6, $7);`,
      [id, email, type, approved, approvedOn, firstName, lastName],
    );
    res.status(201).json({
      id,
    });
  } catch (err) {
    res.status(500).json({
      status: 'Failed',
      msg: err.message,
    });
  }
});

userRouter.put('/approve/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    const currDate = new Date();
    const updatedApproval = await db.query(
      `UPDATE users SET approved = TRUE, approved_on = $1 WHERE id = $2 RETURNING *;`,
      [currDate, uid],
    );
    return res.status(200).send(keysToCamel(updatedApproval));
  } catch (err) {
    return res.status(500).send(err.message);
  }
});

userRouter.delete('/:uid', async (req, res) => {
  try {
    const { uid } = req.params;

    // Firebase delete
    await admin.auth().deleteUser(uid);

    const deletedUser = await db.query(`DELETE FROM users WHERE id = $1 RETURNING *;`, [uid]);
    res.status(200).send(keysToCamel(deletedUser));
  } catch (err) {
    res.status(500).send(err.message);
  }
});

module.exports = userRouter;
