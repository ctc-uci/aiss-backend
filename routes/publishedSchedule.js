const express = require('express');
const { db } = require('../server/db');
const { keysToCamel } = require('../common/utils');

const publishedScheduleRouter = express.Router();

// GET - Returns all data from the published_schedule table
publishedScheduleRouter.get('/', async (req, res) => {
  try {
    const allPublishedSchedules = await db.query(
      `
      SELECT
        PS.id,
        C.host,
        C.title,
        PS.confirmed,
        PS.confirmed_on,
        PS.start_time,
        PS.end_time,
        PS.cohort,
        PS.notes
      FROM
        published_schedule PS
        LEFT JOIN catalog C ON PS.event_id = C.id;
    `,
    );
    res.status(200).json(keysToCamel(allPublishedSchedules));
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// GET/:id - returns the rows that match the given id
publishedScheduleRouter.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const publishedScheduleResult = await db.query(
      `
      SELECT
        PS.id,
        C.host,
        C.title,
        PS.confirmed,
        PS.confirmed_on,
        PS.start_time,
        PS.end_time,
        PS.cohort,
        PS.notes
      FROM
        published_schedule PS
        LEFT JOIN catalog C ON PS.event_id = C.id
      WHERE PS.id = $1;
      `,
      [id],
    );
    res.status(200).json(keysToCamel(publishedScheduleResult));
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// POST - Adds a new row to the published_schedule table
publishedScheduleRouter.post('/', async (req, res) => {
  const { eventId, confirmed, confirmedOn, startTime, endTime, cohort, notes } = req.body;
  try {
    const returnedData = await db.query(
      `
      INSERT INTO
        published_schedule (
          id,
          event_id,
          confirmed,
          confirmed_on,
          start_time,
          end_time,
          cohort,
          notes
        )
        VALUES
          (nextval('published_schedule_id_seq'), $1, $2, $3, $4, $5, $6, $7)
        RETURNING id;
      `,
      [eventId, confirmed, confirmedOn, startTime, endTime, cohort, notes],
    );
    res.status(201).json({
      status: 'Success',
      id: returnedData[0].id,
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// PUT/:id - Updates an existing row given an id
publishedScheduleRouter.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { eventId, confirmed, confirmedOn, startTime, endTime, cohort, notes } = req.body;
    const updatedPublishedSchedule = await db.query(
      `
      UPDATE published_schedule
      SET
        event_id = COALESCE($1, event_id),
        confirmed = COALESCE($2, confirmed),
        confirmed_on = COALESCE($3, confirmed_on),
        start_time = COALESCE($4, start_time),
        end_time = COALESCE($5, end_time),
        cohort = COALESCE($6, cohort),
        notes = COALESCE($7, notes)
      WHERE id = $8

      RETURNING *;
      `,
      [eventId, confirmed, confirmedOn, startTime, endTime, cohort, notes, id],
    );
    res.status(200).json(keysToCamel(updatedPublishedSchedule));
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// DELETE/:id - deletes an existing row given an id
publishedScheduleRouter.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedEntry = await db.query(
      `
      DELETE FROM published_schedule
      WHERE id = $1 RETURNING *;
      `,
      [id],
    );
    res.status(200).send(deletedEntry);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

module.exports = publishedScheduleRouter;
