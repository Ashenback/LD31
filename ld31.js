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

// Create server
var server = app.listen(process.env.PORT, function() {
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

app.use('/', express.static('public/'));
app.use('/webhook', hookshot('refs/heads/master', 'git pull'));

// Connect DB
mongoose.connect(process.env.MONGO_URL);

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

// Sockets object to save game code -> socked associations
var socketCodes = {};

// When a client connects...
io.sockets.on('connection', function(socket) {
    // Confirm the connection
    socket.emit('welcome', {});

    socket.on('message', function (data) {

    });

    // send start command to game client
    socket.on('start', function(data) {
        if(socket.gameCode && socket.gameCode in socketCodes) {
            socketCodes[socket.gameCode].emit('start', data);
        }
    });

    // send disconnect command to game client
    socket.on('disconnect', function(data) {
        if(socket.gameCode && socket.gameCode in socketCodes) {
            socketCodes[socket.gameCode].emit('disconnectController', data);
        }
    });
});

// When a client disconnects...
io.sockets.on('disconnect', function(socket) {
    // remove game code -> socket association on disconnect
    if(socket.gameCode && socket.gameCode in socketCodes) {
        delete socketCodes[socket.gameCode];
    }
});