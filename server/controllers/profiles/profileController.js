module.exports = {
    getProfileById: (req, res) => {
        res.send('Players Profile');
    },

    getOwnProfile: (req, res) => {
        res.send('My Profile');
    }
}