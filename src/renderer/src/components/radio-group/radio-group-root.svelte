<script lang="ts">
  import { setContext, type Snippet } from 'svelte'
  let { group = $bindable(), children }: { group: string; children: Snippet } = $props()

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

<div class="radio-group">
  {@render children?.()}
</div>

<style>
  .radio-group {
    display: flex;
    flex-direction: row;
    justify-content: space-around;
    background-color: #0000001c;
    padding: 5px;
    border-radius: 5px;
  }
</style>
