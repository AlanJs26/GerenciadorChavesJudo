<script lang="ts">
  import type { Snippet } from 'svelte'

  let {
    children,
    value,
    snippet,
    center = false,
    ...restProps
  }: { children?: Snippet; snippet?: Snippet; value?: string | number; center?: boolean } = $props()
</script>

<div {...restProps}>
  {#if snippet}
    {@render snippet(value)}
  {:else if value}
    {#if center}
      <div class="flex justify-center">{value}</div>
    {:else}
      {value}
    {/if}
  {:else}
    {@render children?.()}
  {/if}
</div>
