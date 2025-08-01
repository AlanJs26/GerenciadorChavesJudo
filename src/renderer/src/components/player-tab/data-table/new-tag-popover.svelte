<script lang="ts">
  import { Button } from '@/components/ui/button'
  import { Input } from '@components/ui/input'
  import { Label } from '@components/ui/label'
  import * as Popover from '@components/ui/popover'
  import type { Tag } from '@lib/types/bracket-lib'
  import { type Snippet } from 'svelte'
  import { toast } from 'svelte-sonner'

  let {
    class: className,
    invalidTags = [],
    onSubmit,
    children
  }: {
    class?: string
    invalidTags: Tag[]
    onSubmit: (id: string, value: string) => void
    children: Snippet
  } = $props()

  let tagId = $state('')
  let tagValue = $state('')
  let open = $state(false)
</script>

<Popover.Root bind:open>
  <Popover.Trigger class={className}>
    {@render children?.()}
  </Popover.Trigger>
  <Popover.Content>
    <h1 class="!mb-3 text-lg">Nova Tag</h1>
    <div class="!mb-3 grid grid-cols-[auto_1fr] place-items-baseline gap-2">
      <Label for="tag-id">ID</Label>
      <Input id="tag-id" class="h-8" bind:value={tagId} />

      <Label for="tag-value">Nome</Label>
      <Input id="tag-value" class="h-8" bind:value={tagValue} />
    </div>
    <div class="flex items-end">
      <Button
        variant="default"
        class="!ml-auto"
        onclick={() => {
          if (invalidTags?.find((id) => id.toLowerCase() == tagId.trim().toLowerCase())) {
            toast.warning(`ID "${tagId.trim()}" já existe`)
            return
          }
          if (!tagId.trim() || !tagValue.trim()) {
            toast.warning('Preencha todos os campos')
            return
          }
          onSubmit?.(tagId, tagValue)
          open = false
          tagId = ''
          tagValue = ''
        }}>Criar</Button
      >
    </div>
  </Popover.Content>
</Popover.Root>
