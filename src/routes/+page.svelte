<script lang="ts">
  import Button from "$lib/components/Button.svelte";
  import Card from "$lib/components/Card.svelte";
  import Badge from "$lib/components/Badge.svelte";

  let currentView: "overview" | "concept" | "architecture" = "overview";

  const features = [
    {
      title: "Session Management",
      description:
        "Create and join multiplayer sessions with real-time synchronization",
      status: "complete",
      icon: "🎮",
    },
    {
      title: "Role-Based Cards",
      description:
        "Customized bingo cards based on player roles and preferences",
      status: "in-progress",
      icon: "🎯",
    },
    {
      title: "Real-time Updates",
      description: "WebSocket integration for live game state synchronization",
      status: "complete",
      icon: "⚡",
    },
    {
      title: "GM Verification",
      description: "Game master can verify and approve completed squares",
      status: "planned",
      icon: "✅",
    },
    {
      title: "Pattern Detection",
      description:
        "Automatic detection of completed patterns with bonus scoring",
      status: "planned",
      icon: "🏆",
    },
    {
      title: "Statistics & History",
      description: "Game statistics and historical data tracking",
      status: "planned",
      icon: "📊",
    },
  ];

  const conceptSquares = [
    "Get First Blood",
    "Land 3+ Person Ultimate",
    "Enemy Types 'jg diff'",
    "Flash Into Wall",
    "Ace Before 15min",
    "Someone Claims Lag",
    "Steal Baron/Dragon",
    "Die to Tower Solo",
    "Win 1v2 Fight",
    "Perfect Game (0 Deaths)",
    "Enemy Rage Quits",
    "Save Ally <10% HP",
    "10 CS/min at 20min",
    "Execute to Jungle",
    "Get Pentakill",
    "Team Aced at Baron",
    "Solo Kill Pre-6",
    "Reverse Sweep Fight",
    "20min Surrender",
    "Wrong Item Build",
    "Ping Spam Teammates",
    "Baron Power Play",
    "Jungle Invade Success",
    "Build Completely Wrong",
    "Elder Dragon Secured",
  ];

  function getStatusColor(status: string) {
    switch (status) {
      case "complete":
        return "success";
      case "in-progress":
        return "warning";
      case "planned":
        return "accent";
      default:
        return "default";
    }
  }

  function getStatusText(status: string) {
    switch (status) {
      case "complete":
        return "Complete";
      case "in-progress":
        return "In Progress";
      case "planned":
        return "Planned";
      default:
        return "Unknown";
    }
  }
</script>

<svelte:head>
  <title>Bingo Game - Modern Multiplayer Experience</title>
  <meta
    name="description"
    content="Professional multiplayer bingo game with real-time synchronization and modern design"
  />
</svelte:head>

<main
  class="container"
  style="padding: var(--space-8); display: flex; flex-direction: column; gap: var(--space-12); min-height: 100vh;"
