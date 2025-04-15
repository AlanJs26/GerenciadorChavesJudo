<script lang="ts">
  import DataTable from './components/data-table.svelte'
  //   import { data } from './(data)/tasks'
  import { columns } from './components/columns'
  import type { Player } from '@lib/types/bracket-lib'

  let { players = $bindable() }: { players: Player[] } = $props()
</script>

<div class="hidden h-full flex-1 flex-col space-y-8 p-8 md:flex">
  <DataTable bind:data={players} {columns} />
</div>
