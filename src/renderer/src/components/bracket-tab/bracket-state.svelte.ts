import { createGroupedBrackets, gendered } from '@lib/bracket-lib'
import type { Gender, Gendered, StatefullCategory, Tag } from '@lib/types/bracket-lib'
import { compareObject, isSubsetOf } from '@lib/utils'
import { SvelteSet as Set } from 'svelte/reactivity'

import { bracketsStore, genderStore, playersStore, winnerStore } from '@/states.svelte'

class CategoryState {
  statefullCategories: Gendered<StatefullCategory[]> = $derived(
    gendered((gender) =>
      playersStore.categories[gender].map((category) => ({
        category,
        state: true
      }))
    )
  )

  tagOrder: string[] = $state([])
  orderedTagValues = $derived(
    this.tagOrder.map((tagId, i) => {
      if (i == 0 && tagId in bracketsStore.tagById[genderStore.gender]) {
        return bracketsStore.tagById[genderStore.gender][tagId].map((t) => t.value)
      }
      return [
        ...new Set(
          computePossibleTags(tagId, bracketsStore.selectedCategory.slice(0, i)).map(
            (tag) => tag.value
          )
        )
      ].toSorted()
    })
  )
}

export function generateAllBrackets(): void {
  // Generate brackets for each category and gender
  bracketsStore.clear()
  winnerStore.clear()
  for (const [gender, statefullCategory] of Object.entries(categoryState.statefullCategories)) {
    for (const { category, state } of statefullCategory) {
      if (!state) continue

      const players = playersStore
        .get(gender as Gender, category)
        ?.filter((player) => player.present)

      if (!players || players.length === 0) continue

      const groupedBrackets = createGroupedBrackets(players)

      for (const bracket of groupedBrackets) {
        bracketsStore.setTagged(gender as Gender, bracket)
      }
    }
  }

  for (const [gender, categories] of Object.entries(bracketsStore.categories)) {
    for (const category of categories) {
      winnerStore.set(gender as Gender, category, { matches: {}, winners: [], dirty: false })
    }
  }
}

export const categoryState = new CategoryState()

function computePossibleTags(tagId: string, selected: Tag[]): Tag[] {
  const relevantBrackets = bracketsStore.brackets[genderStore.gender].filter((bracket) =>
    isSubsetOf(selected, bracket.category, (a, b) => compareObject(a, b))
  )
  return relevantBrackets.flatMap((bracket) => bracket.category.filter((tag) => tag.id == tagId))
}

export function findValidCategory(tagOrder: string[], constraints?: Tag[]) {
  if (!tagOrder?.length) return null

  const gender = genderStore.gender
  const availableTags = bracketsStore.tagById[gender]

  const newSelection: Tag[] = [...(constraints ?? []).map((t) => ({ ...t }))]

  for (let i = 0; i < tagOrder.length; i++) {
    const tagId = tagOrder[i]

    // If funtion is called with constraints, prevent duplicated tagIds
    if (constraints != undefined && newSelection.find((t) => t.id == tagId)) {
      continue
    }

    if (!(tagId in availableTags)) {
      throw Error(`tag "${tagId}" id does not exist for gender "${gender}"`)
    }

    if (availableTags[tagId].length == 0) continue

    if (newSelection.length == 0) {
      newSelection.push(availableTags[tagId][0])
      continue
    }

    const possibleTags = computePossibleTags(tagId, newSelection)

    if (possibleTags.length == 0) {
      continue
    }

    newSelection.push(possibleTags[0])
  }
  if (!bracketsStore.get(gender, newSelection)) {
    // console.warn(
    //   'Could not find a valid Bracket given the tag order:',
    //   $state.snapshot(tagOrder),
    //   'and constraints',
    //   $state.snapshot(constraints ?? [])
    // )
    return null
  }
  return newSelection
}
export function setSelectedCategory(category: Tag[]): Tag[] {
  const gender = genderStore.gender

  // const tagById = bracketsStore.tagById[gender]
  // const tagIds = Object.keys(tagById)
  // // keep tagIds already included in new tagIds, and remove any tagId not present in new tagIds
  // categoryState.tagOrder = [
  //   ...categoryState.tagOrder.filter((tagId) => tagIds.includes(tagId)),
  //   ...tagIds.filter((tagId) => !categoryState.tagOrder.includes(tagId))
  // ]

  if (bracketsStore.get(gender, category)) {
    bracketsStore.selectedCategory = category
    return category
  } else {
    let newSelection = findValidCategory(categoryState.tagOrder, category)
    for (let i = -1; i >= -category.length; i--) {
      if (newSelection != null) break

      const contraints = category.slice(0, i)
      newSelection = findValidCategory(categoryState.tagOrder, contraints)
    }

    if (!newSelection || !bracketsStore.has(gender, newSelection)) {
      console.error('Invalid selected category', newSelection)
      return bracketsStore.selectedCategory
    } else {
      bracketsStore.selectedCategory = newSelection
      return newSelection
    }
  }
}
