<script lang="ts">
  import type { Player } from '@lib/types/bracket-lib'

  let { player = $bindable() }: { player: Player } = $props()
</script>

<button
  class="participante hover:bg-primary/5 flex w-full cursor-pointer gap-5 !pr-5"
  onclick={function (): void {
    ;(this as HTMLDivElement).querySelector('input').click()
  }}
>
  <div class="w-full flex-1 items-start">
    <span class="text-start">{player.name}</span>
    <span class="text-muted-foreground text-start text-xs"
      >{player.organization}<br />{player.category.map((c) => c.value).join(' | ')}</span
    >
  </div>
  <input
    type="checkbox"
    onclick={(e: Event): void => {
      e.stopPropagation()
    }}
    bind:checked={
      () => player.present,
      () => {
        player.present = !player.present
      }
    }
  />
</button>

<style>
  .participante {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 5px 10px;

    & > div {
      display: flex;
      flex-direction: column;
    }

    /* & .organization { */
    /*   font-size: 8pt; */
    /*   color: rgba(0, 0, 0, 50%); */
    /* } */
  }
</style>
