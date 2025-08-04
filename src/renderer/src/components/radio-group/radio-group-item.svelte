<script lang="ts">
  import { buttonVariants } from '@/components/ui/button'
  import { cn, type WithoutChildrenOrChild } from '@lib/utils'
  import { RadioGroup as RadioGroupPrimitive } from 'bits-ui'
  let {
    ref = $bindable(null),
    class: className,
    children: radioChildren,
    ...restProps
  }: WithoutChildrenOrChild<RadioGroupPrimitive.ItemProps> = $props()
</script>

<RadioGroupPrimitive.Item bind:ref data-slot="radio-group-item" {...restProps} class="flex-1">
  {#snippet children({ checked })}
    <div
      class={cn(
        buttonVariants({ variant: 'ghost' }),
        'text-muted-foreground/70 h-auto w-full p-2',
        checked
          ? 'bg-background text-foreground hover:bg-background cursor-default shadow-md'
          : 'hover:bg-primary/10',
        className
      )}
    >
      {@render radioChildren?.()}
    </div>
  {/snippet}
</RadioGroupPrimitive.Item>
