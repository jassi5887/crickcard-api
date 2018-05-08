const {User} = require('../../../models/user.model');
const {Otp} = require('../../../models/otp.model');
const _ = require('lodash');

findUser = async (mobile, res) => {
    console.log("****** FIND USER ********");
    try {
        return await User.findOne({
            mobile: mobile
        });
        
    } catch(err)  {
        console.log("Error: AUTH Register (Find User): \n", err);
        return res.status(400).send({"errorMsg": "Something went wrong!"});
    }
}

checkOtpVerification = async (mobile, otpType, res) => {
    console.log("****** Check OTP Verification ********");
    try {
        return await Otp.findOne({
            mobile: mobile,
            otpType: otpType
        })
    } catch(err) {
        console.log("Error: AUTH Register (Find OTP): \n", err);
        res.status(400).send({"errorMsg": "Something went wrong!"});
    }
}

createUser = async (req, res) => {
    console.log("****** CREATE USER ********");
    const body = _.pick(req.body, ['cc', 'mobile', 'firstName', 'lastName']);
    const user = new User({
        mobile:  body.cc + body.mobile,
        firstName: body.firstName,
        lastName: body.lastName,
        registrationComplete: true
    });
    try {
        await user.save();
        const authToken = await user.generateAuthToken();
        res.header('x-auth', authToken).send({user});
    } catch(err) {
        if (err.name === "ValidationError") {
            return res.status(400).send({"errorMsg": "Mobile number is not valid"});
        }
        res.status(400).send({"errorMsg": "Something went wrong!"});
    }
}

module.exports = {
    login: async (req, res) => {
        console.log("ATTEMPT LOGIN");
        if(!req.body.mobile || !req.body.cc) {
            return res.status(400).send({"errorMsg": "invalid request"});
        }

        try {
            const mobile = req.body.cc + req.body.mobile;
            const loginOtp = await Otp.findOne({mobile, otpType: "login", otpConfirmed: true});
            if (!loginOtp) {
                throw new Error({"errorMsg": "invalid request"});
            }

            let user = await User.findOne({mobile});
            if (!user) {
                throw new Error({"errorMsg": "Mobile not registered."});
            }

            const authToken = await user.generateAuthToken();
            res.header('x-auth', authToken).send({user});

        } catch(err) {
            if (err.errorMsg) {
                return res.status(400).send({"errorMsg": err.errorMsg});
            }

            return res.status(400).send();
        }
        
    },

    logout: async(req, res) => {
        console.log("X-AUTH:   \n", req.body['x-auth']);
       if(!req.body['x-auth']) {
            return res.status(400).send({"errorMsg": "invalid request"});
        }

        try {
            const user = await User.findByToken(req.body['x-auth']);
            console.log("USER: ", user);
            await user.removeToken(req.body['x-auth']);
            console.log("TOKEN REMOVED");
            res.status(200).send();
        } catch(err) {
            console.log("LOGOUT ERR: \n", err);
            res.status(400).send();
        }
        

    },

    register: async (req, res) => {
        if(!req.body.mobile || !req.body.otpType || !req.body.cc) {
            return res.status(400).send({"errorMsg": "invalid request"});
        }

        if(!req.body.firstName || !req.body.lastName) {
            return res.status(400).send({"errorMsg": "First and Last Names are required!"});
        }

        const mobile = req.body.cc + req.body.mobile;

        findUser(mobile, res).then((user) => {
            console.log("userFound", user);
            if (user) {
                return res.status(400).send({"errorMsg": "Mobile already registered! Please Login."});
            }

            checkOtpVerification(mobile, req.body.otpType, res).then((userOtp) => {
                if(!userOtp) {
                    return res.status(400).send({"errorMsg": "Something went wrong. Please refresh the page and try again."});   
                }

                if(!userOtp.otpConfirmed){
                    return res.status(400).send({"errorMsg": "Registration OTP is not confirmed. Please refresh the page and start again."});
                }

                createUser(req, res);
            });

        }).catch((err) => {
            return res.status(400).send({"errorMsg": "Something went wrong!"});
        });

    }
}