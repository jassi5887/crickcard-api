module.exports = {
    getTeams: (req, res, next) => {
        res.send('TEAMS');
    },

    getTeam: (req, res, next) => {
        res.send('TEAM');
    }
};