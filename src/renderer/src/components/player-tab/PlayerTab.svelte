<script lang="ts">
  import DataTable from './data-table/DataTable.svelte'
  import { columns } from './data-table/columns.svelte'
  import { playersStore } from '@/states.svelte'

  const flatPlayers = $derived([...playersStore.players['male'], ...playersStore.players['female']])
  // console.log(flatPlayers)
  // TODO: Fix all errors caused by changing category: string to category: Tag[]
</script>

<div class="hidden h-full flex-1 flex-col space-y-8 p-8 md:flex">
  <DataTable data={flatPlayers} {columns} />
</div>
