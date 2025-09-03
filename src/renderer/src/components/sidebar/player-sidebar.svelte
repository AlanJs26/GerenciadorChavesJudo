<script lang="ts">
  import { categoryState, generateAllBrackets } from '@components/bracket-tab/bracket-state.svelte'
  import CategoryDropdown from '@components/category-dropdown.svelte'
  import FileInput from '@components/file-input.svelte'
  import * as RadioGroup from '@components/radio-group'
  import PlayerCard from '@components/sidebar/player-card.svelte'
  // UI Components
  import { Button, buttonVariants } from '@components/ui/button'
  import { Checkbox } from '@components/ui/checkbox'
  import * as ContextMenu from '@components/ui/context-menu'
  import * as DropdownMenu from '@components/ui/dropdown-menu'
  import { Input } from '@components/ui/input'
  import { Label } from '@components/ui/label'
  import { ScrollArea } from '@components/ui/scroll-area'
  import { Separator } from '@components/ui/separator'
  import { gendered } from '@lib/bracket-lib'
  import type { Organization, Player, State } from '@lib/types/bracket-lib'
  import { createContestantId } from '@lib/utils'
  // Icons
  import {
    Bolt,
    Download,
    FileDown,
    FileJson2,
    Loader,
    MoonIcon,
    Save,
    SaveOff,
    SunIcon,
    Trash
  } from '@lucide/svelte'
  // Custom components
  import createFuzzySearch from '@nozbe/microfuzz'
  import type { ExcelOrganizationError, ExcelPlayerError, ResultError } from '@shared/errors'
  import { handleResult } from '@shared/errors'
  import { toggleMode } from 'mode-watcher'
  import { onMount, type Snippet } from 'svelte'
  import { toast } from 'svelte-sonner'

  import ConfirmPopover from '@/components/confirm-popover.svelte'
  import ToastItemList from '@/components/toast-item-list.svelte'
  // Utilities and stores
  import {
    bracketsStore,
    genderStore,
    playersStore,
    resultTableStore,
    winnerStore
  } from '@/states.svelte.ts'

  // ==================== State Variables ====================
  let files: FileList | undefined = $state()
  let fileInputValue: string = $state()
  let organizations: Organization[] = $state([])
  let contextOpen = $state(false)
  let filterText = $state('')
  let autosaveInterval: ReturnType<typeof setInterval> | null = $state(null)
  let configOpen = $state(false)
  let loading = $state(false)
  let autosave = $state(false)

  // ==================== Derived Values ====================
  let nFemale = $derived(playersStore.players.female.length)
  let nMale = $derived(playersStore.players.male.length)

  const fuzzyFn = $derived(
    createFuzzySearch(playersStore.players[genderStore.gender], {
      getText: (player) => [
        `${player.name} ${player.organization}`,
        `${player.organization} ${player.name}`
      ],
      strategy: 'aggressive'
    })
  )

  let filteredPlayers = $derived.by(() => {
    const filtered = fuzzyFn(filterText)
      .toSorted((a, b) => a.score - b.score)
      .map((x) => x.item)
    if (filtered.length == 0 && !filterText) return playersStore.players[genderStore.gender]
    return filtered
  })

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
      winnersByCategory: winnerStore.winnersByCategory,
      resultTables: resultTableStore.tables
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
    autosave = true
  }

  function importState(defaultPath?: string) {
    window.api.importState(defaultPath).then(
      handleResult(
        (state) => {
          playersStore.players = state.players
          bracketsStore.brackets = state.brackets
          winnerStore.winnersByCategory = state.winnersByCategory
          resultTableStore.tables = state.resultTables
          resultTableStore.selectedName = state.resultTables[0].name ?? ''

          updatePlayers()
          enableAutosave()
        },
        (error) => {
          console.error(error)
          toast.error(`${error.name}: ${error.cause?.message}`)
        }
      )
    )
  }

  function updatePlayers() {
    // eslint-disable-next-line svelte/prefer-svelte-reactivity
    const invalidContestantIds = new Set<string>()
    const duplicatedPlayers: string[] = []
    const newPlayers = organizations.reduce(
      (acc, { players, organization }) => {
        for (const player of players) {
          const contestantId = createContestantId(player.name, organization, player.isMale)

          if (invalidContestantIds.has(contestantId)) {
            duplicatedPlayers.push(
              `${player.name}, ${organization}, ${player.isMale ? 'Masculino' : 'Feminino'}`
            )
            continue
          }
          invalidContestantIds.add(contestantId)

          if (contestantId in playersStore.byContestantId) continue

          const gender = player.isMale ? 'male' : 'female'
          acc[gender].push({
            ...player,
            present: true,
            organization,
            contestantId
          })
        }
        return acc
      },
      gendered((gender) => [...playersStore.players[gender]] as Player[])
    )
    if (duplicatedPlayers.length) {
      const formated = Object.entries(Object.groupBy(duplicatedPlayers, (x) => x)).map(
        ([text, items]) => text + (items.length > 1 ? ` (${items.length}x)` : '')
      )
      toast.warning(ToastItemList, {
        componentProps: {
          items: formated,
          title: 'Participantes duplicados não foram inclusos'
        },
        duration: 100000
      })
    }
    // newPlayers.male.sort((a, b) => a.organization.localeCompare(b.organization))
    // newPlayers.female.sort((a, b) => a.organization.localeCompare(b.organization))

    playersStore.players = newPlayers
  }

  // ==================== Error Handling ====================
  function handleImportError(error: ResultError) {
    if (error.name == 'ExcelPlayerError') {
      const { cause } = error as ExcelPlayerError
      toast.error(`Erro ao importar ${cause.file}: ${error.message} (N: ${cause.n})`)
    } else if (error.name == 'ExcelOrganizationError') {
      const { cause } = error as ExcelOrganizationError
      toast.error(`Erro ao importar ${cause.file}: ${error.message} (Cell: ${cause.cell})`)
    } else {
      const { cause } = error
      toast.error(`Erro ao importar ${cause.file}: ${error.message}`)
    }
    console.error('Erro ao importar arquivos:', error)
    return null
  }

  // ==================== Effect for Files Import ====================
  $effect(() => {
    if (!files) return
    ;(async (): Promise<void> => {
      const newOrganizations = await Promise.all(
        Array.from(files).map(async (file) => {
          const result = await window.api.organizationFromFile('nescau', file)
          return result.status == true ? result.data : handleImportError(result.error)
        })
      )
      // Remove arquivos que falharam
      organizations = newOrganizations.flat().filter(Boolean)
      updatePlayers()
    })()
    fileInputValue = ''
  })

  // ==================== Lifecycle Hooks ====================
  onMount(() => {
    importState('~/.chaves-judo/dados.json')
    // organizations = generateRandomOrganizations(4, 50)
    updatePlayers()

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
    <FileInput bind:files bind:value={fileInputValue}>
      <FileDown class="mr-2 h-4 w-4" />
      Importar Fichas
    </FileInput>
  </div>

  <span class="py-2 text-center text-xl font-bold">Presença</span>

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
        <PlayerCard
          bind:player={
            () => playersStore.byContestantId_[filteredPlayers[i].contestantId], () => {}
          }
        />
      {/each}
    </ScrollArea>
  {/snippet}
  {@render contextmenu(playersScrollview)}

  <Separator class="!mb-2" />

  <div class="flex flex-row">
    <CategoryDropdown statefullCategories={categoryState.statefullCategories[genderStore.gender]}>
      <Bolt class="size-4" />
    </CategoryDropdown>

    <Button
      class="w-full rounded-s-none"
      variant="defaultDark"
      onclick={(): void => {
        loading = true
        setTimeout(() => {
          generateAllBrackets()
          loading = false
        }, 500)
        // bracketRenderer.update()
        // enableAutosave()
      }}>Atualizar Chaves</Button
    >
  </div>
</div>

{#if loading}
  <div
    class="fixed top-0 z-10 flex h-screen w-screen flex-col items-center justify-center gap-10 backdrop-blur-xs"
  >
    <h1 class="text-2xl">Criando chaves. Aguarde.</h1>
    <Loader class="size-10 animate-spin" style="animation-duration: 1.5s" />
  </div>
{/if}

{#snippet configDropdown()}
  <DropdownMenu.Root bind:open={configOpen}>
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
            if (!autosave) {
              enableAutosave()
            } else {
              console.log('Desligando Autosave')
              window.clearInterval(autosaveInterval)
              autosave = false
            }
          }}
        >
          {#if !autosave}
            <Save class="h-4 w-4" />
            <span>Ligar Autosave</span>
          {:else}
            <SaveOff class="h-4 w-4" />
            <span>Desligar Autosave</span>
          {/if}
        </DropdownMenu.Item>
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

        <ConfirmPopover
          class="w-full"
          title="Continuar?"
          description="Isso irá apagar todos os dados atuais"
          onNo={() => (configOpen = false)}
          onYes={() => {
            playersStore.clear()
            bracketsStore.clear()
            winnerStore.clear()
            organizations = []

            configOpen = false
          }}
        >
          <DropdownMenu.Item
            closeOnSelect={false}
            class="bg-destructive hover:bg-destructive/70 text-destructive-foreground"
          >
            <Trash class="h-4 w-4" />
            <span>Apagar Sessão</span>
          </DropdownMenu.Item>
        </ConfirmPopover>
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
  <ContextMenu.Root bind:open={contextOpen}>
    <ContextMenu.Trigger class="flex min-h-0 flex-1 flex-col">
      {@render trigger()}
    </ContextMenu.Trigger>

    <ContextMenu.Content class="z-10 flex flex-1 flex-col p-3" updatePositionStrategy="always">
      <ContextMenu.Group class="flex w-full cursor-pointer flex-row items-center">
        <Checkbox
          id="player-checkbox"
          aria-labelledby="player-checkbox-label"
          class="cursor-pointer"
          bind:checked={
            () => filteredPlayers.every((p) => p.present),
            () => {
              const AllChecked = filteredPlayers.every((p) => p.present)
              filteredPlayers.forEach((player) => {
                playersStore.byContestantId_[player.contestantId].present = !AllChecked
              })
              contextOpen = false
            }
          }
        />
        <Label
          id="player-checkbox-label"
          for="player-checkbox"
          class="!ml-2 cursor-pointer text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Alternar Tudo
        </Label>
      </ContextMenu.Group>
    </ContextMenu.Content>
  </ContextMenu.Root>
{/snippet}
