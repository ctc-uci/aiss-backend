const express = require('express');
const cors = require('cors');

require('dotenv').config();

const app = express();

const PORT = process.env.PORT || 3001;

app.use(
  cors({
    origin: `${process.env.REACT_APP_HOST}:${process.env.REACT_APP_PORT}`,
  }),
);

// add all routes under here
app.use(express.json()); // for req.body

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
