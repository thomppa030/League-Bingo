<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import SessionManager from '$lib/components/SessionManager.svelte';
  import { currentSession } from '$lib/stores/sessionStore.js';

  onMount(() => {
    // If no session, redirect to home
    if (!$currentSession) {
      goto('/');
    }
  });
</script>

<svelte:head>
  <title>League Bingo - Game Session</title>
</svelte:head>

<!-- Use the SessionManager component which has all the game functionality -->
<SessionManager />