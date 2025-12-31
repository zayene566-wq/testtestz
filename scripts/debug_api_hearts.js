const http = require('http');

// Helper for requests
function request(method, path, body, cookie = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/api/game' + path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...(cookie && { 'Cookie': cookie })
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const newCookie = res.headers['set-cookie'] ? res.headers['set-cookie'][0] : cookie;
                try {
                    resolve({ status: res.statusCode, body: JSON.parse(data), cookie: newCookie });
                } catch (e) {
                    console.error("JSON Parse Error:", data);
                    resolve({ status: res.statusCode, body: {}, cookie: newCookie });
                }
            });
        });

        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function test() {
    const username = 'api_test_' + Date.now();
    console.log(`Testing with user: ${username}`);

    // 1. Login
    const loginRes = await request('POST', '/login', { username });
    if (loginRes.status !== 200) {
        console.error("Login Failed", loginRes.body);
        return;
    }
    const cookie = loginRes.cookie;
    console.log("Logged in. Cookie:", cookie.substring(0, 20) + "...");

    // 2. Initial Data
    const dataRes1 = await request('GET', '/data', null, cookie);
    const initialHearts = dataRes1.body.user.hearts;
    console.log("Initial Hearts:", initialHearts);

    // 3. Fail Stage
    console.log("Calling /fail-stage...");
    const failRes = await request('POST', '/fail-stage', {}, cookie);
    console.log("Fail Response:", failRes.body);

    // 4. Check Data Again
    const dataRes2 = await request('GET', '/data', null, cookie);
    const finalHearts = dataRes2.body.user.hearts;
    console.log("Final Hearts:", finalHearts);

    if (finalHearts === initialHearts - 1) {
        console.log("SUCCESS: API Logic works. Hearts deducted correctly.");
    } else {
        console.error("FAILURE: Hearts did not decrease via API.");
    }
}

test().catch(console.error);
