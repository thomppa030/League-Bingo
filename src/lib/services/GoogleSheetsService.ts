interface ChallengeRow {
  id: string;
  text: string;
  category: string;
  difficulty: string;
  points: number;
  roles: string;
  requiresConfirmation: boolean;
  description: string;
  tags: string;
  enabled: boolean;
}

interface Challenge {
  id: string;
  text: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  roles: string[];
  requiresConfirmation: boolean;
  description?: string;
  tags: string[];
  enabled: boolean;
}

export class GoogleSheetsService {
  private apiKey: string;
  private sheetId: string;
  private range: string;
  private cache: Challenge[] | null = null;
  private cacheExpiry: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.apiKey = Deno.env.get('GOOGLE_SHEETS_API_KEY') || '';
    this.sheetId = Deno.env.get('GOOGLE_SHEETS_ID') || '';
    this.range = Deno.env.get('GOOGLE_SHEETS_RANGE') || 'Sheet1!A2:J1000';

    if (!this.apiKey || !this.sheetId) {
      console.warn('[Sheets] Missing Google Sheets configuration, using fallback data');
    }
  }

  async getChallenges(): Promise<Challenge[]> {
    // Return cached data if still valid
    if (this.cache && Date.now() < this.cacheExpiry) {
      return this.cache;
    }

    try {
      const challenges = await this.fetchFromSheets();
      this.cache = challenges;
      this.cacheExpiry = Date.now() + this.CACHE_DURATION;
      console.log(`[Sheets] Loaded ${challenges.length} challenges from Google Sheets`);
      return challenges;
    } catch (error) {
      console.error('[Sheets] Error fetching from Google Sheets:', error);
      
      // Return cached data if available, otherwise fallback
      if (this.cache) {
        console.log('[Sheets] Using cached data due to fetch error');
        return this.cache;
      }
      
      console.log('[Sheets] Using fallback challenge data');
      return this.getFallbackChallenges();
    }
  }

  private async fetchFromSheets(): Promise<Challenge[]> {
    if (!this.apiKey || !this.sheetId) {
      throw new Error('Google Sheets credentials not configured');
    }

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.sheetId}/values/${this.range}?key=${this.apiKey}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Sheets API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const rows: string[][] = data.values || [];

    return rows
      .filter(row => row.length >= 10 && row[0]) // Must have ID and all columns
      .map(row => this.parseRow(row))
      .filter(challenge => challenge.enabled);
  }

  private parseRow(row: string[]): Challenge {
    const [id, text, category, difficulty, points, roles, requiresConfirmation, description, tags, enabled] = row;

    return {
      id: id.trim(),
      text: text.trim(),
      category: category.toLowerCase().trim(),
      difficulty: difficulty.toLowerCase().trim() as 'easy' | 'medium' | 'hard',
      points: parseInt(points) || 0,
      roles: roles.toLowerCase().trim() === 'all' 
        ? ['all'] 
        : roles.split(',').map(r => r.trim()),
      requiresConfirmation: requiresConfirmation.toLowerCase() === 'true',
      description: description?.trim() || undefined,
      tags: tags ? tags.split(',').map(t => t.trim()) : [],
      enabled: enabled.toLowerCase() !== 'false' // Default to true
    };
  }

  // Fallback data for development/offline use
  private getFallbackChallenges(): Challenge[] {
    return [
      {
        id: 'pentakill_001',
        text: 'Get a Pentakill',
        category: 'performance',
        difficulty: 'hard',
        points: 40,
        roles: ['all'],
        requiresConfirmation: true,
        description: 'Kill 5 enemies within 10 seconds',
        tags: ['teamfight', 'skill'],
        enabled: true
      },
      {
        id: 'first_blood_001',
        text: 'Get First Blood',
        category: 'performance',
        difficulty: 'medium',
        points: 15,
        roles: ['all'],
        requiresConfirmation: false,
        tags: ['early', 'skill'],
        enabled: true
      },
      {
        id: 'baron_steal_001',
        text: 'Steal Baron from Enemy Team',
        category: 'in_game_events',
        difficulty: 'hard',
        points: 35,
        roles: ['jungle'],
        requiresConfirmation: true,
        description: 'Last hit Baron while enemy team is doing it',
        tags: ['objective', 'steal'],
        enabled: true
      },
      {
        id: 'flash_wall_001',
        text: 'Flash Into a Wall',
        category: 'social',
        difficulty: 'easy',
        points: 5,
        roles: ['all'],
        requiresConfirmation: false,
        tags: ['mistake', 'funny'],
        enabled: true
      },
      {
        id: 'ward_control_001',
        text: 'Place 10 Control Wards in One Game',
        category: 'performance',
        difficulty: 'medium',
        points: 20,
        roles: ['support'],
        requiresConfirmation: false,
        description: 'Place 10 control wards throughout the game',
        tags: ['vision', 'support'],
        enabled: true
      },
      {
        id: 'solo_kill_001',
        text: 'Get 3+ Solo Kills',
        category: 'performance',
        difficulty: 'medium',
        points: 25,
        roles: ['top', 'mid'],
        requiresConfirmation: false,
        tags: ['skill', 'laning'],
        enabled: true
      },
      {
        id: 'cs_perfect_001',
        text: '10 CS/min at 20 Minutes',
        category: 'performance',
        difficulty: 'hard',
        points: 30,
        roles: ['top', 'mid', 'adc'],
        requiresConfirmation: false,
        description: 'Have 200+ CS at 20 minutes',
        tags: ['farming', 'skill'],
        enabled: true
      },
      {
        id: 'enemy_rage_001',
        text: 'Enemy Types "gg ez"',
        category: 'social',
        difficulty: 'easy',
        points: 10,
        roles: ['all'],
        requiresConfirmation: false,
        tags: ['chat', 'social'],
        enabled: true
      },
      {
        id: 'dragon_steal_001',
        text: 'Steal Dragon Soul',
        category: 'in_game_events',
        difficulty: 'hard',
        points: 35,
        roles: ['jungle'],
        requiresConfirmation: true,
        tags: ['objective', 'steal'],
        enabled: true
      },
      {
        id: 'execute_jungle_001',
        text: 'Execute to Jungle Monster',
        category: 'social',
        difficulty: 'easy',
        points: 5,
        roles: ['all'],
        requiresConfirmation: false,
        tags: ['mistake', 'funny'],
        enabled: true
      },
      {
        id: 'ace_early_001',
        text: 'Team Ace Before 15 Minutes',
        category: 'in_game_events',
        difficulty: 'medium',
        points: 25,
        roles: ['all'],
        requiresConfirmation: false,
        description: 'Your team kills all 5 enemies before 15 minutes',
        tags: ['teamfight', 'early'],
        enabled: true
      },
      {
        id: 'perfect_game_001',
        text: 'Perfect Game (0 Deaths)',
        category: 'in_game_events',
        difficulty: 'hard',
        points: 35,
        roles: ['all'],
        requiresConfirmation: false,
        tags: ['perfect', 'skill'],
        enabled: true
      },
      {
        id: 'save_ally_001',
        text: 'Save Ally with <10% HP',
        category: 'performance',
        difficulty: 'medium',
        points: 15,
        roles: ['support', 'jungle'],
        requiresConfirmation: false,
        tags: ['save', 'teamwork'],
        enabled: true
      },
      {
        id: 'surrender_20_001',
        text: 'Enemy Surrenders at 15-20 Minutes',
        category: 'in_game_events',
        difficulty: 'medium',
        points: 20,
        roles: ['all'],
        requiresConfirmation: false,
        tags: ['surrender', 'domination'],
        enabled: true
      },
      {
        id: 'wrong_build_001',
        text: 'Build Completely Wrong Item',
        category: 'social',
        difficulty: 'easy',
        points: 5,
        roles: ['all'],
        requiresConfirmation: false,
        description: 'Build an item that makes no sense for your champion',
        tags: ['mistake', 'funny'],
        enabled: true
      },
      {
        id: 'ping_spam_001',
        text: 'Ping Spam Teammates (6+ pings)',
        category: 'social',
        difficulty: 'easy',
        points: 5,
        roles: ['all'],
        requiresConfirmation: false,
        tags: ['ping', 'social'],
        enabled: true
      },
      {
        id: 'baron_power_001',
        text: 'Win Teamfight with Baron Buff',
        category: 'in_game_events',
        difficulty: 'medium',
        points: 20,
        roles: ['all'],
        requiresConfirmation: false,
        tags: ['baron', 'teamfight'],
        enabled: true
      },
      {
        id: 'invade_success_001',
        text: 'Successful Level 1 Invade',
        category: 'in_game_events',
        difficulty: 'medium',
        points: 20,
        roles: ['all'],
        requiresConfirmation: false,
        description: 'Get kill or summoner spell from level 1 invade',
        tags: ['invade', 'early'],
        enabled: true
      },
      {
        id: 'elder_secure_001',
        text: 'Secure Elder Dragon',
        category: 'in_game_events',
        difficulty: 'medium',
        points: 25,
        roles: ['all'],
        requiresConfirmation: false,
        tags: ['elder', 'objective'],
        enabled: true
      },
      {
        id: 'claim_lag_001',
        text: 'Someone Claims Lag',
        category: 'social',
        difficulty: 'easy',
        points: 5,
        roles: ['all'],
        requiresConfirmation: false,
        tags: ['excuse', 'social'],
        enabled: true
      },
      {
        id: 'double_kill_001',
        text: 'Get a Double Kill',
        category: 'performance',
        difficulty: 'easy',
        points: 10,
        roles: ['all'],
        requiresConfirmation: false,
        tags: ['kills', 'skill'],
        enabled: true
      },
      {
        id: 'triple_kill_001',
        text: 'Get a Triple Kill',
        category: 'performance',
        difficulty: 'medium',
        points: 20,
        roles: ['all'],
        requiresConfirmation: false,
        tags: ['kills', 'skill'],
        enabled: true
      },
      {
        id: 'quadra_kill_001',
        text: 'Get a Quadra Kill',
        category: 'performance',
        difficulty: 'hard',
        points: 30,
        roles: ['all'],
        requiresConfirmation: false,
        tags: ['kills', 'skill'],
        enabled: true
      },
      {
        id: 'tower_dive_001',
        text: 'Successfully Tower Dive for Kill',
        category: 'performance',
        difficulty: 'medium',
        points: 15,
        roles: ['all'],
        requiresConfirmation: false,
        tags: ['aggressive', 'skill'],
        enabled: true
      },
      {
        id: 'cs_100_10min_001',
        text: '100 CS at 10 Minutes',
        category: 'performance',
        difficulty: 'medium',
        points: 20,
        roles: ['top', 'mid', 'adc'],
        requiresConfirmation: false,
        tags: ['farming', 'skill'],
        enabled: true
      },
      {
        id: 'kill_streak_001',
        text: 'Get 5+ Kill Streak',
        category: 'performance',
        difficulty: 'hard',
        points: 25,
        roles: ['all'],
        requiresConfirmation: false,
        tags: ['streak', 'skill'],
        enabled: true
      },
      {
        id: 'enemy_ff_001',
        text: 'Enemy Team Surrenders',
        category: 'in_game_events',
        difficulty: 'medium',
        points: 20,
        roles: ['all'],
        requiresConfirmation: false,
        tags: ['surrender', 'victory'],
        enabled: true
      },
      {
        id: 'first_tower_001',
        text: 'Destroy First Tower',
        category: 'in_game_events',
        difficulty: 'medium',
        points: 15,
        roles: ['all'],
        requiresConfirmation: false,
        tags: ['objective', 'early'],
        enabled: true
      },
      {
        id: 'herald_take_001',
        text: 'Take Rift Herald',
        category: 'in_game_events',
        difficulty: 'medium',
        points: 15,
        roles: ['all'],
        requiresConfirmation: false,
        tags: ['objective', 'herald'],
        enabled: true
      },
      {
        id: 'shutdown_001',
        text: 'Get Shutdown Kill (300+ gold)',
        category: 'performance',
        difficulty: 'medium',
        points: 15,
        roles: ['all'],
        requiresConfirmation: false,
        tags: ['shutdown', 'gold'],
        enabled: true
      },
      {
        id: 'enemy_dc_001',
        text: 'Enemy Player Disconnects',
        category: 'social',
        difficulty: 'easy',
        points: 10,
        roles: ['all'],
        requiresConfirmation: false,
        tags: ['disconnect', 'social'],
        enabled: true
      },
      {
        id: 'flame_teammate_001',
        text: 'Teammate Types in All Chat',
        category: 'social',
        difficulty: 'easy',
        points: 5,
        roles: ['all'],
        requiresConfirmation: false,
        tags: ['chat', 'flame'],
        enabled: true
      },
      {
        id: 'steal_blue_red_001',
        text: 'Steal Enemy Blue/Red Buff',
        category: 'performance',
        difficulty: 'medium',
        points: 15,
        roles: ['all'],
        requiresConfirmation: false,
        tags: ['steal', 'jungle'],
        enabled: true
      },
      {
        id: 'teleport_bot_001',
        text: 'Teleport Bot Lane for Fight',
        category: 'performance',
        difficulty: 'medium',
        points: 15,
        roles: ['top', 'mid'],
        requiresConfirmation: false,
        tags: ['teleport', 'teamwork'],
        enabled: true
      },
      {
        id: 'inhibitor_down_001',
        text: 'Destroy Enemy Inhibitor',
        category: 'in_game_events',
        difficulty: 'medium',
        points: 20,
        roles: ['all'],
        requiresConfirmation: false,
        tags: ['objective', 'inhibitor'],
        enabled: true
      },
      {
        id: 'nexus_turret_001',
        text: 'Destroy Nexus Turret',
        category: 'in_game_events',
        difficulty: 'medium',
        points: 25,
        roles: ['all'],
        requiresConfirmation: false,
        tags: ['objective', 'end'],
        enabled: true
      },
      {
        id: 'death_timer_001',
        text: 'Enemy 60+ Second Death Timer',
        category: 'in_game_events',
        difficulty: 'medium',
        points: 15,
        roles: ['all'],
        requiresConfirmation: false,
        tags: ['death', 'late'],
        enabled: true
      },
      {
        id: 'minion_execute_001',
        text: 'Execute to Minion',
        category: 'social',
        difficulty: 'easy',
        points: 5,
        roles: ['all'],
        requiresConfirmation: false,
        tags: ['mistake', 'funny'],
        enabled: true
      },
      {
        id: 'recall_interrupted_001',
        text: 'Get Recall Interrupted',
        category: 'social',
        difficulty: 'easy',
        points: 5,
        roles: ['all'],
        requiresConfirmation: false,
        tags: ['mistake', 'recall'],
        enabled: true
      },
      {
        id: 'heal_bait_001',
        text: 'Bait Enemy Ultimate/Summoner',
        category: 'performance',
        difficulty: 'medium',
        points: 15,
        roles: ['all'],
        requiresConfirmation: false,
        tags: ['outplay', 'bait'],
        enabled: true
      },
      {
        id: 'juke_skillshot_001',
        text: 'Dodge 3+ Skillshots in Fight',
        category: 'performance',
        difficulty: 'medium',
        points: 15,
        roles: ['all'],
        requiresConfirmation: false,
        tags: ['dodge', 'skill'],
        enabled: true
      },
      {
        id: 'vision_score_001',
        text: 'Vision Score 2+ per Minute',
        category: 'performance',
        difficulty: 'medium',
        points: 15,
        roles: ['support', 'jungle'],
        requiresConfirmation: false,
        tags: ['vision', 'wards'],
        enabled: true
      },
      {
        id: 'early_dragon_001',
        text: 'Solo Dragon Before 10 Minutes',
        category: 'performance',
        difficulty: 'hard',
        points: 25,
        roles: ['jungle'],
        requiresConfirmation: false,
        tags: ['solo', 'early', 'dragon'],
        enabled: true
      },
      {
        id: 'level_advantage_001',
        text: '2+ Level Advantage Over Lane Opponent',
        category: 'performance',
        difficulty: 'medium',
        points: 20,
        roles: ['top', 'mid'],
        requiresConfirmation: false,
        tags: ['level', 'advantage'],
        enabled: true
      },
      {
        id: 'roam_kill_001',
        text: 'Roam and Get Kill/Assist',
        category: 'performance',
        difficulty: 'medium',
        points: 15,
        roles: ['mid', 'support'],
        requiresConfirmation: false,
        tags: ['roam', 'teamwork'],
        enabled: true
      },
      {
        id: 'epic_monster_steal_001',
        text: 'Steal Any Epic Monster',
        category: 'performance',
        difficulty: 'hard',
        points: 30,
        roles: ['all'],
        requiresConfirmation: true,
        tags: ['steal', 'epic'],
        enabled: true
      },
      {
        id: 'comeback_kill_001',
        text: 'Get Kill While Behind 0/3+',
        category: 'performance',
        difficulty: 'medium',
        points: 20,
        roles: ['all'],
        requiresConfirmation: false,
        tags: ['comeback', 'skill'],
        enabled: true
      },
      {
        id: 'team_wipe_001',
        text: 'Team Gets Aced',
        category: 'social',
        difficulty: 'easy',
        points: 5,
        roles: ['all'],
        requiresConfirmation: false,
        tags: ['death', 'team'],
        enabled: true
      },
      {
        id: 'miss_smite_001',
        text: 'Miss Smite on Epic Monster',
        category: 'social',
        difficulty: 'easy',
        points: 5,
        roles: ['jungle'],
        requiresConfirmation: false,
        tags: ['mistake', 'smite'],
        enabled: true
      },
      {
        id: 'buy_wrong_item_001',
        text: 'Accidentally Buy Wrong Item',
        category: 'social',
        difficulty: 'easy',
        points: 5,
        roles: ['all'],
        requiresConfirmation: false,
        tags: ['mistake', 'shop'],
        enabled: true
      }
    ];
  }

  // Force refresh cache
  async refreshCache(): Promise<Challenge[]> {
    this.cache = null;
    this.cacheExpiry = 0;
    return await this.getChallenges();
  }

  // Get challenges filtered by criteria
  async getChallengesByCategory(category: string): Promise<Challenge[]> {
    const challenges = await this.getChallenges();
    return challenges.filter(c => c.category === category);
  }

  async getChallengesByDifficulty(difficulty: string): Promise<Challenge[]> {
    const challenges = await this.getChallenges();
    return challenges.filter(c => c.difficulty === difficulty);
  }

  async getChallengesByRole(role: string): Promise<Challenge[]> {
    const challenges = await this.getChallenges();
    return challenges.filter(c => c.roles.includes('all') || c.roles.includes(role));
  }
}