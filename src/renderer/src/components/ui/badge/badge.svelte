<script lang="ts">
  import { type Variant, badgeVariants } from './index'
  import type { Category } from '@lib/types/bracket-lib'
  import { cn } from '@lib/utils'

  let {
    category,
    href,
    variant = 'default',
    children,
    class: className,
    ...props
  }: { category?: Category; href?: string; variant: Variant; class?: string } = $props()
</script>

{#if category}
  {#each category as tag (tag.value)}
    <svelte:element
      this={href ? 'a' : 'span'}
      {href}
      class={cn(badgeVariants({ variant }), className)}
      {...props}
    >
      {tag.value}
    </svelte:element>
  {/each}
{:else}
  <svelte:element
    this={href ? 'a' : 'span'}
    {href}
    class={cn(badgeVariants({ variant }), className)}
    {...props}
  >
    {@render children?.()}
  </svelte:element>
{/if}
