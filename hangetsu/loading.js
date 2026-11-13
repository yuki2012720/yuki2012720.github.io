/* Early enhancement: wait feedback only, never a mandatory opening sequence. */
(function (init) {
  if (typeof module === 'object' && module.exports) module.exports = init
  else window.hangetsuLoading = init(window, {home:document.currentScript?.dataset.home === 'true'})
})(function initLoading(win, options) {
  'use strict'
  options = options || {}
  const doc = win.document
  // All loading time parameters in ms. No minimum display time.
  const timing = {threshold:500, timeout:8000, fade:500, breath:2200}
  const navigationKey='hangetsu.navigationWait'
  let incomingWait=false
  try{
    const hint=JSON.parse(win.sessionStorage.getItem(navigationKey)||'null')
    win.sessionStorage.removeItem(navigationKey)
    incomingWait=!!hint&&hint.url===win.location.href.split('#')[0]&&Date.now()-hint.at>=0&&Date.now()-hint.at<timing.timeout
  }catch{}
  const started = win.performance.now()
  let done = false, disposed = false, shown = false, cssReady = false, parsed = false
  let heroReady = !options.home, imageHandled = false, observer, showTimer, deadline, removeTimer, intro, layer, blueprint, navigationLayer
  const api = {beginNavigation(href) {
    if(!done || !blueprint || !doc.body)return
    api.endNavigation()
    // Native modals occupy the top layer above body overlays. Close them only
    // when a real, slow document navigation needs visible wait feedback.
    doc.querySelectorAll?.('dialog[open]').forEach(dialog=>dialog.close())
    navigationLayer=blueprint.cloneNode(true)
    navigationLayer.removeAttribute('data-leaving')
    navigationLayer.setAttribute('data-navigation-wait','')
    navigationLayer.hidden=false
    navigationLayer.style.setProperty('--loading-breath',timing.breath+'ms')
    navigationLayer.style.setProperty('--loading-safety',timing.timeout+'ms')
    doc.body.append(navigationLayer)
    try{win.sessionStorage.setItem(navigationKey,JSON.stringify({url:new URL(href,win.location.href).href.split('#')[0],at:Date.now()}))}catch{}
  },endNavigation(handoff=false){navigationLayer?.remove();navigationLayer=undefined;if(!handoff)try{win.sessionStorage.removeItem(navigationKey)}catch{}},isVisible(){return !!navigationLayer || (shown&&!done)},attachIntro(hooks) {
    intro = hooks
    if (disposed) return
    if (done) notify('ready', shown)
    else if (shown) notify('wait')
  }}
  function notify(name, value) { try { intro?.[name]?.(value) } catch {} }
  function stopWaiting() {
    win.clearTimeout(showTimer)
    win.clearTimeout(deadline)
    observer?.disconnect()
    doc.removeEventListener('load', resource, true)
    doc.removeEventListener('error', resource, true)
  }
  function remove() {
    win.clearTimeout(removeTimer)
    const node=layer || doc.querySelector('#page-loading')
    if(!blueprint && node?.cloneNode)blueprint=node.cloneNode(true)
    node?.remove()
    win.removeEventListener('pagehide', dispose)
    win.removeEventListener('pageshow', restore)
  }
  function dispose() {
    disposed = true
    done = true
    stopWaiting()
    doc.documentElement.classList.remove('loading-style-pending')
    doc.documentElement.style.removeProperty('--loading-safety')
    remove()
    intro = undefined
  }
  function restore(event) { if (event.persisted) dispose() }
  function settle() {
    if (done || disposed) return
    done = true
    stopWaiting()
    doc.documentElement.classList.remove('loading-style-pending')
    doc.documentElement.style.removeProperty('--loading-safety')
    // The intro starts as the overlay begins fading, never after another wait.
    notify('ready', shown)
    if (!shown || !layer) return remove()
    layer.setAttribute('data-leaving', '')
    let reduced = true
    try { reduced = win.matchMedia('(prefers-reduced-motion: reduce)').matches } catch {}
    if (reduced) remove()
    else removeTimer = win.setTimeout(remove, timing.fade)
  }
  function show() {
    if (done || disposed || shown) return
    layer = doc.querySelector('#page-loading')
    if (!layer) return // Streaming HTML may not have delivered the body yet.
    layer.style.setProperty('--loading-fade', timing.fade+'ms')
    layer.style.setProperty('--loading-breath', timing.breath+'ms')
    layer.style.setProperty('--loading-safety', (timing.timeout+timing.fade)+'ms')
    // Keep the native fast path. Only a genuinely slow stylesheet releases its
    // render block so this already-styled indicator can paint at the threshold.
    if (!cssReady) {
      const sheet = doc.querySelector('#site-styles')
      if (sheet) sheet.media = 'print'
    }
    layer.hidden = false
    shown = true
    notify('wait')
  }
  function check() { if (parsed && cssReady && heroReady) settle() }
  function portrait(image, failed) {
    if (done || disposed || imageHandled) return
    imageHandled = true
    const ready = () => {
      if (done || disposed) return
      heroReady = true
      check()
    }
    if (failed || !image.decode) ready()
    else { try { Promise.resolve(image.decode()).then(ready, ready) } catch { ready() } }
  }
  function scan() {
    if (done || disposed) return
    // Continue only feedback which was actually shown in the outgoing document.
    if(incomingWait && !shown)show()
    if (doc.querySelector('#page-content-ready')) {
      parsed = true
      if (options.home && !imageHandled) {
        const image = doc.querySelector('.hero-art img')
        if (!image) heroReady = true
        else if (image.complete) portrait(image, !image.naturalWidth)
      }
      observer?.disconnect()
    }
    check()
    if (!done && win.performance.now()-started >= timing.threshold) show()
  }
  function resource(event) {
    if (event.target?.id === 'site-styles') {
      if (event.type === 'error') return settle()
      event.target.media = 'all'
      doc.documentElement.classList.remove('loading-style-pending')
      cssReady = true
      scan()
    } else if (options.home && event.target?.matches?.('.hero-art img')) {
      portrait(event.target, event.type === 'error')
    }
  }
  try {
    // Install the escape before anything can display the overlay.
    deadline = win.setTimeout(settle, timing.timeout)
    doc.documentElement.style.setProperty('--loading-safety', (timing.timeout+timing.fade)+'ms')
    doc.documentElement.classList.add('loading-style-pending')
    showTimer = win.setTimeout(show, timing.threshold)
    win.addEventListener('pagehide', dispose)
    win.addEventListener('pageshow', restore)
    doc.addEventListener('load', resource, true)
    doc.addEventListener('error', resource, true)
    observer = new win.MutationObserver(scan)
    observer.observe(doc.documentElement, {childList:true,subtree:true})
    cssReady = !!doc.querySelector('#site-styles')?.sheet
    scan()
  } catch {
    settle()
    remove()
  }
  return api
})
