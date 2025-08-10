<script lang="ts" module>
  type TData = unknown
  type TValue = unknown
</script>

<script lang="ts" generics="TData, TValue">
  import { Badge } from '@components/ui/badge'
  import { Button } from '@components/ui/button'
  import * as Command from '@components/ui/command'
  import * as Popover from '@components/ui/popover'
  import { Separator } from '@components/ui/separator'
  import type { Category } from '@lib/types/bracket-lib'
  import { cn } from '@lib/utils'
  import { CirclePlus, Component } from '@lucide/svelte'
  import { Check } from '@lucide/svelte'
  import type { Column } from '@tanstack/table-core'
  import { SvelteSet } from 'svelte/reactivity'

  type Props<TData, TValue> = {
    column: Column<TData, TValue>
    title: string
    options: (
      | {
          label: string
          value: string
          icon?: typeof Component
        }
      | {
          label: Category
          value: Category
          icon?: typeof Component
        }
    )[]
  }

  let { column, title, options }: Props<TData, TValue> = $props()

  type optionValue = (typeof options)[number]['value']

  const facets = $derived(column?.getFacetedUniqueValues())
  const selectedValues = $derived(new SvelteSet(column?.getFilterValue() as optionValue[]))
</script>

<Popover.Root>
  <Popover.Trigger>
    {#snippet child({ props })}
      <Button {...props} variant="outline" size="sm" class="h-8 border-dashed">
        <CirclePlus class="mr-1 w-4" />
        {title}
        {#if selectedValues.size > 0}
          <Separator orientation="vertical" class="mx-2 h-4" />
          <Badge variant="secondary" class="rounded-sm px-1 font-normal lg:hidden">
            {selectedValues.size}
          </Badge>
          <div class="hidden space-x-1 lg:flex">
            {#if selectedValues.size > 2}
              <Badge variant="secondary" class="rounded-sm px-1 font-normal">
                {selectedValues.size} selected
              </Badge>
            {:else}
              {#each options.filter( (opt) => selectedValues.has(opt.value) ) as option (option.value)}
                {#if typeof option.label == 'string'}
                  <Badge variant="secondary" class="rounded-sm px-1 font-normal">
                    {option.label}
                  </Badge>
                {:else}
                  <Badge
                    category={option.label}
                    variant="secondary"
                    class="rounded-sm px-1 font-normal"
                  />
                {/if}
              {/each}
            {/if}
          </div>
        {/if}
      </Button>
    {/snippet}
  </Popover.Trigger>
  <Popover.Content class="w-[200px] p-0" align="start">
    <Command.Root>
      <Command.Input placeholder={title} />
      <Command.List>
        <Command.Empty>No results found.</Command.Empty>
        <Command.Group>
          {#each options as option (option.value)}
            {@const isSelected = selectedValues.has(option.value)}
            <Command.Item
              onSelect={() => {
                if (isSelected) {
                  selectedValues.delete(option.value)
                } else {
                  selectedValues.add(option.value)
                }
                const filterValues = Array.from(selectedValues)
                column?.setFilterValue(filterValues.length ? filterValues : undefined)
              }}
            >
              <div
                class={cn(
                  'border-primary mr-2 flex size-4 items-center justify-center rounded-sm border',
                  isSelected ? 'bg-primary text-primary-foreground' : 'opacity-50 [&_svg]:invisible'
                )}
              >
                <Check class="size-4" />
              </div>
              {#if option.icon}
                {@const Icon = option.icon}
                <Icon class="text-muted-foreground" />
              {/if}

              {#if typeof option.label == 'string'}
                <span>{option.label}</span>
              {:else}
                <Badge
                  category={option.label}
                  variant="secondary"
                  class="rounded-sm px-1 font-normal"
                />
              {/if}

              {#if facets?.get(option.value)}
                <span class="!ml-auto flex size-4 items-center justify-center font-mono text-xs">
                  {facets.get(option.value)}
                </span>
              {/if}
            </Command.Item>
          {/each}
        </Command.Group>
        {#if selectedValues.size > 0}
          <Command.Separator />
          <Command.Group>
            <Command.Item
              onSelect={() => column?.setFilterValue(undefined)}
              class="justify-center text-center"
            >
              Clear filters
            </Command.Item>
          </Command.Group>
        {/if}
      </Command.List>
    </Command.Root>
  </Popover.Content>
</Popover.Root>
