declare module '#auth-utils' {
  interface User {
    id: string
    handle: string | null
    role: 'USER' | 'ADMIN'
    email: string
  }
}

export {}
