<script lang="ts">
  import { onMount, type Snippet } from 'svelte'
  import type { ExcelOrganizationError, ExcelPlayerError, ResultError } from '@shared/errors'

  import type { Organization, Player, State } from '@lib/types/bracket-lib'

  import { Bolt, FileDown, FileJson2, Download } from '@lucide/svelte'
  import { Button, buttonVariants } from '@/components/ui/button'
  import { ScrollArea } from '@components/ui/scroll-area'
  import { Input } from '@components/ui/input'
  import * as Tabs from '@components/ui/tabs'
  import * as DropdownMenu from '@components/ui/dropdown-menu'
  import * as ContextMenu from '@components/ui/context-menu'
  import { Separator } from '@components/ui/separator'
  import { Toaster } from '@components/ui/sonner'
  import { Checkbox } from '@components/ui/checkbox'
  import { Label } from '@components/ui/label'
  import { toast } from 'svelte-sonner'

  import * as RadioGroup from '@components/radio-group'
  import PlayerCard from '@components/PlayerCard.svelte'
  import Bracket from '@components/Bracket.svelte'
  import FileInput from '@components/FileInput.svelte'
  import CategoryDropdown from '@components/CategoryDropdown.svelte'
  import PlayerTab from '@components/player-tab/PlayerTab.svelte'

  import { buildBracket } from '@lib/bracket-lib'
  import { playersStore, bracketsStore, winnerStore } from './states.svelte'
  import { randomContestantId } from '@lib/utils'
  import { handleResult } from '@shared/errors'

  // ==================== DOM References ====================
  let bracketRenderer: Bracket

  // ==================== State Variables ====================
  let files: FileList | undefined = $state()
  let radio_sex = $state('Feminino')
  let currentCategory = $state('')
  let organizations: Organization[] = $state([])
  let filterText = $state('')
  let autosaveInterval: ReturnType<typeof setInterval> | null = $state(null)

  // ==================== Computed Values ====================
  let isMale = $derived(radio_sex === 'Masculino')
  const gender = $derived(isMale ? 'male' : 'female')

  $effect(() => {
    playersStore.players = organizations
      .reduce((acc: Player[], org) => {
        return acc.concat(
          org.players.map((player) => ({
            ...player,
            organization: org.organization,
            present: true,
            contestantId: randomContestantId()
          }))
        )
      }, [])
      .sort((a, b) => a.organization.localeCompare(b.organization))
  })

  let nFemale = $derived(playersStore.players.filter((player) => !player.isMale).length)
  let nMale = $derived(playersStore.players.filter((player) => player.isMale).length)
  let filteredPlayers = $derived(
    playersStore.players.filter(
      (player) =>
        player.isMale == isMale &&
        player.name
          .normalize('NFD')
          .replace(/\p{Diacritic}/gu, '')
          .toLowerCase()
          .includes(
            filterText
              .normalize('NFD')
              .replace(/\p{Diacritic}/gu, '')
              .toLowerCase()
          )
    )
  )
  let categories = $derived(
    Array.from(
      new Set(
        playersStore.players
          .map((player) => `${player.category}¨${player.isMale}`)
          .concat(Object.keys(bracketsStore.brackets[gender]).map((c) => `${c}¨${isMale}`))
      )
    )
      .map((key) => {
        const [category, isMale] = key.split('¨')
        return { category, isMale: isMale === 'true', state: false }
      })
      .sort((a, b) => a.category.localeCompare(b.category))
  )

  // ==================== State Update Functions ====================
  function generateAllBrackets(): void {
    // Generate brackets for each category and gender
    for (const { category, state, isMale } of categories) {
      if (!state) continue

      const genderPlayers = playersStore.players.filter(
        (player) => player.present && player.category === category && player.isMale === isMale
      )

      if (genderPlayers.length === 0) continue

      function splitEvenly<T>(list: T[], nGroups: number): T[][] {
        const result: T[][] = Array.from({ length: nGroups }, () => [])
        for (let i = 0; i < list.length; i++) {
          result[i % nGroups].push(list[i])
        }
        return result
      }

      const maxChunk = 8
      const nChunks = Math.ceil(genderPlayers.length / maxChunk)
      const chunks = splitEvenly(genderPlayers, nChunks)

      const letterGen = (n) => {
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
        return letters[n % letters.length]
      }
      for (const [i, chunk] of chunks.entries()) {
        const categoryName = chunks.length > 1 ? `${category} (${letterGen(i)})` : category
        for (const player of chunk) {
          player.category = categoryName
        }
        bracketsStore.brackets[isMale ? 'male' : 'female'][categoryName] = buildBracket(chunk)
      }
    }
    winnerStore.winnersByCategory = Object.fromEntries(
      Array.from(categories, (c) => [c.category, { matches: {}, winners: [] }])
    )
  }

  function exportState(defaultPath?: string) {
    const state: State = {
      brackets: bracketsStore.brackets,
      players: playersStore.players,
      winnersByCategory: winnerStore.winnersByCategory
    }
    if (defaultPath) {
      console.log(`Autosave: ${defaultPath}`)
      window.api.exportState(JSON.stringify(state), defaultPath).then(
        handleResult(undefined, (error) => {
          console.error(error)
          toast.error(`Erro ao salvar automaticamente: ${error.cause?.message}`)
        })
      )
    } else {
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
          enableAutosave()
        },
        (error) => {
          console.error(error)
          toast.error(`${error.name}: ${error.cause?.message}`)
        }
      )
    )
  }

  // ==================== Lifecycle Hooks ====================

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

  onMount(() => {
    importState('~/.chaves-judo/dados.json')

    // Get a reference to the last interval + 1
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const interval_id = window.setInterval(function () {}, Number.MAX_SAFE_INTEGER)

    // Clear any timeout/interval up to that id
    for (let i = 1; i < interval_id; i++) {
      window.clearInterval(i)
    }
  })
