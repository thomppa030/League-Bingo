export var WSMessageType;
(function (WSMessageType) {
    // Connection
    WSMessageType["CONNECT"] = "connect";
    WSMessageType["DISCONNECT"] = "disconnect";
    WSMessageType["HEARTBEAT"] = "heartbeat";
    // Session
    WSMessageType["JOIN_SESSION"] = "join_session";
    WSMessageType["LEAVE_SESSION"] = "leave_session";
    WSMessageType["SESSION_UPDATED"] = "session_updated";
    // Players
    WSMessageType["PLAYER_JOINED"] = "player_joined";
    WSMessageType["PLAYER_LEFT"] = "player_left";
    WSMessageType["PLAYER_UPDATED"] = "player_updated";
    // Game
    WSMessageType["CATEGORIES_SELECTED"] = "categories_selected";
    WSMessageType["CARDS_GENERATED"] = "cards_generated";
    WSMessageType["GAME_STARTED"] = "game_started";
    WSMessageType["GAME_ENDED"] = "game_ended";
    // Bingo
    WSMessageType["SQUARE_CLAIMED"] = "square_claimed";
    WSMessageType["SQUARE_CONFIRMED"] = "square_confirmed";
    WSMessageType["SQUARE_REJECTED"] = "square_rejected";
    WSMessageType["PATTERN_COMPLETED"] = "pattern_completed";
    WSMessageType["SCORE_UPDATED"] = "score_updated";
    // System
    WSMessageType["ERROR"] = "error";
})(WSMessageType || (WSMessageType = {}));
//# sourceMappingURL=types.js.map