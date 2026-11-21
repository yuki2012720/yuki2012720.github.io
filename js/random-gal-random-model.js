(function attachRandomGalRandomModel(root, factory) {
  const api = factory()
  if (typeof module === 'object' && module.exports) module.exports = api
  if (root) root.RandomGalRandomModel = api
})(typeof window === 'undefined' ? globalThis : window, function createRandomGalRandomModel() {
  function positionFromRandom(totalCount, pageSize, randomValue) {
    const total = Math.floor(Number(totalCount))
    const size = Math.floor(Number(pageSize))
    if (!Number.isFinite(total) || total < 1) throw new RangeError('totalCount must be positive')
    if (!Number.isFinite(size) || size < 1) throw new RangeError('pageSize must be positive')

    const normalizedRandom = Math.min(Math.max(Number(randomValue) || 0, 0), 1)
    const ordinal = Math.min(total - 1, Math.floor(normalizedRandom * total))

    return {
      ordinal,
      page: Math.floor(ordinal / size) + 1,
      index: ordinal % size
    }
  }

  function remainingRevealDelay(startedAt, currentTime, minimumMs = 500) {
    const started = Number(startedAt)
    const current = Number(currentTime)
    const minimum = Math.max(0, Number(minimumMs) || 0)
    if (!Number.isFinite(started) || !Number.isFinite(current)) return minimum
    return Math.max(0, minimum - Math.max(0, current - started))
  }

  return {
    positionFromRandom,
    remainingRevealDelay
  }
})
