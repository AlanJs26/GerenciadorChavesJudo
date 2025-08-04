<script lang="ts">
  import FormInput from '@/components/result-tab/config-popover/form-input.svelte'
  import FormSwitch from '@/components/result-tab/config-popover/form-switch.svelte'
  import SubForm from '@/components/result-tab/config-popover/sub-form.svelte'
  import * as Tabs from '@components/ui/tabs'
  import { cn } from '@lib/utils'

  let {
    class: className
  }: {
    class?: string
  } = $props()
</script>

<div class={cn('flex flex-1 flex-col gap-2', className)}>
  <FormInput withDifficulty={false} textarea={false} label="Nome" />

  <FormSwitch selected="Dado" label="Tipo" options={['Dado', 'Classificação']} class="w-fit" />

  <FormInput withDifficulty={true} textarea={true} label="Fórmula" />

  <h1 class="!mt-3 text-3xl">Agregar</h1>

  <SubForm containerclass="border-1" items={['Peso', 'Alan', 'Presença']}>
    <Tabs.Root value="enabled" class={cn('flex w-full flex-col gap-5', className)}>
      <div class="flex items-baseline gap-2">
        <h1 class="text-3xl">Coluna de Total</h1>

        <Tabs.List class="grid grid-cols-2 self-end p-[0.1rem] leading-0">
          <Tabs.Trigger class="px-2 py-2.5 text-[10pt]" value="enabled">Ativado</Tabs.Trigger>
          <Tabs.Trigger class="px-2 py-2.5 text-[10pt]" value="disabled">Desativado</Tabs.Trigger>
        </Tabs.List>
      </div>

      <Tabs.Content value="enabled" class="flex flex-col gap-2">
        <FormInput withDifficulty={false} textarea={false} label="Nome" />

        <FormSwitch
          selected="Dado"
          label="Tipo"
          options={['Dado', 'Classificação']}
          class="w-fit"
        />

        <FormInput withDifficulty={true} textarea={true} label="Fórmula" />
      </Tabs.Content>
      <Tabs.Content value="disabled"></Tabs.Content>
    </Tabs.Root>
  </SubForm>
</div>
