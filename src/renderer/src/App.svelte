<script lang="ts">
  import { onMount } from 'svelte'

  import type { Organization, BracketCollection, Player } from '@lib/types/bracket-lib'
  import { buildBracket, generateRandomOrganizations } from './bracket-lib'

  import { Bolt, FileDown } from '@lucide/svelte'
  import { Button } from '@components/ui/button'
  import { ScrollArea } from '@components/ui/scroll-area'
  import { Input } from '@components/ui/input'
  import { Separator } from '@components/ui/separator'
  import PlayerCard from '@components/PlayerCard.svelte'
  import Bracket from '@components/Bracket.svelte'
  import FileInput from '@components/FileInput.svelte'
  import CategoryDropdown from '@components/CategoryDropdown.svelte'
  import * as RadioGroup from '@components/radio-group'
  import * as Tabs from '@components/ui/tabs'
  import PlayerTab from './components/player-tab/PlayerTab.svelte'
  import { playersStore } from './states/players.svelte'

  // ==================== DOM References ====================
  let bracketRenderer: Bracket

  // ==================== State Variables ====================
  let files: FileList | undefined = $state()
  let radio_sex = $state('Feminino')
  let currentCategory = $state('')
  let organizations: Organization[] = $state([])
  let brackets = $state<BracketCollection>({ male: {}, female: {} })
  let filterText = $state('')

  // ==================== Computed Values ====================
  let isMale = $derived(radio_sex === 'Masculino')

  $effect(() => {
    playersStore.players = organizations
      .reduce((acc: Player[], org) => {
        return acc.concat(
          org.players.map((player) => ({
            ...player,
            organization: org.organization,
            present: true,
            contestantId: Math.floor(Math.random() * 10000).toString()
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
    Array.from(new Set(playersStore.players.map((player) => `${player.category}¨${player.isMale}`)))
      .map((key) => {
        const [category, isMale] = key.split('¨')
        return { category, isMale: isMale === 'true', state: true }
      })
      .sort((a, b) => a.category.localeCompare(b.category))
  )

  // ==================== State Update Functions ====================
  function generateAllBrackets(): void {
    // Create a new object to trigger reactivity
    const newBrackets: BracketCollection = { male: {}, female: {} }

    // Generate brackets for each category and gender
    categories.forEach(({ category, state, isMale }) => {
      if (!state) return

      const genderPlayers = playersStore.players.filter(
        (player) => player.present && player.category === category && player.isMale === isMale
      )
      newBrackets[isMale ? 'male' : 'female'][category] =
        genderPlayers.length > 0
          ? buildBracket(genderPlayers)
          : {
              contestants: {},
              matches: [],
              rounds: []
            }
    })
    console.log(newBrackets)

    brackets = newBrackets
  }

  // ==================== Lifecycle Hooks ====================
  $effect(() => {
    bracketRenderer.update()
  })

  $effect(() => {
    if (!files) return
    ;(async (): Promise<void> => {
      organizations = await Promise.all(
        Array.from(files).map((file) => window.api.organizationFromFile(file))
      )
    })()
  })

  onMount(() => {
    const randomN = [5, 10]
    organizations = generateRandomOrganizations(randomN[0], randomN[1])
    // generateAllBrackets()
    // bracketRenderer.update()
  })
</script>

<main>
  <aside class="p-1">
    <FileInput bind:files>
      <FileDown class="mr-2 h-4 w-4" />
      Importar
    </FileInput>

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

    <ScrollArea class="flex-1" type="auto">
      {#each filteredPlayers as _player, i}
        <PlayerCard bind:player={() => filteredPlayers[i], () => {}} />
      {/each}
    </ScrollArea>

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
        }}>Gerar Chaves</Button
      >
    </div>
  </aside>

  <div class="tabs-container">
    <Tabs.Root value="participantes" class="h-full w-full">
      <Tabs.List class="grid w-full grid-cols-2">
        <Tabs.Trigger value="participantes">Participantes</Tabs.Trigger>
        <Tabs.Trigger value="chaves">Chaves</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="participantes" class="h-[calc(100%-10em)]">
        <PlayerTab />
      </Tabs.Content>
      <Tabs.Content value="chaves" class="mt-0 h-full w-full">
        <Bracket bind:this={bracketRenderer} {brackets} category={currentCategory} {isMale} />
      </Tabs.Content>
    </Tabs.Root>
  </div>
</main>

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
  }

  aside {
    background: #eee;
    display: flex;
    flex-direction: column;
    grid-area: aside;
  }
</style>
