/* Observe ordinary MPA navigation. Never cancel links, fetch pages, or alter history. */
(function(factory){
  const api=factory()
  if(typeof module==='object'&&module.exports)module.exports=api
  else api.initNavigation(window,{home:document.currentScript?.dataset.home==='true'})
})(function(){
  'use strict'
  const timing={threshold:400,timeout:8000}
  function eligible(link,event,location){
    if(!link||event.defaultPrevented||event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey||link.hasAttribute('download')||(link.target&&link.target!=='_self'))return false
    try{
      const url=new URL(link.href,location.href),current=new URL(location.href)
      return /^https?:$/.test(url.protocol)&&url.origin===current.origin&&
        (url.pathname!==current.pathname||url.search!==current.search)&&
        (url.pathname.endsWith('/')||/\.html?$/.test(url.pathname)||!url.pathname.split('/').pop().includes('.'))
    }catch{return false}
  }
  function initNavigation(win,options={}){
    const doc=win.document;let timer,deadline,waiting=false,leaving=false,lifecycle=0
    function skip(transition){transition?.ready?.catch(()=>{});transition?.skipTransition()}
    function clear(handoff=false){win.clearTimeout(timer);win.clearTimeout(deadline);waiting=false;win.hangetsuLoading?.endNavigation(handoff)}
    // Check after the complete dispatch, including later window listeners.
    win.addEventListener('click',event=>{
      const observedLifecycle=lifecycle
      win.setTimeout(()=>{
      const link=event.target?.closest?.('a[href]')
      if(observedLifecycle!==lifecycle||leaving||doc.visibilityState==='hidden'||!eligible(link,event,win.location))return
      clear()
      leaving=false
      timer=win.setTimeout(()=>{if(!event.defaultPrevented&&doc.visibilityState!=='hidden'){waiting=true;win.hangetsuLoading?.beginNavigation(link.href)}},timing.threshold)
      deadline=win.setTimeout(clear,timing.timeout)
      },0)
    })
    win.addEventListener('pagehide',()=>{lifecycle++;leaving=true;clear(true)})
    win.addEventListener('pageshow',()=>{lifecycle++;leaving=false;clear()})
    doc.addEventListener('visibilitychange',()=>{if(doc.visibilityState==='hidden'){lifecycle++;clear(leaving)}})
    win.addEventListener('pageswap',event=>{
      let home=options.home
      try{home ||= /^\/(?:page\/\d+\/)?$/.test(new URL(event.activation.entry.url).pathname)}catch{}
      const shouldSkip=home||waiting||win.hangetsuLoading?.isVisible()||win.matchMedia('(prefers-reduced-motion: reduce)').matches
      lifecycle++;leaving=true;clear(true) // Remove wait feedback before an outgoing snapshot; retain the short-lived handoff.
      if(shouldSkip)skip(event.viewTransition)
    })
    win.addEventListener('pagereveal',event=>{
      if(options.home||win.hangetsuLoading?.isVisible()||win.matchMedia('(prefers-reduced-motion: reduce)').matches)skip(event.viewTransition)
    })
  }
  return {eligible,initNavigation}
})
