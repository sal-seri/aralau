import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma'

const adapter = new PrismaPg({ connectionString: process.env['DATABASE_URL']! })
const prisma = new PrismaClient({ adapter })

// `answers` holds normalized variants (lowercased, trimmed). It is NEVER
// sent to the client — server-side matching only.
const demoLocations = [
  {
    slug: 'harbor-gate',
    title: 'The Harbor Gate',
    order: 1,
    orientText:
      'You stand beneath the salt-stained stone of the old harbor gate, where fishermen once unloaded their catch before sunrise. Gulls still circle the keystone, waiting for scraps that no longer come.',
    storyText:
      'Built to defend the inner quay from storm-driven raiders, the Harbor Gate was the first structure commissioned when the town outgrew its walled core. The keystone was carved by a stonemason who signed their work with a single wavAmeasuring line.',
    question: 'What four-digit year is engraved on the keystone above the gate?',
    answers: ['1782', 'seventeen eighty-two']
  },
  {
    slug: 'clocktower-square',
    title: 'The Clocktower Square',
    order: 2,
    orientText:
      'The square opens around a brick clocktower whose bell has marked noon for two centuries. A sundial beside the door still keeps summer time, stubbornly an hour behind the tower itself.',
    storyText:
      'The clocktower was funded by the merchant guild to regulate market hours. Its main clock has faces on every side of the tower so that no street in the square is without time.',
    question: 'How many clock faces does the tower show from the square?',
    answers: ['4', 'four']
  },
  {
    slug: 'starling-bridge',
    title: 'The Starling Bridge',
    order: 3,
    orientText:
      'A narrow stone bridge arches over the canal where, each spring, starlings gather at dusk and trace shivering shapes above the water. A green-patinaed bronze nymph stands at the rail, half-turned toward something you cannot see.',
    storyText:
      'The bridge dates to the grain-trade boom. The nymph at its center was cast as a ward against drowning; local custom is to brush her upheld hand as you cross.',
    question: 'What does the bronze nymph hold in her raised hand?',
    answers: ['a lantern', 'lantern']
  }
]

async function main() {
  console.info('Seeding…')

  const season = await prisma.season.upsert({
    where: { slug: 'demo' },
    update: {
      title: 'Discover Old Town',
      status: 'active',
      startsAt: new Date('2026-01-01T00:00:00Z'),
      endsAt: null,
      order: 0
    },
    create: {
      slug: 'demo',
      title: 'Discover Old Town',
      status: 'active',
      startsAt: new Date('2026-01-01T00:00:00Z'),
      endsAt: null,
      order: 0
    }
  })

  for (const loc of demoLocations) {
    await prisma.location.upsert({
      where: { seasonId_slug: { seasonId: season.id, slug: loc.slug } },
      update: {
        title: loc.title,
        orientText: loc.orientText,
        storyText: loc.storyText,
        question: loc.question,
        answers: loc.answers,
        order: loc.order,
        publishedAt: new Date()
      },
      create: {
        seasonId: season.id,
        slug: loc.slug,
        title: loc.title,
        orientText: loc.orientText,
        storyText: loc.storyText,
        question: loc.question,
        answers: loc.answers,
        order: loc.order,
        publishedAt: new Date()
      }
    })
  }

  console.info(`Seeded season "${season.slug}" with ${demoLocations.length} locations.`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })