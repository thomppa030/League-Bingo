import type { BingoCard, BingoSquare, Category, Difficulty, Role } from '$lib/types';
import { GoogleSheetsService } from './GoogleSheetsService';

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

export class BingoCardGenerator {
  private sheetsService: GoogleSheetsService;

  constructor() {
    this.sheetsService = new GoogleSheetsService();
  }

  async generateCard(
    playerId: string,
    sessionId: string,
    playerRole: Role,
    selectedCategories: Category[]
  ): Promise<BingoCard> {
    // Get all available challenges
    const allChallenges = await this.sheetsService.getChallenges();
    
    // Filter challenges based on player criteria
    const availableChallenges = this.filterChallenges(
      allChallenges,
      playerRole,
      selectedCategories
    );

    if (availableChallenges.length < 24) {
      throw new Error('Not enough challenges available for selected criteria');
    }

    // Generate 5x5 grid with center as free space
    const squares: BingoSquare[][] = [];
    const selectedChallenges = this.selectChallenges(availableChallenges, 24);
    let challengeIndex = 0;

    for (let row = 0; row < 5; row++) {
      squares[row] = [];
      for (let col = 0; col < 5; col++) {
        if (row === 2 && col === 2) {
          // Center square - FREE SPACE
          squares[row][col] = {
            id: `free-${playerId}-${Date.now()}`,
            text: 'FREE SPACE',
            category: 'free' as Category,
            difficulty: 'easy' as Difficulty,
            points: 0,
            roleSpecific: [],
            requiresConfirmation: false,
            isCompleted: true, // Free space is always completed
            completedAt: new Date()
          };
        } else {
          // Regular challenge square
          const challenge = selectedChallenges[challengeIndex++];
          squares[row][col] = this.challengeToSquare(challenge, playerId);
        }
      }
    }

    return {
      id: `card-${playerId}-${Date.now()}`,
      playerID: playerId,
      sessionID: sessionId,
      squares,
      completedPatterns: [],
      totalScore: 0, // Free space doesn't count
      generatedAt: new Date()
    };
  }

  private filterChallenges(
    challenges: Challenge[],
    playerRole: Role,
    selectedCategories: Category[]
  ): Challenge[] {
    console.log('[CardGen] Total challenges:', challenges.length);
    console.log('[CardGen] Selected categories:', selectedCategories);
    console.log('[CardGen] Player role:', playerRole);
    
    const filtered = challenges.filter(challenge => {
      // Check if challenge is enabled
      if (!challenge.enabled) {
        console.log('[CardGen] Filtering out disabled:', challenge.id);
        return false;
      }

      // Check category - convert both to lowercase for comparison
      const challengeCategory = challenge.category.toLowerCase();
      const hasMatchingCategory = selectedCategories.some(cat => cat.toLowerCase() === challengeCategory);
      
      if (!hasMatchingCategory) {
        console.log('[CardGen] Filtering out category mismatch:', challenge.id, challenge.category, 'not in', selectedCategories);
        return false;
      }

      // Check role compatibility
      if (!challenge.roles.includes('all') && !challenge.roles.includes(playerRole.toLowerCase())) {
        console.log('[CardGen] Filtering out role mismatch:', challenge.id, challenge.roles, 'for role', playerRole);
        return false;
      }

      return true;
    });
    
    console.log('[CardGen] Filtered challenges:', filtered.length);
    console.log('[CardGen] Available challenge IDs:', filtered.map(c => c.id));
    return filtered;
  }

  private selectChallenges(challenges: Challenge[], count: number): Challenge[] {
    // Create difficulty distribution for balanced gameplay
    const distribution = {
      easy: Math.floor(count * 0.4),    // 40% easy (9-10 squares)
      medium: Math.floor(count * 0.4),  // 40% medium (9-10 squares)
      hard: Math.floor(count * 0.2)     // 20% hard (4-5 squares)
    };

    // Adjust to ensure we reach exact count
    let remaining = count - (distribution.easy + distribution.medium + distribution.hard);
    if (remaining > 0) {
      distribution.medium += remaining;
    }

    const selected: Challenge[] = [];
    const shuffled = [...challenges].sort(() => Math.random() - 0.5);

    // Select challenges by difficulty
    for (const [difficulty, needed] of Object.entries(distribution)) {
      const challengesOfDifficulty = shuffled.filter(c => c.difficulty === difficulty);
      
      for (let i = 0; i < needed && challengesOfDifficulty.length > 0; i++) {
        const randomIndex = Math.floor(Math.random() * challengesOfDifficulty.length);
        const challenge = challengesOfDifficulty.splice(randomIndex, 1)[0];
        selected.push(challenge);
      }
    }

    // If we couldn't fill all slots with the distribution, fill with any available
    while (selected.length < count && shuffled.length > 0) {
      const randomIndex = Math.floor(Math.random() * shuffled.length);
      const challenge = shuffled.splice(randomIndex, 1)[0];
      if (!selected.some(s => s.id === challenge.id)) {
        selected.push(challenge);
      }
    }

    return selected;
  }

  private challengeToSquare(challenge: Challenge, playerId: string): BingoSquare {
    return {
      id: `${challenge.id}-${playerId}-${Date.now()}`,
      text: challenge.text,
      description: challenge.description,
      category: challenge.category as Category,
      difficulty: challenge.difficulty as Difficulty,
      points: challenge.points,
      roleSpecific: challenge.roles.includes('all') ? [] : challenge.roles as Role[],
      requiresConfirmation: challenge.requiresConfirmation,
      isCompleted: false
    };
  }

  // Generate cards for all players in a session
  async generateCardsForSession(
    sessionId: string,
    players: Array<{
      id: string;
      role: Role;
      selectedCategories: Category[];
    }>
  ): Promise<BingoCard[]> {
    const cards: BingoCard[] = [];

    for (const player of players) {
      try {
        const card = await this.generateCard(
          player.id,
          sessionId,
          player.role,
          player.selectedCategories
        );
        cards.push(card);
      } catch (error) {
        console.error(`Failed to generate card for player ${player.id}:`, error);
        throw new Error(`Failed to generate bingo card for player ${player.id}`);
      }
    }

    return cards;
  }

  // Validate that a generated card meets requirements
  validateCard(card: BingoCard): boolean {
    // Check grid size
    if (card.squares.length !== 5 || card.squares.some(row => row.length !== 5)) {
      return false;
    }

    // Check free space exists in center
    const centerSquare = card.squares[2][2];
    if (!centerSquare.isCompleted || centerSquare.text !== 'FREE SPACE') {
      return false;
    }

    // Check for duplicate challenges
    const squareIds = card.squares.flat().map(s => s.id);
    const uniqueIds = new Set(squareIds);
    if (uniqueIds.size !== squareIds.length) {
      return false;
    }

    return true;
  }
}