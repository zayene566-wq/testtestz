const http = require('http');

function get(url) {
    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        }).on('error', reject);
    });
}

async function test() {
    try {
        console.log('Fetching Categories...');
        const categories = await get('http://localhost:3000/api/admin/categories');
        console.log('Categories:', categories);

        if (categories.length > 0) {
            const catId = categories[0].id; // Should be 1
            console.log(`Fetching Stages for Category ${catId}...`);
            const stages = await get(`http://localhost:3000/api/admin/stages?category_id=${catId}`);
            console.log('Stages:', stages);
        } else {
            console.log('No categories found.');
        }

    } catch (err) {
        console.error('Error:', err.message);
    }
}

test();
