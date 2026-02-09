const fs = require('fs');
const http = require('http');

// Create a dummy image
const filePath = 'test_image.jpg';
fs.writeFileSync(filePath, 'fake image content');

// Boundary for multipart data
const boundary = '--------------------------' + Date.now().toString(16);

const options = {
  hostname: 'localhost',
  port: 5001,
  path: '/api/scans/upload-image',
  method: 'POST',
  headers: {
    'Content-Type': 'multipart/form-data; boundary=' + boundary
  }
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  res.pipe(process.stdout);
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

// Write multipart body
req.write(`--${boundary}\r\n`);
req.write('Content-Disposition: form-data; name="image"; filename="test_image.jpg"\r\n');
req.write('Content-Type: text/plain\r\n\r\n');
req.write(fs.readFileSync(filePath));
req.write('\r\n');
req.write(`--${boundary}--`);
req.end();
