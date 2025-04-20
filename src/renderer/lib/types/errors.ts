export type ExcelPlayerError = {
  name: 'ExcelPlayerError'
  cause: {
    file: string
    n: string | undefined
    cell: string | undefined
    message: string
  }
}

export type ExcelOrganizationError = {
  name: 'ExcelOrganizationError'
  cause: {
    file: string
    cell?: string
    message: string
  }
}

export type ErrorObject = {
  name: string
  cause: Record<string, unknown>
}

export type ResultError<T> = {
  result: T | null
  error: ErrorObject | null
}
