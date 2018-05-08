var {User} = require('../models/user.model');
const _ = require('lodash');

var authenticate = (req, res, next) => {
    var token = req.header('x-auth');

    User.findByToken(token).then((user) => {
        if (!user) {
            return Promise.reject();
        }

        req.user = user;
        req.token = token;

        next();

    }).catch((err) => {
        console.log("DENOED");
        res.status(401).send('DENIED');
    });
};

module.exports = {authenticate};