// Resolves a Google OAuth profile to a local user:
// existing link -> link by verified email -> create a new user.
import { prisma } from '../db'

export interface GoogleProfile {
  sub: string
  email: string
  emailVerified: boolean
  name: string | null
  picture: string | null
}

export async function resolveGoogleUser(profile: GoogleProfile) {
  const existingAccount = await prisma.oAuthAccount.findUnique({
    where: { provider_providerAccountId: { provider: 'google', providerAccountId: profile.sub } },
    include: { user: true }
  })
  if (existingAccount) return existingAccount.user

  return prisma.$transaction(async (tx) => {
    // re-check inside the transaction to narrow race windows
    const account = await tx.oAuthAccount.findUnique({
      where: { provider_providerAccountId: { provider: 'google', providerAccountId: profile.sub } },
      include: { user: true }
    })
    if (account) return account.user

    const byEmail = await tx.user.findUnique({ where: { email: profile.email } })
    if (byEmail) {
      await tx.oAuthAccount.create({
        data: { provider: 'google', providerAccountId: profile.sub, userId: byEmail.id }
      })
      return byEmail
    }

    return tx.user.create({
      data: {
        email: profile.email,
        name: profile.name,
        avatarUrl: profile.picture,
        oauthAccounts: { create: { provider: 'google', providerAccountId: profile.sub } }
      }
    })
  })
}
