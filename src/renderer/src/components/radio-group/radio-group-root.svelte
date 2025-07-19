<script lang="ts">
  import { setContext, type Snippet } from 'svelte'
  import { cn } from '@lib/utils'

  let {
    group = $bindable(),
    class: className = '',
    children
  }: { group: string; class: string; children: Snippet } = $props()

  // Define o contexto para compartilhar o valor selecionado com os itens filhos
  setContext('RADIO_GROUP', {
    get group() {
      return group
    },
    set group(v) {
      group = v
    }
  })
</script>

<div class={cn(className, 'radio-group bg-secondary')}>
  {@render children?.()}
</div>

<style>
  .radio-group {
    display: flex;
    flex-direction: row;
    justify-content: space-around;
    padding: 5px;
    border-radius: 5px;
  }
</style>
