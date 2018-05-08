const {Otp} = require('../../../models/otp.model');
const {User} = require('../../../models/user.model');
const validator = require('validator');

const OTPDOMAIN = "https://2factor.in/API/V1/";
const OTPAUTOGEN = "/AUTOGEN";
const OTPTRANSPORT = "/SMS/";
const OTPKEY = process.env.TWOFACTOR_KEY;

//template is the one you created on 2FACTOR website
let OTPTEMPLATE;
const OTPTEMPLATE_REGISTRATION = "crickcard";
const OTPTEMPLATE_LOGIN = "crickcard login";

var request = require('request-promise-native');

generateNewOtp = async (req, res) => {
    const mobile = req.body.cc + req.body.mobile;
    //remove previous OTP
    await Otp.findOneAndRemove({
        mobile: mobile,
        otpType: req.body.otpType
    });

    let newOtp = new Otp({
        mobile: mobile
    });

    try {
        await newOtp.save();
        await newOtp.generateOtp(req.body.otpType);
        return newOtp;
    } catch(err) {
        let error = err;
        if (err.name === 'ValidationError') {
            console.log("MobileValidationError: \n", err);
            error = 'mobile number is invalid.';
        }

        res.status(400).send({"errorMsg": error});   
        return false;         
    }
}

sendSMSOtp = (newOtp) => {
    console.log("Attempt OTP", OTPAPIENDPOINT);
    //this will create the URI needed to send an OTP via 2FACTOR
    const OTPAPIENDPOINT = OTPDOMAIN + OTPKEY + OTPTRANSPORT + mobile + "/" + newOtp + "/" + OTPTEMPLATE;
    const otpResponse =  request({
        uri: OTPAPIENDPOINT,
        headers: {"content-type": "application/x-www-form-urlencoded"},
        json: true
    });

    if(!otpResponse.Status === "Success") {
        console.error("OTP could not be Sent: \n", otpResponse);
        return res.status(400).send();
    }

    console.log("OTP sent");
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
            console.log("OTP TYPE: REGISTRATION");
            OTPTEMPLATE = OTPTEMPLATE_REGISTRATION;
            //check, if for registration, that user doesn't exist

            try {
                const user = await User.findOne({mobile});
                if(user) {
                    console.log("SEND OTP:  ALREADY REGISTERED");
                    alreadyRegistered = true;
                    return res.status(400).send({"errorMsg": "Already registered. Please Login."});
                }
            } catch(err) {
                let error = err;
                if (err.name === 'ValidationError') {
                    console.log("MobileValidationError: \n", err);
                    error = 'mobile number is invalid.';
                } else {
                    error = 'something went wrong';
                }
                return res.status(400).send({"errorMsg": error});
            }
        }

        if (req.body.otpType == "login") {
            console.log("OTP TYPE: LOGIN");
            OTPTEMPLATE = OTPTEMPLATE_LOGIN;
            try {
                if (! await validator.isMobilePhone(mobile, 'any', {strictMode: true}) ) {
                    throw new Error("ValidationError");
                }

                const user = await User.findOne({mobile});
                if(!user) {
                    console.log("SEND OTP:  NOT REGISTERED");
                    notRegistered = true;
                    return res.status(400).send({"errorMsg": "Not registered. Please Register."});
                }
            } catch(err) {
                let error = err.message;
                
                if (err.name === 'ValidationError' || error == 'ValidationError') {
                    console.log("MobileValidationError: \n", err);
                    error = 'mobile number is invalid.';
                } else {
                    error = 'something went wrong';
                }
                return res.status(400).send({"errorMsg": error});
            }
        }

        try {
            await Otp.findOneAndRemove({
                mobile: mobile,
                otpType: req.body.otpType
            });
            let newOtp = new Otp({
                mobile: mobile
            });
            await newOtp.save();
            const otp = await newOtp.generateOtp();
            await sendSMSOtp(otp);
            console.log("GENERATE", newOtp);
        } catch (err) {
            let error = err;
            if (err.name === 'ValidationError') {
                console.log("SEND OTP ERROR: \n", err);
                error = 'mobile number is invalid.';
            } else {
                error = 'something went wrong';
            }
            return res.status(400).send({"errorMsg": error});
        }
    },


    /**
     * receive OTP from user to confirm it
     */
    confirmOtp: async (req, res) => {
        if (!req.body.otp) {
            return res.status(400).send({"errorMsg": "Please enter OTP!"});
        }

        if (!req.body.otpType || !req.body.mobile || !req.body.cc) {
            return res.status(400).send({"errorMsg": "invalid request."});
        }
        const mobile = req.body.cc + req.body.mobile;
        console.log("SEARCH MOBILE: ", mobile);
        await Otp.findOne({
            mobile: mobile,
            otpType: req.body.otpType
        }).then( async (userOtp) => {
            if (!userOtp) {
                return res.status(400).send({"errorMsg": "invalid request."});
            }
            if (userOtp.otp === req.body.otp) {
                userOtp.otpConfirmed = true;
                await userOtp.save();
                return res.status(200).send({"message": "otp confirmed"});
            }

            res.status(400).send({"errorMsg": "invalid OTP"});
        }).catch((err) => {
            res.status(400).send();
        });
    }
}