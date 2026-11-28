(function attachRandomAnimeFilters(root, factory) {
  const api = factory()
  if (typeof module !== 'undefined' && module.exports) module.exports = api
  root.RandomAnimeFilters = api
})(typeof window === 'undefined' ? globalThis : window, function createRandomAnimeFilters() {
  'use strict'

  const FIRST_ANIME_YEAR = 1892
  const DEFAULT_STATE = Object.freeze({
    yearMode: 'all',
    year: '',
    yearFrom: '',
    yearTo: '',
    scoreFrom: '',
    scoreTo: '',
    ratingCount: '',
    format: 'all',
    tags: [],
    tagMode: 'all'
  })

  const FORMAT_TAGS = Object.freeze({
    all: [''],
    tv: ['TV'],
    movie: ['剧场版'],
    'ova-oad': ['OVA', 'OAD'],
    web: ['Web'],
    short: ['短片']
  })

  const FORMAT_LABELS = Object.freeze({
    all: '全部形式',
    tv: 'TV 动画',
    movie: '剧场版',
    'ova-oad': 'OVA / OAD',
    web: 'Web 动画',
    short: '短片'
  })

  function clean(value) {
    return value === undefined || value === null ? '' : String(value).trim()
  }

  function uniqueStrings(values) {
    if (!Array.isArray(values)) return []
    return [...new Set(values.map(clean).filter(Boolean))]
  }

  function isValidYear(value) {
    return /^\d{4}$/.test(value)
      && Number(value) >= FIRST_ANIME_YEAR
      && Number(value) <= 2100
  }

  function isValidScore(value) {
    if (value === '') return true
    const number = Number(value)
    return Number.isFinite(number) && number >= 0 && number <= 10
  }

  function isValidRatingCount(value) {
    return value === '' || /^\d+$/.test(value)
  }

  function normalize(raw = {}) {
    const yearMode = ['all', 'single', 'range'].includes(raw.yearMode)
      ? raw.yearMode
      : DEFAULT_STATE.yearMode
    const format = Object.hasOwn(FORMAT_TAGS, raw.format)
      ? raw.format
      : DEFAULT_STATE.format
    const state = {
      yearMode,
      year: clean(raw.year),
      yearFrom: clean(raw.yearFrom),
      yearTo: clean(raw.yearTo),
      scoreFrom: clean(raw.scoreFrom),
      scoreTo: clean(raw.scoreTo),
      ratingCount: clean(raw.ratingCount),
      format,
      tags: uniqueStrings(raw.tags),
      tagMode: raw.tagMode === 'any' ? 'any' : 'all'
    }
    const errors = {}

    if (state.yearMode === 'single' && !isValidYear(state.year)) {
      errors.year = '请选择有效年份'
    }

    if (state.yearMode === 'range') {
      if (state.yearFrom && !isValidYear(state.yearFrom)) {
        errors.yearFrom = `起始年份必须在 ${FIRST_ANIME_YEAR} 到 2100 之间`
      }
      if (state.yearTo && !isValidYear(state.yearTo)) {
        errors.yearTo = `结束年份必须在 ${FIRST_ANIME_YEAR} 到 2100 之间`
      }
      if (!errors.yearFrom && !errors.yearTo && state.yearFrom && state.yearTo
        && Number(state.yearFrom) > Number(state.yearTo)) {
        errors.yearRange = '起始年份不能晚于结束年份'
      }
    }

    if (!isValidScore(state.scoreFrom)) {
      errors.scoreFrom = '最低分必须在 0 到 10 之间'
    }
    if (!isValidScore(state.scoreTo)) {
      errors.scoreTo = '最高分必须在 0 到 10 之间'
    }
    if (!errors.scoreFrom && !errors.scoreTo && state.scoreFrom && state.scoreTo
      && Number(state.scoreFrom) > Number(state.scoreTo)) {
      errors.scoreRange = '最低分不能高于最高分'
    }

    if (!isValidRatingCount(state.ratingCount)) {
      errors.ratingCount = '评分人数必须是非负整数'
    }

    return { state, errors }
  }

  function buildBaseFilter(state) {
    const filter = { type: [2] }

    if (state.yearMode === 'single' && state.year) {
      const year = Number(state.year)
      filter.air_date = [`>=${year}-01-01`, `<${year + 1}-01-01`]
    } else if (state.yearMode === 'range') {
      const airDate = []
      if (state.yearFrom) airDate.push(`>=${state.yearFrom}-01-01`)
      if (state.yearTo) airDate.push(`<${Number(state.yearTo) + 1}-01-01`)
      if (airDate.length) filter.air_date = airDate
    }

    const ratings = []
    if (state.scoreFrom) ratings.push(`>=${state.scoreFrom}`)
    if (state.scoreTo) ratings.push(`<=${state.scoreTo}`)
    if (ratings.length) filter.rating = ratings

    if (state.ratingCount) filter.rating_count = [`>=${state.ratingCount}`]

    return filter
  }

  function buildSearchPlans(state) {
    const baseFilter = buildBaseFilter(state)
    const formatTags = FORMAT_TAGS[state.format] || FORMAT_TAGS.all
    const selectedTags = uniqueStrings(state.tags)
    const tagGroups = selectedTags.length && state.tagMode === 'any'
      ? selectedTags.map(tag => [tag])
      : [selectedTags]

    return formatTags.flatMap(formatTag => tagGroups.map(userTags => {
      const tags = uniqueStrings([formatTag, ...userTags])
      const filter = tags.length
        ? { ...baseFilter, tag: tags }
        : { ...baseFilter }
      return { filter }
    }))
  }

  function shuffled(items, random = Math.random) {
    const result = items.slice()
    for (let index = result.length - 1; index > 0; index -= 1) {
      const value = Math.min(Math.max(Number(random()) || 0, 0), 0.999999999999)
      const target = Math.floor(value * (index + 1))
      ;[result[index], result[target]] = [result[target], result[index]]
    }
    return result
  }

  function buildRandomSearchPlans(state, latestYear = new Date().getFullYear(), random = Math.random) {
    const currentYear = Number(latestYear)
    let firstYear = FIRST_ANIME_YEAR
    let lastYear = currentYear

    if (state.yearMode === 'single' && state.year) {
      firstYear = Number(state.year)
      lastYear = firstYear
    } else if (state.yearMode === 'range') {
      firstYear = state.yearFrom ? Number(state.yearFrom) : FIRST_ANIME_YEAR
      lastYear = state.yearTo ? Number(state.yearTo) : currentYear
    }

    const years = []
    for (let year = firstYear; year <= lastYear; year += 1) years.push(year)

    const plans = shuffled(years, random).flatMap(year => {
      const yearState = {
        ...state,
        yearMode: 'single',
        year: String(year),
        yearFrom: '',
        yearTo: ''
      }
      return buildSearchPlans(yearState).map(plan => ({ ...plan, year }))
    })

    return shuffled(plans, random)
  }

  function buildMonthlySearchPlans(plan, random = Math.random) {
    const year = Number(plan?.year)
    if (!Number.isInteger(year)) return []

    const plans = []
    for (let month = 1; month <= 12; month += 1) {
      const nextYear = month === 12 ? year + 1 : year
      const nextMonth = month === 12 ? 1 : month + 1
      const start = `${year}-${String(month).padStart(2, '0')}-01`
      const end = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`
      plans.push({
        ...plan,
        month,
        filter: {
          ...plan.filter,
          air_date: [`>=${start}`, `<${end}`]
        }
      })
    }

    return shuffled(plans, random)
  }

  function describeYear(state) {
    if (state.yearMode === 'single' && state.year) return `${state.year} 年`
    if (state.yearMode === 'range') {
      if (state.yearFrom && state.yearTo) return `${state.yearFrom}–${state.yearTo} 年`
      if (state.yearFrom) return `${state.yearFrom} 年以后`
      if (state.yearTo) return `${state.yearTo} 年以前`
    }
    return '全部年份'
  }

  function describeScore(state) {
    if (state.scoreFrom && state.scoreTo) return `${state.scoreFrom}–${state.scoreTo} 分`
    if (state.scoreFrom) return `${state.scoreFrom} 分以上`
    if (state.scoreTo) return `${state.scoreTo} 分以下`
    return '不限评分'
  }

  function describeTags(state) {
    if (!state.tags.length) return '不限标签'
    if (state.tags.length === 1) return state.tags[0]
    return `${state.tagMode === 'any' ? '任一包含' : '同时包含'} ${state.tags.join('、')}`
  }

  function describeRatingCount(state) {
    return state.ratingCount ? `至少 ${state.ratingCount} 人评分` : ''
  }

  function describe(state) {
    return [
      describeYear(state),
      describeScore(state),
      describeRatingCount(state),
      FORMAT_LABELS[state.format] || FORMAT_LABELS.all,
      describeTags(state)
    ].filter(Boolean).join(' · ')
  }

  function listYears(latestYear = new Date().getFullYear()) {
    const result = []
    for (let year = Number(latestYear); year >= FIRST_ANIME_YEAR; year -= 1) {
      result.push(year)
    }
    return result
  }

  return {
    DEFAULT_STATE,
    FORMAT_LABELS,
    normalize,
    buildBaseFilter,
    buildSearchPlans,
    buildRandomSearchPlans,
    buildMonthlySearchPlans,
    describe,
    listYears
  }
})
