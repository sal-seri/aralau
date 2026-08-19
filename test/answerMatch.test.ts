import { describe, expect, it } from 'vitest'
import { checkAnswer, isNumeric, normalizeAnswer } from '../server/utils/answerMatch'

describe('normalizeAnswer', () => {
  it('lowercases', () => {
    expect(normalizeAnswer('ПРИВЕТ')).toBe('привет')
  })

  it('folds ё to е', () => {
    expect(normalizeAnswer('ёлка')).toBe('елка')
    expect(normalizeAnswer('Ёлка')).toBe('елка')
  })

  it('strips punctuation', () => {
    expect(normalizeAnswer('привет, мир!')).toBe('привет мир')
    expect(normalizeAnswer('«Зелёный базар»')).toBe('зеленый базар')
  })

  it('collapses whitespace and trims', () => {
    expect(normalizeAnswer('  много   пробелов  ')).toBe('много пробелов')
  })

  it('never NFD-strips — Kazakh precomposed letters survive untouched', () => {
    expect(normalizeAnswer('Әңгүұқһі')).toBe('әңгүұқһі')
    expect(normalizeAnswer('Қазақстан')).toBe('қазақстан')
  })

  it('trims to empty for whitespace-only input', () => {
    expect(normalizeAnswer('   ')).toBe('')
  })
})

describe('isNumeric', () => {
  it('accepts a plain digit sequence', () => {
    expect(isNumeric('1875')).toBe(true)
  })

  it('accepts digits with separators', () => {
    expect(isNumeric('12:30')).toBe(true)
    expect(isNumeric('1,875')).toBe(true)
  })

  it('rejects a sentence containing digits and letters', () => {
    expect(isNumeric('в 1875 году')).toBe(false)
  })

  it('rejects empty and non-numeric strings', () => {
    expect(isNumeric('')).toBe(false)
    expect(isNumeric('дерево')).toBe(false)
  })
})

describe('checkAnswer — numeric rule', () => {
  const answers = ['1875']

  it('accepts the exact number', () => {
    expect(checkAnswer('1875', answers)).toBe(true)
  })

  it('accepts the number embedded in a sentence, digit-sequence only', () => {
    expect(checkAnswer('в 1875 году', answers)).toBe(true)
    expect(checkAnswer('это случилось в 1875-м', answers)).toBe(true)
  })

  it('rejects a different number, even a 1-digit typo', () => {
    expect(checkAnswer('1874', answers)).toBe(false)
    expect(checkAnswer('в 1874 году', answers)).toBe(false)
  })

  it('never fuzzy-matches numeric variants', () => {
    // Levenshtein('1874', '1875') === 1 — must still be rejected.
    expect(checkAnswer('1874', answers)).toBe(false)
  })

  it('rejects a superset/subset digit sequence', () => {
    expect(checkAnswer('18750', answers)).toBe(false)
    expect(checkAnswer('187', answers)).toBe(false)
  })
})

describe('checkAnswer — fuzzy thresholds by normalized length', () => {
  it('length <= 4: exact only, rejects a single typo', () => {
    const answers = ['stol']
    expect(checkAnswer('stol', answers)).toBe(true)
    expect(checkAnswer('stel', answers)).toBe(false) // distance 1
  })

  it('length 5-9: accepts 1 typo, rejects 2', () => {
    const answers = ['bulbul'] // length 6
    expect(checkAnswer('bulbul', answers)).toBe(true) // distance 0
    expect(checkAnswer('culbul', answers)).toBe(true) // distance 1
    expect(checkAnswer('culbuc', answers)).toBe(false) // distance 2
  })

  it('length >= 10: accepts 2 typos, rejects 3', () => {
    const answers = ['abcdefghij'] // length 10
    expect(checkAnswer('abcdefghij', answers)).toBe(true) // distance 0
    expect(checkAnswer('zbcdefghiz', answers)).toBe(true) // distance 2
    expect(checkAnswer('zbcdzfghiz', answers)).toBe(false) // distance 3
  })
})

describe('checkAnswer — multiple ru + kk variants', () => {
  const answers = ['барс', 'снежный барс', 'алабай']

  it('matches any accepted variant, case/whitespace-insensitive', () => {
    expect(checkAnswer('Барс', answers)).toBe(true)
    expect(checkAnswer('  снежный   барс  ', answers)).toBe(true)
    expect(checkAnswer('Алабай!', answers)).toBe(true)
  })

  it('rejects an unrelated word', () => {
    expect(checkAnswer('волк', answers)).toBe(false)
  })

  it('matches a Kazakh-letter variant untouched by normalization', () => {
    expect(checkAnswer('Қала', ['қала', 'город'])).toBe(true)
  })
})

describe('checkAnswer — invalid input', () => {
  it('rejects empty input after trim', () => {
    expect(checkAnswer('   ', ['1875'])).toBe(false)
    expect(checkAnswer('', ['дерево'])).toBe(false)
  })
})
