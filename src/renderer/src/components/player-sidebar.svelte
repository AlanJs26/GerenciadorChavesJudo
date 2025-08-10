<script lang="ts">
  import { categoryState, generateAllBrackets } from '@components/bracket-tab/bracket-state.svelte'
  // Custom components
  import CategoryDropdown from '@components/category-dropdown.svelte'
  import FileInput from '@components/file-input.svelte'
  import PlayerCard from '@components/player-card.svelte'
  import * as RadioGroup from '@components/radio-group'
  // UI Components
  import { Button, buttonVariants } from '@components/ui/button'
  import { Checkbox } from '@components/ui/checkbox'
  import * as ContextMenu from '@components/ui/context-menu'
  import * as DropdownMenu from '@components/ui/dropdown-menu'
  import { Input } from '@components/ui/input'
  import { Label } from '@components/ui/label'
  import { ScrollArea } from '@components/ui/scroll-area'
  import { Separator } from '@components/ui/separator'
  import { gendered, generateRandomOrganizations } from '@lib/bracket-lib'
  import type { Organization, Player, State } from '@lib/types/bracket-lib'
  import { addInvalidContestantIds, randomContestantId } from '@lib/utils'
  // Icons
  import { Bolt, Download, FileDown, FileJson2, MoonIcon, SunIcon } from '@lucide/svelte'
  import type { ExcelOrganizationError, ExcelPlayerError, ResultError } from '@shared/errors'
  import { handleResult } from '@shared/errors'
  import { toggleMode } from 'mode-watcher'
  import { onMount, type Snippet, untrack } from 'svelte'
  import { toast } from 'svelte-sonner'

  // Utilities and stores
  import { bracketsStore, genderStore, playersStore, winnerStore } from '@/states.svelte.ts'

  // ==================== State Variables ====================
  let files: FileList | undefined = $state()
  let organizations: Organization[] = $state([])
  let filterText = $state('')
  let autosaveInterval: ReturnType<typeof setInterval> | null = $state(null)

  // ==================== Effect Handlers ====================
  // Process organizations into players
  $effect(() => {
    const newPlayers = organizations.reduce(
      (acc, org) => {
        for (const player of org.players) {
          const gender = player.isMale ? 'male' : 'female'
          acc[gender].push({
            ...player,
            organization: org.organization,
            present: true,
            contestantId: randomContestantId()
          })
        }
        return acc
      },
      gendered(() => [] as Player[])
    )
    untrack(() => {
      newPlayers.male.sort((a, b) => a.organization.localeCompare(b.organization))
      newPlayers.female.sort((a, b) => a.organization.localeCompare(b.organization))

      playersStore.players = newPlayers
    })
  })

  // ==================== Derived Values ====================
  let nFemale = $derived(playersStore.players.female.length)
  let nMale = $derived(playersStore.players.male.length)

  // Apply text normalization once instead of twice
  let normalizedFilterText = $derived(
    filterText
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
  )

  let filteredPlayers = $derived(
    playersStore.players[genderStore.gender].filter((player) =>
      player.name
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase()
        .includes(normalizedFilterText)
    )
  )

  // ==================== Functions ====================

  function handleAutosaveExport(state: State, path: string) {
    console.log(`Autosave: ${path}`)
    window.api.exportState(JSON.stringify(state), path).then(
      handleResult(undefined, (error) => {
        console.error(error)
        toast.error(`Erro ao salvar automaticamente: ${error.cause?.message}`)
      })
    )
  }

  function handleManualExport(state: State) {
    window.api.exportState(JSON.stringify(state)).then(
      handleResult(
        () => {
          toast.success('Exportado com sucesso!')
        },
        (error) => {
          console.error(error)
          toast.error(`Erro de exportação: ${error.cause?.message}`)
        }
      )
    )
  }

  function exportState(defaultPath?: string) {
    const state: State = {
      brackets: bracketsStore.brackets,
      players: playersStore.players,
      winnersByCategory: winnerStore.winnersByCategory
    }

    // Separate handlers for autosave vs manual export
    if (defaultPath) {
      handleAutosaveExport(state, defaultPath)
    } else {
      handleManualExport(state)
    }
  }

  function enableAutosave() {
    console.log('Autosave ativado!')
    if (autosaveInterval === null) {
      autosaveInterval = setInterval(() => {
        exportState('~/.chaves-judo/dados.json')
      }, 60000)
    }
  }

  function importState(defaultPath?: string) {
    window.api.importState(defaultPath).then(
      handleResult(
        (state) => {
          playersStore.players = state.players
          bracketsStore.brackets = state.brackets
          winnerStore.winnersByCategory = state.winnersByCategory
          addInvalidContestantIds(Object.keys(playersStore.byContestantId))
          enableAutosave()
        },
        (error) => {
          console.error(error)
          toast.error(`${error.name}: ${error.cause?.message}`)
        }
      )
    )
  }

  // ==================== Error Handling ====================
  function handleImportError(error: ResultError) {
    if (error.name == 'ExcelPlayerError') {
      const { cause } = error as ExcelPlayerError
      toast.error(`Erro ao importar ${cause.file}: ${error.message} (N: ${cause.n})`)
    } else if (error.name == 'ExcelOrganizationError') {
      const { cause } = error as ExcelOrganizationError
      toast.error(`Erro ao importar ${cause.file}: ${error.message} (Cell: ${cause.cell})`)
    }
    console.error('Erro ao importar arquivos:', error.cause)
    return null
  }

  // ==================== Effect for Files Import ====================
  $effect(() => {
    if (!files) return
    ;(async (): Promise<void> => {
      organizations = await Promise.all(
        Array.from(files).map(async (file) => {
          const result = await window.api.organizationFromFile(file)
          return result.status == true ? result.data : handleImportError(result.error)
        })
      )
      // Remove arquivos que falharam
      organizations = organizations.filter(Boolean)
    })()
  })

  // ==================== Lifecycle Hooks ====================
  onMount(() => {
    // importState('~/.chaves-judo/dados.json')
    organizations = generateRandomOrganizations(4, 50)

    // Clear all previous intervals
    clearAllIntervals()
  })

  // Helper function to clear all intervals
  function clearAllIntervals() {
    // Get a reference to the last interval + 1
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const interval_id = window.setInterval(function () {}, Number.MAX_SAFE_INTEGER)

    // Clear any timeout/interval up to that id
    for (let i = 1; i < interval_id; i++) {
      window.clearInterval(i)
    }
  }
