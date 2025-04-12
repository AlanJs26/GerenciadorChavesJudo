<script lang="ts">
  import { onMount } from 'svelte'
  let bracketsEl: HTMLDivElement

  function gerarOrdem(size: number): number[] {
    if (size === 1) return [1];
    console.log(size)

    const halfSize = Math.max(Math.floor(size / 2), 1);

    
    const halfOrder = gerarOrdem(halfSize);
    const result = [];
    
    for (let i = 0; i < halfOrder.length; i++) {
      result.push(halfOrder[i]);
      result.push(halfOrder[i] + halfSize);
    }
    
    return result;
  }

  let colegios = [
    {
      colegio: 'Escola Politécnica',
      participantes: [
        { nome: 'Alan', sexo: 'MASC.', categoria: 'KIDS' },
        { nome: 'Lucas', sexo: 'MASC.', categoria: 'KIDS 2' },
        { nome: 'Marcelo', sexo: 'MASC.', categoria: 'KIDS 2' }
      ]
    },
    {
      colegio: 'Escola de Engenharia',
      participantes: [
        { nome: 'Ana', sexo: 'FEM.', categoria: 'KIDS' },
        { nome: 'Maria', sexo: 'FEM.', categoria: 'KIDS 2' },
        { nome: 'Joana', sexo: 'FEM.', categoria: 'KIDS 2' }
      ]
    },
    {
      colegio: 'Escola de Artes',
      participantes: [
        { nome: 'Carlos', sexo: 'MASC.', categoria: 'KIDS' },
        { nome: 'Fernanda', sexo: 'FEM.', categoria: 'KIDS 2' },
        { nome: 'Ricardo', sexo: 'FEM.', categoria: 'KIDS 2' },
        { nome: 'Ricardo', sexo: 'FEM.', categoria: 'KIDS 2' }
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

  function buildBracket(participantes: any[]) {
    const nMatches = Math.floor(participantes.length / 2);

    const rounds = ['1st Round', '2nd Round', '3rd Round', '4th Round', 'Final'].slice(0, nMatches-1);

    const ordem = gerarOrdem(2**Math.ceil(Math.log2(participantes.length)));

    const contestants = participantes.reduce((prev, curr) => {
        prev = {
          ...prev,
          [Math.floor(Math.random()*10000).toString()]: {
            players: [
              {title: curr.nome, nationality: curr.colegio}
            ]
          }
        }
        return prev
      }, {})

    const matchPairs = []
    const contestantsIds = Object.keys(contestants);
    for(let i = 0; i < ordem.length; i += 2) {
      const player1 = contestantsIds[ordem[i] - 1];
      const player2 = contestantsIds[ordem[i + 1] - 1];
      matchPairs.push([player1, player2]);
    }

    const bracket = {
      rounds: rounds.map(name => (
        {name}
      )),
      contestants,
      matches: matchPairs.map(([a, b], i) => ({
        roundIndex: 0,
        order: i,
        sides: [
          {contestantId: a, scores: []},
          {contestantId: b, scores: []},
        ]
      }))
    };

    return bracket;
  }


  import { createBracket } from 'bracketry'
  // import data from './data'

  onMount(async () => {
    
    createBracket(buildBracket(participantes), bracketsEl, {
      navButtonsPosition: 'overTitles'
    })
    // const ordemGerada = gerarOrdem(participantes);
    // console.log(ordemGerada)
    console.log(gerarOrdem(8));
    console.log(gerarOrdem(16));
    console.log(gerarOrdem(32));
  })

// Dar prioridade a lutas entre escolas diferentes
// [ ] As chaves tem no máximo 8 participantes. Acima disso, quebra em mais chaves com o mesmo número de participantes
// [ ] As chaves são divididas por gênero
// [ ] As chaves são dividias por categorias
// [ ]A pontuação final é:
//  1º lugar: 7 pontos
//  2º lugar: 5 pontos
//  existem dois 3º lugares: 3 pontos cada

</script>

<main>
  <aside>
    <button>Importar</button>
    <input type="text" name="busca" id="busca" placeholder="Buscar..." />

    <div class="sexo">
      <label>
        <input type="radio" name="sexo" value="Feminino" />
        Feminino
      </label>
      <label>
        <input type="radio" name="sexo" value="Masculino" />
        Masculino
      </label>
    </div>

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

    & > #brackets {
      min-width: 0;
      min-height: 0;
      height: 100%;
    }
  }
</style>
