import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma'

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
