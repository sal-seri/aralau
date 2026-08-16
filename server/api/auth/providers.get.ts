// Tells the client which OAuth providers are configured, without leaking
// any secrets — the client bundle only ever sees booleans.
export default defineEventHandler((event) => {
  const oauth = useRuntimeConfig(event).oauth as { google?: { clientId?: string; clientSecret?: string } }
  return {
    google: Boolean(oauth.google?.clientId && oauth.google?.clientSecret)
  }
})
