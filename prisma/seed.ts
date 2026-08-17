import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma'
import { STAMP_SLOTS, generateStampPlacement } from '../server/utils/stampPlacement'

const adapter = new PrismaPg({ connectionString: process.env['DATABASE_URL']! })
const prisma = new PrismaClient({ adapter })

// `answers` holds normalized variants (lowercased, trimmed). It is NEVER
// sent to the client — server-side matching only.
// `storyText` is locked post-check-in content — likewise never public.
const demoLocations = [
  {
    slug: 'voznesenskiy-sobor',
    title: 'Вознесенский собор',
    order: 1,
    orientText:
      'В самом сердце старого города есть парк, где шум Кунаева стихает под старыми карагачами. В его глубине стоит здание, пережившее землетрясение, которое снесло почти весь город. Найдите его — и не смотрите на купола, пока не дойдёте до стен.',
    storyText:
      'Вознесенский собор построен в начале XX века целиком из тянь-шаньской ели — без единого гвоздя в несущих узлах. В 1911 году он пережил катастрофическое землетрясение, согнувшее стальные конструкции города, и остался стоять. Его несколько раз разбирали до основания и собирали снова, как огромный конструктор.',
    question: 'Из какого материала построены стены собора — присмотритесь к ним вблизи?',
    answers: ['из дерева', 'дерево', 'деревянный', 'из ели', 'ель', 'тянь-шаньская ель']
  },
  {
    slug: 'zelenyy-bazar',
    title: 'Зелёный базар',
    order: 2,
    orientText:
      'Идите от собора вниз по пешеходной улице, пока воздух не изменится: специи, дыня, свежая рыба и сто голосов торговцев. Двухэтажное здание рынка старше большинства домов вокруг. Вход со стороны улицы Жибек Жолы, у входа — мемориальная доска.',
    storyText:
      'Зелёный базар стоит на этом месте с 1875 года, когда Верный был ещё деревянным городом на окраине империи. Здесь всегда торговали тем, что выросло за городом: яблоками с предгорий, мёдом с пасек Заилийского Алатау, кумысом из пригородных аулов. Двухэтажное здание в стиле советского модернизма скрывает под собой слои прежних рядов.',
    question: 'Какой год высечен на мемориальной доске у входа на базар?',
    answers: ['1875']
  },
  {
    slug: 'arbat-zhibek-zholy',
    title: 'Арбат на Жибек Жолы',
    order: 3,
    orientText:
      'Пешеходная улица, которую горожане упрямо зовут Арбатом, начинается у базара и тянется вверх мимо художников, уличных музыкантов и бронзовых прохожих. Один из них застыл в шаге навсегда — четверо, с гитарами, у самого начала улицы.',
    storyText:
      'Шёлковый путь — Жибек Жолы — давал улице имя задолго до того, как она стала пешеходной. В 1980-х здесь прошла первая волна уличной торговли, в 1990-х — первые галереи. Бронзовая четвёрка появилась на улице в 2007 году и с тех пор собирает вокруг себя ежедневные толпы почитателей.',
    question: 'Какая легендарная четвёрка музыкантов отлита в бронзе в начале улицы?',
    answers: ['битлз', 'биттлз', 'the beatles', 'the beatles', 'ливерпульская четвёрка', 'ливерпульская четверка']
  }
]

async function main() {
  console.info('Seeding…')

  const season = await prisma.season.upsert({
    where: { slug: 'pervyy-sloy' },
    update: {
      title: 'Первый слой',
      description:
        'Первый сезон Aralau — места, которые город прячет на виду. Деревянный собор, старейший рынок, пешеходная улица с бронзовыми прохожими: ищите детали, на которые никто не смотрит, и собирайте первые оттиски в паспорт сезона.',
      status: 'active',
      startsAt: new Date('2026-03-01T00:00:00Z'),
      endsAt: new Date('2026-12-31T23:59:59Z'),
      order: 0
    },
    create: {
      slug: 'pervyy-sloy',
      title: 'Первый слой',
      description:
        'Первый сезон Aralau — места, которые город прячет на виду. Деревянный собор, старейший рынок, пешеходная улица с бронзовыми прохожими: ищите детали, на которые никто не смотрит, и собирайте первые оттиски в паспорт сезона.',
      status: 'active',
      startsAt: new Date('2026-03-01T00:00:00Z'),
      endsAt: new Date('2026-12-31T23:59:59Z'),
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

  // Demo check-ins for the developer's Google account (SEED_DEMO_USER_EMAIL):
  // locations #1 and #2 found, #3 left unfound — the "in progress" states the
  // redesign needs. Placement is immutable: existing rows are never
  // overwritten (create-only + null-guarded placement fill), so re-running
  // the seed leaves coords and createdAt byte-identical.
  const demoEmail = process.env['SEED_DEMO_USER_EMAIL']
  const demoUser = demoEmail
    ? await prisma.user.findUnique({ where: { email: demoEmail } })
    : null

  if (demoEmail && !demoUser) {
    console.info(
      `SEED_DEMO_USER_EMAIL is set but user "${demoEmail}" does not exist yet — skipping demo check-ins. Sign in once via Google, then re-run \`db:seed\`.`
    )
  } else if (demoUser) {
    const locations = await prisma.location.findMany({
      where: { seasonId: season.id, order: { in: [1, 2] } },
      orderBy: { order: 'asc' }
    })

    for (const loc of locations) {
      let checkIn = await prisma.checkIn.findUnique({
        where: { userId_locationId: { userId: demoUser.id, locationId: loc.id } }
      })
      if (!checkIn) {
        checkIn = await prisma.checkIn.create({
          data: { userId: demoUser.id, locationId: loc.id }
        })
      }

      // Fill placement only while null (never overwrite): #1 gets the first
      // design slot, #2 gets deterministic PRNG coords from the row id.
      const placement =
        loc.order === 1
          ? { left: STAMP_SLOTS[0][0], top: STAMP_SLOTS[0][1], rot: STAMP_SLOTS[0][2] }
          : generateStampPlacement(checkIn.id)
      const filled = await prisma.checkIn.updateMany({
        where: { id: checkIn.id, stampLeft: null },
        data: {
          stampLeft: placement.left,
          stampTop: placement.top,
          stampRot: placement.rot
        }
      })

      console.info(
        `Demo check-in on "${loc.slug}": ${filled.count ? 'placed' : 'kept'} at left=${placement.left} top=${placement.top} rot=${placement.rot}.`
      )
    }
  } else {
    console.info('SEED_DEMO_USER_EMAIL is not set — skipping demo check-ins.')
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
