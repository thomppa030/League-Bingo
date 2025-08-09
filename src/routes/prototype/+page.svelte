<script lang="ts">
  import Button from "$lib/components/Button.svelte";
  import Card from "$lib/components/Card.svelte";
  import Badge from "$lib/components/Badge.svelte";

  // Types
  type Role = "top" | "jungle" | "mid" | "adc" | "support";
  type Category =
    | "performance"
    | "social"
    | "events"
    | "missions"
    | "fun"
    | "chaos";
  type Difficulty = "easy" | "medium" | "hard";

  interface BingoSquare {
    id: string;
    text: string;
    category: Category;
    difficulty: Difficulty;
    points: number;
    roleSpecific: Role[];
    requiresConfirmation: boolean;
    completed?: boolean;
  }

  // Simplified square database for prototype
  const centerSquares: BingoSquare[] = [
    {
      id: "c1",
      text: "Team Gets First Blood",
      category: "events",
      difficulty: "easy",
      points: 10,
      roleSpecific: [],
      requiresConfirmation: false,
    },
    {
      id: "c2",
      text: "Ace Enemy Team",
      category: "events",
      difficulty: "medium",
      points: 25,
      roleSpecific: [],
      requiresConfirmation: true,
    },
    {
      id: "c3",
      text: "Win Under 25min",
      category: "events",
      difficulty: "medium",
      points: 20,
      roleSpecific: [],
      requiresConfirmation: false,
    },
    {
      id: "c4",
      text: "Get Baron + Win Fight",
      category: "events",
      difficulty: "medium",
      points: 20,
      roleSpecific: [],
      requiresConfirmation: true,
    },
    {
      id: "c5",
      text: "FREE SPACE",
      category: "events",
      difficulty: "easy",
      points: 0,
      roleSpecific: [],
      requiresConfirmation: false,
      completed: true,
    },
    {
      id: "c6",
      text: "Get 3+ Dragons",
      category: "events",
      difficulty: "medium",
      points: 20,
      roleSpecific: [],
      requiresConfirmation: false,
    },
    {
      id: "c7",
      text: "Win Fight 4v5",
      category: "events",
      difficulty: "hard",
      points: 30,
      roleSpecific: [],
      requiresConfirmation: true,
    },
    {
      id: "c8",
      text: "Destroy All Outer Towers",
      category: "events",
      difficulty: "medium",
      points: 15,
      roleSpecific: [],
      requiresConfirmation: false,
    },
    {
      id: "c9",
      text: "Comeback from 5+ Kill Deficit",
      category: "events",
      difficulty: "hard",
      points: 35,
      roleSpecific: [],
      requiresConfirmation: false,
    },
  ];

  const roleSpecificSquares: BingoSquare[] = [
    // Top Lane
    {
      id: "t1",
      text: "Solo Kill in Lane",
      category: "performance",
      difficulty: "medium",
      points: 20,
      roleSpecific: ["top"],
      requiresConfirmation: true,
    },
    {
      id: "t2",
      text: "Win 1v2 vs Gank",
      category: "performance",
      difficulty: "hard",
      points: 30,
      roleSpecific: ["top"],
      requiresConfirmation: true,
    },
    {
      id: "t3",
      text: "9+ CS/min at 15min",
      category: "performance",
      difficulty: "medium",
      points: 15,
      roleSpecific: ["top"],
      requiresConfirmation: false,
    },
    {
      id: "t4",
      text: "TP Save Teammate",
      category: "performance",
      difficulty: "medium",
      points: 20,
      roleSpecific: ["top"],
      requiresConfirmation: true,
    },
    {
      id: "t5",
      text: "Split Push Tower Solo",
      category: "performance",
      difficulty: "medium",
      points: 15,
      roleSpecific: ["top"],
      requiresConfirmation: true,
    },
    {
      id: "t6",
      text: "Tank 15k+ Damage",
      category: "performance",
      difficulty: "hard",
      points: 25,
      roleSpecific: ["top"],
      requiresConfirmation: false,
    },

    // Jungle
    {
      id: "j1",
      text: "Steal Baron/Dragon",
      category: "performance",
      difficulty: "hard",
      points: 40,
      roleSpecific: ["jungle"],
      requiresConfirmation: true,
    },
    {
      id: "j2",
      text: "4+ Successful Ganks",
      category: "performance",
      difficulty: "medium",
      points: 20,
      roleSpecific: ["jungle"],
      requiresConfirmation: true,
    },
    {
      id: "j3",
      text: "Counter-Jungle + Kill",
      category: "performance",
      difficulty: "medium",
      points: 20,
      roleSpecific: ["jungle"],
      requiresConfirmation: true,
    },
    {
      id: "j4",
      text: "Solo Dragon Pre-15min",
      category: "performance",
      difficulty: "medium",
      points: 20,
      roleSpecific: ["jungle"],
      requiresConfirmation: false,
    },
    {
      id: "j5",
      text: "Herald for 2+ Plates",
      category: "performance",
      difficulty: "medium",
      points: 15,
      roleSpecific: ["jungle"],
      requiresConfirmation: false,
    },
    {
      id: "j6",
      text: "Full Clear Under 4min",
      category: "performance",
      difficulty: "hard",
      points: 25,
      roleSpecific: ["jungle"],
      requiresConfirmation: false,
    },

    // Mid Lane
    {
      id: "m1",
      text: "Roam for 3+ Assists",
      category: "performance",
      difficulty: "medium",
      points: 20,
      roleSpecific: ["mid"],
      requiresConfirmation: true,
    },
    {
      id: "m2",
      text: "Solo Kill Pre-Level 6",
      category: "performance",
      difficulty: "hard",
      points: 30,
      roleSpecific: ["mid"],
      requiresConfirmation: true,
    },
    {
      id: "m3",
      text: "4+ Person Ultimate",
      category: "performance",
      difficulty: "hard",
      points: 30,
      roleSpecific: ["mid"],
      requiresConfirmation: true,
    },
    {
      id: "m4",
      text: "First to Level 6",
      category: "performance",
      difficulty: "easy",
      points: 10,
      roleSpecific: ["mid"],
      requiresConfirmation: false,
    },
    {
      id: "m5",
      text: "10+ CS/min at 20min",
      category: "performance",
      difficulty: "hard",
      points: 25,
      roleSpecific: ["mid"],
      requiresConfirmation: false,
    },
    {
      id: "m6",
      text: "Kill Both Enemy Carries",
      category: "performance",
      difficulty: "hard",
      points: 30,
      roleSpecific: ["mid"],
      requiresConfirmation: false,
    },

    // ADC
    {
      id: "a1",
      text: "Get Pentakill",
      category: "performance",
      difficulty: "hard",
      points: 50,
      roleSpecific: ["adc"],
      requiresConfirmation: true,
    },
    {
      id: "a2",
      text: "45k+ Damage to Champions",
      category: "performance",
      difficulty: "medium",
      points: 20,
      roleSpecific: ["adc"],
      requiresConfirmation: false,
    },
    {
      id: "a3",
      text: "10+ CS/min at 20min",
      category: "performance",
      difficulty: "medium",
      points: 15,
      roleSpecific: ["adc"],
      requiresConfirmation: false,
    },
    {
      id: "a4",
      text: "Get Quadrakill",
      category: "performance",
      difficulty: "medium",
      points: 30,
      roleSpecific: ["adc"],
      requiresConfirmation: true,
    },
    {
      id: "a5",
      text: "Survive with <50 HP",
      category: "performance",
      difficulty: "medium",
      points: 15,
      roleSpecific: ["adc"],
      requiresConfirmation: true,
    },
    {
      id: "a6",
      text: "300+ CS in Game",
      category: "performance",
      difficulty: "hard",
      points: 25,
      roleSpecific: ["adc"],
      requiresConfirmation: false,
    },

    // Support
    {
      id: "s1",
      text: "Save Ally <50 HP",
      category: "performance",
      difficulty: "medium",
      points: 20,
      roleSpecific: ["support"],
      requiresConfirmation: true,
    },
    {
      id: "s2",
      text: "25+ Assists",
      category: "performance",
      difficulty: "medium",
      points: 15,
      roleSpecific: ["support"],
      requiresConfirmation: false,
    },
    {
      id: "s3",
      text: "Place 75+ Wards",
      category: "performance",
      difficulty: "medium",
      points: 15,
      roleSpecific: ["support"],
      requiresConfirmation: false,
    },
    {
      id: "s4",
      text: "4+ Person CC",
      category: "performance",
      difficulty: "hard",
      points: 25,
      roleSpecific: ["support"],
      requiresConfirmation: true,
    },
    {
      id: "s5",
      text: "Solo Kill Enemy Carry",
      category: "performance",
      difficulty: "hard",
      points: 35,
      roleSpecific: ["support"],
      requiresConfirmation: true,
    },
    {
      id: "s6",
      text: "Tank 10k+ Damage",
      category: "performance",
      difficulty: "medium",
      points: 20,
      roleSpecific: ["support"],
      requiresConfirmation: false,
    },
  ];

  const generalSquares: BingoSquare[] = [
    // Performance
    {
      id: "p1",
      text: "Get Triple Kill",
      category: "performance",
      difficulty: "medium",
      points: 25,
      roleSpecific: [],
      requiresConfirmation: true,
    },
    {
      id: "p2",
      text: "Go Deathless",
      category: "performance",
      difficulty: "medium",
      points: 25,
      roleSpecific: [],
      requiresConfirmation: false,
    },
    {
      id: "p3",
      text: "Get 12+ Kills",
      category: "performance",
      difficulty: "medium",
      points: 20,
      roleSpecific: [],
      requiresConfirmation: false,
    },
    {
      id: "p4",
      text: "Get Double Kill",
      category: "performance",
      difficulty: "easy",
      points: 10,
      roleSpecific: [],
      requiresConfirmation: true,
    },
    {
      id: "p5",
      text: "Win 1v1 Fight",
      category: "performance",
      difficulty: "easy",
      points: 10,
      roleSpecific: [],
      requiresConfirmation: true,
    },
    {
      id: "p6",
      text: "Kill Streak 7+",
      category: "performance",
      difficulty: "hard",
      points: 25,
      roleSpecific: [],
      requiresConfirmation: false,
    },

    // Social
    {
      id: "so1",
      text: 'Enemy Types "gg wp"',
      category: "social",
      difficulty: "easy",
      points: 5,
      roleSpecific: [],
      requiresConfirmation: true,
    },
    {
      id: "so2",
      text: 'Someone Says "diff"',
      category: "social",
      difficulty: "easy",
      points: 5,
      roleSpecific: [],
      requiresConfirmation: true,
    },
    {
      id: "so3",
      text: 'Get "?" Pinged',
      category: "social",
      difficulty: "easy",
      points: 5,
      roleSpecific: [],
      requiresConfirmation: true,
    },
    {
      id: "so4",
      text: "Enemy Rage Quits",
      category: "social",
      difficulty: "medium",
      points: 15,
      roleSpecific: [],
      requiresConfirmation: true,
    },
    {
      id: "so5",
      text: "Someone Blames Lag",
      category: "social",
      difficulty: "easy",
      points: 5,
      roleSpecific: [],
      requiresConfirmation: true,
    },
    {
      id: "so6",
      text: "Flash Into Wall",
      category: "social",
      difficulty: "easy",
      points: 5,
      roleSpecific: [],
      requiresConfirmation: true,
    },
    {
      id: "so7",
      text: "Die to Jungle Monster",
      category: "social",
      difficulty: "easy",
      points: 5,
      roleSpecific: [],
      requiresConfirmation: true,
    },
    {
      id: "so8",
      text: 'Someone Types "ff15"',
      category: "social",
      difficulty: "easy",
      points: 5,
      roleSpecific: [],
      requiresConfirmation: true,
    },

    // Fun
    {
      id: "f1",
      text: "Dance After Kill",
      category: "fun",
      difficulty: "easy",
      points: 5,
      roleSpecific: [],
      requiresConfirmation: true,
    },
    {
      id: "f2",
      text: "Flash Over Wall <100 HP",
      category: "fun",
      difficulty: "medium",
      points: 10,
      roleSpecific: [],
      requiresConfirmation: true,
    },
    {
      id: "f3",
      text: "Mastery Emote After Outplay",
      category: "fun",
      difficulty: "easy",
      points: 5,
      roleSpecific: [],
      requiresConfirmation: true,
    },
    {
      id: "f4",
      text: "Kill While Walking Backward",
      category: "fun",
      difficulty: "medium",
      points: 15,
      roleSpecific: [],
      requiresConfirmation: true,
    },
    {
      id: "f5",
      text: 'Type "whoops"',
      category: "fun",
      difficulty: "easy",
      points: 5,
      roleSpecific: [],
      requiresConfirmation: true,
    },
    {
      id: "f6",
      text: "Juke Enemy Into Their Team",
      category: "fun",
      difficulty: "medium",
      points: 15,
      roleSpecific: [],
      requiresConfirmation: true,
    },
    {
      id: "f7",
      text: "Compliment Enemy Play",
      category: "fun",
      difficulty: "easy",
      points: 10,
      roleSpecific: [],
      requiresConfirmation: true,
    },
    {
      id: "f8",
      text: "Survive with Exactly 1 HP",
      category: "fun",
      difficulty: "hard",
      points: 20,
      roleSpecific: [],
      requiresConfirmation: true,
    },

    // Events
    {
      id: "e1",
      text: "Get First Tower",
      category: "events",
      difficulty: "easy",
      points: 10,
      roleSpecific: [],
      requiresConfirmation: false,
    },
    {
      id: "e2",
      text: "Participate in Baron Steal",
      category: "events",
      difficulty: "hard",
      points: 30,
      roleSpecific: [],
      requiresConfirmation: true,
    },
    {
      id: "e3",
      text: "Get Elder Execute",
      category: "events",
      difficulty: "medium",
      points: 20,
      roleSpecific: [],
      requiresConfirmation: false,
    },
    {
      id: "e4",
      text: "Die in Enemy Fountain",
      category: "events",
      difficulty: "easy",
      points: 5,
      roleSpecific: [],
      requiresConfirmation: true,
    },
    {
      id: "e5",
      text: "Team Gets Aced",
      category: "events",
      difficulty: "easy",
      points: 5,
      roleSpecific: [],
      requiresConfirmation: false,
    },

    // Chaos
    {
      id: "ch1",
      text: "Game Goes 45+ Minutes",
      category: "chaos",
      difficulty: "medium",
      points: 20,
      roleSpecific: [],
      requiresConfirmation: false,
    },
    {
      id: "ch2",
      text: "Someone DCs + Reconnects",
      category: "chaos",
      difficulty: "easy",
      points: 10,
      roleSpecific: [],
      requiresConfirmation: true,
    },
    {
      id: "ch3",
      text: "10+ Kill Lead Swing",
      category: "chaos",
      difficulty: "medium",
      points: 15,
      roleSpecific: [],
      requiresConfirmation: false,
    },
    {
      id: "ch4",
      text: "Both Teams Ace Each Other",
      category: "chaos",
      difficulty: "hard",
      points: 25,
      roleSpecific: [],
      requiresConfirmation: true,
    },
    {
      id: "ch5",
      text: "Surrender at Exactly 20min",
      category: "chaos",
      difficulty: "easy",
      points: 10,
      roleSpecific: [],
      requiresConfirmation: false,
    },

    // Missions
    {
      id: "mi1",
      text: "Complete Full Build",
      category: "missions",
      difficulty: "medium",
      points: 15,
      roleSpecific: [],
      requiresConfirmation: false,
    },
    {
      id: "mi2",
      text: "Have 3000+ Gold at Once",
      category: "missions",
      difficulty: "medium",
      points: 10,
      roleSpecific: [],
      requiresConfirmation: false,
    },
    {
      id: "mi3",
      text: "Recall <50 HP",
      category: "missions",
      difficulty: "easy",
      points: 5,
      roleSpecific: [],
      requiresConfirmation: true,
    },
    {
      id: "mi4",
      text: "Get Kill in First 90 Seconds",
      category: "missions",
      difficulty: "medium",
      points: 20,
      roleSpecific: [],
      requiresConfirmation: true,
    },
    {
      id: "mi5",
      text: "Reach Level 18",
      category: "missions",
      difficulty: "medium",
      points: 15,
      roleSpecific: [],
      requiresConfirmation: false,
    },
  ];

  // State
  let selectedRole: Role | null = null;
  let selectedCategories: Category[] = [
    "performance",
    "social",
    "fun",
    "events",
  ];
  let playerName = "";
  let generatedCard: BingoSquare[][] | null = null;
  let totalScore = 0;

  // Generate card function
  function generateCard() {
    if (!selectedRole) return;

    // Get role-specific squares (5 squares - 30% of 16)
    const availableRoleSquares = roleSpecificSquares.filter((sq) =>
      sq.roleSpecific.includes(selectedRole!),
    );
    const selectedRoleSquares = shuffleArray(availableRoleSquares).slice(0, 5);

    // Get general squares filtered by categories (11 squares - 70% of 16)
    const availableGeneralSquares = generalSquares.filter((sq) =>
      selectedCategories.includes(sq.category),
    );
    const selectedGeneralSquares = shuffleArray(availableGeneralSquares).slice(
      0,
      11,
    );

    // Combine individual squares
    const individualSquares = shuffleArray([
      ...selectedRoleSquares,
      ...selectedGeneralSquares,
    ]);

    // Create 5x5 grid
    const card: BingoSquare[][] = [];
    let individualIndex = 0;
    let centerIndex = 0;

    for (let row = 0; row < 5; row++) {
      card[row] = [];
      for (let col = 0; col < 5; col++) {
        // Center 3x3 area (rows 1-3, cols 1-3)
        if (row >= 1 && row <= 3 && col >= 1 && col <= 3) {
          card[row][col] = { ...centerSquares[centerIndex] };
          centerIndex++;
        } else {
          // Individual squares for outer ring
          card[row][col] = { ...individualSquares[individualIndex] };
          individualIndex++;
        }
      }
    }

    generatedCard = card;
    calculateScore();
  }

  function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  function toggleSquare(row: number, col: number) {
    if (!generatedCard) return;

    generatedCard[row][col].completed = !generatedCard[row][col].completed;
    generatedCard = generatedCard; // Trigger reactivity
    calculateScore();
  }

  function calculateScore() {
    if (!generatedCard) return;

    totalScore = 0;
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        if (generatedCard[row][col].completed) {
          totalScore += generatedCard[row][col].points;
        }
      }
    }
  }

  function resetCard() {
    generatedCard = null;
    totalScore = 0;
    selectedRole = null;
    playerName = "";
  }

  function getCategoryColor(category: Category): string {
    switch (category) {
      case "performance":
        return "var(--color-primary-500)";
      case "social":
        return "var(--color-success-500)";
      case "events":
        return "var(--color-accent-500)";
      case "missions":
        return "var(--color-warning-500)";
      case "fun":
        return "#ec4899";
      case "chaos":
        return "#8b5cf6";
      default:
        return "var(--color-neutral-500)";
    }
  }

  function getDifficultyColor(difficulty: Difficulty): string {
    switch (difficulty) {
      case "easy":
        return "var(--color-success-500)";
      case "medium":
        return "var(--color-warning-500)";
      case "hard":
        return "var(--color-danger-500)";
      default:
        return "var(--color-neutral-500)";
    }
  }

  function getRoleIcon(role: Role): string {
    switch (role) {
      case "top":
        return "⚔️";
      case "jungle":
        return "🌿";
      case "mid":
        return "⚡";
      case "adc":
        return "🏹";
      case "support":
        return "🛡️";
      default:
        return "👤";
    }
  }
