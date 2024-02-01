const express = require('express');
const { db } = require('../server/db');

const catalogRouter = express.Router();
const { keysToCamel, isInteger } = require('../common/utils');

// -- GET - Returns all data from the catalog table
catalogRouter.get('/', async (req, res) => {
  try {
    let { limit, page } = req.query;
    limit = isInteger(limit) ? parseInt(limit, 10) : 10;
    page = isInteger(page) ? parseInt(page, 10) : 1;

    const offset = (page - 1) * limit;
    const allInfo = await db.query(`SELECT * from catalog LIMIT $1 OFFSET $2;`, [limit, offset]);
    res.status(200).json(keysToCamel(allInfo));
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// -- GET/:id - Returns the row that matches the id
catalogRouter.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const allUsers = await db.query(`SELECT * FROM catalog WHERE id = $1;`, [id]);
    res.status(200).json(keysToCamel(allUsers));
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// -- POST - Adds a new row to the catalog table
catalogRouter.post('/', async (req, res) => {
  const { host, title, eventType, subject, description, year, season, location } = req.body;
  try {
    const returnedData = await db.query(
      `INSERT INTO catalog (id, host, title, event_type, subject, description, year, season, location)
      VALUES (nextval('catalog_id_seq'), $1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id;`,
      [host, title, eventType, subject, description, year, season, location],
    );
    res.status(201).json({ id: returnedData[0].id, status: 'Success' });
  } catch (err) {
    res.status(500).json({
      status: 'Failed',
      msg: err.message,
    });
  }
});

// -- PUT - Updates an existing row given an id
// -- All fields are optional
catalogRouter.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { host, title, eventType, subject, description, year, location, season } = req.body;

    const updatedCatalog = await db.query(
      `UPDATE catalog SET
       ${host ? 'host = $(host), ' : ''}
       ${title ? 'title = $(title),' : ''}
       ${eventType ? 'event_type = $(eventType), ' : ''}
       ${subject ? 'subject = $(subject), ' : ''}
       ${description ? 'description = $(description), ' : ''}
       ${year ? 'year = $(year), ' : ''}
       ${location ? 'location = $(location), ' : ''}
       ${season ? 'season = $(season), ' : ''}
       id = '${id}'
        WHERE id = '${id}'
        RETURNING *;`,
      {
        host,
        title,
        eventType,
        subject,
        description,
        year,
        id,
        location,
        season,
      },
    );
    res.status(200).send(keysToCamel(updatedCatalog));
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// -- DELETE - deletes an existing row given an id
catalogRouter.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const delUser = await db.query(`DELETE FROM catalog WHERE id = $1 RETURNING *;`, [id]);
    res.status(200).send(keysToCamel(delUser));
  } catch (err) {
    res.status(500).send(err.message);
  }
});

module.exports = catalogRouter;
