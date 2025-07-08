import { Component } from '@lucide/svelte'
import type { Table } from '@tanstack/table-core'
import { type ClassValue, clsx } from 'clsx'
import { cubicOut } from 'svelte/easing'
import type { TransitionConfig } from 'svelte/transition'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): ReturnType<typeof twMerge> {
  return twMerge(clsx(inputs))
}

export function buildColFn<TData>(table: Table<TData>) {
  return (
    key: string,
    mapFn?: (value: unknown) => string
  ): {
    value: string | boolean
    label: string
    icon: typeof Component | undefined
  }[] =>
    Array.from(
      new Set(table.getPreFilteredRowModel().flatRows.map((row) => row.original[key]))
    ).map((value) => ({
      value,
      label: mapFn ? mapFn(value) : value,
      icon: undefined
    }))
}

export function randomContestantId(): string {
  return Math.floor(Math.random() * 10000).toString()
}

export function filterObject<T extends object>(
  obj: T,
  predicate: (key: string, value: T[keyof T]) => boolean
): T {
  return Object.keys(obj)
    .filter((key) => predicate(key, obj[key]))
    .reduce((res, key) => ((res[key] = obj[key]), res), {} as T)
}

// Helper function to split a list evenly
export function splitEvenly<T>(list: T[], nGroups: number): T[][] {
  const result: T[][] = Array.from({ length: nGroups }, () => [])
  for (let i = 0; i < list.length; i++) {
    result[i % nGroups].push(list[i])
  }
  return result
}

type FlyAndScaleParams = {
  y?: number
  x?: number
  start?: number
  duration?: number
}

export const flyAndScale = (
  node: Element,
  params: FlyAndScaleParams = { y: -8, x: 0, start: 0.95, duration: 150 }
): TransitionConfig => {
  const style = getComputedStyle(node)
  const transform = style.transform === 'none' ? '' : style.transform

  const scaleConversion = (
    valueA: number,
    scaleA: [number, number],
    scaleB: [number, number]
  ): number => {
    const [minA, maxA] = scaleA
    const [minB, maxB] = scaleB

    const percentage = (valueA - minA) / (maxA - minA)
    const valueB = percentage * (maxB - minB) + minB

    return valueB
  }

  const styleToString = (style: Record<string, number | string | undefined>): string => {
    return Object.keys(style).reduce((str, key) => {
      if (style[key] === undefined) return str
      return str + key + ':' + style[key] + ';'
    }, '')
  }

  return {
    duration: params.duration ?? 200,
    delay: 0,
    css: (t): ReturnType<typeof styleToString> => {
      const y = scaleConversion(t, [0, 1], [params.y ?? 5, 0])
      const x = scaleConversion(t, [0, 1], [params.x ?? 0, 0])
      const scale = scaleConversion(t, [0, 1], [params.start ?? 0.95, 1])

      return styleToString({
        transform: transform + 'translate3d(' + x + 'px, ' + y + 'px, 0) scale(' + scale + ')',
        opacity: t
      })
    },
    easing: cubicOut
  }
}
