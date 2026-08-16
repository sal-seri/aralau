// Global route guard.
//
// - signed-in user WITHOUT a handle: forced to /auth/onboarding from any page
//   except /auth/*
// - signed-in user WITH a handle: bounced off /auth/login and /auth/onboarding
// - anonymous user on /profile or /passport: sent to /auth/login?redirect=<current>
// - anonymous user on /auth/onboarding: sent to /auth/login (needs a session)
//
// Path checks use the locale-stripped path (kk has the /kk prefix, ru none)
// so they run independently of @nuxtjs/i18n middleware ordering.
export default defineNuxtRouteMiddleware((to) => {
  const { user, loggedIn } = useUserSession()
  const localePath = useLocalePath()

  const stripped = to.path.replace(/^\/kk(?=\/|$)/, '') || '/'
  const isAuthPage = stripped.startsWith('/auth')
  const isProtected = stripped === '/profile' || stripped === '/passport'

  if (loggedIn.value) {
    if (!user.value?.handle && !isAuthPage) {
      return navigateTo(localePath('/auth/onboarding'), { replace: true })
    }
    if (user.value?.handle && isAuthPage) {
      return navigateTo(localePath('/seasons'), { replace: true })
    }
  } else if (isProtected || stripped === '/auth/onboarding') {
    return navigateTo(
      localePath({
        path: '/auth/login',
        query: { redirect: to.fullPath }
      }),
      { replace: true }
    )
  }
})
