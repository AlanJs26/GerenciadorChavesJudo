<script lang="ts">
  import { Button } from '@components/ui/button'
  import type { Category, Tag } from '@lib/types/bracket-lib'
  import { cn } from '@lib/utils'
  import { X } from '@lucide/svelte'
  import type { MouseEventHandler } from 'svelte/elements'

  import { badgeVariants, type Variant } from './index'

  let {
    category,
    variant = 'default',
    children,
    onClose,
    colors = {},
    onclick,
    class: className,
    ...props
  }: {
    category?: Category | Tag
    variant: Variant
    colors: Record<string, string>
    class?: string
    onClose?: MouseEventHandler<HTMLButtonElement>
    onclick?: (tag: Tag) => void
  } = $props()
  const tags = $derived(category && Array.isArray(category) ? category : [category])

  function colorStyle(variant: string, id: string) {
    switch (variant) {
      case 'default':
        return id in colors ? `background-color: ${colors[id]}` : ''
      case 'outline':
      default:
        return id in colors ? `border-color: ${colors[id]}` : ''
    }
  }
</script>

{#if category}
  {#each tags as tag (tag.value)}
    <button
      class={cn(badgeVariants({ variant }), 'cursor-pointer pr-0', className)}
      {...props}
      onclick={() => onclick?.(tag)}
      style={colorStyle(variant, tag.id)}
    >
      {tag.value}
      {#if onClose}
        <Button
          variant="ghost"
          class="hover:bg-background/10 !ml-1 size-5 rounded-full p-0"
          onclick={onClose}
        >
          <X class="size-4 opacity-50" />
        </Button>
      {/if}
    </button>
  {/each}
{:else}
  <button class={cn(badgeVariants({ variant }), 'h-7 cursor-pointer', className)}>
    {@render children?.()}
  </button>
{/if}
