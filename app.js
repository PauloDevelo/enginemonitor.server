const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const cors = require('cors');
const mongoose = require('mongoose');
const errorHandler = require('errorhandler');

if (process.env.NODE_ENV === undefined){
  console.log("Please, consider setting the environment variable NODE_ENV. As NODE_ENV is undefined, the value dev will be used.");
  process.env.NODE_ENV = "dev";
}

if (process.env.NODE_ENV !== "prod" &&
    process.env.NODE_ENV !== "test" &&
    process.env.NODE_ENV !== "dev"){
  console.log("Please, consider setting the environment variable NODE_ENV with one of these values: test, dev or prod. As NODE_ENV is not set correctly, the value dev will be used.");
  process.env.NODE_ENV = "dev";
}

let config = require('config');

//Configure mongoose's promise to global promise
mongoose.promise = global.Promise;

//Configure isProduction variable
const isProduction = process.env.NODE_ENV === 'prod';
const isDev = process.env.NODE_ENV === 'dev';

//Initiate our app
const app = express();

//Configure our app
app.use(cors());
if(isDev){
  app.use(require('morgan')('dev'));
}

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({ secret: 'passport-tutorial', cookie: { maxAge: 60000 }, resave: false, saveUninitialized: false }));

if(!isProduction) {
  app.use(errorHandler());
}

//Configure Mongoose
mongoose.connect('mongodb:' + config.DBHost);
if(isDev) {
  mongoose.set('debug', true);
}

require('./models/Users');
require('./models/Equipments');
require('./models/Entries');
require('./models/Tasks');
require('./config/passport');
app.use(require('./routes'));

app.listen(config.port, () => console.log('Server running on http://localhost:' + config.port + '/'));

module.exports = app; // for testing