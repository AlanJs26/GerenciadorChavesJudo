<script lang="ts">
  import type { Snippet } from 'svelte'

  let { files = $bindable(), children }: { files: FileList | undefined; children: Snippet } =
    $props()

  import { Button } from '@components/ui/button'

  let fileInput: HTMLInputElement
</script>

<div>
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
    bind:this={fileInput}
    accept=".xlsx,.gsheet"
    multiple
  />
</div>