>
  <!-- Hero Section -->
  <section
    class="animate-fade-in-up"
    style="text-align: center; padding: var(--space-16) 0;"
  >
    <h1
      style="
      font-size: var(--font-size-6xl); 
      font-weight: var(--font-weight-black); 
      line-height: var(--line-height-tight);
      background: linear-gradient(135deg, var(--color-primary-400) 0%, var(--color-accent-500) 50%, var(--color-warning-500) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: var(--space-6);
    "
    >
      Modern Bingo Game
    </h1>

    <p
      style="
      font-size: var(--font-size-xl); 
      color: var(--color-muted-foreground);
      max-width: 700px;
      margin: 0 auto var(--space-8);
      line-height: var(--line-height-relaxed);
    "
    >
      A professional multiplayer bingo experience with real-time
      synchronization, modern design, and extensible architecture built for
      competitive gaming communities.
    </p>

    <div
      style="display: flex; gap: var(--space-4); justify-content: center; flex-wrap: wrap;"
    >
      <Button variant="primary" size="lg">
        <a href="/app" style="text-decoration: none; color: inherit;"
          >Launch Application</a
        >
      </Button>
      <Button variant="glass" size="lg">
        <a href="/bingo" style="text-decoration: none; color: inherit;"
          >View Bingo Board</a
        >
      </Button>
      <Button variant="accent" size="lg">
        <a href="/test" style="text-decoration: none; color: inherit;"
          >Design System</a
        >
      </Button>
    </div>
  </section>

  <!-- Navigation Tabs -->
  <section
    style="display: flex; justify-content: center; margin-bottom: var(--space-8);"
  >
    <div
      style="display: flex; gap: var(--space-2); padding: var(--space-2); background: var(--glass-bg); border-radius: var(--radius-xl); backdrop-filter: var(--backdrop-blur-md);"
    >
      <button
        style="
          padding: var(--space-3) var(--space-6);
          border-radius: var(--radius-lg);
          background: {currentView === 'overview'
          ? 'var(--color-primary-500)'
          : 'transparent'};
          color: {currentView === 'overview'
          ? 'white'
          : 'var(--color-muted-foreground)'};
          border: none;
          cursor: pointer;
          font-weight: var(--font-weight-medium);
          transition: all var(--transition-normal);
        "
        on:click={() => (currentView = "overview")}
      >
        Project Overview
      </button>
      <button
        style="
          padding: var(--space-3) var(--space-6);
          border-radius: var(--radius-lg);
          background: {currentView === 'concept'
          ? 'var(--color-primary-500)'
          : 'transparent'};
          color: {currentView === 'concept'
          ? 'white'
          : 'var(--color-muted-foreground)'};
          border: none;
          cursor: pointer;
          font-weight: var(--font-weight-medium);
          transition: all var(--transition-normal);
        "
        on:click={() => (currentView = "concept")}
      >
        Game Concept
      </button>
      <button
        style="
          padding: var(--space-3) var(--space-6);
          border-radius: var(--radius-lg);
          background: {currentView === 'architecture'
          ? 'var(--color-primary-500)'
          : 'transparent'};
          color: {currentView === 'architecture'
          ? 'white'
          : 'var(--color-muted-foreground)'};
          border: none;
          cursor: pointer;
          font-weight: var(--font-weight-medium);
          transition: all var(--transition-normal);
        "
        on:click={() => (currentView = "architecture")}
      >
        Architecture
      </button>
    </div>
  </section>

  <!-- Content Sections -->
  {#if currentView === "overview"}
    <!-- Project Overview -->
    <section
      style="display: grid; gap: var(--space-8); grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));"
    >
      <Card variant="glass" shadow="xl" animated>
        <h3
          style="font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); margin-bottom: var(--space-4);"
        >
          🎯 Project Goals
        </h3>
        <div
          style="display: flex; flex-direction: column; gap: var(--space-4);"
        >
          <div
            style="padding: var(--space-4); background: var(--glass-bg); border-radius: var(--radius-lg);"
          >
            <h4
              style="font-weight: var(--font-weight-semibold); margin-bottom: var(--space-2);"
            >
              Professional Quality
            </h4>
            <p
              style="color: var(--color-muted-foreground); font-size: var(--font-size-sm);"
            >
              Production-ready code with proper architecture, type safety, and
              extensibility
            </p>
          </div>
          <div
            style="padding: var(--space-4); background: var(--glass-bg); border-radius: var(--radius-lg);"
          >
            <h4
              style="font-weight: var(--font-weight-semibold); margin-bottom: var(--space-2);"
            >
              Modern Technology
            </h4>
            <p
              style="color: var(--color-muted-foreground); font-size: var(--font-size-sm);"
            >
              Built with Deno 2, SvelteKit, TypeScript, and modern web standards
            </p>
          </div>
          <div
            style="padding: var(--space-4); background: var(--glass-bg); border-radius: var(--radius-lg);"
          >
            <h4
              style="font-weight: var(--font-weight-semibold); margin-bottom: var(--space-2);"
            >
              Extensible Design
            </h4>
            <p
              style="color: var(--color-muted-foreground); font-size: var(--font-size-sm);"
            >
              Modular architecture that can be adapted for different gaming
              communities
            </p>
          </div>
        </div>
      </Card>

      <Card variant="gradient" shadow="xl" animated>
        <h3
          style="font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); margin-bottom: var(--space-4);"
        >
          ⚡ Technical Features
        </h3>
        <div
          style="display: flex; flex-direction: column; gap: var(--space-3);"
        >
          <div style="display: flex; align-items: center; gap: var(--space-3);">
            <div
              style="width: var(--space-3); height: var(--space-3); border-radius: var(--radius-full); background: var(--color-success-500);"
            ></div>
            <span>Real-time WebSocket Communication</span>
          </div>
          <div style="display: flex; align-items: center; gap: var(--space-3);">
            <div
              style="width: var(--space-3); height: var(--space-3); border-radius: var(--radius-full); background: var(--color-success-500);"
            ></div>
            <span>Type-Safe TypeScript Architecture</span>
          </div>
          <div style="display: flex; align-items: center; gap: var(--space-3);">
            <div
              style="width: var(--space-3); height: var(--space-3); border-radius: var(--radius-full); background: var(--color-success-500);"
            ></div>
            <span>Responsive Modern Design System</span>
          </div>
          <div style="display: flex; align-items: center; gap: var(--space-3);">
            <div
              style="width: var(--space-3); height: var(--space-3); border-radius: var(--radius-full); background: var(--color-success-500);"
            ></div>
            <span>Svelte Reactive State Management</span>
          </div>
          <div style="display: flex; align-items: center; gap: var(--space-3);">
            <div
              style="width: var(--space-3); height: var(--space-3); border-radius: var(--radius-full); background: var(--color-warning-500);"
            ></div>
            <span>Modular Component Architecture</span>
          </div>
          <div style="display: flex; align-items: center; gap: var(--space-3);">
            <div
              style="width: var(--space-3); height: var(--space-3); border-radius: var(--radius-full); background: var(--color-accent-500);"
            ></div>
            <span>CSS Variables Design System</span>
          </div>
        </div>
      </Card>
    </section>

    <!-- Feature Roadmap -->
    <section>
      <h2
        style="font-size: var(--font-size-3xl); font-weight: var(--font-weight-bold); margin-bottom: var(--space-8); text-align: center;"
      >
        Feature Roadmap
      </h2>
      <div
        style="display: grid; gap: var(--space-6); grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));"
      >
        {#each features as feature}
          <Card variant="default" shadow="md" animated>
            <div
              style="display: flex; align-items: flex-start; gap: var(--space-4);"
            >
              <div style="font-size: var(--font-size-2xl);">{feature.icon}</div>
              <div style="flex: 1;">
                <div
                  style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-2);"
                >
                  <h4
                    style="font-size: var(--font-size-lg); font-weight: var(--font-weight-semibold);"
                  >
                    {feature.title}
                  </h4>
                  <Badge variant={getStatusColor(feature.status)} size="sm">
                    {getStatusText(feature.status)}
                  </Badge>
                </div>
                <p
                  style="color: var(--color-muted-foreground); line-height: var(--line-height-relaxed);"
                >
                  {feature.description}
                </p>
              </div>
            </div>
          </Card>
        {/each}
      </div>
    </section>
  {:else if currentView === "concept"}
    <!-- Game Concept -->
    <section>
      <div
        style="max-width: 800px; margin: 0 auto; margin-bottom: var(--space-12);"
      >
        <Card variant="glass" shadow="xl">
          <h2
            style="font-size: var(--font-size-3xl); font-weight: var(--font-weight-bold); margin-bottom: var(--space-6); text-align: center;"
          >
            Game Concept Overview
          </h2>
          <div
            style="display: flex; flex-direction: column; gap: var(--space-6);"
          >
            <div>
              <h3
                style="font-size: var(--font-size-xl); font-weight: var(--font-weight-semibold); margin-bottom: var(--space-3);"
              >
                Core Mechanics
              </h3>
              <ul
                style="list-style: none; padding: 0; display: flex; flex-direction: column; gap: var(--space-2);"
              >
                <li
                  style="display: flex; align-items: center; gap: var(--space-2);"
                >
                  <span style="color: var(--color-primary-500);">•</span>
                  Each player gets a unique 5x5 bingo card with different challenges
                </li>
                <li
                  style="display: flex; align-items: center; gap: var(--space-2);"
                >
                  <span style="color: var(--color-primary-500);">•</span>
                  First to complete a line becomes the shot-caller/team captain
                </li>
                <li
                  style="display: flex; align-items: center; gap: var(--space-2);"
                >
                  <span style="color: var(--color-primary-500);">•</span>
                  Mix of individual achievements and team-wide events
                </li>
                <li
                  style="display: flex; align-items: center; gap: var(--space-2);"
                >
                  <span style="color: var(--color-primary-500);">•</span>
                  GM verification system for completed challenges
                </li>
              </ul>
            </div>

            <div>
              <h3
                style="font-size: var(--font-size-xl); font-weight: var(--font-weight-semibold); margin-bottom: var(--space-3);"
              >
                Challenge Categories
              </h3>
              <div
                style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--space-4);"
              >
                <div
                  style="padding: var(--space-4); background: var(--glass-bg); border-radius: var(--radius-lg);"
                >
                  <h4
                    style="font-weight: var(--font-weight-semibold); margin-bottom: var(--space-2); color: var(--color-primary-500);"
                  >
                    Performance
                  </h4>
                  <p
                    style="font-size: var(--font-size-sm); color: var(--color-muted-foreground);"
                  >
                    Skill-based challenges like pentakills, CS goals, solo kills
                  </p>
                </div>
                <div
                  style="padding: var(--space-4); background: var(--glass-bg); border-radius: var(--radius-lg);"
                >
                  <h4
                    style="font-weight: var(--font-weight-semibold); margin-bottom: var(--space-2); color: var(--color-success-500);"
                  >
                    Social
                  </h4>
                  <p
                    style="font-size: var(--font-size-sm); color: var(--color-muted-foreground);"
                  >
                    Chat interactions, teammate reactions, community moments
                  </p>
                </div>
                <div
                  style="padding: var(--space-4); background: var(--glass-bg); border-radius: var(--radius-lg);"
                >
                  <h4
                    style="font-weight: var(--font-weight-semibold); margin-bottom: var(--space-2); color: var(--color-accent-500);"
                  >
                    Events
                  </h4>
                  <p
                    style="font-size: var(--font-size-sm); color: var(--color-muted-foreground);"
                  >
                    Game events like Baron steals, teamfights, objectives
                  </p>
                </div>
                <div
                  style="padding: var(--space-4); background: var(--glass-bg); border-radius: var(--radius-lg);"
                >
                  <h4
                    style="font-weight: var(--font-weight-semibold); margin-bottom: var(--space-2); color: var(--color-warning-500);"
                  >
                    Missions
                  </h4>
                  <p
                    style="font-size: var(--font-size-sm); color: var(--color-muted-foreground);"
                  >
                    Time-based goals, conditional tasks, special achievements
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <!-- Sample Bingo Board -->
      <div>
        <h2
          style="font-size: var(--font-size-3xl); font-weight: var(--font-weight-bold); margin-bottom: var(--space-8); text-align: center;"
        >
          Sample Bingo Board
        </h2>
        <Card
          variant="gradient"
          shadow="xl"
          style="max-width: 600px; margin: 0 auto;"
        >
          <div
            style="display: grid; grid-template-columns: repeat(5, 1fr); gap: var(--space-2);"
          >
            {#each conceptSquares as square, i}
              <div
                style="
                  aspect-ratio: 1;
                  background: {i === 12
                  ? 'var(--color-warning-500)'
                  : 'var(--glass-bg)'};
                  border: 1px solid var(--glass-border);
                  border-radius: var(--radius-md);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  padding: var(--space-1);
                  font-size: var(--font-size-xs);
                  font-weight: var(--font-weight-medium);
                  text-align: center;
                  line-height: 1.2;
                  backdrop-filter: var(--backdrop-blur-sm);
                  color: {i === 12 ? 'white' : 'var(--color-foreground)'};
                  transition: all var(--transition-normal);
                  cursor: pointer;
                "
                on:mouseenter={(e) => {
                  if (i !== 12) {
                    e.target.style.background = "var(--color-primary-500)";
                    e.target.style.color = "white";
                    e.target.style.transform = "scale(1.05)";
                  }
                }}
                on:mouseleave={(e) => {
                  if (i !== 12) {
                    e.target.style.background = "var(--glass-bg)";
                    e.target.style.color = "var(--color-foreground)";
                    e.target.style.transform = "scale(1)";
                  }
                }}
                role="button"
                tabindex="0"
              >
                {i === 12 ? "FREE" : square}
              </div>
            {/each}
          </div>
          <div style="margin-top: var(--space-6); text-align: center;">
            <p
              style="color: var(--color-muted-foreground); font-size: var(--font-size-sm);"
            >
              Interactive preview - hover over squares to see selection state
            </p>
          </div>
        </Card>
      </div>
    </section>
  {:else if currentView === "architecture"}
    <!-- Architecture Overview -->
    <section
      style="display: grid; gap: var(--space-8); grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));"
    >
      <Card variant="neon" shadow="xl" animated>
        <h3
          style="font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); margin-bottom: var(--space-4); color: var(--color-primary-400);"
        >
          Technology Stack
        </h3>
        <div
          style="display: flex; flex-direction: column; gap: var(--space-4);"
        >
          <div
            style="display: flex; justify-content: space-between; align-items: center; padding: var(--space-3); background: rgba(16, 185, 129, 0.1); border: 1px solid var(--color-success-500); border-radius: var(--radius-lg);"
          >
            <span style="font-weight: var(--font-weight-medium);"
              >🦕 Deno 2 Runtime</span
            >
            <Badge variant="success" glow size="sm">Active</Badge>
          </div>
          <div
            style="display: flex; justify-content: space-between; align-items: center; padding: var(--space-3); background: rgba(16, 185, 129, 0.1); border: 1px solid var(--color-success-500); border-radius: var(--radius-lg);"
          >
            <span style="font-weight: var(--font-weight-medium);"
              >🚀 SvelteKit Framework</span
            >
            <Badge variant="success" glow size="sm">Ready</Badge>
          </div>
          <div
            style="display: flex; justify-content: space-between; align-items: center; padding: var(--space-3); background: rgba(16, 185, 129, 0.1); border: 1px solid var(--color-success-500); border-radius: var(--radius-lg);"
          >
            <span style="font-weight: var(--font-weight-medium);"
              >📘 TypeScript</span
            >
            <Badge variant="success" glow size="sm">Complete</Badge>
          </div>
          <div
            style="display: flex; justify-content: space-between; align-items: center; padding: var(--space-3); background: rgba(16, 185, 129, 0.1); border: 1px solid var(--color-success-500); border-radius: var(--radius-lg);"
          >
            <span style="font-weight: var(--font-weight-medium);"
              >⚡ WebSocket Real-time</span
            >
            <Badge variant="neon" glow size="sm" animated>Live</Badge>
          </div>
        </div>
      </Card>

      <Card variant="default" shadow="lg" animated>
        <h3
          style="font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); margin-bottom: var(--space-4);"
        >
          System Architecture
        </h3>
        <div
          style="display: flex; flex-direction: column; gap: var(--space-4);"
        >
          <div
            style="padding: var(--space-4); background: var(--glass-bg); border-radius: var(--radius-lg);"
          >
            <h4
              style="font-weight: var(--font-weight-semibold); margin-bottom: var(--space-2);"
            >
              Frontend Layer
            </h4>
            <p
              style="color: var(--color-muted-foreground); font-size: var(--font-size-sm);"
            >
              SvelteKit with reactive stores, TypeScript interfaces, and modern
              CSS
            </p>
          </div>
          <div
            style="padding: var(--space-4); background: var(--glass-bg); border-radius: var(--radius-lg);"
          >
            <h4
              style="font-weight: var(--font-weight-semibold); margin-bottom: var(--space-2);"
            >
              Real-time Layer
            </h4>
            <p
              style="color: var(--color-muted-foreground); font-size: var(--font-size-sm);"
            >
              WebSocket connections for live session and game state
              synchronization
            </p>
          </div>
          <div
            style="padding: var(--space-4); background: var(--glass-bg); border-radius: var(--radius-lg);"
          >
            <h4
              style="font-weight: var(--font-weight-semibold); margin-bottom: var(--space-2);"
            >
              Data Layer
            </h4>
            <p
              style="color: var(--color-muted-foreground); font-size: var(--font-size-sm);"
            >
              Planned: Database integration for sessions, cards, and statistics
            </p>
          </div>
        </div>
      </Card>
    </section>
  {/if}

  <!-- Call to Action -->
  <section style="text-align: center; padding: var(--space-16) 0;">
    <Card
      variant="gradient"
      shadow="xl"
      style="max-width: 600px; margin: 0 auto;"
    >
      <h2
        style="font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); margin-bottom: var(--space-4);"
      >
        Ready to Experience the Future of Bingo?
      </h2>
      <p
        style="color: var(--color-muted-foreground); margin-bottom: var(--space-8); line-height: var(--line-height-relaxed);"
      >
        Explore our modern design system, view the interactive bingo board
        prototype, or dive into the application itself.
      </p>
      <div
        style="display: flex; gap: var(--space-4); justify-content: center; flex-wrap: wrap;"
      >
        <Button variant="primary" size="lg">
          <a href="/app" style="text-decoration: none; color: inherit;"
            >Launch App</a
          >
        </Button>
        <Button variant="glass" size="lg">
          <a href="/bingo" style="text-decoration: none; color: inherit;"
            >View Bingo Board</a
          >
        </Button>
      </div>
    </Card>
  </section>
</main>
