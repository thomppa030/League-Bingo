import type { AuthenticatedWebSocket, WSMessage } from './types.js';
import type { ConnectionManager } from './ConnectionManager.js';
import type { SessionValidator } from './SessionValidator.js';
export declare class MessageHandler {
    private connectionManager;
    private sessionValidator;
    constructor(connectionManager: ConnectionManager, sessionValidator: SessionValidator);
    handleMessage(ws: AuthenticatedWebSocket, message: WSMessage): Promise<void>;
    private handleHeartbeat;
    private handlePlayerUpdate;
    private handleSquareClaim;
    private handleSquareConfirmation;
    private handleSquareRejection;
    private sendError;
}
//# sourceMappingURL=MessageHandler.d.ts.map