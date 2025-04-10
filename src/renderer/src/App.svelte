<script lang="ts">
  import { onMount } from 'svelte'
  let bracketsEl: HTMLDivElement

  let colegios = [
    {
      colegio: 'Escola Politécnica',
      participantes: [
        { nome: 'Alan', sexo: 'MASC.', categoria: 'KIDS' },
        { nome: 'Lucas', sexo: 'MASC.', categoria: 'KIDS 2' }
      ]
    }
  ]

  let participantes = $derived(
    colegios.reduce((acc, colegio) => {
      return acc.concat(
        colegio.participantes.map((participante) => ({
          ...participante,
          colegio: colegio.colegio
        }))
      )
    }, [])
  )

  import { createBracket } from 'bracketry'
  import data from './data'

  onMount(async () => {
    createBracket(data, bracketsEl, {
      navButtonsPosition: 'overTitles'
    })
  })
</script>

<main>
  <aside>
    <button>Importar</button>
    <input type="text" name="busca" id="busca" placeholder="Buscar..." />

    <div class="participante-container">
      {#each participantes as participante}
        <div class="participante">
          <div>
            <span>{participante.nome}</span>
            <span>{participante.colegio}</span>
          </div>
          <input type="checkbox" name="" id="" />
        </div>
      {/each}
    </div>

    <button>Gerar Chaves</button>
  </aside>

  <!-- <div class="container"> -->
  <div class="user">Teste</div>
  <div class="brackets-container">
    <div id="brackets" bind:this={bracketsEl}></div>
  </div>
  <!-- </div> -->
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

    & > #brackets {
      min-width: 0;
      min-height: 0;
      height: 100%;
    }
  }
</style>
