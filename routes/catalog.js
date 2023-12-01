const express = require('express');

const db = require('../server/db');

const catalogRouter = express.Router();
const { toCamel } = require('../common/utils');

// -- GET - Returns all data from the catalog table
catalogRouter.get('/', async (req, res) => {
  try {
    const allInfo = await db.query(`SELECT * from catalog;`);
    res.status(200).json(toCamel(allInfo));
  } catch (err) {
    console.log(err);
    res.status(500).send(err.message);
  }
});

// -- GET/:id - Returns the row that matches the id
// SELECT * FROM catalog WHERE id = ?;
catalogRouter.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const allUsers = await db.query(`SELECT * FROM catalog WHERE id = $1;`, [id]);
    res.status(200).json(toCamel(allUsers));
  } catch (err) {
    console.log(err);
    res.status(500).send(err.message);
  }
});

// -- POST - Adds a new row to the catalog table
// INSERT INTO catalog (id, host, title, event_type, subject, description, year)
// VALUES (?, ?, ?, ?, ?, ?, ?);
catalogRouter.post('/', async (req, res) => {
  const { id, host, title, eventType, subject, description, year } = req.body;
  try {
    await db.query(
      `INSERT INTO catalog (id, host, title, event_type, subject, description, year)
      VALUES ($1, $2, $3, $4, $5, $6, $7);`,
      [id, host, title, eventType, subject, description, year],
    );
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

// -- PUT - Updates an existing row given an id
// -- All fields are optional
// UPDATE catalog
// SET host = ?, title = ?, event_type = ?, subject = ?, description = ?, year = ?
// WHERE id = ?;
catalogRouter.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { host, title, eventType, subject, description, year } = req.body;

    const updatedCatalog = await db.query(
      `UPDATE catalog SET host = $1, title = $2, event_type = $3, subject = $4,
                                     description = $5, year = $6 WHERE id = $7;`,
      [host, title, eventType, subject, description, year, id],
    );
    res.status(200).send(updatedCatalog.rows[0]);
  } catch (err) {
    console.log(err);
    res.status(500).send(err.message);
  }
});

// -- DELETE - deletes an existing row given an id
// DELETE FROM catalog WHERE id=?;
catalogRouter.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const delUser = await db.query(`DELETE FROM catalog WHERE id = $1;`, [id]);
    res.status(200).json(toCamel(delUser));
  } catch (err) {
    console.log(err);
    res.status(500).send(err.message);
  }
});

module.exports = catalogRouter;
