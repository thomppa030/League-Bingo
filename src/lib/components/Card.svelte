<script lang="ts">
  export let variant: "default" | "glass" | "gradient" | "neon" = "default";
  export let padding: "sm" | "md" | "lg" | "xl" = "md";
  export let shadow: "sm" | "base" | "md" | "lg" | "xl" = "md";
  export let hover = true;
  export let animated = true;
</script>

<div
  class="card card--{variant} card--padding-{padding} card--shadow-{shadow}"
  class:card--hover={hover}
  class:card--animated={animated}
>
  <slot />
</div>

<style>
  .card {
    position: relative;
    border-radius: var(--radius-2xl);
    transition: all var(--transition-normal);
    overflow: hidden;
  }

  .card::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: inherit;
    padding: 1px;
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.1) 0%,
      rgba(255, 255, 255, 0.05) 50%,
      rgba(255, 255, 255, 0.1) 100%
    );
    mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    mask-composite: exclude;
    -webkit-mask-composite: xor;
    pointer-events: none;
  }

  .card--animated {
    animation: fadeInUp 0.6s ease-out;
  }

  .card--hover:hover {
    transform: translateY(-4px) scale(1.02);
  }

  /* Variants */
  .card--default {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    backdrop-filter: var(--backdrop-blur-sm);
  }

  .card--glass {
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    backdrop-filter: var(--backdrop-blur-md);
    box-shadow: var(--shadow-glass);
  }

  .card--glass::before {
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.2) 0%,
      rgba(255, 255, 255, 0.1) 50%,
      rgba(255, 255, 255, 0.2) 100%
    );
  }

  .card--gradient {
    background: linear-gradient(
      135deg,
      rgba(59, 130, 246, 0.1) 0%,
      rgba(147, 51, 234, 0.1) 50%,
      rgba(236, 72, 153, 0.1) 100%
    );
    border: 1px solid rgba(255, 255, 255, 0.1);
    backdrop-filter: var(--backdrop-blur-base);
  }

  .card--gradient::before {
    background: linear-gradient(
      135deg,
      var(--color-primary-500) 0%,
      var(--color-accent-500) 50%,
      #ec4899 100%
    );
  }

  .card--neon {
    background: rgba(0, 0, 0, 0.8);
    border: 2px solid var(--color-primary-500);
    box-shadow:
      inset 0 0 20px rgba(59, 130, 246, 0.1),
      0 0 20px rgba(59, 130, 246, 0.3);
  }

  .card--neon::before {
    background: var(--color-primary-500);
    opacity: 0.1;
  }

  .card--neon:hover {
    box-shadow:
      inset 0 0 30px rgba(59, 130, 246, 0.2),
      0 0 40px rgba(59, 130, 246, 0.5);
  }

  /* Padding variants */
  .card--padding-sm {
    padding: var(--space-4);
  }

  .card--padding-md {
    padding: var(--space-6);
  }

  .card--padding-lg {
    padding: var(--space-8);
  }

  .card--padding-xl {
    padding: var(--space-10);
  }

  /* Shadow variants */
  .card--shadow-sm {
    box-shadow: var(--shadow-sm);
  }

  .card--shadow-base {
    box-shadow: var(--shadow-base);
  }

  .card--shadow-md {
    box-shadow: var(--shadow-md);
  }

  .card--shadow-lg {
    box-shadow: var(--shadow-lg);
  }

  .card--shadow-xl {
    box-shadow: var(--shadow-xl);
  }

  /* Enhanced hover effects for different shadows */
  .card--hover.card--shadow-sm:hover {
    box-shadow: var(--shadow-md);
  }

  .card--hover.card--shadow-base:hover {
    box-shadow: var(--shadow-lg);
  }

  .card--hover.card--shadow-md:hover {
    box-shadow: var(--shadow-xl);
  }

  .card--hover.card--shadow-lg:hover {
    box-shadow: var(--shadow-2xl);
  }

  .card--hover.card--shadow-xl:hover {
    box-shadow:
      var(--shadow-2xl),
      0 0 40px rgba(59, 130, 246, 0.3);
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
