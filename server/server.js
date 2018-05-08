require('./config/config');

const express = require('express');
const bodyParser = require('body-parser');
const _ = require('lodash');
const { ObjectID } = require('mongodb');
const bcrypt = require('bcryptjs');

var { mongoose } = require('./db/mongoose');

var app = express();

var routes = require('./routes');

const port = process.env.PORT;

app.use(function(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', process.env['ALLOWED_DOMAIN']);
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,x-auth');
    res.setHeader('Access-Control-Expose-Headers', 'x-auth');
    next();
});

app.use(bodyParser.json());

app.use('/api', routes);

app.listen(port, () => {
    console.log(`NODE server started on port ${port}`);
});

module.exports = { app };