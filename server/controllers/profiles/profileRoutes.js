var express = require('express');
var profileCtrl = require('./profileController');

var router = express.Router();

router.route('/me').get(profileCtrl.getOwnProfile);
router.route('/:id').get(profileCtrl.getProfileById);

module.exports = router;