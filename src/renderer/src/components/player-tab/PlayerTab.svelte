<script lang="ts">
  import DataTable from './components/data-table.svelte'
  import { columns } from './components/columns.svelte'
  import { playersStore } from '@/states.svelte'

  const flatPlayers = $derived(Object.values(playersStore.players).flat())
  // TODO: Fix all errors caused by changing category: string to category: Tag[]
</script>

<div class="hidden h-full flex-1 flex-col space-y-8 p-8 md:flex">
  <DataTable data={flatPlayers} {columns} />
</div>
