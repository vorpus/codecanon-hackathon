'use strict'

const AWS = require('aws-sdk');

let s3;

(function init() {

  let credentials = new AWS.SharedIniFileCredentials();
  let config = new AWS.Config({credentials: credentials, region: 'us-east-1'});
  s3 = new AWS.S3(config);

})();

function Upload() {}

Upload.uploadBuffer = function(buffer, key, callback) {
  s3.upload({
    // @change
    Bucket: 'xxxxxx',
    Key: key,
    Body: buffer,
    ACL: 'public-read'
  }, (error, response) => {
		if (callback !== undefined && typeof callback == 'function') {
      callback(error);
    }
  });
};

/*
 * Generate info needed for a new file upload
 *   appId - unique string identifier for the app
 *   filetype - <string> 'image'|'gif'|'thumb'
 */
Upload.newFileInfo = function(appId, filetype) {

  let ts = (new Date()).getTime();
  let extensions = {
    image: 'jpg',
    thumb: 'jpg',
    gif: 'gif'
  }

  let ext = extensions[filetype] || '';


  let filename = 'examples/' + filetype + 's/' + appId + '/' + ts + '.' + ext;

  return {
    type: filetype,
    ts: ts,
    filename: filename
  };
}

module.exports = Upload;
