<script lang="ts">
  import { onMount } from 'svelte'
  import { createBracket } from 'bracketry'

  // ==================== Type Definitions ====================
  type Player = {
    name: string
    isMale: boolean
    category: string
    organization: string
  }

  type Organization = {
    organization: string
    players: Omit<Player, 'organization'>[]
  }

  type Bracket = {
    rounds: { name: string }[]
    contestants: Record<string, { players: { title: string; nationality: string }[] }>
    matches: {
      roundIndex: number
      order: number
      sides: { contestantId: string }[]
    }[]
  }

  type BracketCollection = {
    male: Record<string, Bracket>
    female: Record<string, Bracket>
  }

  // ==================== DOM References ====================
  let bracketsEl: HTMLDivElement

  // ==================== State Variables ====================
  let radio_sex = $state('Feminino')
  let isMale = $derived(radio_sex === 'Masculino')
  let currentCategory = $state('')
  let organizations: Organization[] = []
  let allBrackets = $state<BracketCollection>({ male: {}, female: {} })
  let bracketry: ReturnType<typeof createBracket> = null

  // ==================== Computed Values ====================
  let players = $derived(flattenPlayers(organizations))
  const brackets = $derived(allBrackets[isMale ? 'male' : 'female'])

  let categories = $derived(flattenCategories(players))

  function flattenCategories(players: Player[]): string[] {
    return Array.from(new Set(players.map((player) => player.category))).sort((a, b) => {
      const categoryA = a.toLowerCase()
      const categoryB = b.toLowerCase()
      return categoryA < categoryB ? -1 : categoryA > categoryB ? 1 : 0
    })
  }
  function flattenPlayers(organizations: Organization[]): Player[] {
    return organizations
      .reduce((acc: Player[], org) => {
        return acc.concat(
          org.players.map((player) => ({
            ...player,
            organization: org.organization
          }))
        )
      }, [])
      .sort((a, b) => {
        const orgA = a.organization.toLowerCase()
        const orgB = b.organization.toLowerCase()
        return orgA < orgB ? -1 : orgA > orgB ? 1 : 0
      })
  }

  // ==================== Tournament Order Generation ====================
  function generateTournamentOrder(size: number): number[] {
    if (size === 1) return [1]

    const halfSize = Math.max(Math.floor(size / 2), 1)
    const halfOrder = generateTournamentOrder(halfSize)
    const result = []

    for (let i = 0; i < halfOrder.length; i++) {
      result.push(halfOrder[i])
      result.push(halfOrder[i] + halfSize)
    }

    return result
  }

  // ==================== Data Generation ====================

  function generateRandomOrganizations(numOrgs: number, playersPerOrg: number): Organization[] {
    const maleNames = [
      'Alan',
      'Lucas',
      'Marcelo',
      'Carlos',
      'Ricardo',
      'João',
      'Pedro',
      'Miguel',
      'Gabriel',
      'Rafael'
    ]
    const femaleNames = [
      'Ana',
      'Maria',
      'Joana',
      'Fernanda',
      'Paula',
      'Luisa',
      'Sofia',
      'Julia',
      'Beatriz',
      'Laura'
    ]
    const orgNames = [
      'Escola Politécnica',
      'Escola de Engenharia',
      'Escola de Artes',
      'Academia Judo',
      'Centro Esportivo',
      'Clube Atlético',
      'Instituto Nacional',
      'Associação Desportiva',
      'Federação Estadual',
      'União Esportiva'
    ]
    const categories = ['KIDS', 'KIDS 2', 'JUNIOR', 'TEEN', 'ADULT']

    return Array.from({ length: numOrgs }, (_, i) => {
      const orgName = i < orgNames.length ? orgNames[i] : `Organização ${i + 1}`

      const players = Array.from({ length: playersPerOrg }, () => {
        const isMale = Math.random() > 0.5
        const names = isMale ? maleNames : femaleNames
        return {
          name: names[Math.floor(Math.random() * names.length)],
          isMale,
          category: categories[Math.floor(Math.random() * categories.length)]
        }
      })

      return {
        organization: orgName,
        players
      }
    })
  }

  // ==================== Bracket Generation ====================
  function buildBracket(players: Player[]): Bracket {
    const numPlayers = players.length
    const nMatches = Math.max(Math.floor(numPlayers / 2), 3)
    const rounds = ['1st Round', '2nd Round', '3rd Round', '4th Round', 'Final'].slice(
      0,
      nMatches - 1
    )
    const order = generateTournamentOrder(2 ** Math.ceil(Math.log2(numPlayers)))

    // Generate unique IDs for contestants
    const contestantsIds = players.map(() => Math.floor(Math.random() * 10000).toString())

    // Create contestant objects
    const contestants = players.reduce((prev, curr, i) => {
      return {
        ...prev,
        [contestantsIds[i]]: {
          players: [{ title: curr.name, nationality: curr.organization }]
        }
      }
    }, {})

    // Generate match pairs
    const matchPairs = []
    for (let i = 0; i < order.length; i += 2) {
      if (order[i] <= numPlayers && order[i + 1] <= numPlayers) {
        const player1 = contestantsIds[order[i] - 1]
        const player2 = contestantsIds[order[i + 1] - 1]
        matchPairs.push([player1, player2])
      }
    }

    // Create the complete bracket
    return {
      rounds: rounds.map((name) => ({ name })),
      contestants,
      matches: matchPairs.map(([a, b], i) => ({
        roundIndex: 0,
        order: i,
        sides: [{ contestantId: a }, { contestantId: b }]
      }))
    }
  }

  function filterPlayersByCategory(players: Player[], category: string, isMale: boolean): Player[] {
    return players.filter((player) => player.category === category && player.isMale === isMale)
  }

  function generateAllBrackets(): void {
    players = flattenPlayers(organizations)
    categories = flattenCategories(players)

    // Create a new object to trigger reactivity
    const newBrackets: BracketCollection = { male: {}, female: {} }

    // Generate brackets for each category and gender
    categories.forEach((category) => {
      // Male brackets
      const malePlayers = filterPlayersByCategory(players, category, true)
      if (malePlayers.length > 0) {
        newBrackets.male[category] = buildBracket(malePlayers)
      }

      // Female brackets
      const femalePlayers = filterPlayersByCategory(players, category, false)
      if (femalePlayers.length > 0) {
        newBrackets.female[category] = buildBracket(femalePlayers)
      }
    })

    allBrackets = newBrackets
  }

  // ==================== UI Handling ====================
  function updateBracketDisplay(): void {
    const gender = isMale ? 'male' : 'female'

    // Make sure we have a valid category selected
    if (!currentCategory || !allBrackets[gender][currentCategory]) {
      const availableCategories = Object.keys(allBrackets[gender])
      currentCategory = availableCategories.length > 0 ? availableCategories[0] : ''

      if (!currentCategory) {
        console.warn('No categories available for the selected gender')
        return
      }
    }

    const currentBracket = brackets[currentCategory]

    if (!currentBracket) {
      console.warn('No bracket found for', gender, currentCategory)
      return
    }

    if (!bracketry) {
      bracketry = createBracket(currentBracket, bracketsEl, {
        navButtonsPosition: 'overTitles'
      })
    } else {
      bracketry.replaceData(currentBracket)
    }
  }

  // ==================== Lifecycle Hooks ====================
  $effect(() => {
    updateBracketDisplay()
  })

  onMount(() => {
    organizations = generateRandomOrganizations(5, 30)
    generateAllBrackets()
    updateBracketDisplay()
  })
