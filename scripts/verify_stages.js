const http = require('http');

// Simple http wrapper since axios might not be installed
function request(options, postData) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                if (res.headers['set-cookie']) {
                    resolve({ body: JSON.parse(body), headers: res.headers, status: res.statusCode });
                } else {
                    try {
                        resolve({ body: JSON.parse(body), headers: res.headers, status: res.statusCode });
                    } catch (e) {
                        resolve({ body: body, headers: res.headers, status: res.statusCode }); // non-json response
                    }
                }
            });
        });
        req.on('error', reject);
        if (postData) req.write(postData);
        req.end();
    });
}

async function test() {
    try {
        console.log('1. Logging in...');
        const loginData = JSON.stringify({ username: 'admin', password: 'admin123' });
        const loginRes = await request({
            hostname: 'localhost',
            port: 3000,
            path: '/api/auth/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': loginData.length
            }
        }, loginData);

        if (loginRes.status !== 200) {
            console.log('Login failed:', loginRes.body);
            return;
        }

        console.log('Login success.');
        const cookies = loginRes.headers['set-cookie'];
        const cookieHeader = cookies.map(c => c.split(';')[0]).join('; ');

        console.log('2. Fetching Categories...');
        const catRes = await request({
            hostname: 'localhost',
            port: 3000,
            path: '/api/admin/categories',
            method: 'GET',
            headers: { 'Cookie': cookieHeader }
        });

        console.log(`Categories found: ${catRes.body.length}`);

        if (catRes.body.length > 0) {
            const catId = catRes.body[0].id; // Should be 1 ('a1')
            console.log(`3. Fetching Stages for Category ${catId}...`);

            const stagesRes = await request({
                hostname: 'localhost',
                port: 3000,
                path: `/api/admin/stages?category_id=${catId}`,
                method: 'GET',
                headers: { 'Cookie': cookieHeader }
            });

            console.log('Stages Response status:', stagesRes.status);
            console.log('Stages found:', stagesRes.body.length);
            console.log('First Stage:', stagesRes.body[0]);

            if (stagesRes.body.length > 0) {
                const stageId = stagesRes.body[0].id;
                console.log(`4. Fetching Questions for Stage ${stageId}...`);
                const qRes = await request({
                    hostname: 'localhost',
                    port: 3000,
                    path: `/api/admin/questions?stage_id=${stageId}`,
                    method: 'GET',
                    headers: { 'Cookie': cookieHeader }
                });
                console.log('Questions found:', qRes.body.length);
            }
        }

    } catch (e) {
        console.error('Error:', e);
    }
}

test();
