<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { sessionManager, currentSession, currentPlayer } from '$lib/stores/sessionStore';
	import { persistenceManager } from '$lib/stores/persistenceStore';
	import { browser } from '$app/environment';
	import '../lib/i18n';
	import { isLoading } from 'svelte-i18n';
	import LanguageSwitcher from '$lib/components/LanguageSwitcher.svelte';
	
	let { children } = $props();
	let hasRestored = false;
	
	onMount(async () => {
		if (!browser || hasRestored) return;
		hasRestored = true;
		
		// Try to restore session from localStorage
		const restored = await sessionManager.restoreSession();
		
		if (restored) {
			// Check if we have a saved route
			const savedRoute = persistenceManager.loadRoute();
			const currentPath = $page.url.pathname;
			
			// If we're on the landing page and have a saved route, navigate to it
			if (currentPath === '/' && savedRoute && savedRoute !== '/') {
				console.log('Restoring navigation to:', savedRoute);
				await goto(savedRoute);
			}
			// If we're on /app but have session data, stay there
			else if (currentPath === '/app' && $currentSession) {
				// Already on the right page, just stay
				console.log('Session restored, staying on /app');
			}
		}
	});
	
	// Use effect to save current route when it changes
	$effect(() => {
		if (browser && $page.url.pathname !== '/') {
			persistenceManager.saveRoute($page.url.pathname);
		}
	});
	
	// Use effect to clear route when session is cleared
	$effect(() => {
		if (browser && !$currentSession && !$currentPlayer) {
			persistenceManager.clearRoute();
		}
	});
</script>

{#if $isLoading}
  <div style="
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-background);
    z-index: 9999;
  ">
    <div style="font-size: var(--font-size-lg); color: var(--color-muted-foreground);">
      Loading...
    </div>
  </div>
{:else}
  <div style="position: fixed; top: var(--space-4); right: var(--space-4); z-index: 1000;">
    <LanguageSwitcher />
  </div>
  {@render children()}
{/if}
