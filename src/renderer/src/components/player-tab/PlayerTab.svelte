<script lang="ts">
  import DataTable from './components/data-table.svelte'
  import { columns } from './components/columns.svelte'
  import { playersStore } from '@/states.svelte'
</script>

<div class="hidden h-full flex-1 flex-col space-y-8 p-8 md:flex">
  <DataTable bind:data={playersStore.players} {columns} />
</div>
