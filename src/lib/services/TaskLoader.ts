import { locale } from 'svelte-i18n';
import { get } from 'svelte/store';

// Import all task files
import performanceTasks from '../tasks/performance.json';
import socialTasks from '../tasks/social.json';
import eventsTasks from '../tasks/events.json';
import funTasks from '../tasks/fun.json';
import missionsTasks from '../tasks/missions.json';
import chaosTasks from '../tasks/chaos.json';

export type Role = "top" | "jungle" | "mid" | "adc" | "support";
export type Category = "performance" | "social" | "events" | "missions" | "fun" | "chaos";
export type Difficulty = "easy" | "medium" | "hard";

export interface LocalizedText {
  en: string;
  de: string;
}

export interface BingoSquare {
  id: string;
  text: LocalizedText;
  category: Category;
  difficulty: Difficulty;
  points: number;
  roleSpecific: Role[];
  requiresConfirmation: boolean;
  completed?: boolean;
}

interface TaskData {
  centerSquares?: BingoSquare[];
  roleSpecific?: { [key in Role]?: BingoSquare[] };
  general: BingoSquare[];
}

class TaskLoader {
  private taskData: { [key in Category]: TaskData } = {
    performance: performanceTasks as TaskData,
    social: socialTasks as TaskData,
    events: eventsTasks as TaskData,
    fun: funTasks as TaskData,
    missions: missionsTasks as TaskData,
    chaos: chaosTasks as TaskData
  };

  /**
   * Get localized text based on current language
   */
  getLocalizedText(text: LocalizedText | string): string {
    if (typeof text === 'string') {
      return text;
    }
    const currentLocale = get(locale) || 'en';
    return text[currentLocale as 'en' | 'de'] || text.en;
  }

  /**
   * Convert BingoSquare to have localized text instead of LocalizedText object
   * This keeps the original LocalizedText for reactive updates
   */
  localizeSquare(square: BingoSquare): BingoSquare {
    return { ...square };
  }

  /**
   * Get center squares (team squares) from available categories
   */
  getCenterSquares(categories: Category[]): BingoSquare[] {
    const allCenterSquares: BingoSquare[] = [];
    
    categories.forEach(category => {
      const categoryData = this.taskData[category];
      if (categoryData && categoryData.centerSquares) {
        allCenterSquares.push(...categoryData.centerSquares);
      }
    });

    // Always include the FREE SPACE if events category is selected
    if (categories.includes('events')) {
      const freeSpace = allCenterSquares.find(sq => sq.id === 'c5');
      if (freeSpace) {
        const otherCenterSquares = allCenterSquares.filter(sq => sq.id !== 'c5');
        return [this.localizeSquare(freeSpace), ...this.shuffleArray(otherCenterSquares).slice(0, 8).map(sq => this.localizeSquare(sq))];
      }
    }

    return this.shuffleArray(allCenterSquares).slice(0, 9).map(sq => this.localizeSquare(sq));
  }

  /**
   * Get role-specific squares for a given role
   */
  getRoleSquares(role: Role, categories: Category[]): BingoSquare[] {
    const roleSquares: BingoSquare[] = [];

    categories.forEach(category => {
      const categoryData = this.taskData[category];
      if (categoryData && categoryData.roleSpecific && categoryData.roleSpecific[role]) {
        roleSquares.push(...categoryData.roleSpecific[role]!);
      }
    });

    return this.shuffleArray(roleSquares).map(sq => this.localizeSquare(sq));
  }

  /**
   * Get general squares from selected categories
   */
  getGeneralSquares(categories: Category[]): BingoSquare[] {
    const generalSquares: BingoSquare[] = [];

    categories.forEach(category => {
      const categoryData = this.taskData[category];
      if (categoryData && categoryData.general) {
        generalSquares.push(...categoryData.general);
      }
    });

    return this.shuffleArray(generalSquares).map(sq => this.localizeSquare(sq));
  }

  /**
   * Generate a complete 5x5 bingo card
   */
  generateCard(role: Role, categories: Category[]): BingoSquare[][] {
    // Get squares from different sources
    const centerSquares = this.getCenterSquares(categories);
    const roleSquares = this.getRoleSquares(role, categories);
    const generalSquares = this.getGeneralSquares(categories);

    // Select squares for outer ring (16 squares total)
    // 30% role-specific, 70% general
    const selectedRoleSquares = roleSquares.slice(0, 5);
    const selectedGeneralSquares = generalSquares.slice(0, 11);

    const outerSquares = this.shuffleArray([
      ...selectedRoleSquares,
      ...selectedGeneralSquares
    ]);

    // Create 5x5 grid
    const card: (Omit<BingoSquare, 'text'> & { text: string })[][] = [];
    let outerIndex = 0;
    let centerIndex = 0;

    for (let row = 0; row < 5; row++) {
      card[row] = [];
      for (let col = 0; col < 5; col++) {
        // Center 3x3 area (rows 1-3, cols 1-3)
        if (row >= 1 && row <= 3 && col >= 1 && col <= 3) {
          if (centerIndex < centerSquares.length) {
            card[row][col] = centerSquares[centerIndex];
            centerIndex++;
          } else {
            // Fallback to general squares if not enough center squares
            card[row][col] = generalSquares[centerIndex % generalSquares.length];
            centerIndex++;
          }
        } else {
          // Outer ring
          if (outerIndex < outerSquares.length) {
            card[row][col] = outerSquares[outerIndex];
            outerIndex++;
          } else {
            // Fallback to general squares if not enough outer squares
            card[row][col] = generalSquares[outerIndex % generalSquares.length];
            outerIndex++;
          }
        }
      }
    }

    return card;
  }

  /**
   * Shuffle array utility
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Get all available categories
   */
  getCategories(): Category[] {
    return Object.keys(this.taskData) as Category[];
  }
}

export const taskLoader = new TaskLoader();