const mongoose = require('mongoose');

var TagSchema = new mongoose.Schema({
    tagName: {
        type: String
    },

    priority: {
        type: Number
    }
});

var Tag = mongoose.model('Tag', TagSchema);

module.exports = { Tag };