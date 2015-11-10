var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var uuid = require('uuid');
var methodOverride = require('method-override');
var _ = require('lodash');
var cors = require('cors');
var path = require('path');

// Create the application
var app = express();
app.settings = require('./settings');

// Add Middleware necessary for REST API's
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(methodOverride('X-HTTP-Method-Override'));
app.use(session({
  genid: function(req) {
    return uuid.v4(); // use UUIDs for session IDs
  },
  secret: app.settings.secret
}));

// CORS Support
app.use(cors());

app.use(app.settings.apiRoute+"/uploads", express.static(path.join(__dirname, 'uploads')));

app.get('/', function(req, res, next) {
  return res.status(200).send("Welcome to the API");
});

// Connect to MongoDB
mongoose.connect(app.settings.dbhost);
mongoose.connection.once('open', function() {

	// Load the models
	app.models = require('./models/index');

	// Load the routes
	var routes = require('./routes');


	_.each(routes, function(controller, route) {
		app.use(route, controller(app, route));
	});



	console.log('Listening on port ' + app.settings.port);
	app.listen(app.settings.port);
});
