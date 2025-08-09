import dotenv from 'dotenv';
dotenv.config();
export const config = {
    port: parseInt(process.env.PORT || '8080', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    redis: {
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        enabled: !!process.env.REDIS_URL,
    },
    cors: {
        allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(','),
    },
    api: {
        url: process.env.API_URL || 'http://localhost:5173',
    },
    security: {
        maxConnectionsPerIp: parseInt(process.env.MAX_CONNECTIONS_PER_IP || '10', 10),
        rateLimitMessagesPerMinute: parseInt(process.env.RATE_LIMIT_MESSAGES_PER_MINUTE || '60', 10),
    },
    heartbeat: {
        interval: 30000, // 30 seconds
        timeout: 60000, // 60 seconds
    },
};
//# sourceMappingURL=config.js.map