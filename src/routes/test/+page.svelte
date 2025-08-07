<script lang="ts">
  import Button from "$lib/components/Button.svelte";
  import Card from "$lib/components/Card.svelte";
  import Badge from "$lib/components/Badge.svelte";

  let currentSection = "typography";

  const sections = [
    { id: "typography", label: "Typography" },
    { id: "colors", label: "Colors" },
    { id: "spacing", label: "Spacing" },
    { id: "components", label: "Components" },
    { id: "layout", label: "Layout" },
    { id: "effects", label: "Effects" },
    { id: "responsiveness", label: "Responsive" },
  ];

  const colorGroups = [
    {
      name: "Primary Colors",
      colors: [
        { name: "Primary 400", var: "--color-primary-400" },
        { name: "Primary 500", var: "--color-primary-500" },
        { name: "Primary 600", var: "--color-primary-600" },
        { name: "Primary 700", var: "--color-primary-700" },
      ],
    },
    {
      name: "Accent Colors",
      colors: [
        { name: "Accent 400", var: "--color-accent-400" },
        { name: "Accent 500", var: "--color-accent-500" },
        { name: "Accent 600", var: "--color-accent-600" },
        { name: "Accent 700", var: "--color-accent-700" },
      ],
    },
    {
      name: "Status Colors",
      colors: [
        { name: "Success 500", var: "--color-success-500" },
        { name: "Warning 500", var: "--color-warning-500" },
        { name: "Danger 500", var: "--color-danger-500" },
      ],
    },
    {
      name: "Neutral Colors",
      colors: [
        { name: "Neutral 100", var: "--color-neutral-100" },
        { name: "Neutral 400", var: "--color-neutral-400" },
        { name: "Neutral 600", var: "--color-neutral-600" },
        { name: "Neutral 800", var: "--color-neutral-800" },
      ],
    },
  ];

  const spacingSizes = [
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "8",
    "10",
    "12",
    "16",
    "20",
  ];

  function scrollToSection(sectionId: string) {
    currentSection = sectionId;
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
  }
</script>

<svelte:head>
  <title>Design System Test Page</title>
  <meta
    name="description"
    content="Comprehensive design system testing and documentation"
  />
</svelte:head>

<div class="test-page">
  <!-- Navigation -->
  <nav
    style="
    position: sticky;
    top: 0;
    background: var(--color-surface);
    border-bottom: 1px solid var(--color-border);
    z-index: var(--z-sticky);
    padding: var(--space-4) 0;
    backdrop-filter: var(--backdrop-blur-md);
  "
  >
    <div
      class="container"
      style="
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: var(--space-6);
      flex-wrap: wrap;
    "
    >
      <h1
        style="
        font-size: var(--font-size-2xl);
        font-weight: var(--font-weight-bold);
        margin: 0;
        background: linear-gradient(135deg, var(--color-primary-500) 0%, var(--color-accent-500) 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      "
      >
        Design System
      </h1>

      <div style="display: flex; gap: var(--space-2); flex-wrap: wrap;">
        {#each sections as section}
          <button
            style="
              padding: var(--space-2) var(--space-4);
              border-radius: var(--radius-md);
              background: {currentSection === section.id
              ? 'var(--color-primary-500)'
              : 'transparent'};
              color: {currentSection === section.id
              ? 'white'
              : 'var(--color-muted-foreground)'};
              border: 1px solid {currentSection === section.id
              ? 'var(--color-primary-500)'
              : 'var(--color-border)'};
              transition: all var(--transition-normal);
              cursor: pointer;
              font-size: var(--font-size-sm);
              font-weight: var(--font-weight-medium);
            "
            on:click={() => scrollToSection(section.id)}
          >
            {section.label}
          </button>
        {/each}
      </div>
    </div>
  </nav>

  <!-- Typography Section -->
  <section id="typography" style="padding: var(--space-16) 0;">
    <div class="container">
      <h2
        style="
        font-size: var(--font-size-3xl);
        font-weight: var(--font-weight-bold);
        margin-bottom: var(--space-12);
        color: var(--color-foreground);
      "
      >
        Typography System
      </h2>

      <div
        style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: var(--space-12);"
      >
        <div>
          <h3
            style="font-size: var(--font-size-lg); font-weight: var(--font-weight-semibold); margin-bottom: var(--space-6); color: var(--color-muted-foreground);"
          >
            Headings
          </h3>
          <div
            style="display: flex; flex-direction: column; gap: var(--space-4);"
          >
            <h1 style="margin: 0;">Heading 1 - Display</h1>
            <h2 style="margin: 0;">Heading 2 - Section</h2>
            <h3 style="margin: 0;">Heading 3 - Subsection</h3>
            <h4 style="margin: 0;">Heading 4 - Component</h4>
            <h5 style="margin: 0;">Heading 5 - Small</h5>
            <h6 style="margin: 0;">Heading 6 - Tiny</h6>
          </div>
        </div>

        <div>
          <h3
            style="font-size: var(--font-size-lg); font-weight: var(--font-weight-semibold); margin-bottom: var(--space-6); color: var(--color-muted-foreground);"
          >
            Text Samples
          </h3>
          <div
            style="display: flex; flex-direction: column; gap: var(--space-4);"
          >
            <p style="font-size: var(--font-size-xl); margin: 0;">
              Large text for important information and introductions.
            </p>
            <p style="margin: 0;">
              Regular paragraph text with optimal line height and spacing for
              comfortable reading experience.
            </p>
            <p
              style="font-size: var(--font-size-sm); margin: 0; color: var(--color-muted-foreground);"
            >
              Small text for captions, labels, and secondary information.
            </p>
            <p style="margin: 0;">
              Text with <a
                href="#"
                style="color: var(--color-primary-500); text-decoration: none; border-bottom: 1px solid currentColor;"
                >inline links</a
              > and emphasis.
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Colors Section -->
  <section
    id="colors"
    style="padding: var(--space-16) 0; background: var(--color-muted);"
  >
    <div class="container">
      <h2
        style="
        font-size: var(--font-size-3xl);
        font-weight: var(--font-weight-bold);
        margin-bottom: var(--space-12);
        color: var(--color-foreground);
      "
      >
        Color Palette
      </h2>

      <div style="display: flex; flex-direction: column; gap: var(--space-12);">
        {#each colorGroups as group}
          <div>
            <h3
              style="font-size: var(--font-size-lg); font-weight: var(--font-weight-semibold); margin-bottom: var(--space-6); color: var(--color-muted-foreground);"
            >
              {group.name}
            </h3>
            <div
              style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--space-4);"
            >
              {#each group.colors as color}
                <div
                  style="
                  border: 1px solid var(--color-border);
                  border-radius: var(--radius-lg);
                  overflow: hidden;
                  background: var(--color-surface);
                "
                >
                  <div
                    style="
                    height: 80px;
                    width: 100%;
                    background-color: var({color.var});
                  "
                  ></div>
                  <div style="padding: var(--space-4);">
                    <div
                      style="font-weight: var(--font-weight-medium); margin-bottom: var(--space-1);"
                    >
                      {color.name}
                    </div>
                    <div
                      style="
                      font-family: 'Courier New', monospace;
                      font-size: var(--font-size-sm);
                      color: var(--color-muted-foreground);
                    "
                    >
                      {color.var}
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/each}
      </div>
    </div>
  </section>

  <!-- Spacing Section -->
  <section id="spacing" style="padding: var(--space-16) 0;">
    <div class="container">
      <h2
        style="
        font-size: var(--font-size-3xl);
        font-weight: var(--font-weight-bold);
        margin-bottom: var(--space-12);
        color: var(--color-foreground);
      "
      >
        Spacing System
      </h2>

      <div
        style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: var(--space-8);"
      >
        {#each spacingSizes as size}
          <div
            style="display: flex; flex-direction: column; align-items: center; gap: var(--space-3);"
          >
            <div
              style="
              font-family: 'Courier New', monospace;
              font-size: var(--font-size-sm);
              color: var(--color-muted-foreground);
              font-weight: var(--font-weight-medium);
            "
            >
              --space-{size}
            </div>
            <div
              style="
              width: var(--space-{size});
              height: var(--space-{size});
              background: linear-gradient(135deg, var(--color-primary-500) 0%, var(--color-accent-500) 100%);
              border-radius: var(--radius-sm);
            "
            ></div>
            <div
              style="
              font-size: var(--font-size-xs);
              color: var(--color-muted-foreground);
            "
            >
              {size === "1"
                ? "0.25rem"
                : size === "2"
                  ? "0.5rem"
                  : size === "3"
                    ? "0.75rem"
                    : size === "4"
                      ? "1rem"
                      : size === "5"
                        ? "1.25rem"
                        : size === "6"
                          ? "1.5rem"
                          : size === "8"
                            ? "2rem"
                            : size === "10"
                              ? "2.5rem"
                              : size === "12"
                                ? "3rem"
                                : size === "16"
                                  ? "4rem"
                                  : "5rem"}
            </div>
          </div>
        {/each}
      </div>
    </div>
  </section>

  <!-- Components Section -->
  <section
    id="components"
    style="padding: var(--space-16) 0; background: var(--color-muted);"
  >
    <div class="container">
      <h2
        style="
        font-size: var(--font-size-3xl);
        font-weight: var(--font-weight-bold);
        margin-bottom: var(--space-12);
        color: var(--color-foreground);
      "
      >
        UI Components
      </h2>

      <div style="display: flex; flex-direction: column; gap: var(--space-16);">
        <!-- Buttons -->
        <div>
          <h3
            style="font-size: var(--font-size-xl); font-weight: var(--font-weight-semibold); margin-bottom: var(--space-8); color: var(--color-foreground);"
          >
            Buttons
          </h3>

          <div
            style="display: flex; flex-direction: column; gap: var(--space-8);"
          >
            <!-- Button Variants -->
            <div>
              <h4
                style="font-size: var(--font-size-lg); font-weight: var(--font-weight-medium); margin-bottom: var(--space-4); color: var(--color-muted-foreground);"
              >
                Variants
              </h4>
              <div style="display: flex; flex-wrap: wrap; gap: var(--space-4);">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="accent">Accent</Button>
                <Button variant="danger">Danger</Button>
                <Button variant="glass">Glass</Button>
                <Button variant="neon">Neon</Button>
              </div>
            </div>

            <!-- Button Sizes -->
            <div>
              <h4
                style="font-size: var(--font-size-lg); font-weight: var(--font-weight-medium); margin-bottom: var(--space-4); color: var(--color-muted-foreground);"
              >
                Sizes
              </h4>
              <div
                style="display: flex; flex-wrap: wrap; gap: var(--space-4); align-items: center;"
              >
                <Button variant="primary" size="sm">Small</Button>
                <Button variant="primary" size="md">Medium</Button>
                <Button variant="primary" size="lg">Large</Button>
                <Button variant="primary" size="xl">Extra Large</Button>
              </div>
            </div>

            <!-- Button States -->
            <div>
              <h4
                style="font-size: var(--font-size-lg); font-weight: var(--font-weight-medium); margin-bottom: var(--space-4); color: var(--color-muted-foreground);"
              >
                States
              </h4>
              <div style="display: flex; flex-wrap: wrap; gap: var(--space-4);">
                <Button variant="primary">Normal</Button>
                <Button variant="primary" loading>Loading</Button>
                <Button variant="primary" disabled>Disabled</Button>
              </div>
            </div>
          </div>
        </div>

        <!-- Cards -->
        <div>
          <h3
            style="font-size: var(--font-size-xl); font-weight: var(--font-weight-semibold); margin-bottom: var(--space-8); color: var(--color-foreground);"
          >
            Cards
          </h3>

          <div
            style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: var(--space-6);"
          >
            <Card variant="default">
              <h4
                style="font-size: var(--font-size-lg); font-weight: var(--font-weight-semibold); margin-bottom: var(--space-3);"
              >
                Default Card
              </h4>
              <p
                style="color: var(--color-muted-foreground); line-height: var(--line-height-relaxed);"
              >
                Standard card with clean styling and subtle shadows.
              </p>
            </Card>

            <Card variant="glass">
              <h4
                style="font-size: var(--font-size-lg); font-weight: var(--font-weight-semibold); margin-bottom: var(--space-3);"
              >
                Glass Card
              </h4>
              <p
                style="color: var(--color-muted-foreground); line-height: var(--line-height-relaxed);"
              >
                Glassmorphism effect with backdrop blur and transparency.
              </p>
            </Card>

            <Card variant="gradient">
              <h4
                style="font-size: var(--font-size-lg); font-weight: var(--font-weight-semibold); margin-bottom: var(--space-3);"
              >
                Gradient Card
              </h4>
              <p
                style="color: var(--color-muted-foreground); line-height: var(--line-height-relaxed);"
              >
                Vibrant gradient background with enhanced visual appeal.
              </p>
            </Card>

            <Card variant="neon">
              <h4
                style="font-size: var(--font-size-lg); font-weight: var(--font-weight-semibold); margin-bottom: var(--space-3);"
              >
                Neon Card
              </h4>
              <p
                style="color: var(--color-muted-foreground); line-height: var(--line-height-relaxed);"
              >
                Glowing borders and neon effects for special content.
              </p>
            </Card>
          </div>
        </div>

        <!-- Badges -->
        <div>
          <h3
            style="font-size: var(--font-size-xl); font-weight: var(--font-weight-semibold); margin-bottom: var(--space-8); color: var(--color-foreground);"
          >
            Badges
          </h3>

          <div
            style="display: flex; flex-direction: column; gap: var(--space-6);"
          >
            <!-- Badge Variants -->
            <div>
              <h4
                style="font-size: var(--font-size-lg); font-weight: var(--font-weight-medium); margin-bottom: var(--space-4); color: var(--color-muted-foreground);"
              >
                Variants
              </h4>
              <div style="display: flex; flex-wrap: wrap; gap: var(--space-3);">
                <Badge variant="default">Default</Badge>
                <Badge variant="primary">Primary</Badge>
                <Badge variant="accent">Accent</Badge>
                <Badge variant="success">Success</Badge>
                <Badge variant="warning">Warning</Badge>
                <Badge variant="danger">Danger</Badge>
                <Badge variant="glass">Glass</Badge>
                <Badge variant="neon">Neon</Badge>
              </div>
            </div>

            <!-- Badge Sizes -->
            <div>
              <h4
                style="font-size: var(--font-size-lg); font-weight: var(--font-weight-medium); margin-bottom: var(--space-4); color: var(--color-muted-foreground);"
              >
                Sizes
              </h4>
              <div
                style="display: flex; flex-wrap: wrap; gap: var(--space-3); align-items: center;"
              >
                <Badge variant="primary" size="sm">Small</Badge>
                <Badge variant="primary" size="md">Medium</Badge>
                <Badge variant="primary" size="lg">Large</Badge>
              </div>
            </div>

            <!-- Badge Effects -->
            <div>
              <h4
                style="font-size: var(--font-size-lg); font-weight: var(--font-weight-medium); margin-bottom: var(--space-4); color: var(--color-muted-foreground);"
              >
                Effects
              </h4>
              <div style="display: flex; flex-wrap: wrap; gap: var(--space-3);">
                <Badge variant="primary">Normal</Badge>
                <Badge variant="primary" glow>Glow Effect</Badge>
                <Badge variant="accent" animated>Animated</Badge>
                <Badge variant="neon" glow animated>Neon + Animated</Badge>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Layout Section -->
  <section id="layout" style="padding: var(--space-16) 0;">
    <div class="container">
      <h2
        style="
        font-size: var(--font-size-3xl);
        font-weight: var(--font-weight-bold);
        margin-bottom: var(--space-12);
        color: var(--color-foreground);
      "
      >
        Layout System
      </h2>

      <div style="display: flex; flex-direction: column; gap: var(--space-16);">
        <!-- Grid System -->
        <div>
          <h3
            style="font-size: var(--font-size-xl); font-weight: var(--font-weight-semibold); margin-bottom: var(--space-8); color: var(--color-foreground);"
          >
            Grid System
          </h3>
          <div
            style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--space-4);"
          >
            {#each [1, 2, 3, 4, 5, 6] as item}
              <div
                style="
                background: var(--color-surface);
                border: 1px solid var(--color-border);
                border-radius: var(--radius-lg);
                padding: var(--space-6);
                text-align: center;
                color: var(--color-foreground);
                font-weight: var(--font-weight-medium);
              "
              >
                Grid Item {item}
              </div>
            {/each}
          </div>
        </div>

        <!-- Container -->
        <div>
          <h3
            style="font-size: var(--font-size-xl); font-weight: var(--font-weight-semibold); margin-bottom: var(--space-8); color: var(--color-foreground);"
          >
            Container
          </h3>
          <div
            style="
            background: var(--glass-bg);
            border: 2px dashed var(--color-border);
            border-radius: var(--radius-lg);
            padding: var(--space-8);
            max-width: 1200px;
            margin: 0 auto;
          "
          >
            <p
              style="text-align: center; color: var(--color-muted-foreground); margin: 0;"
            >
              Container with max-width: 1200px and centered alignment
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Effects Section -->
  <section
    id="effects"
    style="padding: var(--space-16) 0; background: var(--color-muted);"
  >
    <div class="container">
      <h2
        style="
        font-size: var(--font-size-3xl);
        font-weight: var(--font-weight-bold);
        margin-bottom: var(--space-12);
        color: var(--color-foreground);
      "
      >
        Visual Effects
      </h2>

      <div
        style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: var(--space-8);"
      >
        <!-- Shadows -->
        <div>
          <h3
            style="font-size: var(--font-size-lg); font-weight: var(--font-weight-semibold); margin-bottom: var(--space-6); color: var(--color-muted-foreground);"
          >
            Shadows
          </h3>
          <div
            style="display: flex; flex-direction: column; gap: var(--space-4);"
          >
            {#each ["sm", "base", "md", "lg", "xl"] as shadow}
              <div
                style="
                padding: var(--space-4);
                background: var(--color-surface);
                border-radius: var(--radius-md);
                box-shadow: var(--shadow-{shadow});
                text-align: center;
                font-size: var(--font-size-sm);
                font-weight: var(--font-weight-medium);
              "
              >
                Shadow {shadow}
              </div>
            {/each}
          </div>
        </div>

        <!-- Border Radius -->
        <div>
          <h3
            style="font-size: var(--font-size-lg); font-weight: var(--font-weight-semibold); margin-bottom: var(--space-6); color: var(--color-muted-foreground);"
          >
            Border Radius
          </h3>
          <div
            style="display: flex; flex-direction: column; gap: var(--space-4);"
          >
            {#each ["sm", "base", "md", "lg", "xl", "2xl"] as radius}
              <div
                style="
                padding: var(--space-4);
                background: var(--color-primary-500);
                color: white;
                border-radius: var(--radius-{radius});
                text-align: center;
                font-size: var(--font-size-sm);
                font-weight: var(--font-weight-medium);
              "
              >
                Radius {radius}
              </div>
            {/each}
          </div>
        </div>

        <!-- Transitions -->
        <div>
          <h3
            style="font-size: var(--font-size-lg); font-weight: var(--font-weight-semibold); margin-bottom: var(--space-6); color: var(--color-muted-foreground);"
          >
            Hover Effects
          </h3>
          <div
            style="display: flex; flex-direction: column; gap: var(--space-4);"
          >
            <div
              style="
              padding: var(--space-4);
              background: var(--color-accent-500);
              color: white;
              border-radius: var(--radius-md);
              text-align: center;
              font-size: var(--font-size-sm);
              font-weight: var(--font-weight-medium);
              transition: all var(--transition-normal);
              cursor: pointer;
            "
              on:mouseenter={(e) => {
                e.target.style.transform = "translateY(-2px) scale(1.02)";
                e.target.style.boxShadow = "var(--shadow-lg)";
              }}
              on:mouseleave={(e) => {
                e.target.style.transform = "none";
                e.target.style.boxShadow = "var(--shadow-base)";
              }}
              role="button"
              tabindex="0"
            >
              Hover Transform
            </div>

            <div
              style="
              padding: var(--space-4);
              background: var(--color-success-500);
              color: white;
              border-radius: var(--radius-md);
              text-align: center;
              font-size: var(--font-size-sm);
              font-weight: var(--font-weight-medium);
              transition: all var(--transition-normal);
              cursor: pointer;
            "
              on:mouseenter={(e) => {
                e.target.style.boxShadow = "0 0 20px var(--color-success-500)";
              }}
              on:mouseleave={(e) => {
                e.target.style.boxShadow = "var(--shadow-base)";
              }}
              role="button"
              tabindex="0"
            >
              Hover Glow
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Responsive Section -->
  <section id="responsiveness" style="padding: var(--space-16) 0;">
    <div class="container">
      <h2
        style="
        font-size: var(--font-size-3xl);
        font-weight: var(--font-weight-bold);
        margin-bottom: var(--space-12);
        color: var(--color-foreground);
      "
      >
        Responsive Design
      </h2>

      <div style="display: flex; flex-direction: column; gap: var(--space-12);">
        <div>
          <p
            style="color: var(--color-muted-foreground); margin-bottom: var(--space-8); line-height: var(--line-height-relaxed);"
          >
            Resize your browser window to test responsive behavior across
            different screen sizes.
          </p>

          <div
            style="display: flex; gap: var(--space-4); margin-bottom: var(--space-8); flex-wrap: wrap;"
          >
            <div
              style="
              padding: var(--space-3) var(--space-4);
              background: var(--color-danger-500);
              color: white;
              border-radius: var(--radius-md);
              font-size: var(--font-size-sm);
              font-weight: var(--font-weight-medium);
            "
            >
              Mobile: &lt; 640px
            </div>
            <div
              style="
              padding: var(--space-3) var(--space-4);
              background: var(--color-warning-500);
              color: white;
              border-radius: var(--radius-md);
              font-size: var(--font-size-sm);
              font-weight: var(--font-weight-medium);
            "
            >
              Tablet: 640px - 1024px
            </div>
            <div
              style="
              padding: var(--space-3) var(--space-4);
              background: var(--color-success-500);
              color: white;
              border-radius: var(--radius-md);
              font-size: var(--font-size-sm);
              font-weight: var(--font-weight-medium);
            "
            >
              Desktop: &gt; 1024px
            </div>
          </div>
        </div>

        <div
          style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: var(--space-4);"
        >
          {#each [1, 2, 3, 4, 5, 6] as item}
            <div
              style="
              background: linear-gradient(135deg, var(--color-primary-500) 0%, var(--color-accent-500) 100%);
              color: white;
              padding: var(--space-8);
              border-radius: var(--radius-lg);
              text-align: center;
              font-weight: var(--font-weight-semibold);
            "
            >
              Responsive Item {item}
            </div>
          {/each}
        </div>
      </div>
    </div>
  </section>
</div>

<style>
  .test-page {
    min-height: 100vh;
    background: var(--color-background);
  }

  /* Mobile Responsive */
  @media (max-width: 768px) {
    .container {
      padding: 0 var(--space-4);
    }

    nav .container {
      flex-direction: column;
      gap: var(--space-4);
    }
  }
</style>
