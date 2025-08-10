<script lang="ts">
  import { playersStore } from '@/states.svelte'

  import { columns } from './data-table/columns.svelte'
  import DataTable from './data-table/DataTable.svelte'

  const flatPlayers = $derived([...playersStore.players['male'], ...playersStore.players['female']])
</script>

<div class="h-full flex-1 flex-col space-y-8 p-8 md:flex">
  <DataTable data={flatPlayers} {columns} />
</div>
