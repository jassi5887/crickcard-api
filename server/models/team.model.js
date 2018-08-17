const mongoose = require('mongoose');

/**
 * All the ObjectId here are of Profile
 */
var TeamSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 3
    },
    logo: {
        type: String
    },
    players: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Profile'
    }],
    captain: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Profile'
    },
    viceCaptain: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Profile'
    },
    admin: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Profile',
        require: true
    }]
});

var Team = mongoose.model('Team', TeamSchema);

module.exports = { Team };