const winston = require('../../config/winston');
const { RegisteredUser } = require('../../models/user.model');
const { Profile } = require('../../models/profile.model');
const { Team } = require('../../models/team.model');
const {isObjectIdValid} = require('../../utils/utils');

module.exports = {

    createTeam: async (req, res) => {
        /**
         * This is to create a team and make creator the admin of the team
         */

        try {
            const authToken = req.header('x-auth');
            const user = await RegisteredUser.findByToken(authToken);
            const profile = await Profile.findOne({user: user._id});

            const team = new Team({
                name: req.body.teamName,
                admin: profile._id,
                players: profile._id
            });

            team.save();

            return res.status(200).send(team);

        } catch (err) {
            winston.log('createTeam: - ${err}');
            return res.status(400).send({"errorMsg": "Something went Wrong"});
        }
    },

    getTeams: async (req, res) => {
        /**
         * This is to get all the teams a player is part of
         */
        winston.log('info', 'Getting teams');
        try {
            const authToken = req.header('x-auth');
            const user = await RegisteredUser.findByToken(authToken);
            const profile = await Profile.findOne({user: user._id});
           
            await Team.find({players: profile._id})
                      .populate('players')
                      .populate('captain')
                      .populate('viceCaptain')
                      .populate('admin')
                      .exec((err, teams) => {
                        winston.log('info', `TEAMS - ${teams}`);
                        return res.status(200).send(teams);
                       });
        } catch (err) {
            winston.log('error', `getTeams: ${err}`);
            return res.send(400).send({"errMessage": "Something went wrong"});
        }
    },

    getTeam: async (req, res) => {
        /**
         * This is to get a team by team Id
         */

        const teamId = req.params.id;
        console.log("TEAMID", teamId);
        if (isObjectIdValid(teamId)) {
            try {
                await Team
                        .findOne({"_id": teamId})
                        .populate('players')
                        .populate('captain')
                        .populate('viceCaptain')
                        .populate('admin')
                        .exec((err, team) => {
                            winston.log('info', `TEAM - ${team}`);
                            return res.status(200).send(team);
                        });
            } catch(err) {
                return res.status(400).send({});     
                winston.log("error", `getTeam: ${err}`);
            }
            
        }
    }
};