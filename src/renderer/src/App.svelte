<script lang="ts">
  // UI Components
  // Custom components
  import { Bracket as BracketTab } from '@components/bracket-tab'
  import PlayerTab from '@components/player-tab/PlayerTab.svelte'
  import ResultTab from '@components/result-tab/ResultTab.svelte'
  import AppSidebar from '@components/sidebar/app-sidebar.svelte'
  import { sidebarStore } from '@components/sidebar/sidebar-state.svelte.ts'
  import * as Sidebar from '@components/ui/sidebar'
  import { Toaster } from '@components/ui/sonner'
  import * as Tabs from '@components/ui/tabs'
  import { ModeWatcher } from 'mode-watcher'
  import { onMount } from 'svelte'

  import { generateAllBrackets } from '@/components/bracket-tab/bracket-state.svelte'

  // ==================== DOM References ====================
  let bracketRenderer: BracketTab

  // onMount(() => {
  //   generateAllBrackets()
  // })
</script>

<ModeWatcher />
<Toaster />

<Sidebar.Provider>
  <AppSidebar />
  <main>
    <div class="tabs-container h-[100vh] min-w-0">
      <Tabs.Root
        value="participantes"
        class="flex h-full w-full flex-col"
        onValueChange={(value) => {
          switch (value) {
            case 'participantes':
            case 'chaves':
            case 'resultados':
              sidebarStore.tab = value
              break
          }
        }}
      >
        <Tabs.List class="grid w-full grid-cols-[auto_1fr_1fr_1fr] rounded-none">
          <Sidebar.Trigger />
          <Tabs.Trigger value="participantes">Participantes</Tabs.Trigger>
          <Tabs.Trigger value="chaves">Chaves</Tabs.Trigger>
          <Tabs.Trigger value="resultados">Resultados</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="participantes" class="mt-0 h-[calc(100%-6em)]">
          <PlayerTab />
        </Tabs.Content>
        <Tabs.Content value="chaves" class="mt-0 flex-1">
          <BracketTab bind:this={bracketRenderer} />
        </Tabs.Content>
        <Tabs.Content value="resultados" class="mt-0 h-[calc(100%-6em)]">
          <ResultTab />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  </main>
</Sidebar.Provider>

<style>
  @reference './assets/main.css';
  main {
    padding: 0;
    margin: 0;
    flex: 1;
    height: 100%;
    width: 100%;
    display: grid;
  }
</style>
