var mongoose = require('mongoose');
var timestamps = require('mongoose-timestamp');
var bcrypt = require('bcrypt-nodejs');

// Create the User Schema
var UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
    },
    profile: {
        avatar: {
            type: String,
            default: '/uploads/default.png'
        },
        firstname: {
            type: String,
            default: 'Awesome'
        },
        lastname: {
            type: String,
            default: 'Name'
        }
    },
    uploads: []
});

UserSchema.plugin(timestamps);

UserSchema.methods.comparePassword = function(candidatePassword, cb) {
    bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
        if (err) return cb(err);
        cb(isMatch);
    });
};

// Export the mode schema
module.exports = UserSchema;
