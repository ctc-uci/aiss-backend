const express = require('express');
const { keysToCamel, isInteger } = require('../common/utils');
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

userRouter.get('/pending-accounts', async (req, res) => {
  try {
    const { accountType } = req.query;
    let queryString = 'SELECT * FROM users WHERE approved = FALSE ';
    if (accountType === 'admin') {
      queryString += `AND type = 'admin'`;
    } else if (accountType === 'student') {
      queryString += `AND type = 'student'`;
    }
    const pendingAccounts = await db.query(`${queryString} ORDER BY first_name ASC;`);
    res.status(200).json(keysToCamel(pendingAccounts));
  } catch (err) {
    res.status(500).send(err.message);
  }
});

userRouter.get('/approved-accounts', async (req, res) => {
  try {
    const { keyword, accountType } = req.query;
    let { page, limit } = req.query;
    page = isInteger(page) ? parseInt(page, 10) : 1;
    limit = isInteger(limit) ? parseInt(limit, 10) : 10;
    const offset = (page - 1) * limit;
    let queryString = 'FROM users WHERE approved = TRUE ';
    if (accountType === 'admin') {
      queryString += `AND type = 'admin'`;
    } else if (accountType === 'student') {
      queryString += `AND type = 'student'`;
    }
    let approvedAccounts;
    let userCount;
    let params = [];
    if (keyword) {
      params = [`%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`, limit, offset];
      approvedAccounts = await db.query(
        `SELECT * ${queryString} AND (first_name ILIKE $1 OR last_name ILIKE $2 OR email ILIKE $3 OR CONCAT(first_name, ' ', last_name) ILIKE $4) ORDER BY first_name ASC LIMIT $5 OFFSET $6;`,
        params,
      );
      userCount = await db.query(
        `SELECT COUNT(*) ${queryString} AND (first_name ILIKE $1 OR last_name ILIKE $2 OR email ILIKE $3 OR CONCAT(first_name, ' ', last_name) ILIKE $4);`,
        params,
      );
    } else {
      params = [limit, offset];
      approvedAccounts = await db.query(
        `SELECT * ${queryString} ORDER BY first_name ASC LIMIT $1 OFFSET $2;`,
        params,
      );
      userCount = await db.query(`SELECT COUNT(*) ${queryString};`, params);
    }
    res.status(200).json(keysToCamel({ accounts: approvedAccounts, count: userCount }));
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
    console.log('err', err);
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
