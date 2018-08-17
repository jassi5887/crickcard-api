const _ = require('lodash');
const winston = require("../config/winston");
const {RegisteredUser} = require('../models/user.model');

var authenticate = (req, res, next) => {
    var token = req.header('x-auth');

    RegisteredUser.findByToken(token).then((user) => {
        if (!user) {
            return Promise.reject();
        }

        req.user = user;
        req.token = token;

        next();

    }).catch((err) => {
        winston.log("error", "authenticate: ${err}");
        res.status(401).send({"errMessage": "Please Register or Login"});
    });
};

module.exports = {authenticate};