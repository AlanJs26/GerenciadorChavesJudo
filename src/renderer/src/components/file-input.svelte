<script lang="ts">
  import type { Snippet } from 'svelte'

  let {
    files = $bindable(),
    value = $bindable(),
    children
  }: { files: FileList | undefined; value: string; children: Snippet } = $props()

  import { Button } from '@components/ui/button'

  let fileInput: HTMLInputElement
</script>

<div class="flex-1">
  <Button
    id="file"
    variant="outline"
    class="mb-2 w-full"
    onclick={(): void => {
      fileInput.click()
    }}
  >
    {@render children?.()}
  </Button>
  <input
    type="file"
    style="display: none;"
    bind:files
    bind:value
    bind:this={fileInput}
    accept=".xlsx,.gsheet"
    multiple
  />
</div>
