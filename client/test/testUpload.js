'use strict';

// Example code for uploading to s3
// Requires setting up s3 bucket and aws credentials

const upload = require('./upload-aws');

upload.uploadBuffer(Buffer.from([0x66, 0x55]), 'examples/images/test.bin', (response) => {
  console.dir(response);
  console.log('Successfully uploaded test object.');
});
