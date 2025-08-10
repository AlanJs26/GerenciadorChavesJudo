<script lang="ts">
  import FormItem from '@components/result-tab/config-popover/form-item.svelte'
  import { Input } from '@components/ui/input'
  import * as Tabs from '@components/ui/tabs'
  import { Textarea } from '@components/ui/textarea'
  import { cn } from '@lib/utils'
  import { type Snippet } from 'svelte'

  let {
    class: className,
    children,
    textarea = false,
    label,
    withDifficulty = false,
    value = $bindable(''),
    difficulty = $bindable<'simple' | 'advanced'>('simple')
  }: {
    withDifficulty?: boolean
    textarea?: boolean
    children?: Snippet
    class?: string
    value?: string
    difficulty?: 'simple' | 'advanced'
  } = $props()
</script>

{#if withDifficulty}
  <Tabs.Root bind:value={difficulty} class={cn('flex w-full flex-col gap-1', className)}>
    <Tabs.List class="grid grid-cols-2 self-end p-[0.1rem] leading-0">
      <Tabs.Trigger class="px-2 py-1 text-xs" value="simple">Simples</Tabs.Trigger>
      <Tabs.Trigger class="px-2 py-1 text-xs" value="advanced">Avançado</Tabs.Trigger>
    </Tabs.List>

    <Tabs.Content value="simple">
      <FormItem {label} class="w-full">
        {@render children?.()}
      </FormItem>
    </Tabs.Content>
    <Tabs.Content value="advanced" class="items-top flex gap-2">
      <FormItem {label} class="w-full">
        {#if textarea}
          <Textarea bind:value id="filter" class="min-h-8" />
        {:else}
          <Input bind:value id="name" class="h-8" />
        {/if}
      </FormItem>
    </Tabs.Content>
  </Tabs.Root>
{:else}
  <FormItem {label} class="w-full">
    {#if textarea}
      <Textarea bind:value id="filter" class="min-h-8" />
    {:else}
      <Input bind:value id="name" class="h-8" />
    {/if}
  </FormItem>
{/if}
