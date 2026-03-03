module.exports = {
    apps: [
        {
            name: 'roomhy-backend',
            cwd: '/var/www/roomhy/roomhy-backend',
            script: 'server.js',
            exec_mode: 'cluster',
            instances: 'max',
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
