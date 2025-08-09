<script lang="ts">
  import Button from "$lib/components/Button.svelte";
  import { _ } from 'svelte-i18n';
</script>

<svelte:head>
  <title>{$_('app.title')}</title>
  <meta name="description" content={$_('app.description')} />
</svelte:head>

<main class="container">
  <div class="content">
    <h1 class="title">{$_('app.title')}</h1>
    <p class="subtitle">{$_('app.subtitle')}</p>
    
    <div class="actions">
      <Button variant="primary" size="lg">
        <a href="/app">{$_('navigation.startSession')}</a>
      </Button>
      
      <Button variant="secondary" size="lg">
        <a href="/prototype">{$_('navigation.viewPrototype')}</a>
      </Button>
    </div>
  </div>
</main>

<style>
  .container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
  }

  .content {
    text-align: center;
    max-width: 600px;
  }

  .title {
    font-size: 4rem;
    font-weight: 800;
    margin-bottom: 1rem;
    background: linear-gradient(135deg, var(--color-primary-400) 0%, var(--color-accent-500) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .subtitle {
    font-size: 1.25rem;
    color: var(--color-muted-foreground);
    margin-bottom: 3rem;
  }

  .actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
    flex-wrap: wrap;
  }

  :global(.actions .btn) a {
    text-decoration: none;
    color: inherit;
  }

  @media (max-width: 768px) {
    .title {
      font-size: 3rem;
    }

    .subtitle {
      font-size: 1.125rem;
    }

    .actions {
      flex-direction: column;
      align-items: stretch;
    }
  }
</style>