<script lang="ts">
  import type { Player } from '@lib/types/bracket-lib'

  let { player = $bindable() }: { player: Player } = $props()
</script>

<button
  class="participante flex w-full gap-5"
  onclick={function (): void {
    ;(this as HTMLDivElement).querySelector('input').click()
  }}
>
  <div class="w-full flex-1 items-start">
    <span>{player.name}</span>
    <span class="organization text-start">{player.organization}<br />{player.category}</span>
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

    & .organization {
      font-size: 8pt;
      color: rgba(0, 0, 0, 50%);
    }
  }
</style>
