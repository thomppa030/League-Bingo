<script lang="ts">
  export let variant:
    | "primary"
    | "secondary"
    | "accent"
    | "danger"
    | "glass"
    | "neon" = "primary";
  export let size: "sm" | "md" | "lg" | "xl" = "md";
  export let disabled = false;
  export let type: "button" | "submit" | "reset" = "button";
  export let loading = false;
</script>

<button
  class="btn btn--{variant} btn--{size}"
  class:btn--loading={loading}
  {disabled}
  {type}
  on:click
>
  {#if loading}
    <div class="btn__spinner" aria-hidden="true"></div>
  {/if}
  <span class:btn__content--loading={loading}>
    <slot />
  </span>
</button>

<style>
  .btn {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-xl);
    font-weight: var(--font-weight-semibold);
    transition: all var(--transition-normal);
    cursor: pointer;
    border: 1px solid transparent;
    text-decoration: none;
    white-space: nowrap;
    overflow: hidden;
    backdrop-filter: var(--backdrop-blur-sm);
    transform: perspective(1px) translateZ(0);
  }

  .btn::before {
    content: "";
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.3),
      transparent
    );
    transition: left var(--transition-slow);
  }

  .btn:hover::before {
    left: 100%;
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  .btn:disabled::before {
    display: none;
  }

  .btn:focus-visible {
    outline: 2px solid var(--color-primary-500);
    outline-offset: 2px;
    transform: translateY(-1px);
  }

  .btn:active:not(:disabled) {
    transform: translateY(1px) scale(0.98);
  }

  /* Loading State */
  .btn--loading {
    cursor: wait;
  }

  .btn__spinner {
    width: 1em;
    height: 1em;
    border: 2px solid transparent;
    border-top: 2px solid currentColor;
    border-radius: var(--radius-full);
    animation: spin 1s linear infinite;
    margin-right: var(--space-2);
  }

  .btn__content--loading {
    opacity: 0.7;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* Variants */
  .btn--primary {
    background: linear-gradient(
      135deg,
      var(--color-primary-500) 0%,
      var(--color-primary-600) 100%
    );
    color: white;
    box-shadow:
      var(--shadow-md),
      0 0 0 1px rgba(59, 130, 246, 0.1);
  }

  .btn--primary:hover:not(:disabled) {
    background: linear-gradient(
      135deg,
      var(--color-primary-600) 0%,
      var(--color-primary-700) 100%
    );
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg), var(--glow-primary);
  }

  .btn--secondary {
    background: var(--color-surface);
    color: var(--color-foreground);
    border: 1px solid var(--color-border);
    backdrop-filter: var(--backdrop-blur-base);
  }

  .btn--secondary:hover:not(:disabled) {
    background: var(--color-muted);
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }

  .btn--accent {
    background: linear-gradient(
      135deg,
      var(--color-accent-500) 0%,
      var(--color-accent-600) 100%
    );
    color: white;
    box-shadow: var(--shadow-md);
  }

  .btn--accent:hover:not(:disabled) {
    background: linear-gradient(
      135deg,
      var(--color-accent-600) 0%,
      var(--color-accent-700) 100%
    );
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg), var(--glow-accent);
  }

  .btn--danger {
    background: linear-gradient(
      135deg,
      var(--color-danger-500) 0%,
      var(--color-danger-600) 100%
    );
    color: white;
    box-shadow: var(--shadow-md);
  }

  .btn--danger:hover:not(:disabled) {
    background: linear-gradient(
      135deg,
      var(--color-danger-600) 0%,
      #b91c1c 100%
    );
    transform: translateY(-2px);
    box-shadow:
      var(--shadow-lg),
      0 0 20px var(--color-danger-500);
  }

  .btn--glass {
    background: var(--glass-bg);
    color: var(--color-foreground);
    border: 1px solid var(--glass-border);
    backdrop-filter: var(--backdrop-blur-md);
    box-shadow: var(--shadow-glass);
  }

  .btn--glass:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.15);
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
  }

  .btn--neon {
    background: transparent;
    color: var(--color-primary-400);
    border: 2px solid var(--color-primary-500);
    text-shadow: 0 0 10px var(--color-primary-500);
    box-shadow:
      inset 0 0 10px var(--color-primary-500),
      0 0 10px var(--color-primary-500);
  }

  .btn--neon:hover:not(:disabled) {
    background: var(--color-primary-500);
    color: white;
    text-shadow: none;
    transform: translateY(-2px);
    box-shadow:
      inset 0 0 20px var(--color-primary-400),
      0 0 30px var(--color-primary-500),
      var(--shadow-lg);
  }

  /* Sizes */
  .btn--sm {
    padding: var(--space-2) var(--space-4);
    font-size: var(--font-size-sm);
    gap: var(--space-1-5);
  }

  .btn--md {
    padding: var(--space-3) var(--space-6);
    font-size: var(--font-size-base);
    gap: var(--space-2);
  }

  .btn--lg {
    padding: var(--space-4) var(--space-8);
    font-size: var(--font-size-lg);
    gap: var(--space-2-5);
  }

  .btn--xl {
    padding: var(--space-5) var(--space-10);
    font-size: var(--font-size-xl);
    gap: var(--space-3);
  }
</style>
