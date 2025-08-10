<script lang="ts">
  import type { Category } from '@lib/types/bracket-lib'
  import { cn } from '@lib/utils'

  import { badgeVariants, type Variant } from './index'

  let {
    category,
    href,
    variant = 'default',
    children,
    group = false,
    class: className,
    ...props
  }: {
    category?: Category
    group: boolean
    href?: string
    variant: Variant
    class?: string
  } = $props()

  function groupClass(i: number, n: number) {
    if (i == 0) {
      return 'pl-2 rounded-r-none'
    } else if (i == n - 1) {
      return 'pr-2 rounded-l-none'
    } else {
      return 'rounded-r-none rounded-l-none'
    }
  }
</script>

{#if category}
  {#each category as tag, i (tag.value)}
    <svelte:element
      this={href ? 'a' : 'span'}
      {href}
      class={cn(
        badgeVariants({ variant }),
        group ? 'px-1' : '',
        group ? groupClass(i, category.length) : '',
        className
      )}
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
