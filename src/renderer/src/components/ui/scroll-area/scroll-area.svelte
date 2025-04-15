<script lang="ts">
  import { ScrollArea as ScrollAreaPrimitive, type WithoutChild } from 'bits-ui'
  import { Scrollbar } from './index'
  import { cn } from '@lib/utils'

  let viewportEl: HTMLDivElement = $state(null)

  let {
    ref = $bindable(null),
    class: className,
    contentclass: contentClassName,
    orientation = 'vertical',
    scrollbarXClasses = '',
    scrollbarYClasses = '',
    children,
    ...restProps
  }: WithoutChild<ScrollAreaPrimitive.RootProps> & {
    orientation?: 'vertical' | 'horizontal' | 'both' | undefined
    contentclass?: string | undefined
    scrollbarXClasses?: string | undefined
    scrollbarYClasses?: string | undefined
  } = $props()

  $effect(() => {
    viewportEl.querySelector('&>div').className = contentClassName ?? ''
  })
</script>

<ScrollAreaPrimitive.Root bind:ref {...restProps} class={cn('relative overflow-hidden', className)}>
  <ScrollAreaPrimitive.Viewport
    class={cn('h-full w-full rounded-[inherit]', contentClassName)}
    bind:ref={viewportEl}
  >
    {@render children?.()}
  </ScrollAreaPrimitive.Viewport>
  {#if orientation === 'vertical' || orientation === 'both'}
    <Scrollbar orientation="vertical" class={scrollbarYClasses} />
  {/if}
  {#if orientation === 'horizontal' || orientation === 'both'}
    <Scrollbar orientation="horizontal" class={scrollbarXClasses} />
  {/if}
  <ScrollAreaPrimitive.Corner />
</ScrollAreaPrimitive.Root>
