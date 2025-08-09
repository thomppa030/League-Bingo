<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { sessionManager, currentSession, currentPlayer } from '$lib/stores/sessionStore';
	import { persistenceManager } from '$lib/stores/persistenceStore';
	import { browser } from '$app/environment';
	
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

{@render children()}
