<script lang="ts">
  export let variant:
    | "default"
    | "primary"
    | "accent"
    | "success"
    | "warning"
    | "danger"
    | "glass"
    | "neon" = "default";
  export let size: "sm" | "md" | "lg" = "md";
  export let glow = false;
  export let animated = false;
</script>

<span
  class="badge badge--{variant} badge--{size}"
  class:badge--glow={glow}
  class:badge--animated={animated}
>
  <slot />
</span>

<style>
  .badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-full);
    font-weight: var(--font-weight-semibold);
    transition: all var(--transition-normal);
    white-space: nowrap;
    position: relative;
    overflow: hidden;
  }

  .badge::before {
    content: "";
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.4),
      transparent
    );
    transition: left var(--transition-slow);
  }

  .badge--animated::before {
    animation: shimmer 2s infinite;
  }

  .badge:hover::before {
    left: 100%;
  }

  @keyframes shimmer {
    0% {
      left: -100%;
    }
    100% {
      left: 100%;
    }
  }

  /* Sizes */
  .badge--sm {
    padding: var(--space-1) var(--space-2-5);
    font-size: var(--font-size-xs);
    gap: var(--space-1);
  }

  .badge--md {
    padding: var(--space-1-5) var(--space-3);
    font-size: var(--font-size-sm);
    gap: var(--space-1-5);
  }

  .badge--lg {
    padding: var(--space-2) var(--space-4);
    font-size: var(--font-size-base);
    gap: var(--space-2);
  }

  /* Variants */
  .badge--default {
    background: var(--color-muted);
    color: var(--color-muted-foreground);
    border: 1px solid var(--color-border);
  }

  .badge--primary {
    background: linear-gradient(
      135deg,
      var(--color-primary-500) 0%,
      var(--color-primary-600) 100%
    );
    color: white;
    box-shadow: var(--shadow-sm);
  }

  .badge--accent {
    background: linear-gradient(
      135deg,
      var(--color-accent-500) 0%,
      var(--color-accent-600) 100%
    );
    color: white;
    box-shadow: var(--shadow-sm);
  }

  .badge--success {
    background: linear-gradient(
      135deg,
      var(--color-success-500) 0%,
      var(--color-success-600) 100%
    );
    color: white;
    box-shadow: var(--shadow-sm);
  }

  .badge--warning {
    background: linear-gradient(
      135deg,
      var(--color-warning-500) 0%,
      var(--color-warning-600) 100%
    );
    color: white;
    box-shadow: var(--shadow-sm);
  }

  .badge--danger {
    background: linear-gradient(
      135deg,
      var(--color-danger-500) 0%,
      var(--color-danger-600) 100%
    );
    color: white;
    box-shadow: var(--shadow-sm);
  }

  .badge--glass {
    background: var(--glass-bg);
    color: var(--color-foreground);
    border: 1px solid var(--glass-border);
    backdrop-filter: var(--backdrop-blur-md);
    box-shadow: var(--shadow-glass);
  }

  .badge--neon {
    background: transparent;
    color: var(--color-primary-400);
    border: 1px solid var(--color-primary-500);
    text-shadow: 0 0 8px var(--color-primary-500);
    box-shadow:
      inset 0 0 8px rgba(59, 130, 246, 0.3),
      0 0 8px rgba(59, 130, 246, 0.3);
  }

  /* Glow effects */
  .badge--glow.badge--primary {
    box-shadow: var(--shadow-sm), var(--glow-primary);
  }

  .badge--glow.badge--accent {
    box-shadow: var(--shadow-sm), var(--glow-accent);
  }

  .badge--glow.badge--success {
    box-shadow: var(--shadow-sm), var(--glow-success);
  }

  .badge--glow.badge--neon {
    box-shadow:
      inset 0 0 12px rgba(59, 130, 246, 0.4),
      0 0 20px rgba(59, 130, 246, 0.6);
  }

  /* Hover effects */
  .badge:hover {
    transform: scale(1.05);
  }

  .badge--primary:hover {
    background: linear-gradient(
      135deg,
      var(--color-primary-600) 0%,
      var(--color-primary-700) 100%
    );
  }

  .badge--accent:hover {
    background: linear-gradient(
      135deg,
      var(--color-accent-600) 0%,
      var(--color-accent-700) 100%
    );
  }

  .badge--neon:hover {
    background: rgba(59, 130, 246, 0.1);
    box-shadow:
      inset 0 0 15px rgba(59, 130, 246, 0.4),
      0 0 25px rgba(59, 130, 246, 0.6);
  }
</style>
