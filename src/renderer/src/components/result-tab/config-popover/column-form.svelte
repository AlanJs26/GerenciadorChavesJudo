<script lang="ts">
  import FormInput from '@components/result-tab/config-popover/form-input.svelte'
  import FormSwitch from '@components/result-tab/config-popover/form-switch.svelte'
  import { cn } from '@lib/utils'

  let {
    class: className,
    name = $bindable('')
  }: {
    name: string
    class?: string
  } = $props()
</script>

<div class={cn('flex flex-1 flex-col gap-2', className)}>
  <FormInput withDifficulty={false} textarea={false} label="Nome" bind:value={name} />

  <FormSwitch label="Tipo" options={['Dado', 'Classificação']} class="w-fit" />

  <FormInput withDifficulty={false} textarea={true} label="Fórmula" />

  <FormInput withDifficulty={false} textarea={true} label="Filtro" />
</div>
