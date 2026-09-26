(function attachRandomDrawModel(root, factory) {
  const api = factory()
  if (typeof module === 'object' && module.exports) module.exports = api
  if (root) root.RandomDrawModel = api
})(typeof window === 'undefined' ? globalThis : window, function createRandomDrawModel() {
  'use strict'

  function stableId(item) {
    if (!item || item.id === undefined || item.id === null) return ''
    const id = String(item.id).trim()
    return id && id !== '0' ? id : ''
  }

  function uniqueItems(items) {
    const seen = new Set()
    const result = []
    for (const item of Array.isArray(items) ? items : []) {
      const id = stableId(item)
      if (!id || seen.has(id)) continue
      seen.add(id)
      result.push(item)
    }
    return result
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

  function createCandidatePool(items, options = {}) {
    const unique = uniqueItems(items)
    const recentIds = new Set((options.recentIds || []).map(id => String(id)))
    const fresh = unique.filter(item => !recentIds.has(stableId(item)))
    const fallback = unique.filter(item => recentIds.has(stableId(item)))
    const order = list => options.preserveOrder
      ? list
      : shuffled(list, options.random || Math.random)

    return [...order(fresh), ...order(fallback)]
  }

  async function drawFreshCandidate(loadCandidates, options = {}) {
    if (typeof loadCandidates !== 'function') {
      throw new TypeError('loadCandidates must be a function')
    }
    const candidates = await loadCandidates()
    return createCandidatePool(candidates, options)[0] || null
  }

  function randomIndex(totalCount, randomValue = Math.random()) {
    const total = Math.floor(Number(totalCount))
    if (!Number.isFinite(total) || total < 1) throw new RangeError('totalCount must be positive')
    const value = Math.min(Math.max(Number(randomValue) || 0, 0), 1)
    return Math.min(total - 1, Math.floor(value * total))
  }

  async function drawFromPartitionedPlans(plans, loadPlan, options = {}) {
    if (typeof loadPlan !== 'function') throw new TypeError('loadPlan must be a function')
    const resultCap = Math.max(1, Number(options.resultCap) || 1000)
    const candidateOptions = options.candidateOptions || {}
    const configuredMaxLoads = Math.floor(Number(options.maxLoads))
    const maxLoads = Number.isFinite(configuredMaxLoads) && configuredMaxLoads > 0
      ? configuredMaxLoads
      : Number.POSITIVE_INFINITY
    let loadCount = 0

    for (const plan of Array.isArray(plans) ? plans : []) {
      if (loadCount >= maxLoads) return null
      if (typeof options.onPlan === 'function') options.onPlan(plan)
      loadCount += 1
      const batch = await loadPlan(plan)
      const total = Number(batch?.total) || 0

      if (total >= resultCap && typeof options.splitPlan === 'function') {
        const partitions = options.splitPlan(plan)
        for (const partition of Array.isArray(partitions) ? partitions : []) {
          if (loadCount >= maxLoads) return null
          if (typeof options.onPlan === 'function') options.onPlan(partition)
          loadCount += 1
          const partitionBatch = await loadPlan(partition)
          const candidate = createCandidatePool(partitionBatch?.items, candidateOptions)[0] || null
          if (candidate) return candidate
        }
        continue
      }

      const candidate = createCandidatePool(batch?.items, candidateOptions)[0] || null
      if (candidate) return candidate
    }

    return null
  }

  function rotateFromIndex(items, rawIndex) {
    if (!Array.isArray(items) || !items.length) return []
    const index = Math.min(Math.max(Math.floor(Number(rawIndex)) || 0, 0), items.length - 1)
    return [...items.slice(index), ...items.slice(0, index)]
  }

  function prependRecent(items, item, limit = 30) {
    const id = stableId(item)
    if (!id) return uniqueItems(items).slice(0, Math.max(0, Number(limit) || 0))
    const rest = uniqueItems(items).filter(entry => stableId(entry) !== id)
    return [item, ...rest].slice(0, Math.max(0, Number(limit) || 0))
  }

  function toggleFavorite(items, item, limit = 30) {
    const id = stableId(item)
    const current = uniqueItems(items)
    if (!id) return current.slice(0, Math.max(0, Number(limit) || 0))
    if (current.some(entry => stableId(entry) === id)) {
      return current.filter(entry => stableId(entry) !== id)
    }
    return [item, ...current].slice(0, Math.max(0, Number(limit) || 0))
  }

  function parseStoredItems(raw, limit = 30) {
    if (!raw) return []
    try {
      return uniqueItems(JSON.parse(raw)).slice(0, Math.max(0, Number(limit) || 0))
    } catch (error) {
      return []
    }
  }

  return {
    createCandidatePool,
    drawFreshCandidate,
    drawFromPartitionedPlans,
    randomIndex,
    parseStoredItems,
    prependRecent,
    rotateFromIndex,
    stableId,
    toggleFavorite,
    uniqueItems
  }
})
