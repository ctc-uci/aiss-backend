const { toCamel } = require('../common/utils');
const express = require('express');
const catalogRouter = express.Router();


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
      const allUsers = await db.query(`SELECT * FROM catalog WHERE id = ?;`);
      res.status(200).json(keysToCamel(allUsers));
    } catch (err) {
      console.log(err);
      res.status(500).send(err.message);
    }
  });

// -- POST - Adds a new row to the catalog table
// INSERT INTO catalog (id, host, title, event_type, subject, description, year)
// VALUES (?, ?, ?, ?, ?, ?, ?);
catalogRouter.post('/', async (req, res) => {
    try {
      const { id, host, title, event_type, subject, description, year } = req.body;
      
    } catch (err) {
      
    }
  });

// -- PUT - Updates an existing row given an id
// -- All fields are optional
// UPDATE catalog
// SET host = ?, title = ?, event_type = ?, subject = ?, description = ?, year = ?
// WHERE id = ?;
catalogRouter.put('/:id', async (req, res) => {
    try {
      const allUsers = await db.query(`SELECT * from catalog;`);
      res.status(200).json(keysToCamel(allUsers));
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
        const delUser = await db.query(`DELETE FROM catalog WHERE id = $1;`,[id],);
        res.status(200).json(keysToCamel(delUser));
    } catch (err) {
      console.log(err);
      res.status(500).send(err.message);
    }
  });

module.exports = catalogRouter;