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