<script lang="ts">
  import { onMount } from "svelte";
  import { createBracket } from "bracketry";

  import type {
    Organization,
    BracketCollection,
    Player,
  } from "./bracket-lib/types";
  import { generateRandomOrganizations, buildBracket } from "./bracket-lib";

  import { Bolt, FileDown, RefreshCcw } from "@lucide/svelte";
  import { Button, buttonVariants } from "@components/ui/button";
  import { ScrollArea } from "@components/ui/scroll-area";
  import { Input } from "@components/ui/input";
  import { Separator } from "@components/ui/separator";
  import * as DropdownMenu from "@components/ui/dropdown-menu";

  // ==================== DOM References ====================
  let bracketsEl: HTMLDivElement;
  let bracketry: ReturnType<typeof createBracket> = null;

  // ==================== State Variables ====================
  let radio_sex = $state("Feminino");
  let currentCategory = $state("");
  let organizations: Organization[] = $state([]);
  let allBrackets = $state<BracketCollection>({ male: {}, female: {} });
  let filterText = $state("");

  // ==================== Computed Values ====================
  let isMale = $derived(radio_sex === "Masculino");
  let gender = $derived(isMale ? "male" : "female");
  let players = $derived(
    organizations
      .reduce((acc: Player[], org) => {
        return acc.concat(
          org.players.map((player) => ({
            ...player,
            organization: org.organization,
            absent: false,
          })),
        );
      }, [])
      .sort((a, b) => {
        const orgA = a.organization.toLowerCase();
        const orgB = b.organization.toLowerCase();
        return orgA < orgB ? -1 : orgA > orgB ? 1 : 0;
      }),
  );
  let filteredPlayers = $derived(
    players.filter((player) =>
      player.name
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .toLowerCase()
        .includes(
          filterText
            .normalize("NFD")
            .replace(/\p{Diacritic}/gu, "")
            .toLowerCase(),
        ),
    ),
  );
  const brackets = $derived(allBrackets[isMale ? "male" : "female"]);
  let categories = $derived(
    Array.from(new Set(players.map((player) => player.category))).sort(
      (a, b) => {
        const categoryA = a.toLowerCase();
        const categoryB = b.toLowerCase();
        return categoryA < categoryB ? -1 : categoryA > categoryB ? 1 : 0;
      },
    ),
  );
  let selectedCategories = $derived(
    categories.map(category => ({name: category, state: true}))
  );

  // ==================== Helper Functions ====================
  function filterPlayersByCategory(
    players: Player[],
    category: string,
    isMale: boolean,
  ): Player[] {
    return players.filter(
      (player) => player.category === category && player.isMale === isMale,
    );
  }

  // ==================== State Update Functions ====================
  function generateAllBrackets(): void {
    // Create a new object to trigger reactivity
    const newBrackets: BracketCollection = { male: {}, female: {} };

    // Generate brackets for each category and gender
    categories.forEach((category) => {
      // Male brackets
      const malePlayers = filterPlayersByCategory(players, category, true);
      newBrackets.male[category] =
        malePlayers.length > 0
          ? buildBracket(malePlayers)
          : {
              contestants: {},
              matches: [],
              rounds: [],
            };

      // Female brackets
      const femalePlayers = filterPlayersByCategory(players, category, false);
      newBrackets.female[category] =
        femalePlayers.length > 0
          ? buildBracket(femalePlayers)
          : {
              contestants: {},
              matches: [],
              rounds: [],
            };
    });

    allBrackets = newBrackets;
  }

  // ==================== UI Handling ====================
  function updateBracketDisplay(): void {
    // Make sure we have a valid category selected
    if (!currentCategory || !allBrackets[gender][currentCategory]) {
      const availableCategories = Object.keys(allBrackets[gender]);
      currentCategory =
        availableCategories.length > 0 ? availableCategories[0] : "";

      if (!currentCategory) {
        console.warn("No categories available for the selected gender");
        return;
      }
    }

    const currentBracket = brackets[currentCategory];

    if (!currentBracket) {
      console.warn("No bracket found for", gender, currentCategory);
      return;
    }

    if (!bracketry) {
      bracketry = createBracket(currentBracket, bracketsEl, {
        navButtonsPosition: "overTitles",
      });
    } else {
      bracketry.replaceData(currentBracket);
    }
  }

  // ==================== Lifecycle Hooks ====================
  $effect(() => {
    updateBracketDisplay();
  });

  onMount(() => {
    organizations = generateRandomOrganizations(5, 15);
    generateAllBrackets();
  });
