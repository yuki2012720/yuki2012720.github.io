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

  function normalizeDescription(description) {
    return String(description || '').replace(/\s+/g, ' ').trim()
  }

  function hasChineseLanguage(game) {
    return Array.isArray(game?.languages)
      && game.languages.some(language => language === 'zh-Hans' || language === 'zh-Hant')
  }

  function getStrongTagCount(game) {
    return Array.isArray(game?.tags) ? game.tags.filter(tag => (tag.rating || 0) >= 1).length : 0
  }

  function getVotecountBonus(votecount) {
    if (votecount >= 300) return 0.95
    if (votecount >= 120) return 0.7
    if (votecount >= 50) return 0.45
    if (votecount >= 20) return 0.2
    if (votecount <= 3) return -1.2
    if (votecount <= 10) return -0.7
    return -0.2
  }

  function isSafeCandidate(game, options = {}) {
    const sexualThreshold = Number(options.sexualThreshold ?? 1)
    const minimumVotes = Number(options.minimumVotes ?? 1)
    const sexualScore = Number(game?.image?.sexual ?? 0)
    const voteCount = Number(game?.image?.votecount ?? 0)
    return !(sexualScore >= sexualThreshold && voteCount >= minimumVotes)
  }

  function scoreCandidate(game, context) {
    const gameId = game?.id
    if (!gameId || !Number.isFinite(game.rating)) return Number.NEGATIVE_INFINITY
    const isRecentRepeat = context.historyContext.recentNoRepeatIds.has(gameId)
    if (!context.allowRepeat && isRecentRepeat) return Number.NEGATIVE_INFINITY
    let score = game.rating / 10
    const description = normalizeDescription(game.description)
    const tagCount = getStrongTagCount(game)
    if (hasChineseLanguage(game)) score += 1.15
    if (game.image?.url) score += 0.7
    if (description.length >= 220) score += 0.9
    else if (description.length >= 120) score += 0.6
    else if (description.length >= 40) score += 0.3
    if (tagCount >= 8) score += 0.8
    else if (tagCount >= 5) score += 0.55
    else if (tagCount >= 3) score += 0.25
    score += getVotecountBonus(game.votecount || 0)
    const repeatPenalty = context.historyContext.recentPenaltyWeights.get(gameId) || 0
    if (repeatPenalty) score -= Math.min(1.6, repeatPenalty / 12)
    if (context.allowRepeat && isRecentRepeat) score -= 2.8
    score += ((hashString(`${context.dayKey}-${context.poolKey}-${gameId}`) % 1000) / 1000) * 0.65
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
        shortlistSize: 8
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
