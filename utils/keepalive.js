const https = require('https');

function setupKeepAlive(url) {
    if (!url) {
        console.log('No keep-alive URL provided, skipping keep-alive setup');
        return;
    }

    // Ping every 5 minutes (300000 ms)
    const interval = 300000;
    
    console.log('Setting up keep-alive ping to', url);
    
    setInterval(() => {
        https.get(url, (res) => {
            if (res.statusCode === 200) {
                console.log('Keep-alive ping successful');
            } else {
                console.log('Keep-alive ping failed with status:', res.statusCode);
            }
        }).on('error', (err) => {
            console.log('Keep-alive ping error:', err.message);
        });
    }, interval);
}

module.exports = setupKeepAlive;
