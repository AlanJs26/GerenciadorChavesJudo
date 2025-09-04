<script lang="ts">
  import { Label } from '@components/ui/label'
  import { cn } from '@lib/utils'
  import { type Snippet } from 'svelte'

  let {
    class: className,
    children,
    label,
    labelFor = ''
  }: {
    children?: Snippet
    class?: string
    label: string
    labelFor: string
  } = $props()
</script>

<div class={cn('items-top flex gap-2', className)}>
  <Label for={labelFor} class="min-w-10 self-center text-sm/tight font-bold">{label}</Label>

  <div class="flex-1">
    {@render children?.()}
  </div>
</div>
