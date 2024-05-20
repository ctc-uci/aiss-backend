const express = require('express');
const { db } = require('../server/db');

const catalogRouter = express.Router();
const { keysToCamel, isInteger } = require('../common/utils');

// -- GET - Returns all data from the catalog table
catalogRouter.get('/', async (req, res) => {
  try {
    const { title, eventType, subject, season, year } = req.query;

    let { limit, page } = req.query;
    limit = isInteger(limit) ? parseInt(limit, 10) : 10;
    page = isInteger(page) ? parseInt(page, 10) : 1;

    const offset = (page - 1) * limit;

    let query = 'FROM catalog WHERE 1=1 AND hidden = false';
    // removed space at beginning here

    const params = [];

    if (title) {
      query += ' AND (title ILIKE $1';
      query += ' OR host ILIKE $1';
      query += ' OR description ILIKE $1) ';
      params.push(`%${title}%`);
    } else {
      params.push('');
    }

    if (subject) {
      const array = subject.split(',');
      query += ' AND subject && $2::subject[]';
      params.push(array);
    } else {
      params.push('');
    }

    if (eventType) {
      const array = eventType.split(',');
      query += ' AND event_type && $3::event[]';
      params.push(array);
    } else {
      params.push('');
    }

    if (season) {
      const array = season.split(',');
      query += ' AND season && $4::season[]';
      params.push(array);
    } else {
      params.push('');
    }

    if (year) {
      const array = year.split(',');
      query += ' AND year && $5::year[]';
      params.push(array);
    } else {
      params.push('');
    }

    const eventCount = await db.query(`SELECT COUNT(*) ${query};`, params);

    query += ' ORDER BY title ASC LIMIT $6 OFFSET $7;';
    params.push(limit);
    params.push(offset);

    const reqInfo = await db.query(`SELECT * ${query}`, params);

    res.status(200).json(keysToCamel({ events: reqInfo, count: eventCount }));
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// -- GET/:id - Returns the row that matches the id
catalogRouter.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const response = await db.query(`SELECT * FROM catalog WHERE id = $1;`, [id]);
    res.status(200).json(keysToCamel(response));
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// -- POST - Adds a new row to the catalog table
catalogRouter.post('/', async (req, res) => {
  const { host, title, eventType, subject, description, year, season } = req.body;
  try {
    const returnedData = await db.query(
      `INSERT INTO catalog (id, host, title, event_type, subject, description, year, season, hidden)
      VALUES (nextval('catalog_id_seq'), $1, $2, $3::event[], $4::subject[], $5, $6::year[], $7::season[], false)
      RETURNING id;`,
      [host, title, eventType, subject, description, year, season],
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
    const { host, title, eventType, subject, description, year, season } = req.body;

    const { count } = (
      await db.query(`SELECT COUNT(*) FROM published_schedule WHERE event_id = $1;`, [id])
    )[0];

    if (count === 1) {
      const updatedCatalog = await db.query(
        `UPDATE catalog SET
        ${host ? 'host = $(host), ' : ''}
        ${title ? 'title = $(title),' : ''}
        ${eventType ? 'event_type = $(eventType)::event[], ' : ''}
        ${subject ? 'subject = $(subject)::subject[], ' : ''}
        ${description ? 'description = $(description), ' : ''}
        ${year ? 'year = $(year)::year[], ' : ''}
        ${season ? 'season = $(season)::season[], ' : ''}
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
          season,
        },
      );
      res.status(200).send(keysToCamel(updatedCatalog));
    } else {
      const newCatalogEvent = await db.query(
        `INSERT INTO catalog (id, host, title, event_type, subject, description, year, season, hidden)
        VALUES (nextval('catalog_id_seq'), $1, $2, $3::event[], $4::subject[], $5, $6::year[], $7::season[], false)
        RETURNING *;`,
        [host, title, eventType, subject, description, year, season],
      );
      res.status(200).send(keysToCamel(newCatalogEvent));
    }
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// -- DELETE - deletes an existing row given an id
catalogRouter.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const inUse = await db.query(`SELECT * FROM published_schedule WHERE event_id = $1;`, [id]);
    let hidden;
    if (inUse && inUse.length) {
      hidden = await db.query(`UPDATE catalog SET hidden = true WHERE id = $1 RETURNING *;`, [id]);
    } else {
      hidden = await db.query(`DELETE FROM catalog WHERE id = $1 RETURNING *;`, [id]);
    }
    res.status(200).send(keysToCamel(hidden));
  } catch (err) {
    res.status(500).send(err.message);
  }
});

module.exports = catalogRouter;
