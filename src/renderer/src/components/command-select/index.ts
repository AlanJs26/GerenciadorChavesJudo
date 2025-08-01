import Item from '@components/ui/command/command-item.svelte'
import CommandSelect from './CommandSelect.svelte'
import type { Snippet } from 'svelte'

export interface SelectItem<T = unknown> {
  label: string
  value: T
  snippet?: Snippet
}

export default CommandSelect
export { Item, CommandSelect }
