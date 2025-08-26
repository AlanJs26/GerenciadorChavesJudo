import type { ResultTable } from '@lib/types/result-table'

// Estado inicial (exemplos) extraído do componente
const initialTables: ResultTable[] = [
  {
    name: 'Pontos SUB10',
    filters: [
      { field: 'Organização', selection: null },
      // { field: 'SUB', selection: null }
      { field: 'SUB', selection: 'SUB10' }
    ],
    columns: [
      {
        name: 'Organização',
        formula: {
          rank: false,
          operation: 'maxcount',
          value: 'Organização'
        },
        filters: []
      },
      // {
      //   name: 'Coluna2',
      //   formula: {
      //     rank: false,
      //     operation: 'count',
      //     value: null
      //   },
      //   // filters: [{ field: 'Peso', selection: '10kg' }]
      //   filters: [
      //     // { field: 'Peso', selection: '10kg' },
      //     // { field: 'Peso', selection: null }
      //     { field: 'Sexo', selection: null }
      //   ]
      //   // filters: []
      // }
      {
        name: 'Pontos',
        formula: {
          rank: false,
          operation: 'sum',
          value: 'Pontos'
        },
        filters: [{ field: 'Peso', selection: null }]
      },
      {
        name: 'Total de Pontos',
        formula: {
          rank: false,
          operation: 'sum',
          value: 'Pontos'
        },
        filters: []
      }
    ]
  },

  {
    name: 'Participantes SUB10',
    filters: [
      // { field: 'Organização', selection: null },
      // { field: 'SUB', selection: null }
      { field: 'SUB', selection: 'SUB10' },
      { field: 'Peso', selection: '40kg' }
    ],
    columns: [
      {
        name: 'Participante',
        formula: {
          rank: false,
          operation: 'maxcount',
          value: 'Nome'
        },
        filters: []
      },
      {
        name: 'Organização',
        formula: {
          rank: false,
          operation: 'maxcount',
          value: 'Organização'
        },
        filters: []
      },
      {
        name: 'Sexo',
        formula: {
          rank: false,
          operation: 'maxcount',
          value: 'Sexo'
        },
        filters: []
      }
    ]
  },
  {
    name: 'Classificação Geral',
    filters: [
      { field: 'Organização', selection: null }
      // { field: 'SUB', selection: null }
      // { field: 'SUB', selection: 'SUB10' }
    ],
    columns: [
      {
        name: 'Posição',
        formula: {
          rank: true,
          operation: 'sum',
          value: 'Pontos'
        },
        filters: []
      },
      {
        name: 'Organização',
        formula: {
          rank: false,
          operation: 'maxcount',
          value: 'Organização'
        },
        filters: []
      },
      {
        name: 'Pontos',
        formula: {
          rank: false,
          operation: 'sum',
          value: 'Pontos'
        },
        filters: []
      }
    ]
  }
]

class ResultTableStore {
  tables = $state(initialTables)
}

export const resultTablesStore = new ResultTableStore()
