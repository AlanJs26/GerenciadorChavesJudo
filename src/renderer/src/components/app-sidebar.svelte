<script lang="ts">
  import * as Sidebar from '@components/ui/sidebar'
  import * as Tabs from '@components/ui/tabs'

  import BracketSidebar from '@/components/bracket-sidebar.svelte'
  import PlayerSidebar from '@/components/player-sidebar.svelte'
  import { sidebarStore } from '@/states.svelte.ts'
</script>

<Sidebar.Root>
  <Sidebar.Content>
    <Tabs.Root value={sidebarStore.tab} class="h-full w-full">
      <Tabs.Content value="participantes" class="mt-0 h-full w-full">
        <PlayerSidebar />
      </Tabs.Content>
      <Tabs.Content value="chaves" class="mt-0 h-full w-full">
        <BracketSidebar />
      </Tabs.Content>
    </Tabs.Root>
  </Sidebar.Content>
  <Sidebar.Rail />
</Sidebar.Root>
