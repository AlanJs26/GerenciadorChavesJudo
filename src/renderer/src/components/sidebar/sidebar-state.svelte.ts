import { gendered } from '@lib/bracket-lib'
import { SvelteMap as Map } from 'svelte/reactivity'

import { bracketsStore, resultTableStore } from '@/states.svelte'

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
  checkedTables = $state(new Map<string, boolean>())
  selectedTables = $derived(
    Array.from(sidebarState.checkedTables.entries())
      .filter(([_hash, checked]) => checked)
      .flatMap(([hash, _checked]) => resultTableStore.tables.filter((table) => table.name == hash))
  )
}

class SidebarStore {
  tab = $state('resultados')
}

export const sidebarStore = new SidebarStore()
export const sidebarState = new SidebarState()
