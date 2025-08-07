<script lang="ts">
  import Button from "$lib/components/Button.svelte";
  import Card from "$lib/components/Card.svelte";
  import Badge from "$lib/components/Badge.svelte";

  // Mock data for the bingo board
  const bingoSquares = [
    {
      id: 1,
      text: "Get First Blood",
      category: "performance",
      difficulty: "medium",
      completed: false,
      points: 15,
    },
    {
      id: 2,
      text: "Land 3+ Person Ultimate",
      category: "performance",
      difficulty: "hard",
      completed: true,
      points: 25,
    },
    {
      id: 3,
      text: "Enemy Types 'jg diff'",
      category: "social",
      difficulty: "easy",
      completed: false,
      points: 10,
    },
    {
      id: 4,
      text: "Flash Into Wall",
      category: "social",
      difficulty: "easy",
      completed: false,
      points: 5,
    },
    {
      id: 5,
      text: "Ace Before 15min",
      category: "events",
      difficulty: "hard",
      completed: false,
      points: 30,
    },

    {
      id: 6,
      text: "Someone Claims Lag",
      category: "social",
      difficulty: "easy",
      completed: true,
      points: 5,
    },
    {
      id: 7,
      text: "Steal Baron/Dragon",
      category: "performance",
      difficulty: "hard",
      completed: false,
      points: 25,
    },
    {
      id: 8,
      text: "Die to Tower Solo",
      category: "social",
      difficulty: "easy",
      completed: false,
      points: 5,
    },
    {
      id: 9,
      text: "Win 1v2 Fight",
      category: "performance",
      difficulty: "medium",
      completed: false,
      points: 20,
    },
    {
      id: 10,
      text: "Perfect Game (0 Deaths)",
      category: "events",
      difficulty: "hard",
      completed: false,
      points: 35,
    },

    {
      id: 11,
      text: "Enemy Rage Quits",
      category: "social",
      difficulty: "medium",
      completed: false,
      points: 15,
    },
    {
      id: 12,
      text: "Save Ally <10% HP",
      category: "performance",
      difficulty: "medium",
      completed: true,
      points: 15,
    },
    {
      id: 13,
      text: "FREE SPACE",
      category: "free",
      difficulty: "free",
      completed: true,
      points: 0,
    },
    {
      id: 14,
      text: "10 CS/min at 20min",
      category: "performance",
      difficulty: "hard",
      completed: false,
      points: 25,
    },
    {
      id: 15,
      text: "Execute to Jungle",
      category: "social",
      difficulty: "easy",
      completed: false,
      points: 5,
    },

    {
      id: 16,
      text: "Get Pentakill",
      category: "performance",
      difficulty: "hard",
      completed: false,
      points: 40,
    },
    {
      id: 17,
      text: "Team Aced at Baron",
      category: "events",
      difficulty: "medium",
      completed: false,
      points: 20,
    },
    {
      id: 18,
      text: "Solo Kill Pre-6",
      category: "performance",
      difficulty: "medium",
      completed: false,
      points: 20,
    },
    {
      id: 19,
      text: "Reverse Sweep Fight",
      category: "events",
      difficulty: "hard",
      completed: false,
      points: 30,
    },
    {
      id: 20,
      text: "20min Surrender",
      category: "events",
      difficulty: "medium",
      completed: true,
      points: 15,
    },

    {
      id: 21,
      text: "Wrong Item Build",
      category: "social",
      difficulty: "easy",
      completed: false,
      points: 5,
    },
    {
      id: 22,
      text: "Ping Spam Teammates",
      category: "social",
      difficulty: "easy",
      completed: false,
      points: 5,
    },
    {
      id: 23,
      text: "Baron Power Play",
      category: "events",
      difficulty: "medium",
      completed: false,
      points: 20,
    },
    {
      id: 24,
      text: "Jungle Invade Success",
      category: "performance",
      difficulty: "medium",
      completed: false,
      points: 15,
    },
    {
      id: 25,
      text: "Elder Dragon Secured",
      category: "events",
      difficulty: "medium",
      completed: false,
      points: 20,
    },
  ];

  // Mock player data
  const players = [
    { id: 1, name: "Player1", role: "Top", score: 55, patterns: 0 },
    { id: 2, name: "You", role: "Mid", score: 55, patterns: 0 },
    { id: 3, name: "Player3", role: "ADC", score: 35, patterns: 0 },
    { id: 4, name: "Player4", role: "Support", score: 25, patterns: 0 },
    { id: 5, name: "Player5", role: "Jungle", score: 40, patterns: 0 },
  ];

  // Game state
  let selectedSquare: number | null = null;
  let showConfirmModal = false;
  let pendingClaim: any = null;
  let gameTime = "23:45";
  let totalScore = 55;

  // Square completion logic
  function handleSquareClick(square: any) {
    if (square.completed || square.category === "free") return;

    selectedSquare = square.id;
    pendingClaim = square;
    showConfirmModal = true;
  }

  function confirmClaim() {
    if (pendingClaim) {
      // Mark square as completed
      const squareIndex = bingoSquares.findIndex(
        (s) => s.id === pendingClaim.id,
      );
      if (squareIndex !== -1) {
        bingoSquares[squareIndex].completed = true;
        totalScore += pendingClaim.points;
      }
    }
    showConfirmModal = false;
    selectedSquare = null;
    pendingClaim = null;
  }

  function cancelClaim() {
    showConfirmModal = false;
    selectedSquare = null;
    pendingClaim = null;
  }

  function getCategoryColor(category: string) {
    switch (category) {
      case "performance":
        return "var(--color-primary-500)";
      case "social":
        return "var(--color-success-500)";
      case "events":
        return "var(--color-accent-500)";
      case "missions":
        return "var(--color-warning-500)";
      case "free":
        return "var(--color-warning-500)";
      default:
        return "var(--color-neutral-500)";
    }
  }

  function getDifficultyColor(difficulty: string) {
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

  function getRoleIcon(role: string) {
    switch (role.toLowerCase()) {
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
  <title>Bingo Board - Interactive Game Interface</title>
  <meta
    name="description"
    content="Interactive bingo board mockup with real-time game features"
  />
</svelte:head>

<div
  style="min-height: 100vh; background: var(--color-background); padding: var(--space-4);"
>
  <!-- Header -->
  <header style="margin-bottom: var(--space-6);">
    <div
      class="container"
      style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: var(--space-4);"
    >
      <div style="display: flex; align-items: center; gap: var(--space-4);">
        <Button variant="glass" size="sm">
          <a href="/" style="text-decoration: none; color: inherit;"
            >← Back Home</a
          >
        </Button>
        <h1
          style="font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); margin: 0;"
        >
          Bingo Board
        </h1>
      </div>

      <div style="display: flex; align-items: center; gap: var(--space-4);">
        <Badge variant="primary" size="md">Game Time: {gameTime}</Badge>
        <Badge variant="success" size="md">Score: {totalScore}</Badge>
      </div>
    </div>
  </header>

  <div class="container">
    <div
      style="display: grid; grid-template-columns: 1fr auto; gap: var(--space-8); align-items: start;"
    >
      <!-- Main Bingo Board -->
      <div>
        <Card variant="gradient" shadow="xl">
          <div
            style="display: flex; justify-content: between; align-items: center; margin-bottom: var(--space-6);"
          >
            <h2
              style="font-size: var(--font-size-xl); font-weight: var(--font-weight-bold); margin: 0;"
            >
              Your Bingo Card
            </h2>
            <div style="display: flex; gap: var(--space-2);">
              <Badge variant="glass" size="sm">Mid Lane</Badge>
              <Badge variant="accent" size="sm">Performance + Events</Badge>
            </div>
          </div>

          <!-- Bingo Grid -->
          <div
            style="
            display: grid; 
            grid-template-columns: repeat(5, 1fr); 
            gap: var(--space-2); 
            margin-bottom: var(--space-6);
            background: var(--glass-bg);
            padding: var(--space-4);
            border-radius: var(--radius-lg);
            backdrop-filter: var(--backdrop-blur-md);
          "
          >
            {#each bingoSquares as square, i}
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
                  cursor: {square.completed || square.category === 'free'
                  ? 'default'
                  : 'pointer'};
                  position: relative;
                  overflow: hidden;
                "
                class:selected={selectedSquare === square.id}
                on:click={() => handleSquareClick(square)}
                on:keydown={(e) =>
                  e.key === "Enter" && handleSquareClick(square)}
                role="button"
                tabindex="0"
              >
                <!-- Difficulty indicator -->
                {#if square.category !== "free"}
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
                {/if}

                <!-- Square content -->
                <div
                  style="flex: 1; display: flex; align-items: center; justify-content: center;"
                >
                  {square.text}
                </div>

                <!-- Points indicator -->
                {#if square.category !== "free" && square.points > 0}
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

                <!-- Completion checkmark -->
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
              </div>
            {/each}
          </div>

          <!-- Legend -->
          <div
            style="display: flex; justify-content: between; align-items: center; gap: var(--space-4); flex-wrap: wrap;"
          >
            <div style="display: flex; gap: var(--space-4); flex-wrap: wrap;">
              <div
                style="display: flex; align-items: center; gap: var(--space-2);"
              >
                <div
                  style="width: var(--space-3); height: var(--space-3); background: var(--color-primary-500); border-radius: var(--radius-sm);"
                ></div>
                <span style="font-size: var(--font-size-sm);">Performance</span>
              </div>
              <div
                style="display: flex; align-items: center; gap: var(--space-2);"
              >
                <div
                  style="width: var(--space-3); height: var(--space-3); background: var(--color-success-500); border-radius: var(--radius-sm);"
                ></div>
                <span style="font-size: var(--font-size-sm);">Social</span>
              </div>
              <div
                style="display: flex; align-items: center; gap: var(--space-2);"
              >
                <div
                  style="width: var(--space-3); height: var(--space-3); background: var(--color-accent-500); border-radius: var(--radius-sm);"
                ></div>
                <span style="font-size: var(--font-size-sm);">Events</span>
              </div>
              <div
                style="display: flex; align-items: center; gap: var(--space-2);"
              >
                <div
                  style="width: var(--space-3); height: var(--space-3); background: var(--color-warning-500); border-radius: var(--radius-sm);"
                ></div>
                <span style="font-size: var(--font-size-sm);">Missions</span>
              </div>
            </div>

            <div style="display: flex; gap: var(--space-3);">
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
          </div>
        </Card>
      </div>

      <!-- Sidebar -->
      <div
        style="width: 300px; display: flex; flex-direction: column; gap: var(--space-6);"
      >
        <!-- Leaderboard -->
        <Card variant="glass" shadow="lg">
          <h3
            style="font-size: var(--font-size-lg); font-weight: var(--font-weight-semibold); margin-bottom: var(--space-4);"
          >
            Leaderboard
          </h3>
          <div
            style="display: flex; flex-direction: column; gap: var(--space-3);"
          >
            {#each players.sort((a, b) => b.score - a.score) as player, index}
              <div
                style="
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: var(--space-3);
                background: {player.name === 'You'
                  ? 'var(--color-primary-500)'
                  : 'var(--glass-bg)'};
                color: {player.name === 'You'
                  ? 'white'
                  : 'var(--color-foreground)'};
                border-radius: var(--radius-md);
                backdrop-filter: var(--backdrop-blur-sm);
              "
              >
                <div
                  style="display: flex; align-items: center; gap: var(--space-2);"
                >
                  <span style="font-weight: var(--font-weight-bold);"
                    >#{index + 1}</span
                  >
                  <span>{getRoleIcon(player.role)}</span>
                  <span style="font-weight: var(--font-weight-medium);"
                    >{player.name}</span
                  >
                </div>
                <div style="text-align: right;">
                  <div style="font-weight: var(--font-weight-bold);">
                    {player.score}pt
                  </div>
                  <div style="font-size: var(--font-size-xs); opacity: 0.8;">
                    {player.patterns} patterns
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </Card>

        <!-- Game Actions -->
        <Card variant="default" shadow="md">
          <h3
            style="font-size: var(--font-size-lg); font-weight: var(--font-weight-semibold); margin-bottom: var(--space-4);"
          >
            Game Actions
          </h3>
          <div
            style="display: flex; flex-direction: column; gap: var(--space-3);"
          >
            <Button variant="accent" size="md" style="width: 100%;">
              Call Bingo!
            </Button>
            <Button variant="secondary" size="md" style="width: 100%;">
              View Patterns
            </Button>
            <Button variant="glass" size="md" style="width: 100%;">
              Game Rules
            </Button>
          </div>
        </Card>

        <!-- Recent Activity -->
        <Card variant="default" shadow="md">
          <h3
            style="font-size: var(--font-size-lg); font-weight: var(--font-weight-semibold); margin-bottom: var(--space-4);"
          >
            Recent Activity
          </h3>
          <div
            style="display: flex; flex-direction: column; gap: var(--space-2);"
          >
            <div
              style="font-size: var(--font-size-sm); color: var(--color-muted-foreground);"
            >
              <span style="color: var(--color-success-500);">Player1</span> completed
              "Get First Blood"
            </div>
            <div
              style="font-size: var(--font-size-sm); color: var(--color-muted-foreground);"
            >
              <span style="color: var(--color-primary-500);">You</span> completed
              "Land 3+ Person Ultimate"
            </div>
            <div
              style="font-size: var(--font-size-sm); color: var(--color-muted-foreground);"
            >
              <span style="color: var(--color-accent-500);">Player3</span> completed
              "Save Ally with less than 10% HP"
            </div>
          </div>
        </Card>
      </div>
    </div>
  </div>
</div>

<!-- Confirmation Modal -->
{#if showConfirmModal && pendingClaim}
  <div
    style="
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: var(--z-modal);
    backdrop-filter: var(--backdrop-blur-md);
  "
  >
    <Card
      variant="glass"
      shadow="xl"
      style="max-width: 500px; margin: var(--space-4);"
    >
      <h3
        style="font-size: var(--font-size-xl); font-weight: var(--font-weight-bold); margin-bottom: var(--space-4);"
      >
        Claim Bingo Square
      </h3>

      <div
        style="
        padding: var(--space-4);
        background: {getCategoryColor(pendingClaim.category)};
        color: white;
        border-radius: var(--radius-md);
        margin-bottom: var(--space-6);
        text-align: center;
      "
      >
        <div
          style="font-weight: var(--font-weight-semibold); margin-bottom: var(--space-2);"
        >
          "{pendingClaim.text}"
        </div>
        <div
          style="display: flex; justify-content: center; gap: var(--space-4); font-size: var(--font-size-sm);"
        >
          <span>Category: {pendingClaim.category}</span>
          <span>Difficulty: {pendingClaim.difficulty}</span>
          <span>Points: {pendingClaim.points}</span>
        </div>
      </div>

      <p
        style="color: var(--color-muted-foreground); margin-bottom: var(--space-6); line-height: var(--line-height-relaxed);"
      >
        Are you sure you want to claim this square? This action will be sent to
        the Game Master for verification.
      </p>

      <div
        style="display: flex; gap: var(--space-3); justify-content: flex-end;"
      >
        <Button variant="secondary" on:click={cancelClaim}>Cancel</Button>
        <Button variant="primary" on:click={confirmClaim}>Claim Square</Button>
      </div>
    </Card>
  </div>
{/if}

<style>
  .selected {
    transform: scale(1.05) !important;
    box-shadow: 0 0 20px var(--color-primary-500) !important;
  }

  /* Mobile responsive */
  @media (max-width: 1024px) {
    main > div {
      grid-template-columns: 1fr !important;
    }

    .container > div:last-child {
      width: 100% !important;
    }
  }
</style>
