DROP TABLE IF EXISTS published_schedule;
CREATE TABLE IF NOT EXISTS published_schedule (
    id varchar(10) NOT NULL,
    event_id varchar(10) NOT NULL,
    confirmed boolean NOT NULL,
    confirmed_on date NOT NULL,
    start_time timestamp NOT NULL,
    end_time timestamp NOT NULL,
    cohort year NOT NULL,
    notes varchar(100),
    FOREIGN KEY (event_id)
        REFERENCES catalog (id)
);
