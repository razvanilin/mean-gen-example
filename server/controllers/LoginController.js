var mongoose = require('mongoose');
var jwt = require('jsonwebtoken');

module.exports = function(app, route) {

    var User = mongoose.model('User', app.models.user);

    // Create the middleware
    app.post(app.settings.apiRoute+'/login', function(req, res) {
        var username = req.body.username || '';
        var password = req.body.password || '';

        if (username == '' || password == '') {
            return res.status(401).send('Wrong username or password');
        }

        User.findOne({
            username: username
        }, function(err, user) {
            if (err || user === null) {
                console.log(err);
                return res.status(401).send('Wrong username or password');
            }

            user.comparePassword(password, function(isMatch) {
                if (!isMatch) {
                    console.log("Failed to login with " + user.username);
                    return res.status(401).send('Wrong username or password');
                }

                var profile = {
                    _id: user._id,
                    username: user.username,
                    email: user.email,
                    profile: user.profile,
                };

                var token = jwt.sign(profile, app.settings.secret, {
                    expiresInMinutes: 60 * 5
                });

                // check if remember me was ticked
                if (req.body.rememberme) {
                    console.log('remember me');
                    res.cookie('rememberme', token, {httpOnly: true, maxAge: 604800000});
                }

                console.log('Log in successfull as ' + user.username);
                res.json({
                    user: {
                        id: user._id,
                        username: user.username,
                        avatar: user.profile.avatar
                    },
                    token: token
                });
            });
        });
    });

    app.get(app.settings.apiRoute+'/logout', function(req, res) {
        req.logout();
        res.send("Log out");
    });

    // Return middleware
    return function(req, res, next) {
        next();
    }
};
