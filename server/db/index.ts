// Database client entrypoint.
// The actual driver (e.g. drizzle-orm / pg / postgres) will be wired up in a later step.
// Export `db` from here once the connection layer is implemented.

export interface DbConfig {
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
