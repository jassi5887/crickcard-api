const { RegisteredUser } = require('../../models/user.model');
const { Profile } = require('../../models/profile.model');
const winston = require('../../config/winston');

module.exports = {
    getProfileById: (req, res) => {
        res.send('Players Profile');
    },

    getOwnProfile: async (req, res) => {
        
        try {
            const authToken = req.header('x-auth');
            console.log("AUTHTOKEN: ", authToken);
            const user = await RegisteredUser.findByToken(authToken);
            await Profile.findOne({user:user._id}).populate('user').exec((err, thisProfile) => {
                console.log('MYPROFILE 1:  ', thisProfile);
                res.status(200).send(thisProfile);        
            });
        } catch (err) {
            winston.log('error', `getOwnProfile:  ${err}`);
            return res.status(401).send({"errMessage": "You are not logged in."});
        }
    }
}