const config = require('./utils/configUtils')
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const cors = require('cors');
const mongoose = require('mongoose');
const errorHandler = require('errorhandler');

//Configure mongoose's promise to global promise
mongoose.promise = global.Promise;

//Initiate our app
const app = express();

//Configure our app
app.use(cors());
if(config.isDev){
  app.use(require('morgan')('dev'));
}

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({ secret: 'passport-tutorial', cookie: { maxAge: 60000 }, resave: false, saveUninitialized: false }));

if(!config.isProd) {
  app.use(errorHandler());
}

//Configure Mongoose
mongoose.connect('mongodb:' + config.DBHost, {useNewUrlParser: true});
if(config.isDev) {
  mongoose.set('debug', true);
}

require('./models/NewPasswords');
require('./models/Users');
require('./models/Equipments');
require('./models/Entries');
require('./models/Tasks');
require('./config/passport');
app.use(require('./routes'));

app.listen(config.port, () => console.log('Server running on http://localhost:' + config.port + '/'));

module.exports = app; // for testing