</script>

<main>
  <aside>
    <button>Importar</button>
    <input type="text" name="busca" id="busca" placeholder="Buscar..." />

    <div class="sexo">
      <label>
        <input type="radio" name="sexo" value="Feminino" bind:group={radio_sex} />
        Feminino
      </label>
      <label>
        <input type="radio" name="sexo" value="Masculino" bind:group={radio_sex} />
        Masculino
      </label>
    </div>

    <div class="participante-container">
      {#each players as participante}
        <div class="participante">
          <div>
            <span>{participante.name}</span>
            <span>{participante.organization}</span>
          </div>
          <input type="checkbox" name="" id="" />
        </div>
      {/each}
    </div>

    <button
      onclick={(): void => {
        organizations = generateRandomOrganizations(5, 30)
        generateAllBrackets()
      }}>Gerar Chaves</button
    >
  </aside>

  <div class="user">Teste</div>
  <div class="brackets-container">
    <div class="categories">
      {#each Object.entries(brackets) as [category, bracket]}
        <button
          class={category == currentCategory ? 'current' : ''}
          onclick={(): void => {
            currentCategory = category
          }}
          oncontextmenu={(e: MouseEvent): void => {
            e.preventDefault()
            console.log(e.buttons)
            if (e.buttons == 2) {
              delete brackets[category]
            }
          }}
        >
          {category}
        </button>
      {/each}
      <button>+</button>
    </div>
    <div id="brackets" bind:this={bracketsEl}></div>
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
      'aside participente'
      'aside brackets';
    grid-template-rows: 200px 1fr;
    grid-template-columns: 300px 1fr;
  }

  .categories {
    display: flex;
    align-self: center;
    gap: 10px;

    & button.current {
      border: 2px solid black;
    }
  }

  .sexo {
    display: flex;
    flex-direction: row;
    justify-content: space-around;
    margin: 10px 0;
  }

  .participante-container {
    grid-area: participante;
    overflow: auto;
    flex: 1;
  }

  .participante {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 5px 10px;

    & > div {
      display: flex;
      flex-direction: column;
    }
  }

  aside {
    background: #eee;
    display: flex;
    flex-direction: column;
    grid-area: aside;
  }

  .user {
    background-color: aquamarine;
    min-height: 0;
  }

  .brackets-container {
    grid-area: brackets;
    background-color: #ffefef;
    min-height: 0;
    min-width: 0;
    display: flex;
    flex-direction: column;
    align-items: center;

    & > #brackets {
      min-width: 0;
      min-height: 0;
      height: 100%;
      width: 100%;
    }
  }
</style>
