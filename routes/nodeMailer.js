const express = require('express');
// const cors = require('cors');
const transporter = require('../transporter');
// TODO: add verifyToken

const emailRouter = express();
// emailRouter.use(
//   cors({
//     origin: 'http://localhost:3000',
//     methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
//     credentials: true,
//   }),
// );

emailRouter.use(express.json());

emailRouter.post('/send', (req, res) => {
  const { email, messageHtml, subject } = req.body;
  const mail = {
    from: `${process.env.REACT_APP_EMAIL_FIRST_NAME} ${process.env.REACT_APP_EMAIL_LAST_NAME} ${process.env.REACT_APP_EMAIL_USERNAME}`,
    to: email,
    subject,
    html: messageHtml,
  };

  transporter.sendMail(mail, (err) => {
    if (err) {
      res.status(500).send(`Transporter Error: ${err}`);
    } else {
      res.status(200).send('Transporter Backend Successfully Sent');
    }
  });
});

module.exports = emailRouter;
