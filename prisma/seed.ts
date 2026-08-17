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

// Seasons ii–iii exist as `draft` so the title page TOC shows locked rows
// («жабық») and the «мөрлер» row reads against the full 9-place volume.
// Their places are published (countable) but NEVER exposed while draft —
// /api/seasons redacts everything but the row's existence and order.
const upcomingSeasons = [
  {
    slug: 'tereptik',
    title: 'Тереңдік',
    description:
      'Второй сезон Aralau — город под городом: метро, подземные реки и ходы, о которых не пишут в путеводителях.',
    order: 1,
    locations: [
      {
        slug: 'almaty-metro',
        title: 'Метрополитен',
        order: 1,
        orientText:
          'Спуститесь туда, где город звучит гулче всего. Самая глубокая станция — не первая по пути: считайте пролёты, а не станции.',
        storyText:
          'Алматинский метрополитен открылся в 2011 году и стал первым в Казахстане. Станции «Алабай» и «Жибек Жолы» скрывают под толщей грунта полноценные архитектурные сюжеты — от национальных орнаментов до витражей о Шёлковом пути.',
        question: 'Какой зверь дал имя самой глубокой станции первой очереди?',
        answers: ['барс', 'снежный барс', 'алабай']
      },
      {
        slug: 'podzemnaya-almatinka',
        title: 'Подземная Алматинка',
        order: 2,
        orientText:
          'Река, которую город заперло в бетон на большей части пути. Найдите место, где её слышно, но не видно.',
        storyText:
          'Большая Алматинка проложена под городом в бетонном коллекторе ещё в советские годы — горные паводки требовали жёсткого русла. Коллектор стал второй, подземной рекой Алматы: её шум прорывается сквозь люки и решётки в самые неожиданные кварталы.',
        question: 'Как называется река, текущая под городом в бетонном русле?',
        answers: ['алматинка', 'большая алматинка']
      },
      {
        slug: 'teplyy-trakt',
        title: 'Тёплый тракт',
        order: 3,
        orientText:
          'Зимой над одним из пешеходных переходов не тает снег, а над соседним — тает. Найдите тёплую линию под ногами.',
        storyText:
          'Теплотрассы Алматы — это ещё одна карта города: там, где под асфальтом идёт горячая нитка, снег сходит первым, а тополя стоят выше. Монтажники называют эти линии «тёплыми трактами»; для внимательного прохожего они читаются без всякой карты.',
        question: 'Что выдаёт прохожему линию теплотрассы зимой?',
        answers: ['снег', 'снег тает', 'растаявший снег', 'отсутствие снега']
      }
    ]
  },
  {
    slug: 'astar',
    title: 'Астар',
    description:
      'Третий сезон Aralau — изнанка города: дворы-колодцы, парадные и лестницы, куда ведут двери без вывесок.',
    order: 2,
    locations: [
      {
        slug: 'dom-na-vzletnoy',
        title: 'Дом на Взлётной',
        order: 1,
        orientText:
          'Район, где улицы названы в честь неба, держит на земле один из самых странных дворов города. Войдите со стороны солнца.',
        storyText:
          'Жилые кварталы у Взлётной строились для лётчиков и инженеров, и дворы здесь проектировали как сады: внутренние аллеи, тополя, скамейки по кругу. Один такой двор сохранил планировку шестидесятых почти без изменений — редкость для города, который растёт вверх.',
        question: 'Для кого строились кварталы у Взлётной улицы?',
        answers: ['для лётчиков', 'лётчиков', 'летчиков', 'для летчиков']
      },
      {
        slug: 'paradnaya-s-lepninoy',
        title: 'Парадная с лепниной',
        order: 2,
        orientText:
          'Найдите парадную, где лифт ездит мимо витража. Подсказка: дом стоит на углу, и вход — с боковой улицы.',
        storyText:
          'Угловые дома старого Алматы часто прятали лучшие двери со двора: парадные с лепниной и коваными перилами оставались невидимыми с магистрали. В одной из них лифт ходит вдоль застеклённой шахты — стеклянная стена смотрит прямо во двор.',
        question: 'Что видит пассажир лифта через стену шахты?',
        answers: ['двор', 'внутренний двор']
      },
      {
        slug: 'lestnica-na-belaya',
        title: 'Лестница на Белая',
        order: 3,
        orientText:
          'Улица уходит вверх круче, чем кажется. Между двумя домами есть ступени, которых нет на картах — их проложили жильцы.',
        storyText:
          'Народные лестницы — стихия предгорного Алматы: когда уклон больше трёх градусов, жильцы сами бетонируют ступени. Эти переходы не числятся ни на одной карте, но связывают кварталы короче любых дорог — и каждая лестница помнит руку своих строителей.',
        question: 'Кто проложил лестницу между двумя домами?',
        answers: ['жильцы', 'жители', 'соседи']
      }
    ]
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

  // Seasons ii–iii: `draft`, places published (countable in progress
  // totals) — idempotent upserts, statuses never flip via re-seeding.
  for (const upcoming of upcomingSeasons) {
    const draftSeason = await prisma.season.upsert({
      where: { slug: upcoming.slug },
      update: {
        title: upcoming.title,
        description: upcoming.description,
        status: 'draft',
        startsAt: null,
        endsAt: null,
        order: upcoming.order
      },
      create: {
        slug: upcoming.slug,
        title: upcoming.title,
        description: upcoming.description,
        status: 'draft',
        startsAt: null,
        endsAt: null,
        order: upcoming.order
      }
    })

    for (const loc of upcoming.locations) {
      await prisma.location.upsert({
        where: { seasonId_slug: { seasonId: draftSeason.id, slug: loc.slug } },
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
          seasonId: draftSeason.id,
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

  console.info(
    `Seeded season "${season.slug}" with ${demoLocations.length} locations and ${upcomingSeasons.length} upcoming draft seasons.`
  )
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
