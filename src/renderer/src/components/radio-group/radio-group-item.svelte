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
  @reference '../../assets/main.css';

  .radio-item {
    @apply text-muted-foreground/70 cursor-pointer;
    border-radius: 5px;
    padding: 5px;
    background: transparent;
    width: 100%;
    text-align: center;
    transition:
      color 100ms ease,
      background-color 100ms ease;

    & input {
      appearance: none;
    }

    &:hover {
      @apply bg-primary/10;
    }
    &:has(input:checked) {
      @apply bg-background text-foreground cursor-default shadow-md;
    }
  }
</style>
