<script lang="ts">
  import FormItem from '@/components/result-tab/config-popover/form-item.svelte'
  import * as RadioGroup from '@components/radio-group'

  let {
    class: className,
    options,
    selected = $bindable(''),
    label
  }: {
    options: string[]
    class?: string
  } = $props()
</script>

<FormItem {label} class={className}>
  <RadioGroup.Root class="grid grid-cols-2 p-[0.1rem] leading-0" bind:value={selected}>
    {#each options as option (option)}
      <RadioGroup.Item class="px-2 py-1 text-xs" value={option}>{option}</RadioGroup.Item>
    {/each}
  </RadioGroup.Root>
</FormItem>
