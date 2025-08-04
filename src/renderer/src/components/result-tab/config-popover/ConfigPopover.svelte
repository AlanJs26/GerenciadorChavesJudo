<script lang="ts">
  import ColumnForm from '@/components/result-tab/config-popover/column-form.svelte'
  import FormInput from '@/components/result-tab/config-popover/form-input.svelte'
  import SubForm from '@/components/result-tab/config-popover/sub-form.svelte'
  import { Button } from '@/components/ui/button'
  import * as Dialog from '@components/ui/dialog'
  import { ScrollArea } from '@components/ui/scroll-area'
  import { type Snippet } from 'svelte'

  let {
    class: className,
    children
  }: {
    class?: string
    children: Snippet
  } = $props()

  let open = $state(true)
</script>

<Dialog.Root bind:open>
  <Dialog.Trigger class={className}>
    {@render children?.()}
  </Dialog.Trigger>
  <Dialog.Content class="flex min-w-[90vw] flex-col p-0">
    <Dialog.Header class="bg-secondary/50 px-5 py-3">
      <div class="flex gap-3 pr-7">
        <h1 class="text-3xl">Nova Visualização</h1>
        <div class="flex-1"></div>
        <Button variant="default">Salvar</Button>
      </div>
    </Dialog.Header>

    <ScrollArea type="auto" contentclass="flex max-h-[80vh] min-h-[79vh] flex-col gap-3">
      <div class="flex flex-col gap-2 px-5 pt-0 pb-3">
        <FormInput withDifficulty={false} textarea={false} label="Nome" />

        <FormInput withDifficulty={true} textarea={true} label="Filtro">Alan</FormInput>
      </div>

      <h1 class="!ml-5 text-3xl">Colunas</h1>

      <SubForm items={['Peso', 'SUB', 'Presença']}>
        <ColumnForm />
      </SubForm>
    </ScrollArea>
  </Dialog.Content>
</Dialog.Root>
