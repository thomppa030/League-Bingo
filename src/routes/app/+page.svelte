<script lang="ts">
  import SessionManager from "$lib/components/SessionManager.svelte";
  import { _ } from 'svelte-i18n';
</script>

<svelte:head>
  <title>{$_('app.title')} - Play Now</title>
  <meta name="description" content={$_('app.description')} />
</svelte:head>

<main style="min-height: 100vh; padding: var(--space-8); background: var(--color-background);">
  <div class="container" style="max-width: 1200px; margin: 0 auto;">
    <SessionManager />
  </div>
</main>