</script>

<Toaster />

{#snippet importDropdown()}
  <DropdownMenu.Root>
    <DropdownMenu.Trigger class={buttonVariants({ variant: 'outline' })}>
      <Bolt class="h-4 w-4" />
    </DropdownMenu.Trigger>
    <DropdownMenu.Content class="w-56">
      <DropdownMenu.Group>
        <DropdownMenu.DropdownMenuGroupHeading>Outras Formas</DropdownMenu.DropdownMenuGroupHeading>
        <DropdownMenu.Separator />
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
    </DropdownMenu.Content>
  </DropdownMenu.Root>
{/snippet}

<main>
  <aside class="p-1">
    <div class="flex w-full flex-row">
      {@render importDropdown()}
      <FileInput bind:files>
        <FileDown class="mr-2 h-4 w-4" />
        Importar Fichas
      </FileInput>
    </div>

    <RadioGroup.Root bind:group={radio_sex}>
      <RadioGroup.Item value="Feminino">
        {nFemale} Feminino
      </RadioGroup.Item>
      <RadioGroup.Item value="Masculino">
        {nMale} Masculino
      </RadioGroup.Item>
    </RadioGroup.Root>

    <Input id="busca" class="w-100" placeholder="Filtrar Nomes..." bind:value={filterText} />

    <Separator class="my-2" />

    {#snippet playersScrollview()}
      <ScrollArea class="flex flex-1 flex-col" type="auto">
        {#each filteredPlayers as _player, i}
          <PlayerCard bind:player={() => filteredPlayers[i], () => {}} />
        {/each}
      </ScrollArea>
    {/snippet}
    {@render contextmenu(playersScrollview)}

    <Separator class="my-2" />

    <div class="flex flex-row">
      <CategoryDropdown categories={categories.filter((c) => c.isMale == isMale)}>
        <Bolt class="h-4 w-4" />
      </CategoryDropdown>

      <Button
        class="w-full rounded-s-none"
        onclick={(): void => {
          generateAllBrackets()
          bracketRenderer.update()
          enableAutosave()
        }}>Atualizar Chaves</Button
      >
    </div>
  </aside>

  <div class="tabs-container">
    <Tabs.Root value="chaves" class="h-full w-full">
      <Tabs.List class="grid w-full grid-cols-2">
        <Tabs.Trigger value="participantes">Participantes</Tabs.Trigger>
        <Tabs.Trigger value="chaves">Chaves</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="participantes" class="h-[calc(100%-10em)]">
        <PlayerTab />
      </Tabs.Content>
      <Tabs.Content value="chaves" class="mt-0 h-full w-full">
        <Bracket bind:this={bracketRenderer} category={currentCategory} {isMale} />
      </Tabs.Content>
    </Tabs.Root>
  </div>
</main>

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
          class="ml-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Alternar Tudo
        </Label>
      </ContextMenu.Group>
    </ContextMenu.Content>
  </ContextMenu.Root>
{/snippet}

<style>
  main {
    padding: 0;
    margin: 0;
    flex: 1;
    height: 100%;
    width: 100%;

    display: grid;
    grid-template-areas:
      'aside brackets'
      'aside brackets';
    grid-template-rows: 200px 1fr;
    grid-template-columns: 300px 1fr;
  }

  .tabs-container {
    grid-area: brackets;
    min-width: 0;
  }

  aside {
    background: #eee;
    display: flex;
    flex-direction: column;
    grid-area: aside;
  }
</style>
