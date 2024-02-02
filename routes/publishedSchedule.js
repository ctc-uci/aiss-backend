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

// GET /published-schedule/season - returns rows that match the season
publishedScheduleRouter.get('/season', async (req, res) => {
  try {
    let startTime;
    let endTime;

    const { season, year } = req.query;

    // getting the intervals for each season
    if (season.toLowerCase() === 'winter') {
      startTime = `${year - 1}-12-01`;
      endTime = `${year}-02-29`;
    } else if (season.toLowerCase() === 'spring') {
      startTime = `${year}-03-01`;
      endTime = `${year}-05-31`;
    } else if (season.toLowerCase() === 'summer') {
      startTime = `${year}-06-01`;
      endTime = `${year}-08-31`;
    } else {
      startTime = `${year}-09-01`;
      endTime = `${year}-11-30`;
    }

    const seasonResult = await db.query(
      `
      WITH seasonPS AS
      (
        SELECT 
          PS.id,
          C.title,
          C.event_type,
          C.year,
          PS.start_time,
          PS.end_time,
          PS.confirmed,
          PS.confirmed_on,
          PS.cohort,
          PS.notes
        FROM published_schedule PS
        LEFT JOIN catalog C ON PS.event_id = C.id
        WHERE 
          DATE(start_time) >= $1::date AND DATE(start_time) <= $2::date
      )
      SELECT DATE(seasonPS.start_time), JSON_AGG(seasonPS.*) AS data
      FROM seasonPS
      GROUP BY DATE(start_time)
      ORDER BY DATE(start_time) ASC;
      `,
      [startTime, endTime],
    );
    res.status(200).json(keysToCamel(seasonResult));
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// GET /published-schedule/date - returns all events occurring on a specific date
publishedScheduleRouter.get('/date', async (req, res) => {
  try {
    const { date } = req.query;
    const seasonResult = await db.query(
      `
      SELECT 
        PS.id,
        C.title,
        C.event_type,
        C.year,
        PS.start_time,
        PS.end_time,
        PS.confirmed,
        PS.confirmed_on,
        PS.cohort,
        PS.notes
      FROM published_schedule PS
      LEFT JOIN catalog C ON PS.event_id = C.id
      DATE(PS.start_time) = $1
      ORDER BY start_time ASC;
      `,
      [date],
    );
    res.status(200).json(keysToCamel(seasonResult));
  } catch (err) {
    res.status(400).send(err.message);
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
