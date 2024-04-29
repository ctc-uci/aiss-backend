const express = require('express');
const { db } = require('../server/db');
const { keysToCamel } = require('../common/utils');

const dayRouter = express.Router();

// GET - returns all days in the table
dayRouter.get('/', async (req, res) => {
  try {
    const allDays = await db.query(`SELECT * FROM day;`);
    res.status(200).json(keysToCamel(allDays));
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// GET - returns a day by eventDate parameter
dayRouter.get('/date', async (req, res) => {
  try {
    const { eventDate } = req.query;
    const dayByDate = await db.query(`SELECT * FROM day WHERE event_date = $1;`, [eventDate]);
    res.status(200).json(keysToCamel(dayByDate));
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// GET - returns a day by id
dayRouter.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const dayById = await db.query(`SELECT * FROM day WHERE id = $1;`, [id]);
    res.status(200).json(keysToCamel(dayById));
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// POST - creates a new day
dayRouter.post('/', async (req, res) => {
  try {
    const { eventDate, location, notes } = req.body;
    const existingDay = await db.query(`SELECT * FROM day WHERE event_date = $1;`, [eventDate]);
    if (existingDay.length) {
      // day exists but has no events --> update location + notes return existing day_id
      if (existingDay[0].day_count === 0) {
        await db.query(`UPDATE day SET location = $1, notes = $2 WHERE id = $3;`, [
          location,
          notes,
          existingDay[0].id,
        ]);
        res.status(201).json({
          status: 'Success',
          id: existingDay[0].id,
        });
      } else {
        res.status(201).json({
          status: 'Failed',
          message: 'Day already exists',
        });
      }
      return;
    }

    const newDay = await db.query(
      `
      INSERT INTO day (
        id,
        event_date,
        start_time,
        end_time,
        location,
        notes,
        day_count
      ) VALUES (
        nextval('day_id_seq'), $1, '23:59:59', '00:00:00', $2, $3, 0
      ) RETURNING id;
      `,
      [eventDate, location, notes],
    );
    res.status(201).json({
      status: 'Success',
      id: newDay[0].id,
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// PUT - modifies an existing day
dayRouter.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { eventDate, startTime, endTime, location, notes } = req.body;
    const updatedDay = await db.query(
      `
      UPDATE day
      SET
        event_date = COALESCE($1, event_date),
        start_time = COALESCE($2, start_time),
        end_time = COALESCE($3, end_time),
        location = COALESCE($4, location),
        notes = COALESCE($5, notes)
      WHERE id = $6
      RETURNING *;
      `,
      [eventDate, startTime, endTime, location, notes, id],
    );
    res.status(200).send(keysToCamel(updatedDay));
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// DELETE - deletes an existing day
dayRouter.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedDay = await db.query(`DELETE FROM day WHERE id = $1 RETURNING *;`, [id]);
    res.status(200).send(keysToCamel(deletedDay));
  } catch (err) {
    res.status(500).send(err.message);
  }
});
module.exports = dayRouter;
