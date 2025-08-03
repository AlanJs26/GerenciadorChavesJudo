<script lang="ts">
  import DataTable from './data-table/DataTable.svelte'
  import { columns } from './data-table/columns.svelte'
  import { playersStore } from '@/states.svelte'

  const flatPlayers = $derived([...playersStore.players['male'], ...playersStore.players['female']])
</script>

<div class="h-full flex-1 flex-col space-y-8 p-8 md:flex">
  <DataTable data={flatPlayers} {columns} />
</div>
