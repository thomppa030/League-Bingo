<script lang="ts">
  import Button from "$lib/components/Button.svelte";
  import Card from "$lib/components/Card.svelte";
  import Badge from "$lib/components/Badge.svelte";
  import { _, locale } from 'svelte-i18n';
  import { taskLoader, type Role, type Category } from '$lib/services/TaskLoader';

  // Import the BingoSquare type directly from TaskLoader
  import type { BingoSquare } from '$lib/services/TaskLoader';




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

  // Reactive statement to force re-render when locale changes
  $: currentLocale = $locale;

  // Generate card function using TaskLoader
  function generateCard() {
    if (!selectedRole) return;

    try {
      const card = taskLoader.generateCard(selectedRole, selectedCategories);
      console.log('Generated card:', card);
      generatedCard = card;
      calculateScore();
    } catch (error) {
      console.error('Error generating card:', error);
    }
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

  function getCategoryColor(category: string): string {
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

  function getDifficultyColor(difficulty: string): string {
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
  <title>{$_('prototype.title')}</title>
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
        {$_('prototype.title')}
      </h1>
      <p
        style="color: var(--color-muted-foreground); font-size: var(--font-size-lg);"
      >
        {$_('prototype.subtitle')}
      </p>
      <div style="margin-top: var(--space-4);">
        <Button variant="glass" size="sm">
          <a href="/" style="text-decoration: none; color: inherit;"
            >{$_('prototype.backHome')}</a
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
          {$_('prototype.createCard')}
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
            {$_('prototype.playerName')}
          </label>
          <input
            type="text"
            bind:value={playerName}
            placeholder={$_('prototype.playerNamePlaceholder')}
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
            {$_('prototype.chooseRole')}
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
            {$_('prototype.selectCategories')}
          </label>
          <div
            style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: var(--space-3);"
          >
            {#each taskLoader.getCategories() as category}
              <label
                style="
                display: flex;
                align-items: center;
                gap: var(--space-2);
                padding: var(--space-3);
                border: 1px solid var(--color-border);
                border-radius: var(--radius-md);
                cursor: pointer;
                background: {selectedCategories.includes(category)
                  ? 'var(--glass-bg)'
                  : 'var(--color-surface)'};
              "
              >
                <input
                  type="checkbox"
                  bind:group={selectedCategories}
                  value={category}
                  style="width: var(--space-4); height: var(--space-4);"
                />
                <span>{$_(`prototype.categoryIcons.${category}`)}</span>
                <span style="font-weight: var(--font-weight-medium);"
                  >{$_(`prototype.categories.${category}`)}</span
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
          {$_('prototype.generateCard')}
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
                {$_('prototype.bingoCard', { values: { name: playerName } })}
              </h2>
              <div
                style="display: flex; gap: var(--space-3); align-items: center;"
              >
                <Badge variant="primary"
                  >{getRoleIcon(selectedRole)}
                  {selectedRole?.toUpperCase()}</Badge
                >
                <Badge variant="success">{$_('prototype.score')}: {totalScore}</Badge>
              </div>
            </div>
            <Button variant="secondary" size="sm" on:click={resetCard}>
              {$_('prototype.newCard')}
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
                    {taskLoader.getLocalizedText(square.text)}
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
                      {square.points}{$_('game.points')}
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
                <span style="font-size: var(--font-size-xs);">{$_('difficulty.easy')}</span>
              </div>
              <div
                style="display: flex; align-items: center; gap: var(--space-1);"
              >
                <div
                  style="width: var(--space-2); height: var(--space-2); background: var(--color-warning-500); border-radius: var(--radius-full);"
                ></div>
                <span style="font-size: var(--font-size-xs);">{$_('difficulty.medium')}</span>
              </div>
              <div
                style="display: flex; align-items: center; gap: var(--space-1);"
              >
                <div
                  style="width: var(--space-2); height: var(--space-2); background: var(--color-danger-500); border-radius: var(--radius-full);"
                ></div>
                <span style="font-size: var(--font-size-xs);">{$_('difficulty.hard')}</span>
              </div>
            </div>
            <div
              style="display: flex; align-items: center; gap: var(--space-2);"
            >
              <span style="font-size: var(--font-size-xs);"
                >👥 = {$_('prototype.teamSquare')}</span
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
              {$_('prototype.cardStats')}
            </h3>
            <div
              style="display: flex; flex-direction: column; gap: var(--space-3);"
            >
              <div style="display: flex; justify-content: space-between;">
                <span>{$_('prototype.totalSquares')}:</span>
                <Badge variant="default" size="sm">25</Badge>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span>{$_('prototype.completed')}:</span>
                <Badge variant="success" size="sm">
                  {generatedCard
                    ? generatedCard.flat().filter((s) => s.completed).length
                    : 0}
                </Badge>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span>{$_('prototype.currentScore')}:</span>
                <Badge variant="primary" size="sm">{totalScore}{$_('game.points')}</Badge>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span>{$_('prototype.roleSquares')}:</span>
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
              {$_('prototype.howToPlay')}
            </h3>
            <div
              style="display: flex; flex-direction: column; gap: var(--space-2); font-size: var(--font-size-sm);"
            >
              {#each $_('prototype.howToPlayText') as instruction}
                <p>• {instruction}</p>
              {/each}
            </div>
          </Card>

          <!-- Share -->
          <Card variant="default" shadow="md">
            <h3
              style="font-size: var(--font-size-lg); font-weight: var(--font-weight-semibold); margin-bottom: var(--space-4);"
            >
              {$_('prototype.shareTest')}
            </h3>
            <div
              style="display: flex; flex-direction: column; gap: var(--space-3);"
            >
              <Button variant="accent" size="md" style="width: 100%;">
                {$_('prototype.screenshotCard')}
              </Button>
              <Button
                variant="secondary"
                size="md"
                style="width: 100%;"
                on:click={generateCard}
              >
                {$_('prototype.generateNewCard')}
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
