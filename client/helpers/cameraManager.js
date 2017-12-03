const fs = require('fs');

class CameraManager {
  constructor(camera, bramble) {
    this.camera = camera;
    this.socket = null;
    this.bramble = bramble;
    this._intervalMs = 1000;
    this._fullSize = false;
    this._imgCounter = 0;
    this._imgFiles = [];
    this._recording = false;
    this._photos = null;
  }

  setSocket(socket) {
    this.socket = socket;
  }

  startRecording() {
    console.log('start recording');
    this._recording = true;
    this.takePhoto();
  }

  stopRecording() {
    console.log('stop recording');
    this._recording = false;
  }

  takePhoto() {
    this.camera.snap()
      .then((response) => {
        console.log('snapped img ' + this._imgCounter);
        this._imgCounter++;
      })
      .then(() => {
        if (this._recording === true) {
          setTimeout(() => {
            this.takePhoto();
          }, this._intervalMs);
        } else {
          this._photos = this.getPhotos();
        }
      })
      .catch((error) => {
        console.log('snap error: ');
        console.log(error);
        this._recording = false;
      });
  }

  emitPhotos(imageFiles) {
    this.socket.emit('retrievedFiles', {
      id: this.bramble.id,
      files: imageFiles,
    });
  }

  getPhotos() {
    let imageFiles = [];

    let objects;
		if (this._fullSize) {
			objects = this.camera.getLastImage(this._imgCounter);
    } else {
			objects = this.camera.getLastThumb(this._imgCounter);
    }

    objects
      .then((response) => {
        console.log('got ' + response.length + ' thumbs');

        for (let i = 0; i < response.length; i++) {

          let filename = __dirname + '/../../server/public/gif/gif-img-' + i + '.jpg';
          // let filename = __dirname + '/server/public/gif/gif-img-' + i + '.jpg';

          let obj = response[i].image;

          fs.writeFileSync(filename, obj, {encoding: 'binary'});

          console.log('saved ' + filename);
          imageFiles[i] = filename;
        }

        this.socket.emit('retrievedFiles', {
          id: this.bramble.id,
          files: imageFiles,
        });
      })
  }
}

module.exports = CameraManager;
