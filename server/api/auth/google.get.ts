import { withQuery } from 'ufo'
import { z } from 'zod'
import { sanitizeRedirect } from '../../../shared/utils/redirect'
import { resolveGoogleUser } from '../../utils/google'
import { toSessionUser } from '../../utils/session'

// Google v3 userinfo (https://www.googleapis.com/oauth2/v3/userinfo).
// `email_verified` may arrive as boolean or string depending on provider version.
const googleUserSchema = z.object({
  sub: z.string().min(1),
  email: z.email(),
  email_verified: z.union([z.boolean(), z.string()]).optional(),
  name: z.string().nullish(),
  picture: z.string().nullish()
})

const googleHandler = defineOAuthGoogleEventHandler({
  config: {
    scope: ['email', 'profile']
  },
  async onSuccess(event, { user }) {
    const parsed = googleUserSchema.safeParse(user)
    if (!parsed.success) {
      console.error('Unexpected Google profile shape', parsed.error.issues)
      return sendRedirect(event, withQuery('/auth/login', { error: 'google' }))
    }

    const profile = parsed.data
    const emailVerified = profile.email_verified === true || profile.email_verified === 'true'

    // never link an account by an unverified email
    if (!emailVerified) {
      return sendRedirect(event, withQuery('/auth/login', { error: 'google' }))
    }

    const dbUser = await resolveGoogleUser({
      sub: profile.sub,
      email: profile.email,
      emailVerified,
      name: profile.name ?? null,
      picture: profile.picture ?? null
    })

    await setUserSession(event, { user: toSessionUser(dbUser) })

    const redirect = sanitizeRedirect(getCookie(event, 'oauth_redirect'))
    deleteCookie(event, 'oauth_redirect', { path: '/' })

    const target = dbUser.handle ? (redirect ?? '/seasons') : '/auth/onboarding'
    return sendRedirect(event, target)
  },
  onError(event, error) {
    console.error('Google OAuth error', error)
    return sendRedirect(event, withQuery('/auth/login', { error: 'google' }))
  }
})

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  // Start of the flow (no `code` yet): remember where to come back to.
  // The cookie must cross the redirect to accounts.google.com and back,
  // hence SameSite=Lax.
  if (typeof query.code !== 'string') {
    const redirect = sanitizeRedirect(typeof query.redirect === 'string' ? query.redirect : null)
    setCookie(event, 'oauth_redirect', redirect ?? '', {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 600,
      path: '/'
    })
  }

  return googleHandler(event)
})
