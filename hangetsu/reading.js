/* Article-only, inlined before styles: preference restoration must precede paint. */
(function (win) {
  'use strict'
  const doc=win.document,root=doc.documentElement,key='hangetsu.readingMode'
  const backgrounds={white:'#ffffff',warm:'#f7f3ec',night:'#24212a'}
  const next={white:'warm',warm:'night',night:'white'},labels={white:'白纸',warm:'暖纸',night:'夜间'}
  function apply(value,save=false){
    const mode=Object.hasOwn(backgrounds,value)?value:'white'
    root.dataset.readingMode=mode;root.dataset.theme=mode==='night'?'dark':'light'
    root.style.setProperty('background-color',backgrounds[mode])
    doc.querySelector('meta[name="color-scheme"]')?.setAttribute('content',mode==='night'?'dark':'light')
    const control=doc.querySelector('[data-reading-picker]')
    if(control){
      const label='阅读模式：'+labels[mode]+'，点击切换为'+labels[next[mode]]
      control.setAttribute('aria-label',label)
    }
    if(save)try{win.localStorage.setItem(key,mode)}catch{}
  }
  function restore(){
    // A restored document must paint the latest preference immediately, not
    // animate from the colour captured in BFCache on another article.
    root.classList?.remove('reading-mode-changing')
    let mode;try{mode=win.localStorage.getItem(key)}catch{}apply(mode)
  }
  restore()
  doc.addEventListener('DOMContentLoaded',()=>{
    const picker=doc.querySelector('[data-reading-picker]')
    if(!picker)return
    picker.hidden=false;apply(root.dataset.readingMode)
    picker.addEventListener('click',()=>{
      root.classList.add('reading-mode-changing');apply(next[root.dataset.readingMode],true)
    })
  },{once:true})
  win.addEventListener('pagereveal',restore)
  win.addEventListener('pageshow',event=>{if(event.persisted)restore()})
})(window)
