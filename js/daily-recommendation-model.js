(function attachDailyRecommendationModel(root, factory) {
  const api = factory()
  if (typeof module === 'object' && module.exports) module.exports = api
  if (root) root.DailyRecommendationModel = api
})(typeof window === 'undefined' ? globalThis : window, function createDailyRecommendationModel() {
  // One shared calendar policy for scheduled snapshots and browser previews.
  function buildYearPools(kind, dayKey) {
    const eras = [
      ['before-2000', '2000 年前', null, '2000-01-01'],
      ['2000-2004', '2000–2004', '2000-01-01', '2005-01-01'],
      ['2005-2009', '2005–2009', '2005-01-01', '2010-01-01'],
      ['2010-2014', '2010–2014', '2010-01-01', '2015-01-01'],
      ['2015-2019', '2015–2019', '2015-01-01', '2020-01-01'],
      ['2020-now', '2020 年至今', '2020-01-01', null]
    ]
    return eras.map(([key, label, from, until]) => {
      const upper = until && until <= dayKey ? until : dayKey
      const exclusive = until && until <= dayKey
      const dates = [...(from ? [['>=', from]] : []), [exclusive ? '<' : '<=', upper]]
      const pool = { key, label }
      if (kind === 'anime') pool.airDateRange = dates.map(([operator, date]) => operator + date)
      else pool.filter = ['and', ['id', '>=', 'v1'], ...dates.map(([operator, date]) => ['released', operator, date])]
      return pool
    })
  }
  function scoreCandidates(candidates, scoreCandidate, allowRepeat) {
    return candidates
      .map(candidate => ({
        candidate,
        score: scoreCandidate(candidate, allowRepeat)
      }))
      .filter(entry => Number.isFinite(entry.score))
      .sort((a, b) => b.score - a.score)
  }

  function pickResult(scoredCandidates, options, allowRepeat) {
    if (!scoredCandidates.length) return null

    const shortlistSize = Math.max(1, Number(options.shortlistSize || 8))
    const shortlist = scoredCandidates.slice(0, Math.min(shortlistSize, scoredCandidates.length))
    const selected = options.pickCandidate(shortlist, options.seed)
    if (!selected) return null

    return {
      candidate: selected.candidate,
      score: selected.score,
      allowRepeat,
      candidateCount: scoredCandidates.length
    }
  }

  function evaluateCandidatePool(candidates, options) {
    if (!Array.isArray(candidates)) throw new TypeError('candidates must be an array')
    if (typeof options?.scoreCandidate !== 'function') throw new TypeError('scoreCandidate must be a function')
    if (typeof options?.pickCandidate !== 'function') throw new TypeError('pickCandidate must be a function')

    const freshCandidates = scoreCandidates(candidates, options.scoreCandidate, false)
    const freshResult = pickResult(freshCandidates, options, false)
    if (freshResult) {
      return {
        freshResult,
        repeatResult: null
      }
    }

    const repeatCandidates = scoreCandidates(candidates, options.scoreCandidate, true)
    return {
      freshResult: null,
      repeatResult: pickResult(repeatCandidates, options, true)
    }
  }

  function choosePoolEvaluation(poolEvaluations) {
    if (!Array.isArray(poolEvaluations)) throw new TypeError('poolEvaluations must be an array')

    for (const entry of poolEvaluations) {
      if (entry?.evaluation?.freshResult) {
        return {
          pool: entry.pool,
          result: entry.evaluation.freshResult
        }
      }
    }

    for (const entry of poolEvaluations) {
      if (entry?.evaluation?.repeatResult) {
        return {
          pool: entry.pool,
          result: entry.evaluation.repeatResult
        }
      }
    }

    return null
  }

  return {
    buildYearPools,
    evaluateCandidatePool,
    choosePoolEvaluation
  }
})
