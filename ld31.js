var express = require('express'),
    cookieParser = require('cookie-parser'),
    io = require('socket.io'),
    mongoose = require('mongoose'),
    hookshot = require('hookshot'),
    sha1 = require('sha1');

var genCookie = function () {
    var randomNumber=Math.random().toString();
    return sha1(randomNumber.substring(2, randomNumber.length));
};

// Set up app with Express framework
var app = express();
//app.set('env', 'production');

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
if (app.get('env') === 'development') {
    app.set('view cache', false);
}

// Create server
var server = app.listen(process.env.PORT || 3300, function() {
    console.log('Listening on port %d', server.address().port);
});

// Configure the app
app.use(cookieParser());
// set a cookie
app.use(function (req, res, next) {
    // check if client sent cookie
    var cookie = req.cookies.UID;
    if (cookie === undefined) {
        // no: gen a new cookie
        cookie = genCookie();
        console.log('cookie have created successfully');
    } else {
        // yes, cookie was already present
        console.log('cookie exists', cookie);
    }
    // refresh cookie
    res.cookie('UID', cookie, { maxAge: 900000 });
    next(); // <-- important!
});

var assets = {
    "lib.js": {
        type: "js",
        dir: "js",
        files: [
            "../lib/underscore-min.js",
            "../lib/socket.io-1.2.1.js",
            "../lib/pixi.js"
        ]
    },
    "game.js" : {
        type: "requirejs",
        dir: "js",
        main: "game.js",
        lib: "../lib/require.js",
        includeLib: false
    },
    "style.css" : {
        type: "css",
        dir: "css",
        files: [
            "style.css"
        ]
    }
};

var assetManagerConfig = {
    rootRoute   : "/static",
    srcDir      : "./public",
    buildDir    : "./builtAssets",
    process     : true,
    env         : app.get("env")
};

app.use(require("express-asset-manager")(assets, assetManagerConfig, function () {
    console.log('callback called', arguments);
}));

if (app.get("env") === "development") {
    console.log('development mode');
    app.use('/static', express.static('public'));
} else {
    console.log('production mode');
    // in production, use a reverse proxy instead
    app.use('/static', express.static('builtAssets'));
}
app.use('/', express.static('public'));
app.use('/', function (req, res) {
    res.render('index');
});

app.use('/webhook', hookshot('refs/heads/master', 'git pull'));

// Connect DB
mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost/ld31');

var Schema = mongoose.Schema;

var clientsSchema = new Schema({
    cookieUID: String,
    clientId: String
});

var Client = mongoose.model('Client', clientsSchema);

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback () {
    console.log('connected to db', db.name);
});

// Tell Socket.io to pay attention
io = io.listen(server, { log: false });

// When a client connects...
io.sockets.on('connection', function(socket) {
    // Confirm the connection
    socket.emit('welcome', {});

    socket.on('message', function (data) {});

    // send start command to game client
    socket.on('start', function(data) {});

    // send disconnect command to game client
    socket.on('disconnect', function(data) {});
});

// When a client disconnects...
io.sockets.on('disconnect', function(socket) {});