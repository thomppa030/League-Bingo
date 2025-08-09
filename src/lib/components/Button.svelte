<script lang="ts">
  export let variant: "primary" | "secondary" | "ghost" | "danger" = "primary";
  export let size: "sm" | "md" | "lg" = "md";
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
    border-radius: var(--radius-md);
    font-weight: var(--font-weight-medium);
    transition: all 200ms ease;
    cursor: pointer;
    border: none;
    text-decoration: none;
    white-space: nowrap;
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn:focus-visible {
    outline: 2px solid var(--color-primary-500);
    outline-offset: 2px;
  }

  .btn:active:not(:disabled) {
    transform: scale(0.98);
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
    background: var(--color-primary-500);
    color: white;
  }

  .btn--primary:hover:not(:disabled) {
    background: var(--color-primary-600);
  }

  .btn--secondary {
    background: var(--color-neutral-200);
    color: var(--color-neutral-900);
  }

  .btn--secondary:hover:not(:disabled) {
    background: var(--color-neutral-300);
  }

  .btn--ghost {
    background: transparent;
    color: var(--color-foreground);
  }

  .btn--ghost:hover:not(:disabled) {
    background: var(--color-neutral-100);
  }

  .btn--danger {
    background: var(--color-danger-500);
    color: white;
  }

  .btn--danger:hover:not(:disabled) {
    background: var(--color-danger-600);
  }

  /* Dark mode adjustments */
  :global(.dark) .btn--secondary {
    background: var(--color-neutral-700);
    color: var(--color-neutral-100);
  }

  :global(.dark) .btn--secondary:hover:not(:disabled) {
    background: var(--color-neutral-600);
  }

  :global(.dark) .btn--ghost:hover:not(:disabled) {
    background: var(--color-neutral-800);
  }

  /* Sizes */
  .btn--sm {
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
  }

  .btn--md {
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
  }

  .btn--lg {
    padding: 1rem 2rem;
    font-size: 1.125rem;
  }
</style>