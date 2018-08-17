const {ObjectID} = require('mongodb');

isObjectIdValid = (objectId) => {
    return ObjectID.isValid(objectId)
}

module.exports = { isObjectIdValid };