(function attachRandomGalFilters(root, factory) {
  const api = factory()
  if (typeof module === 'object' && module.exports) module.exports = api
  if (root) root.RandomGalFilters = api
})(typeof window === 'undefined' ? globalThis : window, function createRandomGalFilters() {
  'use strict'

  const FIRST_GAL_YEAR = 1980
  const TAG_GROUPS = Object.freeze([
    {
      label: '题材',
      tags: [
        ['g96', '恋爱'], ['g2', '奇幻'], ['g105', '科幻'], ['g19', '悬疑'],
        ['g7', '恐怖'], ['g104', '喜剧'], ['g147', '剧情'], ['g12', '动作']
      ]
    },
    {
      label: '氛围',
      tags: [
        ['g324', '紧张'], ['g789', '惊悚'], ['g596', '泣系'], ['g693', '郁系'],
        ['g1154', '哲学'], ['g454', '日常'], ['g325', '智斗'], ['g168', '生死剧']
      ]
    },
    {
      label: '舞台',
      tags: [
        ['g47', '校园'], ['g1320', '乡村'], ['g424', '岛屿'], ['g68', '末世地球'],
        ['g682', '赛博朋克'], ['g1897', '都市奇幻'], ['g140', '未来'], ['g53', '太空']
      ]
    },
    {
      label: '角色与关系',
      tags: [
        ['g201', '青梅竹马女主'], ['g215', '家庭'], ['g710', '友情'], ['g134', '女性主人公'],
        ['g542', '乙女游戏'], ['g97', '女性恋爱'], ['g98', '男性恋爱']
      ]
    },
    {
      label: '叙事与玩法',
      tags: [
        ['g153', '本格推理'], ['g323', '侦探调查'], ['g148', '多结局'], ['g249', '时间旅行'],
        ['g152', '失忆'], ['g709', '一本道'], ['g864', '解谜'], ['g32', 'ADV'], ['g43', 'NVL']
      ]
    }
  ])
  const LANGUAGES = Object.freeze(['', 'ja', 'en', 'zh-Hans', 'zh-Hant', 'ko'])
  const PLATFORMS = Object.freeze(['', 'win', 'lin', 'mac', 'and', 'ios', 'swi', 'ps4', 'ps5'])
  const LENGTHS = Object.freeze(['', '1', '2', '3', '4', '5'])
  const DEFAULT_STATE = Object.freeze({
    yearMode: 'all',
    year: '',
    yearFrom: '',
    yearTo: '',
    ratingFrom: '',
    ratingTo: '',
    ratingCount: '',
    language: '',
    platform: '',
    length: '',
    tags: [],
    tagMode: 'all',
    safety: 'safe'
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
      && Number(value) >= FIRST_GAL_YEAR
      && Number(value) <= 2100
  }

  function isValidRating(value) {
    if (value === '') return true
    const number = Number(value)
    return Number.isFinite(number) && number >= 0 && number <= 10
  }

  function normalize(raw = {}) {
    const rawTags = uniqueStrings(raw.tags)
    const state = {
      yearMode: ['all', 'single', 'range'].includes(raw.yearMode) ? raw.yearMode : 'all',
      year: clean(raw.year),
      yearFrom: clean(raw.yearFrom),
      yearTo: clean(raw.yearTo),
      ratingFrom: clean(raw.ratingFrom),
      ratingTo: clean(raw.ratingTo),
      ratingCount: clean(raw.ratingCount),
      language: clean(raw.language),
      platform: clean(raw.platform),
      length: clean(raw.length),
      tags: rawTags.filter(tag => /^g\d+$/.test(tag)),
      tagMode: raw.tagMode === 'any' ? 'any' : 'all',
      safety: raw.safety === 'allow' ? 'allow' : 'safe'
    }
    const errors = {}

    if (state.yearMode === 'single' && !isValidYear(state.year)) {
      errors.year = '请选择有效年份'
    }
    if (state.yearMode === 'range') {
      if (state.yearFrom && !isValidYear(state.yearFrom)) {
        errors.yearFrom = `起始年份必须在 ${FIRST_GAL_YEAR} 到 2100 之间`
      }
      if (state.yearTo && !isValidYear(state.yearTo)) {
        errors.yearTo = `结束年份必须在 ${FIRST_GAL_YEAR} 到 2100 之间`
      }
      if (!errors.yearFrom && !errors.yearTo && state.yearFrom && state.yearTo
        && Number(state.yearFrom) > Number(state.yearTo)) {
        errors.yearRange = '起始年份不能晚于结束年份'
      }
    }
    if (!isValidRating(state.ratingFrom)) errors.ratingFrom = '最低分必须在 0 到 10 之间'
    if (!isValidRating(state.ratingTo)) errors.ratingTo = '最高分必须在 0 到 10 之间'
    if (!errors.ratingFrom && !errors.ratingTo && state.ratingFrom && state.ratingTo
      && Number(state.ratingFrom) > Number(state.ratingTo)) {
      errors.ratingRange = '最低分不能高于最高分'
    }
    if (state.ratingCount && !/^\d+$/.test(state.ratingCount)) {
      errors.ratingCount = '评分人数必须是非负整数'
    }
    if (!LANGUAGES.includes(state.language)) errors.language = '不支持这个语言筛选'
    if (!PLATFORMS.includes(state.platform)) errors.platform = '不支持这个平台筛选'
    if (!LENGTHS.includes(state.length)) errors.length = '不支持这个游戏长度'
    if (state.tags.length !== rawTags.length) errors.tags = '标签数据无效'

    return { state, errors }
  }

  function ratingValue(value) {
    return Math.round(Number(value) * 10)
  }

  function buildFilters(state) {
    const clauses = [['id', '>=', 'v1']]

    if (state.yearMode === 'single' && state.year) {
      const year = Number(state.year)
      clauses.push(['released', '>=', `${year}-01-01`])
      clauses.push(['released', '<', `${year + 1}-01-01`])
    } else if (state.yearMode === 'range') {
      if (state.yearFrom) clauses.push(['released', '>=', `${state.yearFrom}-01-01`])
      if (state.yearTo) clauses.push(['released', '<', `${Number(state.yearTo) + 1}-01-01`])
    }

    if (state.ratingFrom !== '') clauses.push(['rating', '>=', ratingValue(state.ratingFrom)])
    if (state.ratingTo !== '') clauses.push(['rating', '<=', ratingValue(state.ratingTo)])
    if (state.ratingCount) clauses.push(['votecount', '>=', Number(state.ratingCount)])
    if (state.language) clauses.push(['lang', '=', state.language])
    if (state.platform) clauses.push(['platform', '=', state.platform])
    if (state.length) clauses.push(['length', '=', Number(state.length)])

    if (state.tags.length && state.tagMode === 'any') {
      clauses.push(['or', ...state.tags.map(tag => ['tag', '=', tag])])
    } else {
      state.tags.forEach(tag => clauses.push(['tag', '=', tag]))
    }

    return clauses.length === 1 ? clauses[0] : ['and', ...clauses]
  }

  function describe(state, tagLabels = {}) {
    const parts = []
    if (state.yearMode === 'single' && state.year) parts.push(`${state.year} 年`)
    else if (state.yearMode === 'range' && state.yearFrom && state.yearTo) parts.push(`${state.yearFrom}–${state.yearTo} 年`)
    else if (state.yearMode === 'range' && state.yearFrom) parts.push(`${state.yearFrom} 年以后`)
    else if (state.yearMode === 'range' && state.yearTo) parts.push(`${state.yearTo} 年以前`)
    else parts.push('全部年份')

    if (state.ratingFrom && state.ratingTo) parts.push(`${state.ratingFrom}–${state.ratingTo} 分`)
    else if (state.ratingFrom) parts.push(`${state.ratingFrom} 分以上`)
    else if (state.ratingTo) parts.push(`${state.ratingTo} 分以下`)
    else parts.push('不限评分')

    if (state.ratingCount) parts.push(`至少 ${state.ratingCount} 人评分`)
    if (state.tags.length) {
      const labels = state.tags.map(tag => tagLabels[tag] || tag)
      parts.push(`${state.tagMode === 'any' ? '包含任一' : '同时包含'} ${labels.join('、')}`)
    }
    return parts.join(' · ')
  }

  function listYears(latestYear = new Date().getFullYear()) {
    const years = []
    for (let year = Number(latestYear); year >= FIRST_GAL_YEAR; year -= 1) years.push(year)
    return years
  }

  function listYearGroups(latestYear = new Date().getFullYear()) {
    const grouped = new Map()
    listYears(latestYear).forEach(year => {
      const decade = Math.floor(year / 10) * 10
      if (!grouped.has(decade)) grouped.set(decade, [])
      grouped.get(decade).push(year)
    })
    return [...grouped.entries()].map(([decade, years]) => ({
      label: `${decade}年代`,
      years
    }))
  }

  function getTagGroups() {
    return TAG_GROUPS.map(group => ({
      label: group.label,
      tags: group.tags.map(([id, label]) => ({ id, label }))
    }))
  }

  function getTagLabels() {
    return Object.fromEntries(
      TAG_GROUPS.flatMap(group => group.tags)
    )
  }

  return {
    DEFAULT_STATE,
    FIRST_GAL_YEAR,
    LANGUAGES,
    LENGTHS,
    PLATFORMS,
    buildFilters,
    describe,
    getTagGroups,
    getTagLabels,
    listYearGroups,
    listYears,
    normalize
  }
})
