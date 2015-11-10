var mongoose = require('mongoose');
var expressJwt = require('express-jwt');
var bcrypt = require('bcrypt-nodejs');
var busboy = require('connect-busboy');
var path = require('path');
var fs = require('fs-extra');
var mkdir = require('mkdirp');
var md5 = require('MD5');

var SALT_WORK_FACTOR = 10;

module.exports = function(app, route) {

    app.use(busboy());

    // Setup the controller for REST
    var User = mongoose.model('user', app.models.user);

    /*
     *  GET account details from one id
     */
    app.get(app.settings.apiRoute + '/user/:id', expressJwt({
            secret: app.settings.secret
        }),
        function(req, res, next) {
            if (req.user.isAdmin || req.user._id == req.params.id) {
                User.findOne({
                    _id: req.user._id
                }, function(err, user) {
                    if (err) return res.status(404).send("User not found.");

                    return res.status(200).send(user);
                });
            } else {
                return res.status(401).send("Action not authorized");
            }
        });

    /*
     * Create a new User
     */
    app.post(app.settings.apiRoute + '/user/signup', function(req, res, next) {
        usernameCheck = /\W/;

        // FIELD VALIDATION
        if (req.body.username == null || req.body.email == null || req.body.password == null || req.body.username == '' || req.body.email == '' || req.body.password == '') {

            return res.status(400).send('Incorrect data');
        } else if (usernameCheck.test(req.body.username)) {
            return res.status(400).send("The username contains illegal characters.");
        } else if (req.body.username.length < 6 || req.body.username > 20) {
            return res.status(400).send("The username must be between 6 and 20 characters.");
        } else  if (req.body.password.length < 6) {
            return res.status(400).send("The password must be at least 6 characters long.");
        }
        // END VALIDATION

        console.log("username: " + req.body.username + " email: " + req.body.email);
        bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
            if (err) return next(err);

            bcrypt.hash(req.body.password, salt, null, function(err, hash) {
                if (err) return next(err);
                req.body.password = hash;
                // temporary - app.post below
                User.collection.insert(req.body, function(error, user) {
                    if (error) return res.status(400).send(error);
                    return res.status(200).send("User created");
                });
                // ----
                // next();
            });
        });
    });

    /*
     * Get the user profile
     */
    app.get(app.settings.apiRoute + '/user/:username/profile', function(req, res, next) {
        console.log(req.params.username);
        User.findOne({
            username: req.params.username
        }, function(err, data) {
            if (err || data === null) {
                console.log(err);
                console.log(data);
                return res.status(404).send("User not found");
            } else
                res.send(data.profile);
        });
    });

    /*
     * Change public information
     */
    app.put(app.settings.apiRoute + '/user/:id', expressJwt({
            secret: app.settings.secret
        }),
        function(req, res, next) {
            if (req.user._id == req.params.id) {
                User.findOne({
                    _id: req.user._id
                }, function(err, user) {
                    if (err || user === null) return res.status(404).send("User not found.");
                    console.log(user);
                    user.profile.firstname = req.body.profile.firstname;
                    user.profile.lastname = req.body.profile.lastname;
                    user.email = req.body.email;

                    // save the new user
                    user.save(function(err) {
                        if (err) return res.status(400).send("User could not be updated");

                        return res.status(200).send("User updated");
                    });
                });
            }
        });

    /*
     * set new avatar
     */
    app.put(app.settings.apiRoute + '/user/:username/avatar', expressJwt({
        secret: app.settings.secret
    }), function(req, res, next) {
        User.findOne({
            username: req.user.username
        }, function(err, user) {
            if (err || user === null) {
                return res.status(404).send("User not found");
            }

            if (user.uploads.indexOf(req.body.newAvatar) < 0) {
                return res.status(404).send("Avatar not found on the server");
            }

            if (req.body.requestType == "change") {

                user.profile.avatar = req.body.newAvatar;
                user.save(function(err) {
                    if (err) {
                        return res.status(400).send("Could not change avatar");
                    } else {
                        return res.status(200).send("Avatar changed");
                    }
                });

                // if type is delete, then delete the pic from the server and db
            } else if (req.body.requestType == "delete") {
                var file = __dirname + '/../' + req.body.newAvatar;
                fs.unlink(file, function(err) {
                    if (err) return res.status(400).send('picture could not be deleted');

                    var index = user.uploads.indexOf(req.body.newAvatar);
                    user.uploads.splice(index, 1);

                    // set the default avatar if the current profile picture was removed
                    if (user.profile.avatar == req.body.newAvatar) {
                        user.profile.avatar = app.settings.defaultPicture;
                    }

                    user.save(function(err) {
                        if (err) {
                            return res.status(400).send("Could not remove picture");
                        } else {
                            return res.status(200).send(req.body.newAvatar);
                        }
                    });

                });
            }
        });
    });


    /*
     * Avatar upload route
     */

    app.post(app.settings.apiRoute + '/user/:username/avatar', expressJwt({
        secret: app.settings.secret
    }), function(req, res, next) {

        var uploadPath = "";

        User.findOne({
            username: req.user.username
        }, function(err, user) {
            if (err || user === null) {
                console.log("user");
                return res.status(404).send("User not found");
            }
            if (user.uploads.length >= app.settings.maxImages) {
                return res.status(403).send("Maximum number of pictures reached: " + app.settings.maxImages);
            }

            req.pipe(req.busboy);
            req.busboy.on('file', function(fieldname, file, filename) {
                mkdir(__dirname + '/../uploads/' + req.user.username, function(err) {
                    if (err) console.error(err);

                    var hashDate = Date.now();
                    var fileExtension = filename.substring(filename.lastIndexOf('.'));

                    filename = md5(hashDate + filename) + fileExtension;

                    uploadPath = '/uploads/' + req.user.username + '/' + filename;
                    var stream = fs.createWriteStream(__dirname + '/../uploads/' + req.user.username + '/' + filename);
                    file.pipe(stream);
                    stream.on('close', function() {
                        console.log('File ' + filename + ' is uploaded');

                        if (user.uploads.length >= app.settings.maxImages) {
                            return res.status(403).send("Maximum number of pictures reached: " + app.settings.maxImages);
                        }

                        // Update the database with the avatars paths
                        user.uploads.push(uploadPath);
                        user.save(function(err) {
                            if (err) {
                                return res.status(400).send("Could not add image");
                            } else {
                                return res.status(200).send(uploadPath);
                            }
                        });
                    });
                });
            });
        });
    });


    // Return middleware
    return function(req, res, next) {
        next();
    }
};
