const mongoose = require('mongoose');
const validator = require('validator');

var OtpSchema = new mongoose.Schema({
    otp: {
        type: String
    },
    mobile: {
        required: true,
        type: String,
        trim: true,
        validate: [{
            validator: (value) => {
                return validator.isMobilePhone(value, 'any', {strictMode: true});
            },
            message: `{VALUE} is not a valid mobile number.`
        }, {
            validator: (value) => {
                return validator.isByteLength(value, {min: 10})
            },
            message: `{VALUE} is not a valid mobile number,`
        }]
    },
    otpConfirmed: {
        type: Boolean,
        default: false
    },
    otpType: {
        type: String
    }
});

OtpSchema.methods.generateOtp = function(otpType) {
    var otp = this;
    otp.otp = Math.floor(100000 + Math.random() * 900000);
    otp.otpType = otpType;
    console.log("Saving OTP: ", otp.otp, otpType);
    return otp.save().then(() => {
        return otp.otp;
    });

};

var Otp = mongoose.model('Otp', OtpSchema);

module.exports = { Otp };