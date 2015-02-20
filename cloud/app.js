
// These two lines are required to initialize Express in Cloud Code.
var express = require('express');
var app = express();

var _ = require('underscore');

var seasonCtrlr = require('cloud/controllers/seasons.js');
var matchCtrlr = require('cloud/controllers/matches.js');

var parseExpressHttpsRedirect = require('parse-express-https-redirect');
var parseExpressCookieSession = require('parse-express-cookie-session');
var parseFacebookUserSession = require('cloud/parse-facebook-user-session');

// Global app configuration section
app.set('views', 'cloud/views'); // Specify the folder to find templates
app.set('view engine', 'ejs'); // Set the template engine

app.use(parseExpressHttpsRedirect()); // Require user to be on HTTPS.


app.use(express.cookieParser('1234567'));
app.use(parseExpressCookieSession({
        cookie : {
            maxAge : 3600000
        }
    }));

app.use(parseFacebookUserSession({
        clientId : '598232666944761',
        appSecret : '5fc0ac7ecca5f40a9885d6b782296d90',
        verbose : true,
        redirectUri : '/login',
    }));
app.use(express.bodyParser()); // Middleware for reading request body


// You can use app.locals to store helper methods so that they are accessible from templates.
app.locals._ = _;
app.locals.formatTime = function(time) {
  return moment(time).format('MMMM Do YYYY, h:mm a');
};

// The homepage renders differently depending on whether user is logged in.
app.get('/', seasonCtrlr.list);
app.get('/seasons/:seasonId', matchCtrlr.list);


// You could have a "Log Out" link on your website pointing to this.
app.get('/logout', function (req, res) {
    console.log("Invoking Parse.User.logOut()", req);
    Parse.User.logOut();
    res.redirect('/');
});

// Attach the Express app to Cloud Code.
app.listen();
