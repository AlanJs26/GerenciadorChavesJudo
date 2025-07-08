// Type mapping from name to error type
type ErrorNameMap = {
  ExcelPlayerError: ExcelPlayerError
  ExcelOrganizationError: ExcelOrganizationError
}

// Helper type to extract error type from name
type ErrorByName<N extends keyof ErrorNameMap> = ErrorNameMap[N]

export interface ExcelPlayerError extends ResultError {
  name: 'ExcelPlayerError'
  cause: {
    file: string
    n: string | undefined
    cell: string | undefined
  }
}

export interface ExcelOrganizationError extends ResultError {
  name: 'ExcelOrganizationError'
  cause: {
    file: string
    cell?: string
  }
}

export interface ResultError {
  name: ErrorByName<keyof ErrorNameMap> | string
  message: string
  cause?: Record<string, unknown>
}

export type Success<T> = {
  status: true
  data: T
}

export type Failure<E extends ResultError> = {
  status: false
  error: E
}

export type Result<T = void, E extends ResultError = ResultError> = Success<T> | Failure<E>

export function handleResult<T, E extends ResultError = ResultError>(
  successFn?: (data: T) => void,
  failureFn?: (error: E) => void
) {
  return (result: Result<T, E>) => {
    if (result.status && successFn) {
      successFn(result.data)
    } else if (!result.status && failureFn) {
      failureFn(result.error)
    }
  }
}

export function success<T>(result: T): Success<T> {
  return {
    status: true,
    data: result
  }
}

// Overload for fail function to infer error type by name
export function fail<N extends keyof ErrorNameMap>(
  name: N,
  message?: string,
  cause?: ErrorByName<N>['cause']
): Failure<ErrorByName<N>>
export function fail<E extends ResultError>(
  name: E['name'],
  message?: string,
  cause?: E['cause']
): Failure<E>
export function fail(name: string, message?: string, cause?: unknown): Failure<ResultError> {
  return {
    status: false,
    error: {
      name: name,
      message: message ?? '',
      cause: cause
    } as ResultError
  }
}
