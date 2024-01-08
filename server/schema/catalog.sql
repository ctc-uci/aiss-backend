CREATE TYPE event AS ENUM ('guest speaker', 'study-trip', 'workshop', 'other');
CREATE TYPE subject AS ENUM ('life skills', 'science', 'technology', 'engineering', 'math', 'college readiness');
CREATE TYPE year AS ENUM ('junior', 'senior', 'both');

DROP TABLE IF EXISTS catalog;
CREATE TABLE catalog (
  id SERIAL PRIMARY KEY,
  host VARCHAR(50) NOT NULL,
  title VARCHAR(50) NOT NULL,
  event_type event NOT NULL,
  subject subject NOT NULL,
  description VARCHAR(50) NOT NULL,
  year year NOT NULL
);
