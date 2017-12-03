var express = require('express')
var path = require('path')
var favicon = require('serve-favicon')
var cookieParser = require('cookie-parser')
var bodyParser = require('body-parser')
const socketIO = require('socket.io')

/* socket modules */
const SocketManager = require('./SocketManager')

var routes = require('./routes')

var app = express()
var server = require('http').Server(app);

/* set up the REST server */
(function restSetup() {

  // http://localhost:5000
  const REST_PORT = 5000

  // view engine setup
  app.set('views', path.join(__dirname, 'views'))
  app.set('view engine', 'ejs')

  // favicon in /public
  app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')))
  app.use(express.static(path.join(__dirname, 'public')))

  app.use(bodyParser.urlencoded({
    extended: true
  }))
  app.use(bodyParser.json())
  app.use(cookieParser())

  // use routes.js for routes
  app.use('/', routes)

  let port = process.env.PORT || REST_PORT
  server.listen(port)

  console.log('Listening on port ' + port)
})();

/* setup the socket connection */
(function socketSetup() {
  const io = socketIO(server)
  const checkinSocket = new SocketManager(io)
})()
