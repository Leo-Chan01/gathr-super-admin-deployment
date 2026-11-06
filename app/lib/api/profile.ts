// The signed-in admin's own profile.
import { apiRequest } from './client'
import { getSession, setSession } from './session'
import type { ApiUser, Raw } from './types'

export interface ProfilePatch {
  firstName?: string
  lastName?: string
  username?: string
  phone?: string
  bio?: string
  location?: string
  /** Image URL from uploadImage(). */
  avatar?: string
}

/** Keep the stored session in sync so the sidebar and dialogs re-render. */
const remember = (user: ApiUser) => {
  const session = getSession()
  if (session) setSession({ ...session, user })
  return user
}

/** GET /users/me — the login response may omit fields like `avatar`. */
export const getMe = async (o?: { signal?: AbortSignal }) => remember(await apiRequest<ApiUser>('/users/me', o))

/** PATCH /users/me (UpdateUserDto). Email can't be changed through this endpoint. */
export const updateMe = async (patch: ProfilePatch) =>
  remember(await apiRequest<ApiUser>('/users/me', { method: 'PATCH', body: patch }))

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

/** POST /uploads/image (multipart). Response shape is undocumented; accepts a few forms. */
export async function uploadImage(file: File, folder = 'avatars'): Promise<string> {
  if (!IMAGE_TYPES.includes(file.type)) throw new Error('Use a JPEG, PNG, GIF or WebP image.')
  if (file.size > MAX_IMAGE_BYTES) throw new Error('Images must be 10 MB or smaller.')
  const form = new FormData()
  form.append('file', file)
  form.append('folder', folder)
  const result = await apiRequest<Raw | string>('/uploads/image', { method: 'POST', body: form })
  const url =
    typeof result === 'string'
      ? result
      : [result.url, result.secureUrl, result.imageUrl, result.location, (result.data as Raw | undefined)?.url].find(
          (value): value is string => typeof value === 'string' && value.length > 0
        )
  if (!url) throw new Error('Upload finished but no image URL came back.')
  return url
}
