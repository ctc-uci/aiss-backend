DROP TABLE IF EXISTS published_schedule;
CREATE TABLE IF NOT EXISTS published_schedule (
    id serial NOT NULL,
    event_id integer NOT NULL,
    confirmed boolean NOT NULL,
    confirmed_on date NOT NULL,
    start_time timestamp NOT NULL,
    end_time timestamp NOT NULL,
    cohort varchar[] NOT NULL,
    notes varchar(100),
    created_on date NOT NULL,
    FOREIGN KEY (event_id)
        REFERENCES catalog (id)
);
