import { getSession, setSession, updateTokens } from './session'
import type { AuthTokens, Raw } from './types'

export const API_PREFIX = '/api/v1'

export class ApiError extends Error {
        readonly status: number
        readonly body: unknown

        constructor(status: number, message: string, body: unknown) {
                super(message)
                this.name = 'ApiError'
                this.status = status
                this.body = body
        }
}

type Query = Record<string, string | number | boolean | null | undefined>

export interface RequestOptions {
        method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
        query?: Query
        body?: unknown
        auth?: boolean
        signal?: AbortSignal
}

const buildUrl = (path: string, query?: Query) => {
        const url = `${API_PREFIX}${path}`
        if (!query) return url
        const params = new URLSearchParams()
        for (const [key, value] of Object.entries(query)) {
                if (value === undefined || value === null || value === '') continue
                params.set(key, String(value))
        }
        const qs = params.toString()
        return qs ? `${url}?${qs}` : url
}

const isObject = (value: unknown): value is Raw =>
        typeof value === 'object' && value !== null && !Array.isArray(value)

/**
 * NestJS backends often wrap payloads as `{ success, statusCode, message, data }`.
 * Strip that envelope, but keep paginated bodies (`{ data, meta }`) intact.
 */
const unwrap = (body: unknown): unknown => {
        if (!isObject(body) || !('data' in body) || 'meta' in body) return body
        if ('success' in body || 'statusCode' in body) return body.data
        return body
}

const messageFrom = (body: unknown, fallback: string) => {
        if (isObject(body)) {
                const { message } = body
                if (Array.isArray(message)) return message.join(', ')
                if (typeof message === 'string' && message) return message
        }
        return fallback
}

const parse = async (response: Response) => {
        const text = await response.text()
        if (!text) return null
        try {
                return JSON.parse(text)
        } catch {
                return text
        }
}

// One refresh in flight at a time; concurrent 401s wait on the same promise.
let refreshing: Promise<boolean> | null = null

const extractTokens = (body: unknown): AuthTokens | null => {
        const source = isObject(body) && isObject(body.tokens) ? body.tokens : body
        if (isObject(source) && typeof source.accessToken === 'string') {
                return {
                        accessToken: source.accessToken,
                        refreshToken:
                                typeof source.refreshToken === 'string'
                                        ? source.refreshToken
                                        : getSession()?.tokens.refreshToken ?? '',
                        expiresIn: typeof source.expiresIn === 'number' ? source.expiresIn : undefined
                }
        }
        return null
}

const refreshTokens = () => {
        if (refreshing) return refreshing
        refreshing = (async () => {
                const refreshToken = getSession()?.tokens.refreshToken
                if (!refreshToken) return false
                try {
                        const response = await fetch(buildUrl('/auth/refresh'), {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ refreshToken })
                        })
                        if (!response.ok) return false
                        const tokens = extractTokens(unwrap(await parse(response)))
                        if (!tokens) return false
                        updateTokens(tokens)
                        return true
                } catch {
                        return false
                } finally {
                        refreshing = null
                }
        })()
        return refreshing
}

export async function apiRequest<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
        const { method = 'GET', query, body, auth = true, signal } = options

        const send = () => {
                const headers: Record<string, string> = { Accept: 'application/json' }
                // FormData sets its own multipart boundary header.
                const isForm = typeof FormData !== 'undefined' && body instanceof FormData
                if (body !== undefined && !isForm) headers['Content-Type'] = 'application/json'
                const token = auth ? getSession()?.tokens.accessToken : undefined
                if (token) headers.Authorization = `Bearer ${token}`
                return fetch(buildUrl(path, query), {
                        method,
                        headers,
                        body: body === undefined ? undefined : isForm ? (body as FormData) : JSON.stringify(body),
                        signal
                })
        }

        let response = await send()

        if (response.status === 401 && auth && getSession()) {
                if (await refreshTokens()) {
                        response = await send()
                }
                if (response.status === 401) {
                        setSession(null)
                }
        }

        const payload = await parse(response)

        if (!response.ok) {
                const fallback =
                        // No rewrite configured → Next serves its own HTML 404 page.
                        response.status === 404 && !isObject(payload)
                                ? 'Endpoint not found on the API server.'
                                : `Request failed (${response.status})`
                throw new ApiError(response.status, messageFrom(payload, fallback), payload)
        }

        return unwrap(payload) as T
}

export const errorMessage = (error: unknown) =>
        error instanceof Error ? error.message : 'Something went wrong'
