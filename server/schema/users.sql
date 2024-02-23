CREATE TYPE account_type as ENUM ('admin', 'student');

DROP TABLE IF EXISTS users;

CREATE TABLE users (
	id VARCHAR ( 256 ) PRIMARY KEY,
	email VARCHAR ( 50 ) NOT NULL,
	type account_type NOT NULL, 
	approved BOOLEAN NOT NULL,
	approved_on DATE NOT NULL,
);