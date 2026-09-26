'use strict'

;(function (root, factory) {
  const api = factory()
  if (typeof module === 'object' && module.exports) module.exports = api
  if (root?.document) {
    root.APlayerLoader = api
    root.aplayerReady = api.loadAPlayer({ browser: root, document: root.document })
  }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  const DEFAULT_URLS = {
    primaryCss: 'https://cdn.jsdelivr.net/npm/aplayer@1.10.1/dist/APlayer.min.css',
    fallbackCss: 'https://unpkg.com/aplayer@1.10.1/dist/APlayer.min.css',
    primaryJs: 'https://cdn.jsdelivr.net/npm/aplayer@1.10.1/dist/APlayer.min.js',
    fallbackJs: 'https://unpkg.com/aplayer@1.10.1/dist/APlayer.min.js'
  }

  function appendStylesheet(document, primaryUrl, fallbackUrl) {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = primaryUrl
    link.onerror = function () {
      link.onerror = null
      link.href = fallbackUrl
    }
    document.head.append(link)
  }

  function appendScript(document, url) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = url
      script.onload = resolve
      script.onerror = () => reject(new Error(`Failed to load ${url}`))
      document.head.append(script)
    })
  }

  async function loadAPlayer(options = {}) {
    const settings = { ...DEFAULT_URLS, ...options }
    const { browser, document } = settings
    if (browser.APlayer) return browser.APlayer

    appendStylesheet(document, settings.primaryCss, settings.fallbackCss)

    try {
      await appendScript(document, settings.primaryJs)
    } catch {
      await appendScript(document, settings.fallbackJs)
    }

    if (!browser.APlayer) throw new Error('APlayer loaded without exposing its constructor')
    return browser.APlayer
  }

  return { DEFAULT_URLS, loadAPlayer }
})
