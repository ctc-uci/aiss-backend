-- PUT/:uid - Updates an existing user as approved
UPDATE
    users
SET
    approved = TRUE
WHERE
    id = ?;

-- DELETE/:uid - Deletes an existing user given their id
DELETE FROM
    users
WHERE
    id = ?;

-- GET - Returns all data from the Users table
SELECT * FROM
    Users;

-- GET/pending-accounts - Returns all data from Users table who are currently pending approval
SELECT * FROM
    Users
WHERE
    approved = false;

-- POST - Adds a new row into Users table
INSERT INTO
    Users (id, email, "type", approved)
VALUES
    (?,?,?,?);