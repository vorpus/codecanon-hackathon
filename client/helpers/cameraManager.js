class CameraManager {
  constructor(camera) {
    this.camera = camera;
    this._intervalMs = 1000;
    this._fullSize = false;
    this._imgCounter = 0;
    this._imgFiles = [];
    this._recording = false;
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
        }
      })
      .catch((error) => {
        console.log('snap error: ');
        console.log(error);
        this._recording = false;
      });
  }

  getPhotos() {
    let objects;
		if (this._fullSize) {
			objects = camera.getLastImage(this._imgCounter);
    } else {
			objects = camera.getLastThumb(this._imgCounter);
    }

    objects
      .then((response) => {
        console.log('got ' + response.length + ' thumbs');

        for (let i = 0; i < response.length; i++) {

          let filename = 'gif/gif-img-' + i + '.jpg';

          let obj = response[i].image;

          fs.writeFileSync(filename, obj, {encoding: 'binary'});

          console.log('saved ' + filename);
          imageFiles[i] = filename;
        }
      })
  }
}

module.exports = CameraManager;