</script>

<main>
  <aside class="p-1">
    <Button variant="outline" class="mb-2">
      <FileDown class="mr-2 h-4 w-4" />
      Importar
    </Button>

    <div class="sexo">
      <label>
        <input
          type="radio"
          name="sexo"
          value="Feminino"
          bind:group={radio_sex}
        />
        Feminino
      </label>
      <label>
        <input
          type="radio"
          name="sexo"
          value="Masculino"
          bind:group={radio_sex}
        />
        Masculino
      </label>
    </div>

    <Input
      id="busca"
      class="w-100"
      placeholder="Filtrar..."
      bind:value={filterText}
    />

    <Separator class="my-2" />

    <!-- <div class="participante-container"> -->
    <ScrollArea class="flex-1">
      {#each filteredPlayers as participante}
        <div class="participante">
          <div>
            <span>{participante.name}</span>
            <span>{participante.organization}</span>
          </div>
          <input
            type="checkbox"
            name=""
            id=""
            bind:checked={participante.absent}
          />
        </div>
      {/each}
    </ScrollArea>
    <!-- </div> -->

    <Separator class="my-2" />

    <div class="flex flex-row">

    <DropdownMenu.Root closeOnItemClick={false}>
      <DropdownMenu.Trigger class={buttonVariants({ variant: "default" }) + ' rounded-e-none border-e border-gray-700'} >
        <Bolt class="h-4 w-4" />
      </DropdownMenu.Trigger>

      <DropdownMenu.Content class="w-30">
        <DropdownMenu.Group>
        
          {#each Object.values(selectedCategories) as selected}
            <DropdownMenu.CheckboxItem bind:checked={selected.state} class="cursor-pointer">
              {selected.name}
            </DropdownMenu.CheckboxItem>
          {/each}
        </DropdownMenu.Group>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
    <Button class="w-full rounded-s-none" onclick={
      (): void => {
        organizations = generateRandomOrganizations(5, 15);
        generateAllBrackets()
      }
    }>Gerar Chaves</Button>
  </div>

    <!-- <Button
    variant="default"
      onclick={(): void => {
        organizations = generateRandomOrganizations(5, 30);
        generateAllBrackets();
      }}>
      <RefreshCcw class="mr-2 h-4 w-4"/>
      Gerar Chaves
      </Button> -->
  </aside>

  <div class="user">Teste</div>
  <div class="brackets-container">
    <div class="categories">
      {#each Object.entries(brackets) as [category, bracket]}
        <button
          class={category == currentCategory ? "current" : ""}
          onclick={(): void => {
            currentCategory = category;
          }}
          oncontextmenu={(e: MouseEvent): void => {
            e.preventDefault();
            console.log(e.buttons);
            if (e.buttons == 2) {
              delete brackets[category];
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
      "aside participente"
      "aside brackets";
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
    background-color: #0000001c;
    padding: 5px;
    border-radius: 5px;

    & label {
      border-radius: 5px;
      padding: 5px;
      background: transparent;
      width: 100%;
      text-align: center;
      cursor: pointer;
      color: rgba(0, 0, 0, 60%);
      transition:
        color 100ms ease,
        background-color 100ms ease;

      & input {
        appearance: none;
      }

      &:hover {
        background: #ffffff48;
      }
      &:has(input:checked) {
        background: #ffffff;
        box-shadow: 0 0 5px #00000015;
        color: black;
      }
    }
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
