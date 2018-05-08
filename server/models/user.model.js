const mongoose = require('mongoose');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const bcrypt = require('bcryptjs');

var UserSchema = new mongoose.Schema({
    mobile: {
        required: true,
        type: String,
        unique: true,
        minlength: 10,
        trim: true,
        validate: {
            validator: (value) => {
                return validator.isMobilePhone(value, 'any', {strictMode: true});
            },
            message: `{VALUE} is not a valid mobile number.`
        } 
    },

    firstName: {
        required: true,
        type: String,
        minlength: 1,
        trim: true
    },

    lastName: {
        required: true,
        type: String,
        minlength: 1,
        trim: true
    },

    // email: {
    //     required: false,
    //     //unique: true,
    //     trim: true,
    //     validate: {
    //         validator: (value) => {
    //             return validator.isEmail(value);
    //         },
    //         message: `{VALUE} is not a valid email id.`
    //     }
    // },

    password: {
        type: String,
        required: false,
        minlength: 6
    },

    tokens: [{
        access: {
            required: true,
            type: String
        },
        token: {
            required: true,
            type: String
        }
    }],

    registrationComplete: {
        type: Boolean,
        default: false
    }
});

/**
 * Instance Methods
 */
UserSchema.methods.toJSON = function() {
    var user = this;
    var userObject = user.toObject();

    return _.pick(userObject, ['_id', 'mobile', 'firstName', 'lastName']);
};

UserSchema.methods.generateAuthToken = function() {
    var user = this;
    var access = 'auth';
    var token = jwt.sign({_id: user._id.toHexString(), access}, process.env.JWT_SECRET).toString();

    user.tokens.push({access, token});
    return user.save().then(() => {
        return token;
    });
};

UserSchema.methods.removeToken = function(token) {
    var user = this;
    console.log("INSIDE REMOVE TOKEN: ", token);
    return user.update({
        $pull: {
            tokens: {token}
        }
    });
};


/**
 * Model Methods
 */

UserSchema.statics.findByToken = function(token) {
    var User = this; //Model
    var decoded;

    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch(err) {
        return Promise.reject();
    }   

    return User.findOne({
        '_id': decoded._id,
        'tokens.token': token,
        'tokens.access': 'auth'
    });
};

// UserSchema.statics.findByCredentials = function(email, password) {
//     var User = this;

//     return User.findOne({email}).then((user) => {
//         if (!user) {
//             return Promise.reject();
//         }
//         return new Promise((resolve, reject) => {
//             bcrypt.compare(password, user.password, (err, res) => {
//                 if (res) {
//                     resolve(user);
//                 } else {
//                     reject();
//                 } 
//             });
//         });
//     });
// };

UserSchema.pre('save', function(next) {
    var user = this;
    if (user.isModified('password')) {
        bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(user.password, salt, (err, hash) => {
                user.password = hash;
                next();
            });
        });
    } else {    
        next();
    }
});

var User = mongoose.model('User', UserSchema);

module.exports = { User };