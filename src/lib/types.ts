export enum Role {
  TOP = "top",
  JUNGLE = "jungle",
  MID = "mid",
  ADC = "adc",
  SUPPORT = "support",
}

export enum Category {
  PERFORMANCE = "performance",
  SOCIAL = "social",
  IN_GAME_EVENTS = "in_game_events",
  MISSIONS = "missions",
}

export enum Difficulty {
  EASY = "easy",
  MEDIUM = "medium",
  HARD = "hard",
}

export enum SessionStatus {
  SETUP = "setup",
  CATEGORY_SELECTION = "category_selection",
  CARD_GENERATION = "card_generation",
  PLAYING = "playing",
  COMPLETED = "completed",
}

export enum PatternType {
  ROW = "row",
  COLUMN = "column",
  DIAGONAL = "diagonal",
  CORNERS = "corners",
  X_PATTERN = "x_pattern",
  FULL_CARD = "full_card",
  OUTER_EDGE = "outer_edge",
  INNER_SQUARE = "inner_square",
}

export interface Session {
  id: string;
  code: string; // 6 Character alphanumeric
  gmId: string;
  name: string;
  status: SessionStatus;
  settings: SessionSettings;
  players: Player[];
  cards: BingoCard[];
  createAt: Date;
  updatedAt: Date;
  maxPlayers: number;
  minPlayers: number;
}

export interface SessionSettings {
  allowLateJoin: boolean;
  requireGMConfirmation: boolean;
  enablePatternBonuses: boolean;
  timeLimit?: number; //minutes, optional
  customRules: string[];
}

export interface Player {
  id: string;
  sessionId: string;
  name: string;
  role: Role;
  selectedCategories: Category[];
  isGM: boolean;
  isReady: boolean;
  joinedAt: Date;
  connectionStatus: "connected" | "disconnected";
  totalScore: number;
}

export interface BingoSquare {
  id: string;
  text: string;
  description?: string;
  category: Category;
  difficulty: Difficulty;
  points: number;
  roleSpecific: Role[]; //empty array
  requiresConfirmation: boolean;
  isCompleted: boolean;
  completedAt?: Date;
  confirmedBy?: string; // GM Player ID
}

export interface BingoCard {
  id: string;
  playerID: string;
  sessionID: string;
  squares: BingoSquare[][]; // 5x5 Grid
  completedPatterns: CompletedPattern[];
  totalScore: number;
  generatedAt: Date;
}

export interface CompletedPattern {
  id: string;
  type: PatternType;
  positions: [number, number][]; // Array of [row, col] positions
  completedAt: Date;
  bonusPoints: number;
  confirmedBy?: string;
}

export interface SquareCompletion {
  squareID: string;
  playerID: string;
  claimedAt: Date;
  evidence?: string; // optional tex evidence
  confirmedAt?: Date;
  confirmedBy?: string;
  rejected?: boolean;
  rejectionReason?: string;
}

// Websocket Message Types
export enum WSMessageType {
  JOIN_SESSION = "join_session",
  LEAVE_SESSION = "leave_session",
  SESSION_UPDATED = "session_updated",
  PLAYER_JOINED = "player_joined",
  PLAYER_LEFT = "player_left",
  PLAYER_UPDATED = "player_updated",

  //Game Flow
  CATEGORIES_SELECTED = "categories_selected",
  CARDS_GENERATED = "cards_generated",
  GAME_STARTED = "game_started",
  GAME_ENDED = "game_ended",
  //Bingo Actions
  SQUARE_CLAIMED = "square_claimed",
  SQUARE_CONFIRMED = "square_confirmed",
  SQUARE_REJECTED = "square_rejected",
  PATTERN_COMPLETED = "pattern_completed",
  SCORE_UPDATED = "score_updated",

  ERROR = "error",
  HEARTBEAT = "heartbeat",
}

export interface WSMessage {
  type: WSMessageType;
  sessionId: string;
  playerID?: string;
  data: any;
  timestamp: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: string;
  };
  timestamp: Date;
}

export interface CreateSessionRequest {
  gmName: string;
  sessionName: string;
  settings: Partial<SessionSettings>;
  maxPlayers?: number;
  minPlayers?: number;
}

export interface JoinSessionRequest {
  code: string;
  playerName: string;
  role: Role;
}

export interface UpdatedCategoriesRequest {
  sessionId: string;
  playerId: string;
  selectedCategories: Category[];
}

export interface ClaimSquareRequest {
  sessionId: string;
  playerId: string;
  squareId: string;
  evidence?: string;
}

export interface ConfirmSquareRequest {
  sessionId: string;
  playerId: string;
  squareId: string;
  approved: boolean;
  reason?: string;
}

export type PlayerRole = keyof typeof Role;
export type SquarePosition = [number, number];
export type PatternPositions = SquarePosition[];

export interface PatternDefinition {
  type: PatternType;
  name: string;
  description: string;
  positions: PatternPositions;
  bonusMultiplier: number;
  isSpecial: boolean; // for achievements/special recognition
}

export enum ErrorCode {
  SESSION_NOT_FOUND = "SESSION_NOT_FOUND",
  SESSION_FULL = "SESSION_FULL",
  INVALID_SESSION_CODE = "INVALID_SESSION_CODE",
  PLAYER_NOT_FOUND = "PLAYER_NOT_FOUND",
  INVALID_CODE = "INVALID_CODE",
  DUPLICATE_PLAYER_NAME = "DUPLICATE_PLAYER_NAME",
  GAME_ALREADY_STARTED = "GAME_ALREADY_STARTED",
  UNAUTHORIZED = "UNAUTHORIZED",
  SQUARE_ALREADY_COMPLETED = "SQUARE_ALREADY_COMPLETED",
  PATTERN_INVALID = "PATTERN_INVALID",
  VALIDATION_ERROR = "VALIDATION_ERROR",
}

export interface ValidationRule {
  field: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  customValidator?: (value: any) => boolean;
}

export interface GameStats {
  sessionId: string;
  duration: number;
  totalSquareCompleted: number;
  patternsCompleted: CompletedPattern[];
  playerStats: PlayerStats[];
  gameEndedAt: Date;
}

export interface PlayerStats {
  playerId: string;
  playerName: string;
  role: Role;
  squaresCompleted: number;
  patternsCompleted: number;
  totalScore: number;
  averageCompletionTime: number;
  fastestCompletionTime: number;
}

export interface BingoConfig {
  cardSize: number;
  patterns: PatternDefinition[];
  scoring: ScoringConfig;
  validation: ValidationConfig;
}

export interface ScoringConfig {
  basePoints: {
    [Difficulty.EASY]: number;
    [Difficulty.MEDIUM]: number;
    [Difficulty.HARD]: number;
  };
  patternBonuses: {
    [PatternType.ROW]: number;
    [PatternType.COLUMN]: number;
    [PatternType.DIAGONAL]: number;
    [PatternType.CORNERS]: number;
    [PatternType.X_PATTERN]: number;
    [PatternType.FULL_CARD]: number;
    [PatternType.OUTER_EDGE]: number;
    [PatternType.INNER_SQUARE]: number;
  };
}

export interface ValidationConfig {
  maxPlayersPerSession: number;
  minPlayersPerSession: number;
  sessionCodeLength: number;
  playerNameMaxLength: number;
  sessionNameMaxLength: number;
  maxEvidenceLength: number;
  sessionTimeoutMinutes: number;
}
