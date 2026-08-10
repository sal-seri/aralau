// Database client entrypoint.
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../../generated/prisma'

interface DbConfig {
  host: string
  port: number
  user: string
  password: string
  database: string
}

export function readDbConfig(): DbConfig {
  const config = useRuntimeConfig()
  return {
    host: config.dbHost,
    port: Number(config.dbPort),
    user: config.dbUser,
    password: config.dbPassword,
    database: config.dbName
  }
}

function buildDatabaseUrl(): string {
  const { host, port, user, password, database } = readDbConfig()
  return `postgresql://${user}:${password}@${host}:${port}/${database}?schema=public`
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaPg({ connectionString: buildDatabaseUrl() })
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}