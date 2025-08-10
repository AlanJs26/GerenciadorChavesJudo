<script lang="ts">
  import FormInput from '@components/result-tab/config-popover/form-input.svelte'
  import FormSwitch from '@components/result-tab/config-popover/form-switch.svelte'
  import SubForm from '@components/result-tab/config-popover/sub-form.svelte'
  import * as Tabs from '@components/ui/tabs'
  import { cn } from '@lib/utils'

  let {
    class: className,
    name = $bindable(''),
    type = $bindable<'data' | 'order'>('data'),
    formulaValue = $bindable(''),
    formulaDifficulty = $bindable<'simple' | 'advanced'>('simple'),
    groups = $bindable<string[]>(['Peso']),
    totalEnabled = $bindable(true),
    totalName = $bindable('Total'),
    totalType = $bindable<'data' | 'order'>('data'),
    totalFormulaValue = $bindable(''),
    totalFormulaDifficulty = $bindable<'simple' | 'advanced'>('simple')
  }: {
    class?: string
    name?: string
    type?: 'data' | 'order'
    formulaValue?: string
    formulaDifficulty?: 'simple' | 'advanced'
    groups?: string[]
    totalEnabled?: boolean
    totalName?: string
    totalType?: 'data' | 'order'
    totalFormulaValue?: string
    totalFormulaDifficulty?: 'simple' | 'advanced'
  } = $props()

  // Labels intermediárias para switches de tipo
  let selectedLabel = $state(type === 'data' ? 'Dado' : 'Classificação')
  $effect(() => {
    type = selectedLabel === 'Dado' ? 'data' : 'order'
  })
  let totalSelectedLabel = $state(totalType === 'data' ? 'Dado' : 'Classificação')
  $effect(() => {
    totalType = totalSelectedLabel === 'Dado' ? 'data' : 'order'
  })

  // Tabs value para total habilitado
  let totalTabsValue = $state(totalEnabled ? 'enabled' : 'disabled')
  $effect(() => {
    totalEnabled = totalTabsValue === 'enabled'
  })
</script>

<div class={cn('flex flex-1 flex-col gap-2', className)}>
  <FormInput withDifficulty={false} textarea={false} label="Nome" bind:value={name} />

  <FormSwitch
    bind:selected={selectedLabel}
    label="Tipo"
    options={['Dado', 'Classificação']}
    class="w-fit"
  />

  <FormInput
    withDifficulty={true}
    textarea={true}
    label="Fórmula"
    bind:value={formulaValue}
    bind:difficulty={formulaDifficulty}
  />

  <h1 class="!mt-3 text-3xl">Agregar</h1>

  <SubForm containerclass="border-1" bind:items={groups}>
    <Tabs.Root bind:value={totalTabsValue} class={cn('flex w-full flex-col gap-5', className)}>
      <div class="flex items-baseline gap-2">
        <h1 class="text-3xl">Coluna de Total</h1>

        <Tabs.List class="grid grid-cols-2 self-end p-[0.1rem] leading-0">
          <Tabs.Trigger class="px-2 py-2.5 text-[10pt]" value="enabled">Ativado</Tabs.Trigger>
          <Tabs.Trigger class="px-2 py-2.5 text-[10pt]" value="disabled">Desativado</Tabs.Trigger>
        </Tabs.List>
      </div>

      <Tabs.Content value="enabled" class="flex flex-col gap-2">
        <FormInput withDifficulty={false} textarea={false} label="Nome" bind:value={totalName} />

        <FormSwitch
          bind:selected={totalSelectedLabel}
          label="Tipo"
          options={['Dado', 'Classificação']}
          class="w-fit"
        />

        <FormInput
          withDifficulty={true}
          textarea={true}
          label="Fórmula"
          bind:value={totalFormulaValue}
          bind:difficulty={totalFormulaDifficulty}
        />
      </Tabs.Content>
      <Tabs.Content value="disabled"></Tabs.Content>
    </Tabs.Root>
  </SubForm>
</div>
