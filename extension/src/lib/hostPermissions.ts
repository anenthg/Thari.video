import type { BackendProvider } from './types'

/** Host permission patterns required by each backend provider. */
export const PROVIDER_HOSTS: Record<BackendProvider, string[]> = {
  firebase: [
    'https://*.googleapis.com/*',
    'https://*.firebasestorage.app/*',
    'https://*.appspot.com/*',
    'https://oauth2.googleapis.com/*',
    'https://run.googleapis.com/*',
    'https://serviceusage.googleapis.com/*',
    'https://cloudfunctions.googleapis.com/*',
    'https://cloudresourcemanager.googleapis.com/*',
  ],
  supabase: [
    'https://*.supabase.co/*',
    'https://api.supabase.com/*',
  ],
  convex: [
    'https://*.convex.cloud/*',
    'https://*.convex.site/*',
  ],
}

/**
 * Request optional host permissions for a provider.
 * Must be called from a user-gesture handler (e.g. button click).
 * Returns true if permissions were granted.
 */
export async function requestProviderPermissions(provider: BackendProvider): Promise<boolean> {
  const origins = PROVIDER_HOSTS[provider]
  return chrome.permissions.request({ origins })
}
