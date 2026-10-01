(function attachDailyAnimeRecommendation(root, factory) {
  const model = typeof module === 'object' && module.exports
    ? require('./daily-recommendation-model.js')
    : root.DailyRecommendationModel
  const api = factory(model)
  if (typeof module === 'object' && module.exports) module.exports = api
  if (root) root.DailyAnimeRecommendation = api
})(typeof window === 'undefined' ? globalThis : window, function createDailyAnimeRecommendation(selectionModel) {
  'use strict'

  function hashString(input) {
    let hash = 0
    const value = String(input || '')
    for (let index = 0; index < value.length; index += 1) {
      hash = ((hash << 5) - hash) + value.charCodeAt(index)
      hash |= 0
    }
    return Math.abs(hash)
  }

  function normalizeSummary(summary) {
    return String(summary || '').replace(/\s+/g, ' ').trim()
  }

  function normalizeTagName(tagName) {
    return String(tagName || '').replace(/\s+/g, '').trim().toLowerCase()
  }

  function getTagObjects(anime) {
    const rawTags = Array.isArray(anime?.tags) ? anime.tags : []
    return rawTags
      .map(tag => ({
        name: typeof tag === 'string' ? tag : (tag?.name || ''),
        count: Number(typeof tag === 'string' ? 0 : (tag?.count || 0))
      }))
      .filter(tag => tag.name)
  }

  function countTagMatches(tagNames, targets) {
    const targetSet = new Set((targets || []).map(normalizeTagName))
    return tagNames.reduce((total, tagName) => total + (targetSet.has(tagName) ? 1 : 0), 0)
  }

  function getRatingTotalBonus(total) {
    if (total >= 5000) return 1.8
    if (total >= 2000) return 1.3
    if (total >= 800) return 0.9
    if (total >= 300) return 0.5
    if (total >= 100) return 0.2
    if (total < 30) return -1.5
    if (total < 80) return -1
    return -0.3
  }

  function getRankBonus(rank) {
    if (!rank || rank <= 0) return 0
    if (rank <= 100) return 0.25
    if (rank <= 300) return 0.15
    if (rank <= 800) return 0.08
    if (rank <= 1500) return 0.02
    return 0
  }

  function getTagCountBonus(tagCount) {
    if (tagCount >= 12) return 0.75
    if (tagCount >= 8) return 0.55
    if (tagCount >= 5) return 0.3
    if (tagCount <= 2) return -0.2
    return 0
  }

  function getTagSignalBonus(tagObjects) {
    const topSignal = tagObjects.slice().sort((a, b) => b.count - a.count).slice(0, 3)
      .reduce((sum, tag) => sum + tag.count, 0)
    if (topSignal >= 3000) return 0.45
    if (topSignal >= 1200) return 0.25
    if (topSignal >= 300) return 0.1
    if (topSignal > 0 && topSignal < 30) return -0.15
    return 0
  }

  function buildHistoryContext(historyEntries, dayKey, options = {}) {
    const noRepeatDays = Number(options.noRepeatDays || 90)
    const downweightWindow = Number(options.downweightWindow || 15)
    const history = (Array.isArray(historyEntries) ? historyEntries : [])
      .filter(entry => entry?.date < dayKey)
      .sort((a, b) => b.date.localeCompare(a.date))
    const recentNoRepeatIds = new Set(history.slice(0, noRepeatDays).map(entry => entry.id))
    const recentPenaltyWeights = new Map()
    history.slice(0, downweightWindow).forEach((entry, index) => {
      const existingWeight = recentPenaltyWeights.get(entry.id) || 0
      recentPenaltyWeights.set(entry.id, existingWeight + (downweightWindow - index))
    })
    return { recentNoRepeatIds, recentPenaltyWeights }
  }

  function splitPoolSequenceByRecentStreak(pools, historyEntries, dayKey) {
    const priorHistory = (Array.isArray(historyEntries) ? historyEntries : [])
      .filter(entry => entry?.date < dayKey)
      .sort((a, b) => b.date.localeCompare(a.date))
    const recentPoolKeys = priorHistory.slice(0, 2).map(entry => entry.poolKey).filter(Boolean)
    if (recentPoolKeys.length < 2 || recentPoolKeys[0] !== recentPoolKeys[1]) {
      return { preferredPools: pools, fallbackPool: null }
    }
    const blockedPoolKey = recentPoolKeys[0]
    const preferredPools = pools.filter(pool => pool.key !== blockedPoolKey)
    const fallbackPool = pools.find(pool => pool.key === blockedPoolKey) || null
    return {
      preferredPools: preferredPools.length ? preferredPools : pools,
      fallbackPool: preferredPools.length ? fallbackPool : null
    }
  }

  function scoreCandidate(anime, context) {
    const animeId = anime?.id || anime?.subject_id
    const baseRating = Number(anime?.rating?.score || anime?.score || 0)
    const ratingTotal = Number(anime?.rating?.total || 0)
    if (!animeId || !baseRating) return Number.NEGATIVE_INFINITY
    if (context.minVotes && ratingTotal < context.minVotes) return Number.NEGATIVE_INFINITY
    const isRecentRepeat = context.historyContext.recentNoRepeatIds.has(animeId)
    if (!context.allowRepeat && isRecentRepeat) return Number.NEGATIVE_INFINITY

    let score = baseRating
    const summary = normalizeSummary(anime.summary || anime.short_summary || '')
    const tagObjects = getTagObjects(anime)
    const tagNames = tagObjects.map(tag => normalizeTagName(tag.name))
    score += getRatingTotalBonus(ratingTotal)
    score += getRankBonus(Number(anime.rank || 0))
    if (anime.name_cn) score += 0.35
    if (anime.images || anime.image) score += 0.55
    if (summary.length >= 220) score += 0.8
    else if (summary.length >= 120) score += 0.55
    else if (summary.length >= 40) score += 0.25
    score += getTagCountBonus(tagObjects.length)
    score += getTagSignalBonus(tagObjects)
    score += Math.min(0.72, countTagMatches(tagNames, context.emotionProfile?.tags) * 0.24)
    score += Math.min(0.48, countTagMatches(tagNames, context.seasonProfile?.tags) * 0.16)
    const repeatPenalty = context.historyContext.recentPenaltyWeights.get(animeId) || 0
    if (repeatPenalty) score -= Math.min(1.6, repeatPenalty / 12)
    if (context.allowRepeat && isRecentRepeat) score -= 2.8
    score += ((hashString(`${context.dayKey}-${context.poolKey}-${animeId}`) % 1000) / 1000) * 0.55
    return score
  }

  function pickWeightedCandidate(candidates, seed) {
    const weighted = candidates.map(candidate => ({ ...candidate, weight: Math.max(candidate.score * 100, 1) }))
    const totalWeight = weighted.reduce((sum, candidate) => sum + candidate.weight, 0)
    let target = seed % totalWeight
    for (const candidate of weighted) {
      if (target < candidate.weight) return candidate
      target -= candidate.weight
    }
    return weighted[0] || null
  }

  function selectCandidateForPool(pool, candidates, config, historyContext) {
    return selectionModel.evaluateCandidatePool(candidates, {
      scoreCandidate: (anime, allowRepeat) => scoreCandidate(anime, {
        allowRepeat,
        dayKey: config.dayKey,
        poolKey: pool.key,
        minVotes: Number(pool.minVotes || 0),
        emotionProfile: config.emotionProfile,
        seasonProfile: config.seasonProfile,
        historyContext
      }),
      pickCandidate: pickWeightedCandidate,
      seed: hashString(`${config.dayKey}-${pool.key}-final-pick`),
      shortlistSize: 8
    })
  }

  return {
    buildHistoryContext,
    hashString,
    pickWeightedCandidate,
    scoreCandidate,
    selectCandidateForPool,
    splitPoolSequenceByRecentStreak
  }
})
