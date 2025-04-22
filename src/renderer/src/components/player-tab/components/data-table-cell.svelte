<script lang="ts">
  import type { Snippet } from 'svelte'

  let {
    children,
    value,
    center = false,
    ...restProps
  }: { children?: Snippet; value?: string | number; center?: boolean } = $props()
</script>

<div {...restProps}>
  {#if value}
    {#if center}
      <div class="flex justify-center">{value}</div>
    {:else}
      {value}
    {/if}
  {:else}
    {@render children?.()}
  {/if}
</div>
