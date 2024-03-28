CREATE TYPE event AS ENUM ('guest speaker', 'study-trip', 'workshop', 'other');
CREATE TYPE subject AS ENUM ('life skills', 'science', 'technology', 'engineering', 'math', 'college readiness');
CREATE TYPE year AS ENUM ('junior', 'senior', 'both');
CREATE TYPE season AS ENUM ('spring', 'summer', 'fall');

DROP TABLE IF EXISTS catalog;
CREATE TABLE catalog (
  id SERIAL PRIMARY KEY,
  host VARCHAR(50),
  title VARCHAR(50) NOT NULL,
  event_type event[] NOT NULL DEFAULT '{}',
  subject subject[] NOT NULL DEFAULT '{}',
  description VARCHAR(256),
  year year[] NOT NULL DEFAULT '{}',
  season season[] NOT NULL DEFAULT '{}',
  hidden BOOLEAN NOT NULL,
);
