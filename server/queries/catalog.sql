-- GET - Returns all data from the catalog table
SELECT * FROM catalog;


-- GET/:id - Returns the row that matches the id
SELECT * FROM catalog WHERE id = ?;


-- POST - Adds a new row to the catalog table
INSERT INTO catalog (id, host, title, event_type, subject, description, year)
VALUES (?, ?, ?, ?, ?, ?, ?);


-- PUT - Updates an existing row given an id
-- All fields are optional
UPDATE catalog
SET host = ?, title = ?, event_type = ?, subject = ?, description = ?, year = ?
WHERE id = ?;


-- DELETE - deletes an existing row given an id
DELETE FROM catalog WHERE id=?;