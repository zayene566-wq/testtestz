const { spawn } = require('child_process');
const server = spawn('node', ['server.js'], { stdio: 'inherit' });

console.log("Starting server...");

setTimeout(() => {
    console.log("Starting tester...");
    const tester = spawn('node', ['debug_api_hearts.js'], { stdio: 'inherit' });

    tester.on('close', (code) => {
        console.log(`Tester finished with code ${code}`);
        server.kill();
        process.exit(code);
    });
}, 5000);
