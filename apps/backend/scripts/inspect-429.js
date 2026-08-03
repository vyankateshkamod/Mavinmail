
import http from 'http';

const CONFIG = {
    hostname: 'localhost',
    port: 5001,
    path: '/api/auth/login',
    method: 'POST',
};

const makeRequest = () => {
    const data = JSON.stringify({
        email: `test@example.com`,
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
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
            console.log(`Status: ${res.statusCode}`);
            console.log(`Body: ${body}`);
        });
    });

    req.write(data);
    req.end();
};

makeRequest();
