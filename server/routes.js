var config = require('./settings');

var routes = {};

routes[config.apiRoute+'/user'] = require('./controllers/UserController');
routes[config.apiRoute+'/login'] = require('./controllers/LoginController');

module.exports = routes;
