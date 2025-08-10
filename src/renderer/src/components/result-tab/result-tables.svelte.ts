import type { ResultTable } from '@lib/types/result-table'

// Estado inicial (exemplos) extraído do componente
const initialTables: ResultTable[] = [
  {
    name: 'Pontos por Categoria',
    filter: {
      difficulty: 'simple',
      items: [
        { field: 'Categoria', selection: null },
        { field: 'Sexo', selection: null }
      ]
    },
    columns: [
      {
        name: 'Atleta',
        type: 'data',
        formula: {
          difficulty: 'simple',
          field: 'nome',
          operation: { difficulty: 'simple', type: 'sum' }
        },
        aggregations: [
          {
            name: 'Total Pontos',
            groups: ['Peso'],
            column: {
              name: 'Total',
              type: 'data',
              formula: {
                difficulty: 'simple',
                field: 'pontos',
                operation: { difficulty: 'simple', type: 'sum' }
              }
            }
          }
        ]
      }
    ],
    extraColumns: [
      {
        name: 'Ranking',
        type: 'order',
        formula: { difficulty: 'advanced', code: '/* cálculo de ranking */' }
      }
    ],
    extraRows: {
      name: 'TOTAL GERAL',
      formula: {
        difficulty: 'simple',
        field: 'pontos',
        operation: { difficulty: 'simple', type: 'sum' }
      }
    }
  },
  {
    name: 'Ranking por Peso',
    filter: { difficulty: 'advanced', code: '/* filtro avançado (ex: categoria=="Senior") */' },
    columns: [
      {
        name: 'Atleta',
        type: 'data',
        formula: {
          difficulty: 'simple',
          field: 'nome',
          operation: { difficulty: 'simple', type: 'sum' }
        },
        aggregations: []
      },
      {
        name: 'Classificação',
        type: 'order',
        formula: { difficulty: 'advanced', code: '/* lógica de classificação */' },
        aggregations: []
      }
    ],
    extraColumns: [],
    extraRows: {
      name: 'TOTAL',
      formula: {
        difficulty: 'simple',
        field: 'pontos',
        operation: { difficulty: 'simple', type: 'sum' }
      }
    }
  }
]

let resultTables = $state(initialTables)

export const resultTablesStore = {
  get resultTables(): ResultTable[] {
    return resultTables
  },
  set resultTables(value: ResultTable[]) {
    resultTables = value
  }
}

export function addResultTable(table: ResultTable) {
  resultTables = [...resultTables, table]
}
