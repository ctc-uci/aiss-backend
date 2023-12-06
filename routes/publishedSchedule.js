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
        AND PS.id = $1;
      `,
      [req.params.id],
    );
    res.status(200).json(keysToCamel(publishedScheduleResult));
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// POST - Adds a new row to the published_schedule table
publishedScheduleRouter.post('/', async (req, res) => {
  const {
    id,
    event_id: eventId,
    confirmed_on: confirmedOn,
    start_time: startTime,
    end_time: endTime,
    cohort,
    notes,
  } = req.body;
  try {
    await db.query(
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
          ($1, $2, true, $3, $4, $5, $6, $7);
      `,
      [id, eventId, confirmedOn, startTime, endTime, cohort, notes],
    );
    res.status(201).json({
      status: 'Success',
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// PUT/:id - Updates an existing row given an id
publishedScheduleRouter.put('/id', async (req, res) => {

  try {
    const { id } = req.params;
    const {
      event_id: eventId,
      confirmed_on: confirmedOn,
      start_time: startTime,
      end_time: endTime,
      cohort,
      notes,
    } = req.body;
    const updatedPublishedSchedule = await db.query(
      `
      UPDATE published_schedule
      SET
        event_id = COALESCE(?, event_id),
        confirmed = COALESCE(?, confirmed),
        confirmed_on = COALESCE(?, confirmed_on),
        start_time = COALESCE(?, start_time),
        end_time = COALESCE(?, end_time),
        cohort = COALESCE(?, cohort),
        notes = COALESCE(?, notes)
      WHERE id = ?;
      `,
      [id, eventId, confirmedOn, startTime, endTime, cohort, notes],
    );
    res.status(204).json(keysToCamel(updatedPublishedSchedule));
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// DELETE/:id - deletes an existing row given an id
publishedScheduleRouter.put('/id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query(
      `
      DELETE FROM published_schedule
      WHERE id = ?;
      `,
      [id]
    );
    res.status(200).send('Deleted row from Published Schedule');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

module.exports = publishedScheduleRouter;
