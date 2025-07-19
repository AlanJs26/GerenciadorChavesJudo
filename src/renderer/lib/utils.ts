import { Component } from '@lucide/svelte'
import type { Table } from '@tanstack/table-core'
import { type ClassValue, clsx } from 'clsx'
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

const invalidContestantIds: string[] = []
const rand = buildRandomGen('seed')

export function randomContestantId(): string {
  const gen = () => Math.floor(rand() * 10000).toString()
  let contestantId = gen()
  while (invalidContestantIds.includes(contestantId)) {
    contestantId = gen()
  }
  invalidContestantIds.push(contestantId)
  return contestantId
}

export function mapFilter<T, U>(
  array: Array<T>,
  predicate: (n: T) => U | null | undefined
): Array<U> {
  return array.reduce((p, n) => {
    const result = predicate(n)
    if (result !== undefined && result !== null) {
      p.push(result)
    }
    return p
  }, [] as U[])
}

function isIterable(obj) {
  // checks for null and undefined
  if (obj == null) {
    return false
  }
  return typeof obj[Symbol.iterator] === 'function'
}

export function clamp(num: number, min: number, max: number) {
  return Math.min(Math.max(num, min), max)
}

export function isSubsetOf<T>(inner: T[], outer: T[], comparator: (a: T, b: T) => boolean) {
  return inner.every((innerItem) => {
    return outer.some((outerItem) => comparator(innerItem, outerItem))
  })
}

export function mapExtend<T, U>(array: Array<T>, predicate: (n: T) => U | U[]): U[] {
  return array.reduce((p, n) => {
    const result = predicate(n)
    const newItems = (isIterable(result) ? result : [result]) as U[]
    return [...p, ...newItems]
  }, [] as U[])
}

export function filterObject<T extends object, U = T>(
  obj: T,
  predicate: (key: string, value: T[keyof T]) => boolean
): U {
  return Object.keys(obj)
    .filter((key) => predicate(key, obj[key]))
    .reduce((res, key) => ((res[key] = obj[key]), res), {} as U)
}

// Helper function to split a list evenly
export function splitEvenly<T>(list: T[], nGroups: number): T[][] {
  const result: T[][] = Array.from({ length: nGroups }, () => [])
  for (let i = 0; i < list.length; i++) {
    result[i % nGroups].push(list[i])
  }
  return result
}

export function compareObject(a: object, b: object): boolean {
  for (const key of Object.keys(a)) {
    if (a[key] != b[key]) return false
  }
  return true
}

function cyrb128(str: string) {
  let h1 = 1779033703,
    h2 = 3144134277,
    h3 = 1013904242,
    h4 = 2773480762
  for (let i = 0; i < str.length; i++) {
    const k = str.charCodeAt(i)
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067)
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233)
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213)
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179)
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067)
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233)
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213)
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179)
  h1 ^= h2 ^ h3 ^ h4
  h2 ^= h1
  h3 ^= h1
  h4 ^= h1
  return [h1 >>> 0, h2 >>> 0, h3 >>> 0, h4 >>> 0]
}

function sfc32(a: number, b: number, c: number, d: number) {
  return function () {
    a |= 0
    b |= 0
    c |= 0
    d |= 0
    const t = (((a + b) | 0) + d) | 0
    d = (d + 1) | 0
    a = b ^ (b >>> 9)
    b = (c + (c << 3)) | 0
    c = (c << 21) | (c >>> 11)
    c = (c + t) | 0
    return (t >>> 0) / 4294967296
  }
}

export function buildRandomGen(seedStr: string) {
  // Create cyrb128 state:
  const seed = cyrb128(seedStr)
  // Four 32-bit component hashes provide the seed for sfc32.
  const rand = sfc32(seed[0], seed[1], seed[2], seed[3])

  return rand
}

export function pickRandom<T>(array: T[], seed: number): T {
  return array[Math.floor(seed * array.length)]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, 'child'> : T
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, 'children'> : T
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null }
