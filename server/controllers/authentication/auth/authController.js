const {RegisteredUser} = require('../../../models/user.model');
const { Profile } = require('../../../models/profile.model');
const {Otp} = require('../../../models/otp.model');
const winston = require('../../../config/winston');
const _ = require('lodash');

findUser = async (mobile, res) => {
    try {
        return await RegisteredUser.findOne({
            mobile: mobile
        });
        
    } catch(err)  {
        winston.log('error', `FIND USER: ${mobile} - ${err}`);
        return res.status(400).send({"errorMsg": "Something went wrong!"});
    }
}

checkOtpVerification = async (mobile, otpType, res) => {
    try {
        return await Otp.findOne({
            mobile: mobile,
            otpType: otpType
        })
    } catch(err) {
        winston.log('error', `FIND OTP: ${mobile} - ${err}`);
        res.status(400).send({"errorMsg": "Something went wrong!"});
    }
}

createUser = async (req, res) => {
    const body = _.pick(req.body, ['cc', 'mobile', 'firstName', 'lastName']);
    const mobile = body.cc + body.mobile;
    winston.log('info', `MOBILE: ${body.mobile} - ATTEMPTING TO CREATE USER`);
    const user = new RegisteredUser({
        mobile: mobile,
        registrationComplete: true
    });
    try {
        await user.save();

        const profile = new Profile({
            firstName: body.firstName,
            lastName: body.lastName,
            user: user._id
        });

        await profile.save();

        const authToken = await user.generateAuthToken();
        await Profile.findById(profile._id).populate('user').exec((err, userProfile) => {
            res.header('x-auth', authToken).send({userProfile});
        });

    } catch(err) {
        if (err.name === "ValidationError") {
            winston.log('error', `MOBILE: ${mobile} - INVALID MOBILE`);
            return res.status(400).send({"errorMsg": "Mobile number is not valid"});
        }
        winston.log('error', `MOBILE: ${mobile} - ${err}`);
        res.status(400).send({"errorMsg": "Something went wrong!"});
    }
}

module.exports = {
    login: async (req, res) => {
        const mobile = req.body.cc + req.body.mobile;
        winston.log('info', `MOBILE: ${mobile} - ATTEMPTING LOGIN`);
        if(!req.body.mobile || !req.body.cc) {
            winston.log('error', `MOBILE: ${mobile} - ATTEMPTING LOGIN`);
            return res.status(400).send({"errorMsg": "invalid request"});
        }

        try {
            const loginOtp = await Otp.findOne({mobile, otpType: "login", otpConfirmed: true});
            if (!loginOtp) {
                winston.log('error', `MOBILE: ${mobile} - INVALID REQUEST - NO OTP IN DB`);
                throw new Error({"errorMsg": "invalid request"});
            }

            let user = await RegisteredUser.findOne({mobile});
            if (!user) {
                winston.log('error', `MOBILE: ${mobile} - NOT REGISTERED`);
                throw new Error({"errorMsg": "Mobile not registered."});
            }
            const authToken = await user.generateAuthToken();

            await Profile.findById({user: user._id}).populate('user').exec((err, userProfile) => {
                res.header('x-auth', authToken).send({userProfile});
            });         

        } catch(err) {
            if (err.errorMsg) {
                winston.log('error', `Login: Mobile - {mobile} - ${err}`)
                return res.status(400).send({"errorMsg": err.errorMsg});
            }
            winston.log('error', `Login: Mobile - {mobile} - ${err}`)
            return res.status(400).send();
        }
        
    },

    logout: async(req, res) => {
        winston.log('info', `ATTEMPTING LOGOUT`);
       if(!req.body['x-auth']) {
           winston.log('error', `LOGOUT: NO AUTH TOKEN RECEIVED`);
            return res.status(400).send({"errorMsg": "invalid request"});
        }

        try {
            const user = await RegisteredUser.findByToken(req.body['x-auth']);
            await user.removeToken(req.body['x-auth']);
            winston.log('info', `LOGGED OUT`);
            res.status(200).send();
        } catch(err) {
            winston.log('error', `LOGOUT ERROR: ${err}`);
            res.status(400).send();
        }
        

    },

    register: async (req, res) => {
        winston.log('error', `ATTEMPTING REGISTER`);
        if(!req.body.mobile || !req.body.otpType || !req.body.cc) {
            winston.log('error', `REGISTER: EITHER OF MOBILE/OTPTYPE/COUNTRY CODE NOT RECEIVED - ${req.body}`);
            return res.status(400).send({"errorMsg": "invalid request"});
        }

        const mobile = req.body.cc + req.body.mobile;

        if(!req.body.firstName || !req.body.lastName) {
            winston.log('error', `REGISTER: ${mobile} EITHER OF FIRSTNAME/LASTNAME NOT RECEIVED - ${req.body}`);
            return res.status(400).send({"errorMsg": "First and Last Names are required!"});
        }

        findUser(mobile, res).then((user) => {
            winston.log('info', `Finding User - ${mobile}`);
            if (user) {
                winston.log('info', `REGISTER: ${mobile} - ALREADY REGISTERED`);
                return res.status(400).send({"errorMsg": "Mobile already registered! Please Login."});
            }

            checkOtpVerification(mobile, req.body.otpType, res).then((userOtp) => {
                if(!userOtp) {
                    winston.log('error', `REGISTER: ${mobile} - NO OTP IN DB!`);
                    return res.status(400).send({"errorMsg": "Something went wrong. Please refresh the page and try again."});   
                }

                if(!userOtp.otpConfirmed){
                    winston.log('error', `REGISTER: ${mobile} - OTP IS NOT CONFIRMED!`);
                    return res.status(400).send({"errorMsg": "Registration OTP is not confirmed. Please refresh the page and start again."});
                }

                createUser(req, res);
            });

        }).catch((err) => {
            winston.log('error', `REGISTER: ${mobile} - ${err}`);
            return res.status(400).send({"errorMsg": "Something went wrong!"});
        });

    }
}