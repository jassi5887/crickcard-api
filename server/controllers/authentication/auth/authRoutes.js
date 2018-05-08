var express = require('express');
var authCtrl = require('./authController');

var router = express.Router();

router.route('/login').post(authCtrl.login);
router.route('/register').post(authCtrl.register);
router.route('/logout').post(authCtrl.logout);

module.exports = router;