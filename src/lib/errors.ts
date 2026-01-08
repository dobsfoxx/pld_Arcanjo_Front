import axios from 'axios'

function compactSingleLineMessage(message: string, maxLen = 180): string {
  const firstLine = (message || '').split(/\r?\n/)[0]?.trim() || ''
  if (!firstLine) return ''
  if (firstLine.length <= maxLen) return firstLine
  return `${firstLine.slice(0, maxLen - 1)}…`
}

function looksSensitiveOrInternal(message: string): boolean {
  if (!message) return false
  if (/Invalid `.*` invocation/i.test(message)) return true
  if (/^PrismaClient/i.test(message)) return true
  if (/\bPrisma\b/i.test(message)) return true
  if (/[A-Z]:\\/i.test(message)) return true // Windows path
  if (/\/src\/|\\src\\/i.test(message)) return true
  return false
}

export function getToastErrorMessage(error: unknown, fallback = 'Erro inesperado'): string {
  if (typeof error === 'string') {
    const msg = compactSingleLineMessage(error)
    return msg || fallback
  }

  if (axios.isAxiosError(error)) {
    const data = error.response?.data as unknown
    const serverMsg =
      typeof data === 'string'
        ? data
        : (data as { error?: unknown; message?: unknown } | undefined)?.error ??
          (data as { error?: unknown; message?: unknown } | undefined)?.message

    const candidate =
      typeof serverMsg === 'string'
        ? serverMsg
        : typeof error.message === 'string'
          ? error.message
          : ''

    const compact = compactSingleLineMessage(candidate)
    if (!compact) return fallback
    if (looksSensitiveOrInternal(compact)) return 'Erro interno do servidor'
    return compact
  }

  if (error instanceof Error) {
    const compact = compactSingleLineMessage(error.message)
    if (!compact) return fallback
    if (looksSensitiveOrInternal(compact)) return 'Erro interno do servidor'
    return compact
  }

  return fallback
}
