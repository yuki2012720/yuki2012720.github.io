/* Inlined before the homepage stylesheet; coordinated with optional wait feedback. */
(function (init) {
  if (typeof module === 'object' && module.exports) module.exports = init
  else init(window)
})(function initHomeIntro(win) {
  'use strict'
  const doc = win.document, root = doc.documentElement
  // [delay, duration] in ms; 150ms release margin allows the last paint to settle.
  const timing = {nav:[350,1100],title:[650,1400],copy:[1050,1150],art:[1350,1650],cue:[2000,1000],end:3150}
  let active = false, timer, media, art, artStart, imageHandled = false, generation = 0
  const names = ['nav','title','art','copy','cue']

  function finish() {
    active = false
    generation++
    root.classList.remove('home-intro')
    names.forEach(name => {
      root.style.removeProperty('--home-'+name+'-delay')
      root.style.removeProperty('--home-'+name+'-duration')
    })
    if (art) {
      art.removeAttribute('data-home-intro-art')
      art.style.removeProperty('--home-art-delay')
      art.style.removeProperty('--home-art-duration')
    }
    win.clearTimeout(timer)
    doc.removeEventListener('load', imageEvent, true)
    doc.removeEventListener('error', imageEvent, true)
    doc.removeEventListener('DOMContentLoaded', inspectImage)
    if (media?.removeEventListener) media.removeEventListener('change', reduce)
    else media?.removeListener?.(reduce)
  }
  function restore(event) { if (event.persisted) start() }
  function reduce() { if (media.matches) finish() }
  function imageEvent(event) {
    if (event.target?.matches?.('link[rel="stylesheet"]') && /\/hangetsu\/site\.css(?:[?#]|$)/.test(event.target.href)) {
      if (event.type === 'error') return finish()
      // Styles may arrive late. Negative delays catch up without extending the deadline.
      const elapsed = win.performance.now() - started
      names.forEach(name => root.style.setProperty('--home-'+name+'-delay', (timing[name][0]-elapsed)+'ms'))
      if (artStart !== undefined) art.style.setProperty('--home-art-delay', (artStart-elapsed)+'ms')
      return
    }
    if (event.target?.matches?.('.hero-art img')) prepareImage(event.target, event.type === 'error')
  }
  function inspectImage() {
    const image = doc.querySelector('.hero-art img')
    if (image?.complete) prepareImage(image, !image.naturalWidth)
  }
  let started
  function prepareImage(image, failed) {
    if (!active || imageHandled) return
    imageHandled = true
    art = image.closest('.hero-art')
    const run = generation
    function reveal() {
      if (!active || run !== generation || !art) return
      const elapsed = win.performance.now() - started
      const delay = Math.max(0, timing.art[0] - elapsed)
      const available = timing.end - elapsed - delay
      if (failed || !image.naturalWidth || available < 160) {
        art.setAttribute('data-home-intro-art', 'skip')
        return
      }
      artStart = elapsed + delay
      art.style.setProperty('--home-art-delay', delay+'ms')
      art.style.setProperty('--home-art-duration', Math.min(timing.art[1], available)+'ms')
      art.setAttribute('data-home-intro-art', 'ready')
    }
    if (failed || !image.decode) reveal()
    else {
      try { Promise.resolve(image.decode()).then(reveal, reveal) }
      catch { reveal() }
    }
  }
  function start() {
    finish()
    art = undefined
    artStart = undefined
    imageHandled = false
    try {
      media = win.matchMedia('(prefers-reduced-motion: reduce)')
      if (media.matches) return false
      started = win.performance.now()
      active = true
      // Install the release before adding any class that can hide content.
      timer = win.setTimeout(finish, timing.end)
      names.forEach(name => {
        root.style.setProperty('--home-'+name+'-delay', timing[name][0]+'ms')
        root.style.setProperty('--home-'+name+'-duration', timing[name][1]+'ms')
      })
      doc.addEventListener('load', imageEvent, true)
      doc.addEventListener('error', imageEvent, true)
      doc.addEventListener('DOMContentLoaded', inspectImage, {once:true})
      if (media.addEventListener) media.addEventListener('change', reduce)
      else media.addListener?.(reduce)
      root.classList.add('home-intro')
      if (doc.readyState !== 'loading') inspectImage()
      return true
    } catch {
      if (active) finish()
      return false
    }
  }
  // Full document navigation runs this script again. Only BFCache needs replay.
  // No focus/visibility/hash/scroll handlers, and no visit-count storage.
  win.addEventListener('pagehide', finish)
  win.addEventListener('pageshow', restore)
  const playing = start()
  win.hangetsuLoading?.attachIntro({wait:finish,ready:shown=>{if (shown) start(); else inspectImage()}})
  return playing
})
