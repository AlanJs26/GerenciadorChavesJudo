<script lang="ts" module>
  import Badge from '@/components/ui/badge/badge.svelte'
  import type { Tag } from '@lib/types/bracket-lib'
  export { tagsCellSnippet }
</script>

{#snippet tagsCellSnippet(tags: Tag[])}
  <div class="flex flex-wrap gap-0.5">
    {#each tags as tag (tag.value)}
      <Badge variant="secondary" class="rounded-sm">{tag.value}</Badge>
    {/each}
  </div>
{/snippet}
