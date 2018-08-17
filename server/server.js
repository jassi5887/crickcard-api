require('./config/config');
const path = require('path');

global.appRoot = path.resolve(__dirname);

const express = require('express');
const bodyParser = require('body-parser');
const _ = require('lodash');
const { ObjectID } = require('mongodb');
const bcrypt = require('bcryptjs');
const morgan = require('morgan');
const winston = require('./config/winston');
const fs = require('fs');

var { mongoose } = require('./db/mongoose');

var app = express();

var routes = require('./routes');

const port = process.env.PORT;

app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', process.env['ALLOWED_DOMAIN']);
    res.header('Access-Control-Allow-Headers', 'X-Requested-With,Content-Type,x-auth');
    res.header('Access-Control-Expose-Headers', 'x-auth, content-type');

    //this is so that OPTION request before HTTP GET doesn't get 401
    if ('OPTIONS' == req.method) {
        res.send(200);
    } else {
        next();
    }
});

app.use(bodyParser.json());

app.use(morgan('combined', { stream: winston.stream }));

app.use('/api', routes);

//500 Application level Error handler middleware
app.use( function(err, req, res, next){
    winston.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
    res.status(500).send({"errorMsg": "Something Went Wrong at our end"});
});

//404 Handler Middleware
app.use( function(req, res, next){
    winston.error(`404 - Page Not Found - ${req.originalUrl} - ${req.method} - ${req.ip}`);
    res.status(404).send({"errorMsg": "Page Not Found"});
});

app.listen(port, () => {
    console.log(`NODE server started on port ${port}`);
});

module.exports = { app };