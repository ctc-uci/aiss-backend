DROP TABLE IF EXISTS day;
CREATE TABLE IF NOT EXISTS day (
    id serial PRIMARY KEY,
    event_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    location VARCHAR( 256 ) NOT NULL,
    notes VARCHAR( 250 )
);