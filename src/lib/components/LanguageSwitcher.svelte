<script lang="ts">
  import { locale } from 'svelte-i18n';
  import { browser } from '$app/environment';

  const languages = {
    'en': '🇺🇸',
    'de': '🇩🇪'
  };

  function switchLanguage(lang: string) {
    locale.set(lang);
    if (browser) {
      localStorage.setItem('locale', lang);
    }
  }
</script>

<div class="language-switcher">
  {#each Object.entries(languages) as [code, flag]}
    <button 
      class="language-button"
      class:active={$locale === code}
      on:click={() => switchLanguage(code)}
      title={code === 'en' ? 'English' : 'Deutsch'}
    >
      {flag}
    </button>
  {/each}
</div>

<style>
  .language-switcher {
    display: flex;
    gap: var(--space-2);
  }

  .language-button {
    width: 40px;
    height: 40px;
    border: 2px solid var(--color-border);
    border-radius: 50%;
    background: var(--color-surface);
    color: var(--color-foreground);
    font-size: 18px;
    cursor: pointer;
    transition: all var(--transition-normal);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .language-button:hover {
    border-color: var(--color-primary-500);
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }

  .language-button:focus {
    outline: none;
    border-color: var(--color-primary-500);
    box-shadow: 0 0 0 3px rgba(var(--color-primary-500-rgb), 0.2);
  }

  .language-button.active {
    border-color: var(--color-primary-500);
    background: var(--color-primary-500);
    box-shadow: 0 2px 8px rgba(var(--color-primary-500-rgb), 0.3);
  }

  .language-button:active {
    transform: translateY(0);
  }
</style>