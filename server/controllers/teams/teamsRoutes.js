var express = require('express');
var teamsCtrl = require('./teamsController');

var router = express.Router();

router.route('/').get(teamsCtrl.getTeams);
router.route('/').post(teamsCtrl.createTeam);

router.route('/:id').get(teamsCtrl.getTeam);

module.exports = router;