<script lang="ts">
  import { mode } from 'mode-watcher'
  import { Toaster as Sonner, type ToasterProps as SonnerProps } from 'svelte-sonner'

  let { ...restProps }: SonnerProps = $props()
</script>

<Sonner
  theme={mode.current}
  class="toaster group"
  toastOptions={{
    classes: {
      toast:
        'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
      description: 'group-[.toast]:text-muted-foreground',
      actionButton: 'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
      cancelButton: 'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
      error: '!bg-destructive !text-destructive-foreground',
      success: '!bg-emerald-700 !text-neutral-50',
      warning: '!bg-amber-700 !text-neutral-50'
    }
  }}
  {...restProps}
/>
