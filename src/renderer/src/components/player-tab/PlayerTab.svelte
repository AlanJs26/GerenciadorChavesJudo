<script lang="ts">
  import DataTable from './components/data-table.svelte'
  import { columns } from './components/columns'
  import { playersStore } from '@/states/players.svelte'
</script>

<div class="hidden h-full flex-1 flex-col space-y-8 p-8 md:flex">
  <DataTable bind:data={playersStore.players} {columns} />
</div>
