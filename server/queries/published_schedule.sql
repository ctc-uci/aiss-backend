/*GET - Returns all data from the published_schedule table*/
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

/*GET/:id - returns the rows that match the given id*/
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
   AND PS.id = ?;

/*POST - Adds a new row to the published_schedule table
Note: Confirmed should be defaulted to true*/
INSERT INTO published_schedule (id, event_id, confirmed, confirmed_on, start_time, end_time, cohort, notes)
VALUES (?, ?, true, ?, ?, ?, ?, ?);

/*PUT - Updates an existing row given an id
Notes: All fields are optional*/
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

/*DELETE - deletes an existing row given an id*/
DELETE FROM published_schedule WHERE id = ?;