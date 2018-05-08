var express = require('express');
var teamsRoutes = require('./controllers/teams/teamsRoutes');
var profileRoutes = require('./controllers/profiles/profileRoutes');
var authRoutes = require('./controllers/authentication/auth/authRoutes');
var otpRoutes = require('./controllers/authentication/otp/otpRoutes');
const {authenticate} = require('./middleware/authenticate');

var router = express.Router();

router.use('/teams', authenticate, teamsRoutes);
router.use('/profile', authenticate, profileRoutes);
router.use('/auth', authRoutes);
router.use('/otp', otpRoutes);

module.exports = router;