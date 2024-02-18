const express = require('express');
const cors = require('cors');
const publishedScheduleRouter = require('./routes/publishedSchedule');

require('dotenv').config();

// routes
const users = require('./routes/users');

const { authRouter } = require('./routes/auth');

const email = require('./routes/nodeMailer');

const app = express();

const catalogRouter = require('./routes/catalog');
const dayRouter = require('./routes/day');

const PORT = process.env.PORT || 3001;

app.use(
  cors({
    origin: `${process.env.REACT_APP_HOST}:${process.env.REACT_APP_PORT}`,
    credentials: true,
  }),
);

// app.use(cors({ origin: 'http://localhost:3000', credentials: true }));

// add all routes under here
app.use(express.json()); // for req.body
app.use('/published-schedule', publishedScheduleRouter);
app.use('/users', users);
app.use('/catalog', catalogRouter);
app.use('/nodeMailer', email);
app.use('/auth', authRouter);
app.use('/day', dayRouter);

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
