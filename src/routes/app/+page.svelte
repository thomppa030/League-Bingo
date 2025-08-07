<script lang="ts">
  import SessionManager from "$lib/components/SessionManager.svelte";
</script>

<svelte:head>
  <title>League of Legends Bingo - Play Now</title>
  <meta name="description" content="Create or join a League of Legends Bingo session" />
</svelte:head>

<main style="min-height: 100vh; padding: var(--space-8); background: var(--color-background);">
  <div class="container" style="max-width: 1200px; margin: 0 auto;">
    <SessionManager />
  </div>
</main>