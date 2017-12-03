'use strict';

let cameras = {};

function SocketManager(io) {
  let self = this;

  // Socket endpoints
  io.on('connection', function (socket) {
    console.log('client connected')

    let statusTimer;
    let cameraId;

    socket.on('sendStatus', (shouldSend) => {

      if (shouldSend === false) return;

      clearInterval(statusTimer);
      statusTimer = setInterval(()=> {
        //console.log('sending status to client');
        socket.emit('cameraStatus', {
          cameras: cameras
        });
      }, 1000);

    });

    socket.on('disconnect', function () {
      console.log('client disconnected')
      clearInterval(statusTimer);

      if (cameras[cameraId]) {
        delete cameras[cameraId];
      }
    })

    socket.on('cameraCommand', (obj) => {

      console.log('cameraCommand');
      console.log(obj);
      let cameraId = obj.cameraId;
      let cmd = obj.command;

      io.emit('cameraCommand', {
        target: cameraId,
        command: cmd
      });

    });

    socket.on('managerCommand', (obj) => {

      console.log('managerCommand');
      console.log(obj);
      let cameraId = obj.cameraId;
      let cmd = obj.command;

      io.emit('managerCommand', {
        target: cameraId,
        command: cmd
      });

    });

    socket.on('cameraStatus', (obj) => {
      console.log('cameraStatus');
      console.log(obj);
      cameraId = obj.id;
      cameras[obj.id] = obj;
    });

    socket.on('cameraDying', (obj) => {
      console.log('cameraDying');
      console.log(obj);
      if (cameras[obj.id]) {
        delete cameras[obj.id];
      }
    });


    socket.on('cameraSnap', (obj) => {
      console.log('cameraSnap');
      io.emit('cameraSnap', obj)
    });

    socket.on('cameraStream', (obj) => {
      console.log('cameraStream');
      // console.log(obj);
      io.emit('cameraStream', obj);
    });

    socket.on('retrievedFiles', (obj) => {
      console.log('retrievedFiles');
      // console.log(obj);
      io.emit('retrievedFiles', obj);
    });

  });
}

module.exports = SocketManager
