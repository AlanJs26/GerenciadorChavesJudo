import type { Bracket } from '@lib/types/bracket-lib'
import { createBracket, OptionsMap } from 'bracketry'

export function get_match_data_for_element(el: Element, all_data: Bracket): Bracket['matches'][0] {
  const round_index = +(el.closest('.round-wrapper')?.getAttribute('round-index') || -1)
  const match_order = +(el.closest('.match-wrapper')?.getAttribute('match-order') || -1)
  return (
    all_data.matches?.find((m) => {
      return m.roundIndex === round_index && m.order === match_order
    }) || { roundIndex: +round_index, order: +match_order, sides: [] }
  )
}

export function installBracketUI(
  domEl: HTMLDivElement,
  data: Bracket,
  oncontextmenu?: (e: MouseEvent) => void,
  options?: OptionsMap
): ReturnType<typeof createBracket> {
  const bracketry = createBracket(data, domEl, {
    navButtonsPosition: 'overTitles',
    width: '100%',
    height: '100%',
    ...options
  })

  if (oncontextmenu) {
    domEl.addEventListener('contextmenu', oncontextmenu)
  }

  const styleEl = document.createElement('style')
  styleEl.textContent = `
          & .nationality {
            align-self: end;
            font-size: xx-small;
          }
          .bracket-root .player-wrapper {
            flex-direction: row-reverse;
            align-items: baseline;
  
            & .player-title {
              flex: unset;
              padding-right: calc(var(--matchFontSize)* 0.6);
            }
            & .nationality {
              flex: 1;
            }
          }
        `
  domEl.appendChild(styleEl)

  return bracketry
}
