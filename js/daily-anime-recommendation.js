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
    const id = anime?.id || anime?.subject_id
    if (!id) return Number.NEGATIVE_INFINITY
    if (!context.allowRepeat && context.historyContext.recentNoRepeatIds.has(id)) {
      return Number.NEGATIVE_INFINITY
    }
    return 1
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
        historyContext
      }),
      pickCandidate: pickWeightedCandidate,
      seed: hashString(`${config.dayKey}-${pool.key}-final-pick`),
      shortlistSize: Math.max(1, candidates.length)
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
