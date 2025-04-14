<script lang="ts">
  import { getContext, type Snippet } from 'svelte'
  const context = getContext<{ group: string }>('RADIO_GROUP')

  let { value = '', children }: { value: string; children: Snippet } = $props()
</script>

<label class="radio-item">
  <input type="radio" name="radio-group" {value} bind:group={context.group} />
  {@render children?.()}
</label>

<style>
  .radio-item {
    border-radius: 5px;
    padding: 5px;
    background: transparent;
    width: 100%;
    text-align: center;
    cursor: pointer;
    color: rgba(0, 0, 0, 60%);
    transition:
      color 100ms ease,
      background-color 100ms ease;

    & input {
      appearance: none;
    }

    &:hover {
      background: #ffffff48;
    }
    &:has(input:checked) {
      background: #ffffff;
      box-shadow: 0 0 5px #00000015;
      color: black;
    }
  }
</style>
