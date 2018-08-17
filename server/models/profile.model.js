const mongoose = require('mongoose');

const {RegisteredUser} = require('./user.model');

/**
 * tags are related to model Tag
 * 
 * user is related to model User
 * 
 * while saving a document all the Object ids will be validated using:
 * 
 * const {ObjectID} = require('mongodb');
 * ObjectID.isValid(id);
 */

var ProfileSchema = new mongoose.Schema({
    profileComplete: {
        type: Boolean,
        default: false
    },

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RegisteredUser',
        required: true,
        unique: true
    },

    firstName: {
        required: true,
        type: String,
        minlength: 1,
        trim: true
    },

    lastName: {
        required: true,
        type: String,
        minlength: 1,
        trim: true
    },

    image: {
        type: String,
        default: ""
    },

    dob : {
        type: String,
        default: ""
    },

    tags: [{
        type: mongoose.Schema.Types.ObjectId
    }]
});

var Profile = mongoose.model('Profile', ProfileSchema);

module.exports = { Profile };