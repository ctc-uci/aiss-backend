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

    let query = 'FROM catalog WHERE 1=1';
    // removed space at beginning here

    const params = [];

    if (title) {
      query += ' AND title ILIKE $1';
      params.push(`%${title}%`);
    } else {
      params.push('');
    }

    if (subject) {
      const array = subject.split(',');
      query += ' AND subject = ANY($2::subject[])';
      // for (let i = 0; i < array.length; i += 1) {
      //   query += `'${array[i]}'`;
      //   if (i < array.length - 1) {
      //     query += ', ';
      //   }
      // }
      // query += ')';
      // query += ' AND subject = $2';
      params.push(array);
    } else {
      params.push('');
    }

    if (eventType) {
      const array = eventType.split(',');
      query += ' AND event_type = ANY($3::event[])';
      params.push(array);
    } else {
      params.push('');
    }

    if (season) {
      const array = season.split(',');
      query += ' AND season = ANY($4::season[])';
      params.push(array);
    } else {
      params.push('');
    }

    if (year) {
      const array = year.split(',');
      query += ' AND year = ANY($5::year[])';
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
    // Must delete from published event first and then catalog because of foreign key constraint
    // We also need to update the day table if the event we're deleting is part of a day
    // Since we're making multiple queries, we need to ensure that if any query fails, we revert all the queries before it
    // We do this by using transactions (BEGIN, COMMIT, ROLLBACK)

    await db.query('BEGIN;');

    // Get the published event we're deleting if it exists
    // Expecting to only return 1 row because only one published schedule can correlate to catalog event
    // Event ids currently are not set as unique in the schema but we will assume they are for now
    const publishedEvents = await db.query(
      `SELECT * FROM published_schedule WHERE event_id = $1;`,
      id,
    );

    // Delete from published schedule
    await db.query(`DELETE FROM published_schedule WHERE event_id = $1;`, [id]);

    // Delete from catalog
    const delCatalog = await db.query(`DELETE FROM catalog WHERE id = $1 RETURNING *;`, [id]);

    // Handle modifying day table if necessary
    if (publishedEvents.length > 0) {
      // Iterate through all published events............. 112, 133, 132, 113
      // published event id 112 has catalog id 80
      // published event id 133 has catalog id 80

      // so when we deleted catalog id 80, we only deleted 112
      // but now we have a lingering 133 that we need to delete
      // along with accounting for the day it could be affecting
      // we need to now manually delete and edit database bc we cant do this w code

      // and looping through all published events may not be possible because of deadlock
      // lets say we have 2 published events associated with a catalog event,
      // we delete the first one (first event of the day) and then modify day
      // we delete the second one (last event of the day) and then modify day
      // deadlock can occur because we are modifying the same row in the day table within the same transaction

      // can be fixed by not allowing multiple published events to be associated with the same catalog event (add unique in schema)

      console.log(publishedEvents);
      const publishedEvent = publishedEvents[0];

      const dayId = publishedEvent.day_id;
      const publishedEventStartTime = publishedEvent.start_time;
      const publishedEventEndTime = publishedEvent.end_time;

      // Query for day corresponding to the published schedule
      const day = await db.query(`SELECT * FROM day WHERE id = $1;`, [dayId]);

      const dayStartTime = day.start_time;
      const dayEndTime = day.end_time;

      // If the event we're deleting is the only event for the day, delete the day
      if (publishedEventStartTime === dayStartTime && publishedEventEndTime === dayEndTime) {
        await db.query(`DELETE FROM day WHERE id = $1;`, [dayId]);
      } else {
        // Decrement day count by 1
        await db.query(`UPDATE day SET day_count = day_count - 1 WHERE id = $1;`, [dayId]);

        // If the event we're deleting is the first/last event for the day, update the day start/end time
        if (publishedEventStartTime === dayStartTime) {
          const nextEvent = await db.query(
            `SELECT * FROM published_schedule WHERE day_id = $1 ORDER BY start_time ASC LIMIT 1;`,
            [dayId],
          );
          // Guaranteed to have a next event since day end time is not the same as event end time
          const nextEventStartTime = nextEvent[0].start_time;
          await db.query(`UPDATE day SET start_time = $1 WHERE id = $2;`, [
            nextEventStartTime,
            dayId,
          ]);
        } else if (publishedEventEndTime === dayEndTime) {
          const prevEvent = await db.query(
            `SELECT * FROM published_schedule WHERE day_id = $1 ORDER BY end_time DESC LIMIT 1;`,
            [dayId],
          );

          // Guaranteed to have a next event since day start time is not the same as event start time
          const prevEventEndTime = prevEvent[0].end_time;
          await db.query(`UPDATE day SET end_time = $1 WHERE id = $2;`, [prevEventEndTime, dayId]);
        }
      }
    }

    // Signals to db to run all these commands, if any fail, it will rollback all of the rows to their previous state
    await db.query('COMMIT;');

    res.status(200).send(keysToCamel(delCatalog));
  } catch (err) {
    await db.query('ROLLBACK;');
    res.status(500).send(err.message);
  }
});

module.exports = catalogRouter;
