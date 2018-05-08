var express = require('express');
var otpCtrl = require('./otpController');

var router = express.Router();

router.route('/').post(otpCtrl.sendOtp);
router.route('/confirm').post(otpCtrl.confirmOtp);

module.exports = router;