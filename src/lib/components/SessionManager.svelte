<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import Button from "./Button.svelte";
  import Card from "./Card.svelte";
  import Badge from "./Badge.svelte";
  import {
    currentSession,
    currentPlayer,
    sessionPlayers,
    isGM,
    connectionStatus,
    canStartGame,
    sessionManager,
  } from "../stores/sessionStore.js";
  import {
    Role,
    Category,
    type CreateSessionRequest,
    type JoinSessionRequest,
  } from "../types.js";

  // Component state
  let currentView:
    | "home"
    | "create"
    | "join"
    | "lobby"
    | "categories"
    | "game" = "home";
  let loading = false;
  let error = "";

  // Form data
  let createForm = {
    gmName: "",
    sessionName: "",
    maxPlayers: 8,
    minPlayers: 1,
    allowLateJoin: true,
    requireGMConfirmation: true,
  };

  let joinForm = {
    code: "",
    playerName: "",
    role: Role.MID,
  };

  let selectedCategories: Category[] = [
    Category.PERFORMANCE,
    Category.IN_GAME_EVENTS,
  ];

  // Reactive statements
  $: showCategorySelection = $currentSession?.status === "category_selection";
  $: showGameLobby = $currentSession?.status === "setup";
  $: showGame = $currentSession?.status === "playing";
  $: myPlayer = $currentPlayer;
  $: allPlayersReady =
    $sessionPlayers.length > 1 && $sessionPlayers.every((p) => p.isReady);
  
  // Auto-navigate based on session status changes (real-time updates)
  $: if ($currentSession) {
    if ($currentSession.status === "setup" && currentView !== "lobby") {
      currentView = "lobby";
    } else if ($currentSession.status === "category_selection" && currentView !== "categories") {
      currentView = "categories";
    } else if ($currentSession.status === "playing" && currentView !== "game") {
      currentView = "game";
    }
  }
  
  // Debug logging for session players
  $: if (import.meta.env.DEV && $sessionPlayers) {
    console.log('Session players updated:', $sessionPlayers);
    console.log('Player count:', $sessionPlayers.length);
    $sessionPlayers.forEach((player, index) => {
      console.log(`Player ${index}:`, {
        id: player.id,
        name: player.name,
        role: player.role,
        isGM: player.isGM,
        isReady: player.isReady
      });
    });
  }

  onMount(async () => {
    // Check if session was restored from persistence
    if ($currentSession) {
      console.log('Session detected on mount, status:', $currentSession.status);
      
      // Navigate to the appropriate view based on session status
      if ($currentSession.status === "setup") {
        currentView = "lobby";
      } else if ($currentSession.status === "category_selection") {
        currentView = "categories";
      } else if ($currentSession.status === "playing") {
        currentView = "game";
      }
      
      // If player exists, populate role selection if needed
      if ($currentPlayer && !$currentPlayer.isGM) {
        selectedCategories = $currentPlayer.categories || [Category.PERFORMANCE, Category.SOCIAL];
        if ($currentPlayer.role) {
          joinForm.role = $currentPlayer.role;
        }
      }
    }
  });

  onDestroy(() => {
    // Cleanup on component destroy
  });

  // Session Management Functions
  async function createSession() {
    if (!createForm.gmName.trim() || !createForm.sessionName.trim()) {
      error = "Please fill in all required fields";
      return;
    }

    loading = true;
    error = "";

    const request: CreateSessionRequest = {
      gmName: createForm.gmName.trim(),
      sessionName: createForm.sessionName.trim(),
      settings: {
        allowLateJoin: createForm.allowLateJoin,
        requireGMConfirmation: createForm.requireGMConfirmation,
        enablePatternBonuses: true,
        customRules: [],
      },
      maxPlayers: createForm.maxPlayers,
      minPlayers: createForm.minPlayers,
    };

    try {
      const result = await sessionManager.createSession(request);

      if (result.success) {
        currentView = "lobby";
      } else {
        error = result.error?.message || "Failed to create session";
      }
    } catch (err) {
      error = "Network error. Please try again.";
    } finally {
      loading = false;
    }
  }

  async function joinSession() {
    if (!joinForm.code.trim() || !joinForm.playerName.trim()) {
      error = "Please fill in all required fields";
      return;
    }

    loading = true;
    error = "";

    const request: JoinSessionRequest = {
      code: joinForm.code.trim().toUpperCase(),
      playerName: joinForm.playerName.trim(),
      role: joinForm.role,
    };

    try {
      const result = await sessionManager.joinSession(request);

      if (result.success) {
        currentView = "lobby";
      } else {
        error = result.error?.message || "Failed to join session";
      }
    } catch (err) {
      error = "Network error. Please try again.";
    } finally {
      loading = false;
    }
  }

  async function leaveSession() {
    await sessionManager.leaveSession();
    currentView = "home";
  }

  async function moveToCategories() {
    if (!$currentSession || !$isGM) return;
    
    loading = true;
    error = "";
    
    try {
      // Update session status to category_selection for all players
      await sessionManager.updateSessionStatus("category_selection");
      // Navigation will happen automatically via reactive statement
    } catch (err) {
      error = "Failed to move to category selection";
      console.error(err);
    } finally {
      loading = false;
    }
  }

  async function toggleReady() {
    if (!myPlayer) return;
    await sessionManager.updatePlayerReady(!myPlayer.isReady);
  }

  async function updateCategories() {
    console.log("[UI] Updating categories:", selectedCategories);
    loading = true;
    error = "";
    
    try {
      await sessionManager.updatePlayerCategories(selectedCategories);
      
      // After updating categories, check if we should start the game
      if ($isGM) {
        console.log("[UI] GM detected, checking if all players have selected categories...");
        
        // Wait a moment for the update to propagate
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Check if all players have selected categories
        const allPlayersReady = $sessionPlayers.every((p) => 
          p.categories && p.categories.length > 0
        );
        
        console.log("[UI] All players have categories:", allPlayersReady);
        
        if (allPlayersReady) {
          // For GM, automatically start after all players have selected categories
          await generateCardsAndStart();
        }
      }
    } catch (err) {
      error = "Failed to update categories";
      console.error(err);
    } finally {
      loading = false;
    }
  }

  async function generateCardsAndStart() {
    loading = true;
    error = "";
    console.log("[UI] Starting card generation...");
    
    try {
      const result = await sessionManager.generateCards();
      console.log("[UI] Generate cards result:", result);
      
      if (result.success) {
        console.log("[UI] Cards generated successfully, starting game...");
        const startResult = await sessionManager.startGame();
        console.log("[UI] Start game result:", startResult);
        
        if (startResult.success) {
          // Update session status to playing, which will auto-navigate all players
          await sessionManager.updateSessionStatus("playing");
          // Navigation happens automatically via reactive statement
        } else {
          error = startResult.error?.message || "Failed to start game";
        }
      } else {
        error = result.error?.message || "Failed to generate cards";
      }
    } catch (err) {
      console.error("[UI] Error in generateCardsAndStart:", err);
      error = err instanceof Error ? err.message : "Failed to start game";
    } finally {
      loading = false;
    }
  }

  function getRoleDisplayName(role: Role | undefined): string {
    if (!role) return "No Role Selected";
    
    const roleNames = {
      [Role.TOP]: "Top Lane",
      [Role.JUNGLE]: "Jungle",
      [Role.MID]: "Mid Lane",
      [Role.ADC]: "ADC/Bot",
      [Role.SUPPORT]: "Support",
    };
    return roleNames[role] || "Unknown Role";
  }

  function getCategoryDisplayName(category: Category): string {
    const categoryNames = {
      [Category.PERFORMANCE]: "Performance",
      [Category.SOCIAL]: "Social Interaction",
      [Category.IN_GAME_EVENTS]: "In-Game Events",
      [Category.MISSIONS]: "Missions",
    };
    return categoryNames[category];
  }

  function getCategoryColor(category: string): string {
    switch (category.toLowerCase()) {
      case "performance":
        return "var(--color-primary-500)";
      case "social":
        return "var(--color-success-500)";
      case "in_game_events":
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

  function getDifficultyColor(difficulty: string): string {
    switch (difficulty.toLowerCase()) {
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

  function getRoleIcon(role: string | undefined): string {
    if (!role) return "👤";
    
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

  let showClaimModal = false;
  let claimingSquare: any = null;
  let claimEvidence = "";

  async function handleSquareClaim(square: any) {
    if (square.isCompleted || square.text === 'FREE SPACE') return;
    
    console.log('[UI] Opening claim modal for square:', square.text);
    
    // Open the claim modal
    claimingSquare = square;
    showClaimModal = true;
  }

  async function confirmSquareClaim() {
    if (!claimingSquare) return;
    
    console.log('[UI] Claiming square via WebSocket:', claimingSquare.text);
    
    // Send claim via WebSocket
    await sessionManager.claimSquare(claimingSquare.id, claimEvidence);
    
    // Close modal and reset
    showClaimModal = false;
    claimingSquare = null;
    claimEvidence = "";
  }

  function cancelSquareClaim() {
    showClaimModal = false;
    claimingSquare = null;
    claimEvidence = "";
  }
</script>

<!-- Connection Status -->
{#if $connectionStatus !== "connected" && $currentSession}
  <div
    style="
    position: fixed;
    top: var(--space-4);
    right: var(--space-4);
    z-index: var(--z-fixed);
    padding: var(--space-2) var(--space-4);
    background: var(--color-warning-500);
    color: white;
    border-radius: var(--radius-md);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
  "
  >
    {$connectionStatus === "connecting" ? "Connecting..." : "Disconnected"}
  </div>
{/if}

<!-- Error Display -->
{#if error}
  <div
    style="
    margin-bottom: var(--space-6);
    padding: var(--space-4);
    background: var(--color-danger-50);
    border: 1px solid var(--color-danger-500);
    border-radius: var(--radius-lg);
    color: var(--color-danger-600);
  "
  >
    {error}
    <button
      style="
        float: right;
        background: none;
        border: none;
        color: var(--color-danger-600);
        cursor: pointer;
        font-size: var(--font-size-lg);
      "
      on:click={() => (error = "")}
    >
      ×
    </button>
  </div>
{/if}

<!-- Home View -->
{#if currentView === "home"}
  <div style="text-align: center; max-width: 500px; margin: 0 auto;">
    <h1
      style="
      font-size: var(--font-size-4xl);
      font-weight: var(--font-weight-bold);
      margin-bottom: var(--space-6);
      background: linear-gradient(135deg, var(--color-primary-400) 0%, var(--color-accent-500) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    "
    >
      LoL Bingo
    </h1>

    <div style="display: flex; flex-direction: column; gap: var(--space-4);">
      <Button
        variant="primary"
        size="lg"
        on:click={() => (currentView = "create")}
        style="width: 100%;"
      >
        Create Session
      </Button>

      <Button
        variant="secondary"
        size="lg"
        on:click={() => (currentView = "join")}
        style="width: 100%;"
      >
        Join Session
      </Button>
    </div>
  </div>

  <!-- Create Session View -->
{:else if currentView === "create"}
  <Card variant="glass" shadow="xl" style="max-width: 600px; margin: 0 auto;">
    <h2
      style="font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); margin-bottom: var(--space-6);"
    >
      Create New Session
    </h2>

    <div style="display: flex; flex-direction: column; gap: var(--space-4);">
      <div>
        <label
          style="
          display: block;
          font-weight: var(--font-weight-medium);
          margin-bottom: var(--space-2);
          color: var(--color-foreground);
        "
        >
          Your Name *
        </label>
        <input
          type="text"
          bind:value={createForm.gmName}
          placeholder="Enter your name"
          style="
            width: 100%;
            padding: var(--space-3);
            border: 1px solid var(--color-border);
            border-radius: var(--radius-md);
            background: var(--color-surface);
            color: var(--color-foreground);
            font-size: var(--font-size-base);
          "
        />
      </div>

      <div>
        <label
          style="
          display: block;
          font-weight: var(--font-weight-medium);
          margin-bottom: var(--space-2);
          color: var(--color-foreground);
        "
        >
          Session Name *
        </label>
        <input
          type="text"
          bind:value={createForm.sessionName}
          placeholder="Enter session name"
          style="
            width: 100%;
            padding: var(--space-3);
            border: 1px solid var(--color-border);
            border-radius: var(--radius-md);
            background: var(--color-surface);
            color: var(--color-foreground);
            font-size: var(--font-size-base);
          "
        />
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4);">
        <div>
          <label
            style="
            display: block;
            font-weight: var(--font-weight-medium);
            margin-bottom: var(--space-2);
            color: var(--color-foreground);
          "
          >
            Min Players
          </label>
          <select
            bind:value={createForm.minPlayers}
            style="
              width: 100%;
              padding: var(--space-3);
              border: 1px solid var(--color-border);
              border-radius: var(--radius-md);
              background: var(--color-surface);
              color: var(--color-foreground);
              font-size: var(--font-size-base);
            "
          >
            <option value={1}>1 Player (Testing)</option>
            <option value={2}>2 Players</option>
            <option value={3}>3 Players</option>
            <option value={4}>4 Players</option>
          </select>
        </div>

        <div>
          <label
            style="
            display: block;
            font-weight: var(--font-weight-medium);
            margin-bottom: var(--space-2);
            color: var(--color-foreground);
          "
          >
            Max Players
          </label>
          <select
            bind:value={createForm.maxPlayers}
            style="
              width: 100%;
              padding: var(--space-3);
              border: 1px solid var(--color-border);
              border-radius: var(--radius-md);
              background: var(--color-surface);
              color: var(--color-foreground);
              font-size: var(--font-size-base);
            "
          >
            <option value={4}>4 Players</option>
            <option value={6}>6 Players</option>
            <option value={8}>8 Players</option>
            <option value={10}>10 Players</option>
          </select>
        </div>
      </div>

      <div style="display: flex; flex-direction: column; gap: var(--space-2);">
        <label
          style="
          display: flex;
          align-items: center;
          gap: var(--space-2);
          font-weight: var(--font-weight-medium);
          color: var(--color-foreground);
        "
        >
          <input
            type="checkbox"
            bind:checked={createForm.allowLateJoin}
            style="
              width: var(--space-4);
              height: var(--space-4);
            "
          />
          Allow players to join after game starts
        </label>

        <label
          style="
          display: flex;
          align-items: center;
          gap: var(--space-2);
          font-weight: var(--font-weight-medium);
          color: var(--color-foreground);
        "
        >
          <input
            type="checkbox"
            bind:checked={createForm.requireGMConfirmation}
            style="
              width: var(--space-4);
              height: var(--space-4);
            "
          />
          Require GM confirmation for completed squares
        </label>
      </div>

      <div
        style="display: flex; gap: var(--space-3); margin-top: var(--space-4);"
      >
        <Button variant="secondary" on:click={() => (currentView = "home")}>
          Back
        </Button>
        <Button
          variant="primary"
          {loading}
          on:click={createSession}
          style="flex: 1;"
        >
          Create Session
        </Button>
      </div>
    </div>
  </Card>

  <!-- Join Session View -->
{:else if currentView === "join"}
  <Card variant="glass" shadow="xl" style="max-width: 500px; margin: 0 auto;">
    <h2
      style="font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); margin-bottom: var(--space-6);"
    >
      Join Session
    </h2>

    <div style="display: flex; flex-direction: column; gap: var(--space-4);">
      <div>
        <label
          style="
          display: block;
          font-weight: var(--font-weight-medium);
          margin-bottom: var(--space-2);
          color: var(--color-foreground);
        "
        >
          Session Code *
        </label>
        <input
          type="text"
          bind:value={joinForm.code}
          placeholder="Enter 6-character code"
          maxlength="6"
          style="
            width: 100%;
            padding: var(--space-3);
            border: 1px solid var(--color-border);
            border-radius: var(--radius-md);
            background: var(--color-surface);
            color: var(--color-foreground);
            font-size: var(--font-size-lg);
            text-align: center;
            text-transform: uppercase;
            letter-spacing: 0.1em;
          "
        />
      </div>

      <div>
        <label
          style="
          display: block;
          font-weight: var(--font-weight-medium);
          margin-bottom: var(--space-2);
          color: var(--color-foreground);
        "
        >
          Your Name *
        </label>
        <input
          type="text"
          bind:value={joinForm.playerName}
          placeholder="Enter your name"
          style="
            width: 100%;
            padding: var(--space-3);
            border: 1px solid var(--color-border);
            border-radius: var(--radius-md);
            background: var(--color-surface);
            color: var(--color-foreground);
            font-size: var(--font-size-base);
          "
        />
      </div>

      <div>
        <label
          style="
          display: block;
          font-weight: var(--font-weight-medium);
          margin-bottom: var(--space-2);
          color: var(--color-foreground);
        "
        >
          Preferred Role
        </label>
        <select
          bind:value={joinForm.role}
          style="
            width: 100%;
            padding: var(--space-3);
            border: 1px solid var(--color-border);
            border-radius: var(--radius-md);
            background: var(--color-surface);
            color: var(--color-foreground);
            font-size: var(--font-size-base);
          "
        >
          {#each Object.values(Role) as role}
            <option value={role}>{getRoleDisplayName(role)}</option>
          {/each}
        </select>
      </div>

      <div
        style="display: flex; gap: var(--space-3); margin-top: var(--space-4);"
      >
        <Button variant="secondary" on:click={() => (currentView = "home")}>
          Back
        </Button>
        <Button
          variant="primary"
          {loading}
          on:click={joinSession}
          style="flex: 1;"
        >
          Join Session
        </Button>
      </div>
    </div>
  </Card>

  <!-- Session Lobby -->
{:else if currentView === "lobby" && $currentSession}
  <Card
    variant="gradient"
    shadow="xl"
    style="max-width: 800px; margin: 0 auto;"
  >
    <div
      style="display: flex; justify-content: between; align-items: center; margin-bottom: var(--space-6);"
    >
      <div>
        <h2
          style="font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); margin-bottom: var(--space-2);"
        >
          {$currentSession.name}
        </h2>
        <div style="display: flex; align-items: center; gap: var(--space-4);">
          <Badge variant="primary" size="lg">
            Code: {$currentSession.code}
          </Badge>
          <Badge variant="glass">
            {$sessionPlayers.length}/{$currentSession.maxPlayers} Players
          </Badge>
        </div>
      </div>
      <Button variant="danger" size="sm" on:click={leaveSession}>Leave</Button>
    </div>

    <!-- Players List -->
    <div style="margin-bottom: var(--space-6);">
      <h3
        style="font-size: var(--font-size-lg); font-weight: var(--font-weight-semibold); margin-bottom: var(--space-4);"
      >
        Players
      </h3>
      <div style="display: grid; gap: var(--space-3);">
        {#each $sessionPlayers as player}
          <div
            style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: var(--space-3);
            background: var(--glass-bg);
            border: 1px solid var(--glass-border);
            border-radius: var(--radius-lg);
            backdrop-filter: var(--backdrop-blur-md);
          "
          >
            <div
              style="display: flex; align-items: center; gap: var(--space-3);"
            >
              <div>
                <div style="font-weight: var(--font-weight-medium);">
                  {player.name || "No Name"}
                  {#if player.isGM}
                    <Badge variant="accent" size="sm">GM</Badge>
                  {/if}
                </div>
                <div
                  style="font-size: var(--font-size-sm); color: var(--color-muted-foreground);"
                >
                  {getRoleDisplayName(player.role)} ({player.role || "undefined"})
                </div>
                {#if import.meta.env.DEV}
                  <div style="font-size: var(--font-size-xs); color: var(--color-muted-foreground); opacity: 0.7;">
                    Debug: ID={player.id}, Role={player.role}
                  </div>
                {/if}
              </div>
            </div>
            <div
              style="display: flex; align-items: center; gap: var(--space-2);"
            >
              <Badge variant={player.isReady ? "success" : "warning"} size="sm">
                {player.isReady ? "Ready" : "Not Ready"}
              </Badge>
              <div
                style="
                width: var(--space-2);
                height: var(--space-2);
                border-radius: var(--radius-full);
                background: {player.connectionStatus === 'connected'
                  ? 'var(--color-success-500)'
                  : 'var(--color-neutral-400)'};
              "
              ></div>
            </div>
          </div>
        {/each}
      </div>
    </div>

    <!-- Actions -->
    <div
      style="display: flex; justify-content: space-between; align-items: center;"
    >
      <div>
        {#if myPlayer && !myPlayer.isGM}
          <Button
            variant={myPlayer.isReady ? "secondary" : "primary"}
            on:click={toggleReady}
          >
            {myPlayer.isReady ? "Not Ready" : "Ready"}
          </Button>
        {/if}
      </div>

      {#if $isGM}
        <Button
          variant="accent"
          size="lg"
          disabled={!$canStartGame || loading}
          {loading}
          on:click={moveToCategories}
        >
          Next: Choose Categories
        </Button>
      {/if}
    </div>
  </Card>

  <!-- Category Selection -->
{:else if currentView === "categories" && $currentSession}
  <Card variant="glass" shadow="xl" style="max-width: 600px; margin: 0 auto;">
    <h2
      style="font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); margin-bottom: var(--space-6);"
    >
      Choose Your Bingo Categories
    </h2>

    <p
      style="color: var(--color-muted-foreground); margin-bottom: var(--space-6); line-height: var(--line-height-relaxed);"
    >
      Select the types of challenges you're comfortable with. Your bingo card
      will only include squares from your selected categories.
    </p>

    <div
      style="display: flex; flex-direction: column; gap: var(--space-4); margin-bottom: var(--space-8);"
    >
      {#each Object.values(Category) as category}
        <label
          style="
          display: flex;
          align-items: flex-start;
          gap: var(--space-3);
          padding: var(--space-4);
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-lg);
          cursor: pointer;
          transition: all var(--transition-normal);
        "
        >
          <input
            type="checkbox"
            bind:group={selectedCategories}
            value={category}
            style="
              width: var(--space-5);
              height: var(--space-5);
              margin-top: var(--space-1);
            "
          />
          <div>
            <div
              style="font-weight: var(--font-weight-semibold); margin-bottom: var(--space-1);"
            >
              {getCategoryDisplayName(category)}
            </div>
            <div
              style="font-size: var(--font-size-sm); color: var(--color-muted-foreground);"
            >
              {#if category === Category.PERFORMANCE}
                Skill-based challenges like getting pentakills, high CS, solo
                kills
              {:else if category === Category.SOCIAL}
                Chat interactions, teammate reactions, enemy behavior
              {:else if category === Category.IN_GAME_EVENTS}
                Baron steals, teamfights, objectives, game outcomes
              {:else if category === Category.MISSIONS}
                Time-based goals, specific achievements, conditional tasks
              {/if}
            </div>
          </div>
        </label>
      {/each}
    </div>

    <div style="display: flex; justify-content: space-between;">
      <Button variant="secondary" on:click={() => (currentView = "lobby")}>
        Back to Lobby
      </Button>
      <Button
        variant="primary"
        disabled={selectedCategories.length === 0 || loading}
        {loading}
        on:click={updateCategories}
      >
        {$isGM ? "Generate Cards & Start" : "Confirm Selection"}
      </Button>
    </div>
  </Card>

  <!-- Game Interface -->
{:else if currentView === "game" && $currentSession}
  <div style="min-height: 100vh; background: var(--color-background);">
    <!-- Game Header -->
    <header style="margin-bottom: var(--space-6);">
      <div
        class="container"
        style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: var(--space-4);"
      >
        <div style="display: flex; align-items: center; gap: var(--space-4);">
          <h1
            style="font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); margin: 0;"
          >
            {$currentSession.name}
          </h1>
          <Badge variant="success">Playing</Badge>
        </div>

        <div style="display: flex; align-items: center; gap: var(--space-4);">
          <Badge variant="primary" size="md">Code: {$currentSession.code}</Badge>
          <Badge variant="accent" size="md">
            Score: {myPlayer?.totalScore || 0}
          </Badge>
          <Button variant="danger" size="sm" on:click={leaveSession}>
            Leave Game
          </Button>
        </div>
      </div>
    </header>

    <div class="container">
      <div
        style="display: grid; grid-template-columns: 1fr auto; gap: var(--space-8); align-items: start;"
      >
        <!-- Player's Bingo Board -->
        {#if myPlayer && $currentSession.cards}
          {@const playerCard = $currentSession.cards.find(c => c.playerID === myPlayer.id)}
          <!-- Debug info -->
          <div style="margin-bottom: var(--space-4); padding: var(--space-4); background: var(--color-warning-100); border-radius: var(--radius-md);">
            <h4>Debug Info:</h4>
            <p>My Player ID: {myPlayer.id}</p>
            <p>Total Cards: {$currentSession.cards?.length || 0}</p>
            <p>Card IDs: {$currentSession.cards?.map(c => `${c.playerID}`).join(', ') || 'none'}</p>
            <p>Player Card Found: {playerCard ? 'YES' : 'NO'}</p>
            {#if playerCard}
              <p>Card ID: {playerCard.id}</p>
              <p>Squares: {playerCard.squares?.length || 0} rows</p>
            {/if}
          </div>
          {#if playerCard}
            <div>
              <Card variant="gradient" shadow="xl">
                <div
                  style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-6);"
                >
                  <h2
                    style="font-size: var(--font-size-xl); font-weight: var(--font-weight-bold); margin: 0;"
                  >
                    Your Bingo Card
                  </h2>
                  <div style="display: flex; gap: var(--space-2);">
                    <Badge variant="glass" size="sm">{getRoleDisplayName(myPlayer.role)}</Badge>
                    <Badge variant="accent" size="sm">
                      {playerCard.completedPatterns.length} Patterns
                    </Badge>
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
                  {#each playerCard.squares as row, rowIndex}
                    {#each row as square, colIndex}
                      <div
                        style="
                          aspect-ratio: 1;
                          background: {square.isCompleted
                            ? getCategoryColor(square.category)
                            : 'var(--color-surface)'};
                          border: 2px solid {square.isCompleted
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
                          color: {square.isCompleted
                            ? 'white'
                            : 'var(--color-foreground)'};
                          transition: all var(--transition-normal);
                          cursor: {square.isCompleted || square.text === 'FREE SPACE'
                            ? 'default'
                            : 'pointer'};
                          position: relative;
                          overflow: hidden;
                        "
                        on:click={() => handleSquareClaim(square)}
                        on:keydown={(e) =>
                          e.key === "Enter" && handleSquareClaim(square)}
                        role="button"
                        tabindex="0"
                      >
                        <!-- Difficulty indicator -->
                        {#if square.text !== 'FREE SPACE'}
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
                        {#if square.text !== 'FREE SPACE' && square.points > 0}
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
                        {#if square.isCompleted}
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
                  {/each}
                </div>

                <!-- Legend -->
                <div
                  style="display: flex; justify-content: space-between; align-items: center; gap: var(--space-4); flex-wrap: wrap;"
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
          {/if}
        {/if}

        <!-- Game Sidebar -->
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
              {#each $sessionPlayers.sort((a, b) => b.totalScore - a.totalScore) as player, index}
                <div
                  style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: var(--space-3);
                    background: {player.id === myPlayer?.id
                      ? 'var(--color-primary-500)'
                      : 'var(--glass-bg)'};
                    color: {player.id === myPlayer?.id
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
                    {#if player.isGM}
                      <Badge variant="accent" size="xs">GM</Badge>
                    {/if}
                  </div>
                  <div style="text-align: right;">
                    <div style="font-weight: var(--font-weight-bold);">
                      {player.totalScore}pt
                    </div>
                    <div style="font-size: var(--font-size-xs); opacity: 0.8;">
                      {$currentSession.cards?.find(c => c.playerID === player.id)?.completedPatterns.length || 0} patterns
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

          <!-- GM: Pending Claims -->
          {#if $isGM && $currentSession?.settings?.requireGMConfirmation}
            <Card variant="accent" shadow="md">
              <h3
                style="font-size: var(--font-size-lg); font-weight: var(--font-weight-semibold); margin-bottom: var(--space-4);"
              >
                Pending Claims (GM)
              </h3>
              <div
                style="display: flex; flex-direction: column; gap: var(--space-3);"
              >
                {#if $currentSession.pendingClaims && $currentSession.pendingClaims.length > 0}
                  {#each $currentSession.pendingClaims as claim}
                    <div
                      style="
                        padding: var(--space-3);
                        background: var(--glass-bg);
                        border: 1px solid var(--glass-border);
                        border-radius: var(--radius-md);
                      "
                    >
                      <div style="font-weight: var(--font-weight-medium); margin-bottom: var(--space-1);">
                        {claim.playerName} - "{claim.squareText}"
                      </div>
                      {#if claim.evidence}
                        <div style="font-size: var(--font-size-sm); color: var(--color-muted-foreground); margin-bottom: var(--space-2);">
                          Evidence: {claim.evidence}
                        </div>
                      {/if}
                      <div style="display: flex; gap: var(--space-2); margin-top: var(--space-2);">
                        <Button 
                          variant="success" 
                          size="sm"
                          on:click={() => sessionManager.confirmSquare(claim.playerId, claim.squareId)}
                        >
                          Approve
                        </Button>
                        <Button 
                          variant="danger" 
                          size="sm"
                          on:click={() => sessionManager.rejectSquare(claim.playerId, claim.squareId)}
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  {/each}
                {:else}
                  <div style="font-size: var(--font-size-sm); color: var(--color-muted-foreground);">
                    No pending claims
                  </div>
                {/if}
              </div>
            </Card>
          {/if}

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
                Game started with {$sessionPlayers.length} players
              </div>
              <div
                style="font-size: var(--font-size-sm); color: var(--color-muted-foreground);"
              >
                Cards generated successfully
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  </div>
{/if}

<!-- Square Claim Modal -->
{#if showClaimModal && claimingSquare}
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
          background: {getCategoryColor(claimingSquare.category)};
          color: white;
          border-radius: var(--radius-md);
          margin-bottom: var(--space-6);
          text-align: center;
        "
      >
        <div
          style="font-weight: var(--font-weight-semibold); margin-bottom: var(--space-2);"
        >
          "{claimingSquare.text}"
        </div>
        <div
          style="display: flex; justify-content: center; gap: var(--space-4); font-size: var(--font-size-sm);"
        >
          <span>Category: {claimingSquare.category}</span>
          <span>Difficulty: {claimingSquare.difficulty}</span>
          <span>Points: {claimingSquare.points}</span>
        </div>
      </div>

      {#if $currentSession?.settings?.requireGMConfirmation}
        <div style="margin-bottom: var(--space-4);">
          <label
            style="
              display: block;
              font-weight: var(--font-weight-medium);
              margin-bottom: var(--space-2);
              color: var(--color-foreground);
            "
          >
            Evidence or Description (Optional)
          </label>
          <textarea
            bind:value={claimEvidence}
            placeholder="Describe how you completed this challenge..."
            style="
              width: 100%;
              padding: var(--space-3);
              border: 1px solid var(--color-border);
              border-radius: var(--radius-md);
              background: var(--color-surface);
              color: var(--color-foreground);
              font-size: var(--font-size-base);
              min-height: 100px;
              resize: vertical;
            "
          />
        </div>
      {/if}

      <p
        style="color: var(--color-muted-foreground); margin-bottom: var(--space-6); line-height: var(--line-height-relaxed);"
      >
        {#if $currentSession?.settings?.requireGMConfirmation}
          Your claim will be sent to the Game Master for verification.
        {:else}
          This square will be marked as completed immediately.
        {/if}
      </p>

      <div
        style="display: flex; gap: var(--space-3); justify-content: flex-end;"
      >
        <Button variant="secondary" on:click={cancelSquareClaim}>Cancel</Button>
        <Button variant="primary" on:click={confirmSquareClaim}>
          {#if $connectionStatus !== "connected"}
            No Connection
          {:else}
            Claim Square
          {/if}
        </Button>
      </div>
    </Card>
  </div>
{/if}
