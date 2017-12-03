'use strict';

const fs = require('fs');
const bramble = {
  "id":"Canon MM100-WS"
}

// API Wrapper
const Camera = require('howielib').MMCamera;
const logger = require('howielib').Logger;

const CameraManager = require('./helpers/cameraManager');

logger.setLevel('normal'); // Logging level:  normal or debug

// default http://localhost:5000 - stubbed HEROKU using socket.io
let SERVER_URL = 'http://0.0.0.0:5000';

let socket;
let camera = new Camera();
const cameraManager = new CameraManager(camera);

let cameraStatus = {
  response: 'connected',
  filename: undefined,
  streaming: false
};

camera.ipConnect(() => {
  connectSocketToServer();
});

// When you have multiple cameras on same network,
// allow you to choose by ip address
// camera.ipConnect(() => {
//   connectSocketToServer();
// }, {address: '10.0.0.1'});

var timers = {
  status_loop: undefined,
  STATUS_LOOP_MS: 1000
};

let socketCommands = {

  snap: (callback) => {

    logger.green('taking photo');

    camera.snap()
    .then((response) => {
      logger.green('snap complete');
      logger.dir(response);
      return camera.getLastImage();
    })
    .then((response) => {
      logger.green('emitting cameraSnap');
      // logger.dir(response);

      socket.emit('cameraSnap', {
        id: bramble.id,
        snap: response[0].image.toString('base64')
      });

      console.log('display image')
      cameraStatus.response = 'ready';
      // execute callback
      callback();
    })
    .catch((error) => {
      logger.red('snap error');
      logger.red(error);
      cameraStatus.response = 'error';
    });
  },

  stream: (callback) => {


    // execute callback immediately
    if (typeof callback === 'function') {
      callback();
    }

    if (cameraStatus.streaming) {
      camera.stopStream();
      cameraStatus.streaming = false;
      cameraStatus.response = 'ready';
      return;
    }

    cameraStatus.streaming = true;

    cameraStatus.response = 'streaming';
    logger.cyan('start streaming...');

    function onFrame(data) {

      logger.green('emitting cameraStream');
      data.image = data.image.toString('base64');

      socket.emit('cameraStream', {
        id: bramble.id,
        stream: data
      });

    }

    camera.startStream(onFrame);
  },

  startRecording: (callback) => {
    cameraManager.startRecording();
  },

  stopRecording: () => {
    cameraManager.stopRecording();
  },
}


function connectSocketToServer() {

  socket = require('socket.io-client')(SERVER_URL);

  socket.on('connect', () => {
    console.log('connected to local server');

    timers.status_loop = setInterval(() => {
        socket.emit('cameraStatus', getStatus());
    }, timers.STATUS_LOOP_MS);
  });

  socket.on('disconnect', () => {
    console.log('socket disconnected');
    clearInterval(timers.status_loop);
  });

  socket.on('cameraCommand', onCameraCommand);
  socket.on('managerCommand', onManagerCommand);
}

function onManagerCommand(obj) {
  if (obj.target !== bramble.id && obj.target !== 'broadcast') {
    return;
  }

  console.log('received command: ');
  console.log(obj);

  let cmd = obj.command;
  socketCommands[cmd]();
}

function onCameraCommand(obj) {

  if (obj.target !== bramble.id && obj.target !== 'broadcast') {
    return;
  }

  console.log('received command: ');
  console.log(obj);

  let cmd = obj.command;
  let cmdFunction = socketCommands[cmd];

  if (cameraStatus.streaming && cmd !== 'stream') {
    return;
  }

  if (typeof cmdFunction === 'function') {
    // stop accepting commands while processing this one
    socket.off('cameraCommand', onCameraCommand);
    cameraStatus.response = 'retrieving...';
    cmdFunction(() => {
      // accept commands again after processing
      socket.on('cameraCommand', onCameraCommand);
    });
  } else {
    logger.yellow('command not recognized: ' + cmd);
  }

}

/*-------------------------------------------*/

function getStatus() {
 return {
    id: bramble.id,
    arch: process.arch,
    platform: process.platform,
    response: cameraStatus.response,
    last_image: cameraStatus.last_image,
    last_gif: cameraStatus.last_gif,
    streaming: (cameraStatus.streaming) ? ('on') : ('off')
  };
}

function gifLoop() {

}


process.on('SIGINT', () => {
  console.log('shutting down...');
  socket.emit('cameraDying', {id: bramble.id});
  process.exit(0);
});
