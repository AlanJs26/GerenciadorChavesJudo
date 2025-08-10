import Item from '@components/ui/command/command-item.svelte'
import type { Snippet } from 'svelte'

import CommandSelect from './CommandSelect.svelte'

export interface SelectItem<T = unknown> {
  label: string
  value: T
  snippet?: Snippet
}

export default CommandSelect
export { CommandSelect, Item }
