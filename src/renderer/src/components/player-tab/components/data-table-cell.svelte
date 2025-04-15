<script lang="ts">
  import type { Snippet } from 'svelte'

  let { children, value, ...restProps }: { children?: Snippet; value?: string } = $props()
</script>

<div {...restProps}>
  {#if value}
    {value}
  {:else}
    {@render children?.()}
  {/if}
</div>
