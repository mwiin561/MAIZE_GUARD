const http = require('http');

// Configuration
const PORT = 5001;
const HOST = 'localhost';

// Helper for making requests
function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: HOST,
      port: PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
            const parsed = data ? JSON.parse(data) : {};
            resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
            resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', (e) => reject(e));

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTest() {
  console.log('--- Starting Integration Test ---');

  // 1. Health Check
  try {
      console.log('Checking Server Health...');
      // Note: Root returns text, not JSON, so handle that
      const healthReq = http.request({ hostname: HOST, port: PORT, path: '/', method: 'GET' }, (res) => {
          let data = '';
          res.on('data', c => data += c);
          res.on('end', () => console.log('Server Health:', data));
      });
      healthReq.end();
  } catch (e) {
      console.error('Server not running!');
      return;
  }
  
  // Wait a bit
  await new Promise(r => setTimeout(r, 1000));

  // 2. Register User
  const email = `testuser_${Date.now()}@example.com`;
  const password = 'password123';
  console.log(`\nRegistering user: ${email}`);
  
  const authRes = await request('POST', '/api/auth/register', {
    name: 'Test Farmer',
    email: email,
    password: password,
    region: 'Nairobi',
    farmSize: 5
  });

  if (authRes.status !== 200) {
      console.error('Registration failed:', authRes.data);
      // Try login if user exists (though we used random email)
      return;
  }
  
  const token = authRes.data.token;
  console.log('Got Auth Token');

  // 3. Test Silent Sync (Vector Data)
  console.log('\nTesting Silent Sync with Vector Data...');
  const scanPayload = [
      {
        localId: `local_${Date.now()}`,
        imageMetadata: { resolution: '1920x1080', orientation: 'Portrait' },
        location: { latitude: -1.2921, longitude: 36.8219 }, // Nairobi
        environment: { 
            leafhopperObserved: 'Yes',
            weather: 'Sunny'
        },
        diagnosis: {
            modelPrediction: 'Maize Streak Virus',
            confidence: 0.95,
            userVerified: true,
            finalDiagnosis: 'Maize Streak Virus'
        },
        imageUrl: 'http://example.com/fake-image.jpg'
      }
  ];

  const syncRes = await request('POST', '/api/scans/sync', scanPayload, {
      'x-auth-token': token
  });

  console.log('Sync Response:', syncRes.data);

  if (syncRes.status === 200 && syncRes.data.syncedCount === 1) {
      console.log('SUCCESS: Scan synced successfully.');
  } else {
      console.error('FAILURE: Sync failed.');
  }

  // 4. Verify Data Retrieval
  console.log('\nVerifying Data Persistence...');
  const getRes = await request('GET', '/api/scans', null, {
      'x-auth-token': token
  });

  if (getRes.status === 200 && Array.isArray(getRes.data)) {
      const savedScan = getRes.data[0];
      console.log('Retrieved Scan:', savedScan ? 'Found' : 'Not Found');
      
      if (savedScan) {
          console.log('Vector Data (Leaf Hopper):', savedScan.environment.leafhopperObserved);
          
          if (savedScan.environment.leafhopperObserved === 'Yes') {
              console.log('SUCCESS: Vector data correctly stored!');
          } else {
              console.error('FAILURE: Vector data mismatch.');
          }
      }
  } else {
      console.error('FAILURE: Could not retrieve scans.');
  }
}

runTest();
