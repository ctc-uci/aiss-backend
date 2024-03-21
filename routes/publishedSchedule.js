const express = require('express');
const { db } = require('../server/db');
const { keysToCamel, calculateYear, getSeasonFromMonthAndYear } = require('../common/utils');

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
        PS.notes,
        PS.created_on
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

// GET/published-schedule/recently-added - returns the rows that were added in the past week
publishedScheduleRouter.get('/recently-added', async (req, res) => {
  try {
    const recentAddResult = await db.query(
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
        PS.notes,
        PS.created_on
      FROM published_schedule PS
      LEFT JOIN catalog C ON PS.event_id = C.id
      WHERE PS.created_on = PS.confirmed_on AND PS.created_on > current_date - 7 AND confirmed = true
      ORDER BY created_on DESC;
      `,
    );
    res.status(200).json(keysToCamel(recentAddResult));
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// GET/published-schedule/recently-confirmed - returns the rows that were confirmed in the past week
publishedScheduleRouter.get('/recently-confirmed', async (req, res) => {
  try {
    const recentConfirm = await db.query(
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
        PS.notes,
        PS.created_on
      FROM published_schedule PS
      LEFT JOIN catalog C ON PS.event_id = C.id
      WHERE PS.confirmed_on > current_date - 7
      ORDER BY created_on DESC;
      `,
    );
    res.status(200).json(keysToCamel(recentConfirm));
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// GET /published-schedule/all-seasons - return all the seasons
publishedScheduleRouter.get('/all-seasons', async (req, res) => {
  const getSeason = (date) => {
    const formattedDate = new Date(date.event_date);
    const year = formattedDate.getFullYear();
    const month = formattedDate.getMonth();
    return getSeasonFromMonthAndYear(month, year);
  };

  try {
    const allDatesResult = await db.query(
      `
        SELECT D.event_date
        FROM
          published_schedule AS PS, day AS D
        WHERE
          D.id = PS.day_id
        ORDER BY
          D.event_date DESC;
      `,
    );
    const allUniqueSeasonsResult = [];

    // Get all unique seasons by order of season, from most recent to least
    allDatesResult.forEach((row) => {
      const season = getSeason(row);
      if (!allUniqueSeasonsResult.includes(season)) {
        allUniqueSeasonsResult.push(season);
      }
    });

    res.status(200).json(keysToCamel(allUniqueSeasonsResult));
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
      if ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0) {
        endTime = `${year}-02-29`;
      } else {
        endTime = `${year}-02-28`;
      }
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
          PS.event_id,
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
          PS.notes,
          PS.created_on
        FROM published_schedule PS
        LEFT JOIN catalog C ON PS.event_id = C.id
        LEFT JOIN day D on PS.day_id = D.id
        WHERE
          D.event_date >= $1::date AND D.event_date <= $2::date
          AND D.id = PS.day_id
        ORDER BY PS.start_time ASC
      )
      SELECT event_date,
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
          'event_id', seasonPS.event_id,
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
      GROUP BY event_date, day_id, day_start_time, day_end_time, location, day_notes
      ORDER BY event_date ASC;
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
      SELECT
        json_build_object(
            'id', D.id,
            'event_date', D.event_date,
            'start_time', D.start_time,
            'end_time', D.end_time,
            'location', D.location,
            'notes', D.notes
        ) AS day_data,
        JSON_AGG(
          json_build_object (
            'id', PS.id,
            'day_id', PS.day_id,
            'title', C.title,
            'event_type', C.event_type,
            'year', C.year,
            'start_time', PS.start_time,
            'end_time', PS.end_time,
            'confirmed', PS.confirmed,
            'confirmed_on', PS.confirmed_on,
            'cohort', PS.cohort,
            'notes', PS.notes
          )
        ) AS data
      FROM day D
      LEFT JOIN published_schedule PS ON PS.day_id = D.id
      LEFT JOIN catalog C ON PS.event_id = C.id
      WHERE D.event_date = $1::date
      GROUP BY d.event_date, d.id
      ORDER BY d.event_date;
      `,
      [date],
    );
    res.status(200).json(keysToCamel(seasonResult)[0]);
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
        PS.day_id,
        C.host,
        C.title,
        PS.confirmed,
        PS.confirmed_on,
        PS.start_time,
        PS.end_time,
        PS.cohort,
        PS.notes,
        PS.created_on
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
  const currDate = new Date();
  const { eventId, dayId, confirmed, confirmedOn, startTime, endTime, cohort, notes } = req.body;
  try {
    const dayResult = await db.query(
      `UPDATE day SET day_count = day_count + 1 WHERE id = $1 RETURNING *;`,
      [dayId],
    );
    const { eventDate } = dayResult ? keysToCamel(dayResult[0]) : null;
    await db.query(
      `
      UPDATE day
        SET
          start_time = CASE WHEN $1 < start_time THEN $1 ELSE start_time END,
          end_time = CASE WHEN $2 > end_time THEN $2 ELSE end_time END
        WHERE id = $3;
      `,
      [startTime, endTime, dayId],
    );
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
          notes,
          created_on
        )
        VALUES
          ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, created_on;
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
        currDate,
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
// NOTE: if the day that you're moving the event FROM will have 0 associated events,
// IT WILL BE DELETED
publishedScheduleRouter.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { eventId, dayId, confirmed, confirmedOn, startTime, endTime, cohort, notes, createdOn } =
      req.body;

    // get the current day from the PS table
    const psDayIdResult = keysToCamel(
      await db.query(`SELECT day_id FROM published_schedule WHERE id = $1;`, id),
    )[0];
    // extract the old day id
    const psDayId = psDayIdResult.dayId;
    // now we need to grab the data from the table (should use dayId unless it is null)
    const dayResult = keysToCamel(
      await db.query(`SELECT * FROM day WHERE id = $1;`, [dayId || psDayId]),
    )[0];
    // grab the eventDate so that you can set the years
    const { eventDate } = dayResult;
    // update the PS

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
        notes = COALESCE($8, notes),
        created_on = COALESCE($9, created_on)

      WHERE id = $10

      RETURNING *;
      `,
      [
        eventId,
        dayId,
        confirmed,
        confirmedOn,
        startTime,
        endTime,
        cohort ? calculateYear(eventDate, cohort) : cohort,
        notes,
        createdOn,
        id,
      ],
    );
    // if day was modified we need to query and reset the min/max
    if (dayId) {
      if (startTime) {
        await db.query(
          `UPDATE day SET start_time = (SELECT MIN(start_time) FROM published_schedule WHERE day_id = $1) WHERE id = $1;
           UPDATE day SET start_time = (SELECT MIN(start_time) FROM published_schedule WHERE day_id = $2) WHERE id = $2;`,
          [psDayId, dayId],
        );
      }
      if (endTime) {
        await db.query(
          `UPDATE day SET end_time = (SELECT MAX(end_time) FROM published_schedule WHERE day_id = $1) WHERE id = $1;
           UPDATE day SET end_time = (SELECT MAX(end_time) FROM published_schedule WHERE day_id = $2) WHERE id = $2;`,
          [psDayId, dayId],
        );
      }
      const dayCountResult = await db.query(
        `UPDATE day SET day_count = day_count + 1 WHERE id = $1; UPDATE day SET day_count = day_count - 1 WHERE id = $2 RETURNING day_count;`,
        [dayId, psDayId],
      );
      const { dayCount } = keysToCamel(dayCountResult);
      // if start time was passed alongside day we need to update the old day and change the new day
      if (dayCount === 0) {
        await db.query(`DELETE FROM day WHERE id = $1`, [psDayId]);
      }
    } else {
      if (startTime) {
        await db.query(
          `UPDATE day SET start_time = (SELECT MIN(start_time) FROM published_schedule WHERE day_id = $1) WHERE id = $1;`,
          [psDayId],
        );
      }
      if (endTime) {
        await db.query(
          `UPDATE day SET end_time = (SELECT MAX(end_time) FROM published_schedule WHERE day_id = $1) WHERE id = $1;`,
          [psDayId],
        );
      }
    }
    res.status(200).json(keysToCamel(updatedPublishedSchedule));
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// DELETE/:id - deletes an existing row given an id
// NOTE: if the day that you're deleting the event FROM will have 0 associated events,
// IT WILL BE DELETED
publishedScheduleRouter.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // delete PS entry
    const deletedEntry = await db.query(
      `
      DELETE FROM published_schedule
      WHERE id = $1 RETURNING *;
      `,
      [id],
    );
    // grab relevant info from the deleted row
    const { dayId, startTime, endTime } = keysToCamel(deletedEntry[0]);

    // update the day table
    const updatedDay = await db.query(
      `UPDATE day SET day_count = day_count - 1 WHERE id = $1 RETURNING *;`,
      [dayId],
    );
    const dayResult = keysToCamel(updatedDay[0]);
    const { dayCount } = dayResult;
    // if the day has 0 events delete day
    if (dayCount === 0) {
      await db.query(`DELETE FROM day WHERE id = $1`, [dayId]);
    } else {
      // if the event start time was the earliest change to earliest in PS table for that day
      if (startTime === dayResult.startTime) {
        await db.query(
          `UPDATE day SET start_time = (SELECT MIN(start_time) FROM published_schedule WHERE day_id = $1) WHERE id = $1`,
          [dayId],
        );
      }
      // if the event end time was the latest change to latest in PS table for that day
      if (endTime === dayResult.endTime) {
        await db.query(
          `UPDATE day SET end_time = (SELECT MAX(end_time) FROM published_schedule WHERE day_id = $1) WHERE id = $1`,
          [dayId],
        );
      }
    }
    res.status(200).send(keysToCamel(deletedEntry));
  } catch (err) {
    res.status(500).send(err.message);
  }
});

module.exports = publishedScheduleRouter;
