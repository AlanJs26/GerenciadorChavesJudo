<script lang="ts">
  import { Label } from '@components/ui/label'
  import { cn } from '@lib/utils'
  import { type Snippet } from 'svelte'

  let {
    class: className,
    children,
    label
  }: {
    children?: Snippet
    class?: string
  } = $props()
</script>

<div class={cn('items-top flex gap-2', className)}>
  <Label class="!mt-2 min-w-10 text-sm/tight font-bold">{label}</Label>

  <div class="flex-1">
    {@render children?.()}
  </div>
</div>
