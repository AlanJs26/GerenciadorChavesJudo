import { gendered } from '@lib/bracket-lib'
import { SvelteMap as Map } from 'svelte/reactivity'

import { bracketsStore } from '@/states.svelte'

class SidebarState {
  checkedBrackets = $state({
    female: new Map<string, boolean>(),
    male: new Map<string, boolean>()
  })
  selected = $derived(
    gendered((gender) =>
      Array.from(sidebarState.checkedBrackets[gender].entries())
        .filter(([_hash, checked]) => checked)
        .map(([hash, _checked]) => bracketsStore.get_(gender, hash)!)
    )
  )
}

export const sidebarState = new SidebarState()
