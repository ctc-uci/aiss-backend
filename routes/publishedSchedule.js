const express = require('express');
const { db } = require('../server/db');
const { keysToCamel, calculateYear } = require('../common/utils');

const publishedScheduleRouter = express.Router();

// GET - Returns all data from the published_schedule table
publishedScheduleRouter.get('/', async (req, res) => {
  try {
    const allPublishedSchedules = await db.query(
      `
      SELECT
        PS.id,
        PS.day_id,
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
          PS.day_id,
          D.id AS day_day_id,
          D.event_date,
          D.start_time AS day_start_time,
          D.end_time AS day_end_time,
          D.location,
          D.notes AS day_notes,
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
        LEFT JOIN day D on PS.day_id = D.id
        WHERE
          DATE(PS.start_time) >= $1::date AND DATE(PS.start_time) <= $2::date
          AND D.id = PS.day_id
      )
      SELECT DATE(seasonPS.start_time),
      json_build_object (
        'id', seasonPS.day_id,
        'event_date', seasonPS.event_date,
        'start_time', seasonPS.day_start_time,
        'end_time', seasonPS.day_end_time,
        'location', seasonPS.location,
        'notes', seasonPS.day_notes
      ) as day,
      JSON_AGG(
        json_build_object (
          'id', seasonPS.id,
          'title', seasonPS.title,
          'event_type', seasonPS.event_type,
          'year', seasonPS.year,
          'start_time', seasonPS.start_time,
          'end_time', seasonPS.end_time,
          'confirmed', seasonPS.confirmed,
          'confirmed_on', seasonPS.confirmed_on,
          'cohort', seasonPS.cohort,
          'notes', seasonPS.notes
        )
      ) AS data
      FROM seasonPS
      GROUP BY DATE(start_time), day_id, event_date, day_start_time, day_end_time, location, day_notes 
      ORDER BY DATE(start_time) ASC;
      `,
      [startTime, endTime],
    );
    res.status(200).json(keysToCamel(seasonResult));
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// GET /published-schedule/date - returns all events occurring on a specific date
publishedScheduleRouter.get('/date', async (req, res) => {
  try {
    const { date } = req.query;
    const seasonResult = await db.query(
      `
      WITH seasonPS AS
      (
        SELECT
          PS.id,
          PS.day_id,
          D.event_date,
          D.start_time AS day_start_time,
          D.end_time AS day_end_time,
          D.location,
          D.notes AS day_notes,
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
        LEFT JOIN day D on PS.day_id = D.id
        WHERE
          DATE(PS.start_time) = $1::date
      )

      SELECT json_build_object (
        'id', seasonPS.day_id,
        'event_date', seasonPS.event_date,
        'start_time', seasonPS.day_start_time,
        'end_time', seasonPS.day_end_time,
        'location', seasonPS.location,
        'notes', seasonPS.day_notes
      ) as day,
      JSON_AGG(
        json_build_object (
          'id', seasonPS.id,
          'title', seasonPS.title,
          'event_type', seasonPS.event_type,
          'year', seasonPS.year,
          'start_time', seasonPS.start_time,
          'end_time', seasonPS.end_time,
          'confirmed', seasonPS.confirmed,
          'confirmed_on', seasonPS.confirmed_on,
          'cohort', seasonPS.cohort,
          'notes', seasonPS.notes
        )
      ) AS data
      FROM seasonPS
      GROUP BY DATE(start_time), day_id, event_date, day_start_time, day_end_time, location, day_notes 
      ORDER BY DATE(start_time) ASC;
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
        PS.day_id,
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
// NOTE: there is a requirement that the day already exist,
// as that is how we are able to calculate the cohort from the event date
publishedScheduleRouter.post('/', async (req, res) => {
  const { eventId, dayId, confirmed, confirmedOn, startTime, endTime, cohort, notes } = req.body;
  try {
    const dayResult = await db.query(`SELECT * FROM day WHERE id = $1;`, [dayId]);
    const { eventDate } = dayResult ? keysToCamel(dayResult[0]) : null;
    const returnedData = await db.query(
      `
      INSERT INTO
        published_schedule (
          event_id,
          day_id,
          confirmed,
          confirmed_on,
          start_time,
          end_time,
          cohort,
          notes
        )
        VALUES
          ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id;
      `,
      [
        eventId,
        dayId,
        confirmed,
        confirmedOn,
        startTime,
        endTime,
        calculateYear(eventDate, cohort),
        notes,
      ],
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
// NOTE: there is a requirement that the selected DAY already exist; this is how
// we are able to grab the event day from the day table for use in the cohort
publishedScheduleRouter.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { eventId, dayId, confirmed, confirmedOn, startTime, endTime, cohort, notes } = req.body;
    const psDayIdResult = await db.query(`SELECT day_id FROM published_schedule WHERE id = $1`, [
      id,
    ]);
    const psDayId = psDayIdResult ? keysToCamel(psDayIdResult[0]).dayId : null;
    const dayResult = await db.query(`SELECT * FROM day WHERE id = $1;`, [dayId || psDayId]);
    const { eventDate } = dayResult ? keysToCamel(dayResult[0]) : null;
    const updatedPublishedSchedule = await db.query(
      `
      UPDATE published_schedule
      SET
        event_id = COALESCE($1, event_id),
        day_id = COALESCE($2, day_id),
        confirmed = COALESCE($3, confirmed),
        confirmed_on = COALESCE($4, confirmed_on),
        start_time = COALESCE($5, start_time),
        end_time = COALESCE($6, end_time),
        cohort = COALESCE($7, cohort),
        notes = COALESCE($8, notes)
      WHERE id = $9

      RETURNING *;
      `,
      [
        eventId,
        dayId,
        confirmed,
        confirmedOn,
        startTime,
        endTime,
        calculateYear(eventDate, cohort),
        notes,
        id,
      ],
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
    res.status(200).send(keysToCamel(deletedEntry));
  } catch (err) {
    res.status(500).send(err.message);
  }
});

module.exports = publishedScheduleRouter;
