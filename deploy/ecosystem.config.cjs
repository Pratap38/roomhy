module.exports = {
    apps: [
        {
            name: 'roomhy-backend',
            cwd: '/var/www/roomhy/roomhy-backend',
            script: 'server.js',
            // This backend uses Socket.IO without a cross-worker adapter, so cluster mode
            // causes polling/websocket sessions to land on different workers and fail with 400s.
            exec_mode: 'fork',
            instances: 1,
            node_args: '--max-old-space-size=512',
            max_memory_restart: '500M',
            listen_timeout: 10000,
            kill_timeout: 5000,
            merge_logs: true,
            autorestart: true,
            env: {
                NODE_ENV: 'production'
            }
        }
    ]
};
