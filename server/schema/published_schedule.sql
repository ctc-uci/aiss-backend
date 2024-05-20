DROP TABLE IF EXISTS published_schedule;
CREATE TABLE IF NOT EXISTS published_schedule (
    id serial NOT NULL PRIMARY KEY,
    event_id integer NOT NULL,
    day_id integer NOT NULL,
    confirmed boolean NOT NULL,
    confirmed_on date,
    start_time time NOT NULL,
    end_time time NOT NULL,
    cohort varchar[] NOT NULL,
    notes varchar(100),
    created_on date NOT NULL,
    FOREIGN KEY (event_id)
        REFERENCES catalog (id),
    FOREIGN KEY (day_id)
        REFERENCES day (id) ON DELETE CASCADE
);

CREATE INDEX idx_day_id ON published_schedule (day_id);
