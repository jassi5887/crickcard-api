const {Otp} = require('../../../models/otp.model');
const {User} = require('../../../models/user.model');
const validator = require('validator');
const winston = require('../../../config/winston');

const OTPDOMAIN = "https://2factor.in/API/V1/";
const OTPAUTOGEN = "/AUTOGEN";
const OTPTRANSPORT = "/SMS/";
const OTPKEY = process.env.TWOFACTOR_KEY;

//template is the one you created on 2FACTOR website
let OTPTEMPLATE;
const OTPTEMPLATE_REGISTRATION = "crickcard";
const OTPTEMPLATE_LOGIN = "crickcard login";

var request = require('request-promise-native');

sendSMSOtp = (newOtp, otpType, mobile, res) => {
    //this will create the URI needed to send an OTP via 2FACTOR
    const OTPAPIENDPOINT = OTPDOMAIN + OTPKEY + OTPTRANSPORT + mobile + "/" + newOtp + "/" + OTPTEMPLATE;
    winston.log('info', `MOBILE: ${mobile} - Attempting ${otpType} OTP - ON: ${OTPAPIENDPOINT}`);
    const otpResponse =  request({
        uri: OTPAPIENDPOINT,
        headers: {"content-type": "application/x-www-form-urlencoded"},
        json: true
    });

    if(!otpResponse.Status === "Success") {
        winston.error(`MOBILE: ${mobile} - OTP COULD NOT BE SENT`);
        return res.status(400).send();
    }

    winston.log('info', `MOBILE: ${mobile} - OTP SENT`);
    res.status(200).send({"message": "otp generated"});
}

module.exports = {

    /**
     * send OTP to users mobile phone
     */
    sendOtp: async (req, res) => {
        if (!req.body.mobile || !req.body.cc) {
            return res.status(400).send({"errorMsg": "Please enter a valid mobile number"});
        }

        if (!req.body.otpType) {
            return res.status(400).send({"errorMsg": "Invalid Request."});
        }

        const mobile = req.body.cc + req.body.mobile;
        let notRegistered = false;
        let alreadyRegistered = false;
        //let newOtp;
        
        if (req.body.otpType == "registration") {
            OTPTEMPLATE = OTPTEMPLATE_REGISTRATION;
            //check, if for registration, that user doesn't exist
            try {
                const user = await User.findOne({mobile});
                if(user) {
                    winston.log('info', `REGISTRATION: ${mobile} - ALREADY REGISTERED`);
                    alreadyRegistered = true;
                    return res.status(400).send({"errorMsg": "Already registered. Please Login."});
                }
            } catch(err) {
                let error = err;
                if (err.name === 'ValidationError') {
                    winston.log('error', `REGISTRATION: ${mobile} - INVALID NUMBER`);
                    error = 'mobile number is invalid.';
                } else {
                    error = 'something went wrong';
                    winston.log('error', `REGISTRATION: ${mobile} - ${err}`);
                }
                return res.status(400).send({"errorMsg": error});
            }
        }

        if (req.body.otpType == "login") {
            OTPTEMPLATE = OTPTEMPLATE_LOGIN;
            try {
                if (! await validator.isMobilePhone(mobile, 'any', {strictMode: true}) ) {
                    throw new Error("ValidationError");
                }
                const user = await User.findOne({mobile});
                if(!user) {
                    winston.log('info', `LOGIN: ${mobile} - NOT REGISTERED`);
                    notRegistered = true;
                    return res.status(400).send({"errorMsg": "Not registered. Please Register."});
                }
            } catch(err) {
                let error = err.message;
                
                if (err.name === 'ValidationError' || error == 'ValidationError') {
                    winston.log('error', `LOGIN: ${mobile} - INVALID MOBILE`);
                    error = 'mobile number is invalid.';
                } else {
                    error = 'something went wrong';
                    winston.log('error', `LOGIN: ${mobile} - ${err}`);
                }
                return res.status(400).send({"errorMsg": error});
            }
        }

        try {
            await Otp.remove({
                mobile: mobile,
                otpType: req.body.otpType
            });
            let newOtp = new Otp({
                mobile: mobile
            });
            await newOtp.save();
            // if (req.body.otpType === 'registration') {
            //     await newOtp.save();
            // }
            const otp = await newOtp.generateOtp(req.body.otpType);
            await sendSMSOtp(otp, req.body.otpType, mobile, res);
        } catch (err) {
            let error = err;
            //console.log(err);
            if (err.name === 'ValidationError') {
                winston.log('error', `${req.body.otpType}: ${mobile} - INVALID MOBILE`);
                error = 'mobile number is invalid.';
            } else {
                winston.log('error', `${req.body.otpType}: ${mobile} - ${err}`);
                error = 'something went wrong';
            }
            return res.status(400).send({"errorMsg": error});
        }
    },


    /**
     * receive OTP from user to confirm it
     */
    confirmOtp: async (req, res) => {
        const mobile = req.body.cc + req.body.mobile;
        winston.log('info', `${req.body.otpType}: ARTTEMPTING OTP CONFIRMATION - ${mobile}`);
        if (!req.body.otp) {
            winston.log('info', `${req.body.otpType}: OTP CONFIRMATION - ${mobile} - OTP NOT RECEIVED`);
            return res.status(400).send({"errorMsg": "Please enter OTP!"});
        }

        if (!req.body.otpType || !req.body.mobile || !req.body.cc) {
            winston.log('warn', `${req.body.otpType}: OTP CONFIRMATION - ${mobile} - INVALID REQUEST: ${req.body}`);
            return res.status(400).send({"errorMsg": "invalid request."});
        }
        
        Otp.findOne({
            mobile: mobile,
            otpType: req.body.otpType
        }).then( async (userOtp) => {
            if (!userOtp) {
                console.log("OTP not found: ", userOtp);
                winston.log('warn', `${req.body.otpType}: OTP CONFIRMATION - ${mobile} - NO MATCHING OTP IN DB`);
                return res.status(400).send({"errorMsg": "invalid request."});
            }
            if (userOtp.otp === req.body.otp) {
                userOtp.otpConfirmed = true;
                await userOtp.save();
                return res.status(200).send({"message": "otp confirmed"});
            }

            winston.log('warn', `${req.body.otpType}: OTP CONFIRMATION - ${mobile} - INVALID OTP`);
            res.status(400).send({"errorMsg": "invalid OTP"});
        }).catch((err) => {
            winston.log('error', `${req.body.otpType}: OTP CONFIRMATION - SOMETHING WENT WRONG: ${err}`);
            res.status(400).send();
        });
    }
}