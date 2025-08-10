<script lang="ts">
  import { cn } from '@lib/utils'
  import { RadioGroup as RadioGroupPrimitive } from 'bits-ui'
  let {
    ref = $bindable(null),
    class: className,
    value = $bindable(''),
    ...restProps
  }: RadioGroupPrimitive.RootProps = $props()
</script>

<RadioGroupPrimitive.Root
  bind:ref
  bind:value
  data-slot="radio-group"
  class={cn('bg-secondary flex items-center justify-around rounded-md p-1', className)}
  {...restProps}
/>

<style>
  .radio-group {
    display: flex;
    flex-direction: row;
    justify-content: space-around;
    padding: 5px;
    border-radius: 5px;
  }
</style>
