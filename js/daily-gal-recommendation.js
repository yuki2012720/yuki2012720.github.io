(function attachDailyGalRecommendation(root, factory) {
  const model = typeof module === 'object' && module.exports
    ? require('./daily-recommendation-model.js')
    : root.DailyRecommendationModel
  const api = factory(model)
  if (typeof module === 'object' && module.exports) module.exports = api
  if (root) root.DailyGalRecommendation = api
})(typeof window === 'undefined' ? globalThis : window, function createDailyGalRecommendation(selectionModel) {
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

  function isSafeCandidate(game, options = {}) {
    const sexualThreshold = Number(options.sexualThreshold ?? 1)
    const minimumVotes = Number(options.minimumVotes ?? 1)
    const sexualScore = Number(game?.image?.sexual ?? 0)
    const voteCount = Number(game?.image?.votecount ?? 0)
    return !(sexualScore >= sexualThreshold && voteCount >= minimumVotes)
  }

  function scoreCandidate(game, context) {
    const id = game?.id
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

  function selectCandidateForPool(pool, candidates, config, historyContext, safetyOptions = {}) {
    return selectionModel.evaluateCandidatePool(
      candidates.filter(game => isSafeCandidate(game, safetyOptions)),
      {
        scoreCandidate: (game, allowRepeat) => scoreCandidate(game, {
          allowRepeat,
          dayKey: config.dayKey,
          poolKey: pool.key,
          historyContext
        }),
        pickCandidate: pickWeightedCandidate,
        seed: hashString(`${config.dayKey}-${pool.key}-final-pick`),
        shortlistSize: Math.max(1, candidates.length)
      }
    )
  }

  return {
    buildHistoryContext,
    hashString,
    isSafeCandidate,
    pickWeightedCandidate,
    scoreCandidate,
    selectCandidateForPool
  }
})
