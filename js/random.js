(function attachRandomPost(root, factory) {
  const api = factory()
  if (typeof module === 'object' && module.exports) module.exports = api
  if (root) root.toRandomPost = () => api.toRandomPost(root)
})(typeof window === 'undefined' ? globalThis : window, function createRandomPost() {
  'use strict'

  function postPath(item) {
    if (typeof item === 'string') return item.trim()
    if (item && typeof item === 'object' && typeof item.path === 'string') {
      return item.path.trim()
    }
    return ''
  }

  function comparablePath(path) {
    const normalized = String(path || '').replace(/index\.html$/, '').replace(/\/+$/, '')
    return normalized || '/'
  }

  function pickRandomPath(items, currentPath, random = Math.random) {
    const current = comparablePath(currentPath)
    const candidates = [...new Set((Array.isArray(items) ? items : [])
      .map(postPath)
      .filter(Boolean))]
      .filter(path => comparablePath(path) !== current)

    if (!candidates.length) return ''
    const value = Math.min(Math.max(Number(random()) || 0, 0), 0.999999999999)
    return candidates[Math.floor(value * candidates.length)]
  }

  async function toRandomPost(browser = window, random = Math.random) {
    try {
      const response = await browser.fetch('/post_list.json')
      if (!response.ok) throw new Error('Failed to fetch post list')
      const posts = await response.json()
      const randomPath = pickRandomPath(posts, browser.location.pathname, random)

      if (!randomPath) {
        browser.alert('暂时没有其他文章可供随机跳转')
        return
      }

      browser.location.href = randomPath
    } catch (error) {
      browser.console?.error('Error fetching post list:', error)
      browser.alert('随机文章加载失败，请稍后重试')
    }
  }

  return {
    pickRandomPath,
    toRandomPost
  }
})
