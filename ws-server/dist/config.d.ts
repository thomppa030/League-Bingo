export declare const config: {
    port: number;
    nodeEnv: string;
    redis: {
        url: string;
        enabled: boolean;
    };
    cors: {
        allowedOrigins: string[];
    };
    api: {
        url: string;
    };
    security: {
        maxConnectionsPerIp: number;
        rateLimitMessagesPerMinute: number;
    };
    heartbeat: {
        interval: number;
        timeout: number;
    };
};
//# sourceMappingURL=config.d.ts.map