</script>

<div class="bg-background flex h-full w-full flex-col border-r p-1">
  <div class="flex w-full flex-row">
    {@render configDropdown()}
    <FileInput bind:files>
      <FileDown class="mr-2 h-4 w-4" />
      Importar Fichas
    </FileInput>
  </div>

  <RadioGroup.Root bind:value={genderStore.radio} class="!mt-1">
    <RadioGroup.Item value="Feminino">
      {nFemale} Feminino
    </RadioGroup.Item>
    <RadioGroup.Item value="Masculino">
      {nMale} Masculino
    </RadioGroup.Item>
  </RadioGroup.Root>

  <Input id="busca" class="!my-1 w-full" placeholder="Filtrar Nomes..." bind:value={filterText} />

  <Separator />

  {#snippet playersScrollview()}
    <ScrollArea class="flex flex-1 flex-col" type="auto">
      {#each filteredPlayers as _player, i (_player.contestantId)}
        <PlayerCard bind:player={() => filteredPlayers[i], () => {}} />
      {/each}
    </ScrollArea>
  {/snippet}
  {@render contextmenu(playersScrollview)}

  <Separator class="!mb-2" />

  <div class="flex flex-row">
    <CategoryDropdown statefullCategories={categoryState.statefullCategories[genderStore.gender]}>
      <Bolt class="h-4 w-4" />
    </CategoryDropdown>

    <Button
      class="w-full rounded-s-none"
      variant="defaultDark"
      onclick={(): void => {
        generateAllBrackets()
        // bracketRenderer.update()
        // enableAutosave()
      }}>Atualizar Chaves</Button
    >
  </div>
</div>

{#snippet configDropdown()}
  <DropdownMenu.Root>
    <DropdownMenu.Trigger class={buttonVariants({ variant: 'outline' })}>
      <Bolt class="h-4 w-4" />
    </DropdownMenu.Trigger>
    <DropdownMenu.Content class="w-56">
      <DropdownMenu.Group>
        <DropdownMenu.DropdownMenuGroupHeading class="!font-bold"
          >Sessão</DropdownMenu.DropdownMenuGroupHeading
        >
        <DropdownMenu.Item
          onclick={() => {
            importState()
          }}
        >
          <FileJson2 class="h-4 w-4" />
          <span>Importar Sessão Anterior</span>
        </DropdownMenu.Item>

        <DropdownMenu.Item
          onclick={() => {
            exportState()
          }}
        >
          <Download class="h-4 w-4" />
          <span>Exportar Sessão</span>
        </DropdownMenu.Item>
      </DropdownMenu.Group>

      <DropdownMenu.Group>
        <DropdownMenu.Separator />
        <DropdownMenu.DropdownMenuGroupHeading class="!font-bold"
          >Tema</DropdownMenu.DropdownMenuGroupHeading
        >

        <DropdownMenu.Item
          closeOnSelect={false}
          onclick={() => {
            document.startViewTransition(() => {
              toggleMode()
            })
          }}
        >
          <SunIcon
            class="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 !transition-all dark:scale-0 dark:-rotate-90"
          />
          <MoonIcon
            class="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 !transition-all dark:scale-100 dark:rotate-0"
          />
          <span>Mudar Tema</span>
        </DropdownMenu.Item>
      </DropdownMenu.Group>
    </DropdownMenu.Content>
  </DropdownMenu.Root>
{/snippet}

{#snippet contextmenu(trigger: Snippet)}
  <ContextMenu.Root>
    <ContextMenu.Trigger class="flex min-h-0 flex-1 flex-col">
      {@render trigger()}
    </ContextMenu.Trigger>

    <ContextMenu.Content class="flex flex-1 flex-col p-3" updatePositionStrategy="always">
      <ContextMenu.Group class="flex w-full cursor-pointer flex-row items-center">
        <Checkbox
          id="player-checkbox"
          aria-labelledby="player-checkbox-label"
          bind:checked={
            () => filteredPlayers.every((p) => p.present),
            () => {
              const AllChecked = filteredPlayers.every((p) => p.present)
              filteredPlayers.forEach((_, i) => {
                filteredPlayers[i].present = !AllChecked
              })
            }
          }
        />
        <Label
          id="player-checkbox-label"
          for="player-checkbox"
          class="ml-2 text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Alternar Tudo
        </Label>
      </ContextMenu.Group>
    </ContextMenu.Content>
  </ContextMenu.Root>
{/snippet}
