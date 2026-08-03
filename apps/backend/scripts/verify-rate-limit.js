
import http from 'http';

// Configuration
const CONFIG = {
    hostname: 'localhost',
    port: 5001,
    path: '/api/auth/login',
    method: 'POST',
    limit: 10, // The limit you set in your middleware
};

const makeRequest = (i) => {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({
            email: `test${i}@example.com`,
            password: 'password123'
        });

        const options = {
            hostname: CONFIG.hostname,
            port: CONFIG.port,
            path: CONFIG.path,
            method: CONFIG.method,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };

        const req = http.request(options, (res) => {
            resolve({ statusCode: res.statusCode, index: i });
            // Consume response data to free up memory
            res.resume();
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.write(data);
        req.end();
    });
};

async function runVerification() {
    console.log(`Starting verification: Sending ${CONFIG.limit + 2} requests to ${CONFIG.path}...`);
    console.log(`Expected behavior: First ${CONFIG.limit} allow, subsequent block (429).`);
    console.log('---------------------------------------------------');

    for (let i = 1; i <= CONFIG.limit + 2; i++) {
        try {
            const result = await makeRequest(i);
            const status = result.statusCode;

            let statusIcon = '✅';
            if (status === 429) statusIcon = '🛡️';
            else if (status >= 400) statusIcon = '⚠️';

            console.log(`${statusIcon} Request ${i}: Status ${status}`);

            if (status === 429) {
                console.log(`\n🎉 SUCCESS: Rate limiter active! Blocked request #${i}.`);
                return;
            }
        } catch (error) {
            console.error(`❌ Request ${i} failed:`, error.message);
        }
    }

    console.log('\n⚠️ WARNING: Rate limit was not triggered. Did you restart the server?');
}

runVerification();
