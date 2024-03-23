CREATE TYPE event AS ENUM ('guest speaker', 'study-trip', 'workshop', 'other');
CREATE TYPE subject AS ENUM ('life skills', 'science', 'technology', 'engineering', 'math', 'college readiness');
CREATE TYPE year AS ENUM ('junior', 'senior', 'both');
CREATE TYPE season AS ENUM ('spring', 'summer', 'fall', 'winter');

DROP TABLE IF EXISTS catalog;
CREATE TABLE catalog (
  id SERIAL PRIMARY KEY,
  host VARCHAR(50),
  title VARCHAR(50) NOT NULL,
  event_type event[] DEFAULT '{}',
  subject subject[] DEFAULT '{}',
  description VARCHAR(100),
  year year[] DEFAULT '{}',
  season season[] DEFAULT '{}',
  hidden BOOLEAN NOT NULL,
);
