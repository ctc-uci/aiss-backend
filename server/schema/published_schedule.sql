DROP TABLE [IF EXISTS] published_schedule;

CREATE TYPE year AS ENUM ('Junior','Senior');

CREATE TABLE [IF NOT EXISTS] published_schedule (
    id varchar(10) NOT NULL,
    event_id varchar(10) NOT NULL,
    confirmed boolean NOT NULL,
    confirmed_on DATETIME NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    cohort ENUM NOT NULL,
    notes varchar(100),
    FOREIGN KEY (event_id)
        REFERENCES catalog (id)
);