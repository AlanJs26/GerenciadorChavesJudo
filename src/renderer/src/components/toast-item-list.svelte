<script lang="ts">
  let {
    items,
    title
  }: {
    title: string
    items: string[]
  } = $props()
</script>

{#if title}
  <h1 class="text-lg font-bold">{title}</h1>
{/if}

<div class="max-h-[40vh] overflow-y-auto">
  {#each items as item, i (i)}
    <p>{item}</p>
  {/each}
</div>
