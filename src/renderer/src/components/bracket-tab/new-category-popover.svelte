<script lang="ts">
  import { Button, buttonVariants } from '@components/ui/button'
  import { Input } from '@components/ui/input'
  import { Label } from '@components/ui/label'
  import * as Popover from '@components/ui/popover'
  import * as Select from '@components/ui/select'
  import { roundsBySize } from '@lib/bracket-lib'
  import { Plus } from '@lucide/svelte'
  import { toast } from 'svelte-sonner'

  import { bracketsStore } from '@/states.svelte'

  let {
    isMale,
    onSubmit
  }: {
    isMale: boolean
    onSubmit: (category: string) => void
  } = $props()

  const validBracketSizes = [2, 4, 8, 16, 32].map((size) => size.toString())
  let popoverInput = $state('')
  let popoverSelectedValue = $state(validBracketSizes[0])
  let openPopover = $state(false)
  const allPopoverFilled = $derived(popoverInput != '')
  let gender: 'male' | 'female' = $derived(isMale ? 'male' : 'female')
</script>

<Popover.Root
  bind:open={openPopover}
  onOpenChange={() => {
    popoverInput = ''
    popoverSelectedValue = validBracketSizes[2]
  }}
>
  <Popover.Trigger class={buttonVariants({ variant: 'ghost' })}>
    <Plus />
  </Popover.Trigger>
  <Popover.Content class="w-[400px]">
    <div class="grid gap-4">
      <div class="space-y-2">
        <h4 class="leading-none font-medium">Nova Categoria</h4>
        <p class="text-muted-foreground text-sm">
          Insira o nome da nova categoria e clique em "Criar" para adicionar uma nova chave.
        </p>
      </div>
      <div class="grid grid-cols-3 items-center">
        <Label for="width">Categoria</Label>
        <Input id="width" bind:value={popoverInput} class="col-span-2 h-8" />
      </div>
      <div class="grid grid-cols-3 items-center">
        <Label for="width">Nº Competidores</Label>
        <Select.Root type="single" bind:value={popoverSelectedValue}>
          <Select.Trigger class="col-span-2 h-8">{popoverSelectedValue}</Select.Trigger>
          <Select.Content>
            <Select.Group>
              {#each validBracketSizes as size (size)}
                <Select.Item value={size} label={size}>{size}</Select.Item>
              {/each}
            </Select.Group>
          </Select.Content>
        </Select.Root>
      </div>
      <div class="grid grid-cols-4">
        <Button
          class="col-start-4"
          variant="default"
          disabled={!allPopoverFilled}
          onclick={() => {
            if (popoverInput in bracketsStore.brackets[gender]) {
              toast.error('Essa categoria já existe!')
              return
            }

            bracketsStore.brackets[gender][popoverInput] = {
              matches: [],
              rounds: roundsBySize(+popoverSelectedValue).map((size) => ({
                name: size.toString()
              })),
              contestants: {}
            }

            onSubmit(popoverInput)

            openPopover = false
          }}>Criar</Button
        >
      </div>
    </div>
  </Popover.Content>
</Popover.Root>