</script>

<svelte:head>
  <title>Bingo Card Prototype</title>
</svelte:head>

<div
  style="min-height: 100vh; background: var(--color-background); padding: var(--space-4);"
>
  <div class="container">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: var(--space-8);">
      <h1
        style="
        font-size: var(--font-size-4xl);
        font-weight: var(--font-weight-bold);
        background: linear-gradient(135deg, var(--color-primary-400) 0%, var(--color-accent-500) 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        margin-bottom: var(--space-4);
      "
      >
        Bingo Card Prototype
      </h1>
      <p
        style="color: var(--color-muted-foreground); font-size: var(--font-size-lg);"
      >
        Generate your personalized 5x5 bingo card for testing
      </p>
      <div style="margin-top: var(--space-4);">
        <Button variant="glass" size="sm">
          <a href="/" style="text-decoration: none; color: inherit;"
            >← Back Home</a
          >
        </Button>
      </div>
    </div>

    {#if !generatedCard}
      <!-- Setup Form -->
      <Card
        variant="glass"
        shadow="xl"
        style="max-width: 600px; margin: 0 auto;"
      >
        <h2
          style="font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); margin-bottom: var(--space-6);"
        >
          Create Your Bingo Card
        </h2>

        <!-- Player Name -->
        <div style="margin-bottom: var(--space-6);">
          <label
            style="
            display: block;
            font-weight: var(--font-weight-medium);
            margin-bottom: var(--space-2);
          "
          >
            Player Name
          </label>
          <input
            type="text"
            bind:value={playerName}
            placeholder="Enter your name"
            style="
              width: 100%;
              padding: var(--space-3);
              border: 1px solid var(--color-border);
              border-radius: var(--radius-md);
              background: var(--color-surface);
              color: var(--color-foreground);
            "
          />
        </div>

        <!-- Role Selection -->
        <div style="margin-bottom: var(--space-6);">
          <label
            style="
            display: block;
            font-weight: var(--font-weight-medium);
            margin-bottom: var(--space-4);
          "
          >
            Choose Your Role
          </label>
          <div
            style="display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: var(--space-3);"
          >
            {#each ["top", "jungle", "mid", "adc", "support"] as role}
              <button
                style="
                  padding: var(--space-4);
                  border: 2px solid {selectedRole === role
                  ? 'var(--color-primary-500)'
                  : 'var(--color-border)'};
                  border-radius: var(--radius-lg);
                  background: {selectedRole === role
                  ? 'var(--color-primary-500)'
                  : 'var(--color-surface)'};
                  color: {selectedRole === role
                  ? 'white'
                  : 'var(--color-foreground)'};
                  cursor: pointer;
                  transition: all var(--transition-normal);
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  gap: var(--space-2);
                "
                on:click={() => (selectedRole = role)}
              >
                <span style="font-size: var(--font-size-2xl);"
                  >{getRoleIcon(role)}</span
                >
                <span
                  style="font-weight: var(--font-weight-medium); text-transform: capitalize;"
                  >{role}</span
                >
              </button>
            {/each}
          </div>
        </div>

        <!-- Category Selection -->
        <div style="margin-bottom: var(--space-8);">
          <label
            style="
            display: block;
            font-weight: var(--font-weight-medium);
            margin-bottom: var(--space-4);
          "
          >
            Select Categories (Choose at least 3)
          </label>
          <div
            style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: var(--space-3);"
          >
            {#each [{ id: "performance", name: "Performance", icon: "🎯" }, { id: "social", name: "Social", icon: "💬" }, { id: "fun", name: "Fun", icon: "🎪" }, { id: "events", name: "Events", icon: "⚡" }, { id: "missions", name: "Missions", icon: "🎲" }, { id: "chaos", name: "Chaos", icon: "🌪️" }] as category}
              <label
                style="
                display: flex;
                align-items: center;
                gap: var(--space-2);
                padding: var(--space-3);
                border: 1px solid var(--color-border);
                border-radius: var(--radius-md);
                cursor: pointer;
                background: {selectedCategories.includes(category.id)
                  ? 'var(--glass-bg)'
                  : 'var(--color-surface)'};
              "
              >
                <input
                  type="checkbox"
                  bind:group={selectedCategories}
                  value={category.id}
                  style="width: var(--space-4); height: var(--space-4);"
                />
                <span>{category.icon}</span>
                <span style="font-weight: var(--font-weight-medium);"
                  >{category.name}</span
                >
              </label>
            {/each}
          </div>
        </div>

        <!-- Generate Button -->
        <Button
          variant="primary"
          size="lg"
          style="width: 100%;"
          disabled={!selectedRole ||
            selectedCategories.length < 3 ||
            !playerName.trim()}
          on:click={generateCard}
        >
          Generate Bingo Card
        </Button>
      </Card>
    {:else}
      <!-- Generated Card Display -->
      <div
        style="display: grid; grid-template-columns: 1fr auto; gap: var(--space-8); align-items: start;"
      >
        <!-- Bingo Card -->
        <Card variant="gradient" shadow="xl">
          <div
            style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-6);"
          >
            <div>
              <h2
                style="font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); margin-bottom: var(--space-2);"
              >
                {playerName}'s Bingo Card
              </h2>
              <div
                style="display: flex; gap: var(--space-3); align-items: center;"
              >
                <Badge variant="primary"
                  >{getRoleIcon(selectedRole)}
                  {selectedRole?.toUpperCase()}</Badge
                >
                <Badge variant="success">Score: {totalScore}</Badge>
              </div>
            </div>
            <Button variant="secondary" size="sm" on:click={resetCard}>
              New Card
            </Button>
          </div>

          <!-- 5x5 Grid -->
          <div
            style="
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: var(--space-2);
            background: var(--glass-bg);
            padding: var(--space-4);
            border-radius: var(--radius-lg);
            backdrop-filter: var(--backdrop-blur-md);
          "
          >
            {#each generatedCard as row, rowIndex}
              {#each row as square, colIndex}
                <div
                  style="
                    aspect-ratio: 1;
                    background: {square.completed
                    ? getCategoryColor(square.category)
                    : 'var(--color-surface)'};
                    border: 2px solid {square.completed
                    ? 'transparent'
                    : getCategoryColor(square.category)};
                    border-radius: var(--radius-md);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: var(--space-2);
                    font-size: var(--font-size-xs);
                    font-weight: var(--font-weight-medium);
                    text-align: center;
                    line-height: 1.2;
                    color: {square.completed
                    ? 'white'
                    : 'var(--color-foreground)'};
                    transition: all var(--transition-normal);
                    cursor: {square.id === 'c5' ? 'default' : 'pointer'};
                    position: relative;
                    overflow: hidden;
                  "
                  on:click={() =>
                    square.id !== "c5" && toggleSquare(rowIndex, colIndex)}
                  on:keydown={(e) =>
                    e.key === "Enter" &&
                    square.id !== "c5" &&
                    toggleSquare(rowIndex, colIndex)}
                  role="button"
                  tabindex="0"
                >
                  <!-- Difficulty indicator -->
                  <div
                    style="
                    position: absolute;
                    top: var(--space-1);
                    right: var(--space-1);
                    width: var(--space-2);
                    height: var(--space-2);
                    background: {getDifficultyColor(square.difficulty)};
                    border-radius: var(--radius-full);
                  "
                  ></div>

                  <!-- Square text -->
                  <div
                    style="flex: 1; display: flex; align-items: center; justify-content: center;"
                  >
                    {square.text}
                  </div>

                  <!-- Points -->
                  {#if square.points > 0}
                    <div
                      style="
                      position: absolute;
                      bottom: var(--space-1);
                      left: var(--space-1);
                      font-size: var(--font-size-xs);
                      font-weight: var(--font-weight-bold);
                      opacity: 0.8;
                    "
                    >
                      {square.points}pt
                    </div>
                  {/if}

                  <!-- Completion check -->
                  {#if square.completed}
                    <div
                      style="
                      position: absolute;
                      top: 50%;
                      left: 50%;
                      transform: translate(-50%, -50%);
                      font-size: var(--font-size-xl);
                      color: white;
                      text-shadow: 0 0 10px rgba(0,0,0,0.5);
                    "
                    >
                      ✓
                    </div>
                  {/if}

                  <!-- Center square indicator -->
                  {#if rowIndex >= 1 && rowIndex <= 3 && colIndex >= 1 && colIndex <= 3}
                    <div
                      style="
                      position: absolute;
                      top: var(--space-1);
                      left: var(--space-1);
                      font-size: var(--font-size-xs);
                      opacity: 0.7;
                    "
                    >
                      👥
                    </div>
                  {/if}
                </div>
              {/each}
            {/each}
          </div>

          <!-- Legend -->
          <div
            style="margin-top: var(--space-6); display: flex; justify-content: space-between; flex-wrap: wrap; gap: var(--space-4);"
          >
            <div style="display: flex; gap: var(--space-4); flex-wrap: wrap;">
              <div
                style="display: flex; align-items: center; gap: var(--space-1);"
              >
                <div
                  style="width: var(--space-2); height: var(--space-2); background: var(--color-success-500); border-radius: var(--radius-full);"
                ></div>
                <span style="font-size: var(--font-size-xs);">Easy</span>
              </div>
              <div
                style="display: flex; align-items: center; gap: var(--space-1);"
              >
                <div
                  style="width: var(--space-2); height: var(--space-2); background: var(--color-warning-500); border-radius: var(--radius-full);"
                ></div>
                <span style="font-size: var(--font-size-xs);">Medium</span>
              </div>
              <div
                style="display: flex; align-items: center; gap: var(--space-1);"
              >
                <div
                  style="width: var(--space-2); height: var(--space-2); background: var(--color-danger-500); border-radius: var(--radius-full);"
                ></div>
                <span style="font-size: var(--font-size-xs);">Hard</span>
              </div>
            </div>
            <div
              style="display: flex; align-items: center; gap: var(--space-2);"
            >
              <span style="font-size: var(--font-size-xs);"
                >👥 = Team Square</span
              >
            </div>
          </div>
        </Card>

        <!-- Sidebar Info -->
        <div
          style="width: 300px; display: flex; flex-direction: column; gap: var(--space-6);"
        >
          <!-- Card Stats -->
          <Card variant="glass" shadow="md">
            <h3
              style="font-size: var(--font-size-lg); font-weight: var(--font-weight-semibold); margin-bottom: var(--space-4);"
            >
              Card Statistics
            </h3>
            <div
              style="display: flex; flex-direction: column; gap: var(--space-3);"
            >
              <div style="display: flex; justify-content: space-between;">
                <span>Total Squares:</span>
                <Badge variant="default" size="sm">25</Badge>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span>Completed:</span>
                <Badge variant="success" size="sm">
                  {generatedCard
                    ? generatedCard.flat().filter((s) => s.completed).length
                    : 0}
                </Badge>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span>Current Score:</span>
                <Badge variant="primary" size="sm">{totalScore}pts</Badge>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span>Role Squares:</span>
                <Badge variant="accent" size="sm">
                  {generatedCard
                    ? generatedCard
                        .flat()
                        .filter((s) => s.roleSpecific.includes(selectedRole))
                        .length
                    : 0}
                </Badge>
              </div>
            </div>
          </Card>

          <!-- Instructions -->
          <Card variant="default" shadow="md">
            <h3
              style="font-size: var(--font-size-lg); font-weight: var(--font-weight-semibold); margin-bottom: var(--space-4);"
            >
              How to Play
            </h3>
            <div
              style="display: flex; flex-direction: column; gap: var(--space-2); font-size: var(--font-size-sm);"
            >
              <p>• Click squares to mark them as completed</p>
              <p>• Center 3x3 squares are shared with your team</p>
              <p>• Outer squares are unique to you</p>
              <p>• Different colors = different categories</p>
              <p>
                • Dots show difficulty (green=easy, yellow=medium, red=hard)
              </p>
              <p>• Try to complete rows, columns, or diagonals!</p>
            </div>
          </Card>

          <!-- Share -->
          <Card variant="default" shadow="md">
            <h3
              style="font-size: var(--font-size-lg); font-weight: var(--font-weight-semibold); margin-bottom: var(--space-4);"
            >
              Share & Test
            </h3>
            <div
              style="display: flex; flex-direction: column; gap: var(--space-3);"
            >
              <Button variant="accent" size="md" style="width: 100%;">
                Screenshot Card
              </Button>
              <Button
                variant="secondary"
                size="md"
                style="width: 100%;"
                on:click={generateCard}
              >
                Generate New Card
              </Button>
            </div>
          </Card>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  /* Mobile responsive */
  @media (max-width: 1024px) {
    main > div > div {
      grid-template-columns: 1fr !important;
    }

    main > div > div > div:last-child {
      width: 100% !important;
    }
  }
</style>
