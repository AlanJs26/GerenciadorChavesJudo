<script lang="ts">
  import { Button } from '@/components/ui/button'
  import * as RadioGroup from '@components/radio-group'
  import * as Dialog from '@components/ui/dialog'
  import { Input } from '@components/ui/input'
  import { Label } from '@components/ui/label'
  import { ScrollArea } from '@components/ui/scroll-area'
  import { Textarea } from '@components/ui/textarea'
  import { Plus } from '@lucide/svelte'
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
  <Dialog.Content class="flex max-h-[90vh] min-w-[90vw] flex-col p-0">
    <Dialog.Header class="bg-secondary/50 px-5 py-3">
      <div class="flex gap-3 pr-7">
        <h1 class="text-3xl">Nova Visualização</h1>
        <div class="flex-1"></div>
        <Button variant="default">Salvar</Button>
      </div>
    </Dialog.Header>
    <ScrollArea type="always" contentclass="flex h-[90vh] flex-col gap-3">
      <div class="flex flex-col gap-2 px-5 pt-0 pb-3">
        <div class="flex items-center gap-2">
          <Label for="name">Nome</Label>
          <Input id="name" class="h-8" />
        </div>

        <div class="flex w-full flex-col gap-1">
          <RadioGroup.Root class="grid grid-cols-2 self-end p-[0.1rem] leading-0" value="advanced">
            <RadioGroup.Item class="px-2 py-1 text-xs" value="simple">Simples</RadioGroup.Item>
            <RadioGroup.Item class="px-2 py-1 text-xs" value="advanced">Avançado</RadioGroup.Item>
          </RadioGroup.Root>

          <div class="items-top flex gap-2">
            <Label for="filter" class="pt-2">Filtro</Label>
            <Textarea id="filter" class="min-h-8" />
          </div>
        </div>
      </div>

      <h1 class="!ml-5 text-3xl">Colunas</h1>

      <div class="flex w-full flex-1 border-t-1">
        <div class="flex min-h-full flex-col border-r-1 p-3">
          {#each ['Peso', 'SUB', 'Presença'] as item (item)}
            <Button variant="ghost">
              {item}
            </Button>
          {/each}
          <Button variant="outline" size="sm">
            <Plus />
            Adicionar
          </Button>
        </div>

        <div class="flex flex-1 flex-col gap-2 p-5">
          <div class="flex items-center gap-2">
            <Label for="name">Nome</Label>
            <Input id="name" class="h-8" />
          </div>

          <div class="flex items-center gap-2">
            <Label>Tipo</Label>
            <RadioGroup.Root class="grid grid-cols-2 p-[0.1rem] leading-0" value="data">
              <RadioGroup.Item class="px-2 py-1 text-xs" value="data">Dado</RadioGroup.Item>
              <RadioGroup.Item class="px-2 py-1 text-xs" value="classification"
                >Classificação</RadioGroup.Item
              >
            </RadioGroup.Root>
          </div>

          <div class="flex w-full flex-col gap-1">
            <RadioGroup.Root
              class="grid grid-cols-2 self-end p-[0.1rem] leading-0"
              value="advanced"
            >
              <RadioGroup.Item class="px-2 py-1 text-xs" value="simple">Simples</RadioGroup.Item>
              <RadioGroup.Item class="px-2 py-1 text-xs" value="advanced">Avançado</RadioGroup.Item>
            </RadioGroup.Root>

            <div class="items-top flex gap-2">
              <Label for="formula" class="pt-2">Fórmula</Label>
              <Textarea id="formula" class="min-h-8" />
            </div>
          </div>

          <h1 class="!mt-3 text-3xl">Agregar</h1>

          <div class="flex w-full flex-1 border-1">
            <div class="flex min-h-full flex-col border-r-1 p-3">
              {#each ['Peso', 'SUB', 'Presença'] as item (item)}
                <Button variant="ghost">
                  {item}
                </Button>
              {/each}
              <Button variant="outline" size="sm">
                <Plus />
                Adicionar
              </Button>
            </div>

            <div class="flex min-h-full flex-1 flex-col gap-2 p-3">
              <div class="!mb-3 flex items-baseline gap-2">
                <h1 class="text-3xl">Coluna de Total</h1>

                <RadioGroup.Root
                  class="grid grid-cols-2 self-end p-[0.1rem] leading-0"
                  value="enabled"
                >
                  <RadioGroup.Item class="px-2 py-1 text-xs" value="enabled"
                    >Ativado</RadioGroup.Item
                  >
                  <RadioGroup.Item class="px-2 py-1 text-xs" value="disabled"
                    >Desativado</RadioGroup.Item
                  >
                </RadioGroup.Root>
              </div>

              <div class="flex items-center gap-2">
                <Label for="name">Nome</Label>
                <Input id="name" class="h-8" />
              </div>

              <div class="flex items-center gap-2">
                <Label>Tipo</Label>
                <RadioGroup.Root class="grid grid-cols-2 p-[0.1rem] leading-0" value="data">
                  <RadioGroup.Item class="px-2 py-1 text-xs" value="data">Dado</RadioGroup.Item>
                  <RadioGroup.Item class="px-2 py-1 text-xs" value="classification"
                    >Classificação</RadioGroup.Item
                  >
                </RadioGroup.Root>
              </div>

              <div class="flex w-full flex-col gap-1">
                <RadioGroup.Root
                  class="grid grid-cols-2 self-end p-[0.1rem] leading-0"
                  value="advanced"
                >
                  <RadioGroup.Item class="px-2 py-1 text-xs" value="simple">Simples</RadioGroup.Item
                  >
                  <RadioGroup.Item class="px-2 py-1 text-xs" value="advanced"
                    >Avançado</RadioGroup.Item
                  >
                </RadioGroup.Root>

                <div class="items-top flex gap-2">
                  <Label for="formula" class="pt-2">Fórmula</Label>
                  <Textarea id="formula" class="min-h-8" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ScrollArea>
  </Dialog.Content>
</Dialog.Root>
