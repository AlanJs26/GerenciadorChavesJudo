<script lang="ts">
  import DataTable from '@components/data-table/DataTable.svelte'
  import type { Player } from '@lib/types/bracket-lib'
  import { createContestantId } from '@lib/utils'
  import { toast } from 'svelte-sonner'

  import { playersStore } from '@/states.svelte'

  import { columns } from './columns.svelte'
  import DataTableToolbar from './toolbar.svelte'

  const flatPlayers = $derived([...playersStore.players['male'], ...playersStore.players['female']])
</script>

<div class="flex h-full flex-1 flex-col p-8">
  <DataTable
    data={flatPlayers}
    {columns}
    options={{
      meta: {
        removePlayer: (player: Player) => {
          const gender = player.isMale ? 'male' : 'female'
          const players = playersStore.get(gender, player.category)

          playersStore.set(
            gender,
            player.category,
            players.filter((p) => p.contestantId != player.contestantId)
          )
        },
        addPlayer: (player: Omit<Player, 'contestantId'>) => {
          const contestantId = createContestantId(player.name, player.organization, player.isMale)
          if (contestantId in playersStore.byContestantId) {
            toast.warning(
              `O participante ${player.name} - ${player.organization} já existe. Ele foi sobrescrito.`
            )
          }
          playersStore.setPlayer({ ...player, contestantId })
        }
      }
    }}
  >
    {#snippet headerSnippet(table)}
      <DataTableToolbar {table} />
    {/snippet}
  </DataTable>
</div>
