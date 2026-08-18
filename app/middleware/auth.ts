// Named middleware for session-required pages (/profile).
export default defineNuxtRouteMiddleware((to) => {
  const { loggedIn } = useUserSession()
  if (!loggedIn.value) {
    const localePath = useLocalePath()
    return navigateTo(
      localePath({
        path: '/auth/login',
        query: { redirect: to.fullPath }
      }),
      { replace: true }
    )
  }
})
