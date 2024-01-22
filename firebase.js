const admin = require('firebase-admin');

require('dotenv').config();

console.log('Current working directory:', process.cwd());

const credentials = require('./firebase-adminsdk.json');

admin.initializeApp({ credential: admin.credential.cert(credentials) });

module.exports = admin;
