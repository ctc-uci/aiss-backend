CREATE TYPE account_type as ENUM ('superadmin', 'admin');

CREATE TABLE IF NOT EXISTS users (
	id VARCHAR ( 256 ) PRIMARY KEY,
	email VARCHAR ( 50 ) NOT NULL,
	type account_type NOT NULL, 
	approved BOOLEAN NOT NULL
);