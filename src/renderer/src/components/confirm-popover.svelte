<script lang="ts">
  import { Button } from '@components/ui/button'
  import * as Popover from '@components/ui/popover'
  import { type Snippet } from 'svelte'

  let {
    onNo,
    onYes,
    description,
    title = 'Continuar',
    class: className,
    children
  }: {
    onNo?: () => void
    onYes?: () => void
    title: string
    description?: string
    class?: string
    children?: Snippet
  } = $props()

  let open = $state(false)
</script>

<Popover.Root bind:open>
  <Popover.Trigger class={className}>
    {@render children?.()}
  </Popover.Trigger>
  <Popover.Content class="flex flex-col p-3">
    <h1 class="text-lg">{title}</h1>
    {#if description}
      <p class="text-muted-foreground text-sm">{description}</p>
    {/if}
    <div class="flex w-full justify-end">
      <div class="!mt-2 flex gap-2">
        <Button
          variant="default"
          onclick={() => {
            open = false
            onNo?.()
          }}>Não</Button
        >
        <Button
          variant="outline"
          onclick={() => {
            open = false
            onYes?.()
          }}>Sim</Button
        >
      </div>
    </div>
  </Popover.Content>
</Popover.Root>
