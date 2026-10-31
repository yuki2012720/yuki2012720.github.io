/* Scroll chooses a destination; the browser completes the timed transition. */
(function(factory){
  const api=factory()
  if(typeof module==='object'&&module.exports)module.exports=api
  else api.initHomeScroll(window)
})(function(){
  'use strict'
  const settings={trigger:40,duration:850,easing:'cubic-bezier(.22,1,.36,1)'}
  function nextTarget(target,y,previousY){
    if(y<=0)return 'hero'
    return target==='hero'&&y>=settings.trigger&&y>previousY?'reading':target
  }
  function layoutFrame(g,scrollY,target){
    const y=Math.max(0,scrollY),reading=target==='reading'
    return {x:reading?g.target.x:g.source.x,y:reading?g.target.y:g.source.y,scale:reading?g.target.width/g.source.width:1,anchorY:-Math.max(0,g.storyTop-y)-(reading?0:y)}
  }
  function readingTarget({source,rail,articleRight,viewportWidth,viewportHeight}){
    const ratio=source.height/source.width,gutter=32,gap=40
    // Enlarge the artwork itself, using outer whitespace, not the article column.
    const width=Math.min(rail.width*1.3,Math.max(1,viewportHeight-96)/ratio,Math.max(1,viewportWidth-gutter-articleRight-gap))
    const x=Math.max(articleRight+gap,Math.min(rail.left,viewportWidth-gutter-width))
    // The larger portrait naturally raises its head; do not add a second offset.
    return {x,y:Math.max(36,(viewportHeight-width*ratio)/2),width}
  }
  function initHomeScroll(win){
    const doc=win.document,story=doc.querySelector('[data-home-story]')
    if(!story)return
    const slot=story.querySelector('.home-art-slot'),position=story.querySelector('.home-art-position'),motion=story.querySelector('.home-art-motion'),image=story.querySelector('.hero-art img'),rail=story.querySelector('.home-reading-rail'),root=doc.documentElement
    const desktop=win.matchMedia('(min-width: 1024px)'),reduced=win.matchMedia('(prefers-reduced-motion: reduce)')
    let geometry,frame,animation,remeasure=true,suspended=false,observer,target='hero',previousY=win.scrollY,restoring=true,failed=image.complete&&!image.naturalWidth
    story.style.setProperty('--home-story-duration',settings.duration+'ms')
    function stopAnimation(){const current=animation;animation=undefined;current?.cancel()}
    function reset(){
      stopAnimation();target='hero'
      root.classList.remove('home-scroll-enabled');root.classList.add('home-scroll-fallback');geometry=undefined
      motion.style.removeProperty('transform');motion.style.removeProperty('width');position.style.removeProperty('transform')
      delete story.dataset.homeState;delete story.dataset.homeTarget
    }
    function measure(){
      if(!desktop.matches||reduced.matches||failed){reset();return}
      root.classList.remove('home-scroll-fallback');root.classList.add('home-scroll-enabled')
      const y=win.scrollY,s=slot.getBoundingClientRect(),r=rail.getBoundingClientRect(),top=story.getBoundingClientRect().top+y
      if(!s.width||!s.height||!r.width){reset();return}
      const target=readingTarget({source:s,rail:r,articleRight:story.querySelector('.post-list').getBoundingClientRect().right,viewportWidth:win.innerWidth,viewportHeight:win.innerHeight})
      geometry={storyTop:top,source:{x:s.left,y:s.top+y,width:s.width,height:s.height},target}
      motion.style.width=s.width+'px'
    }
    const transform=state=>`translate3d(${state.x}px,${state.y}px,0) scale(${state.scale})`
    function placeAnchor(state){position.style.transform=`translate3d(0,${state.anchorY}px,0)`}
    function show(next,animated){
      const rect=motion.getBoundingClientRect()
      stopAnimation();target=next
      const state=layoutFrame(geometry,win.scrollY,target)
      placeAnchor(state)
      const parent=position.getBoundingClientRect()
      const from=transform({x:rect.left-parent.left,y:rect.top-parent.top,scale:rect.width/geometry.source.width})
      const destination=transform(state)
      motion.style.transform=destination;story.dataset.homeTarget=target
      if(!animated||!motion.animate){story.dataset.homeState=target;return}
      story.dataset.homeState='transitioning'
      const current=motion.animate([{transform:from},{transform:destination}],{duration:settings.duration,easing:settings.easing})
      animation=current
      current.onfinish=()=>{
        if(animation!==current||suspended)return
        animation=undefined;story.dataset.homeState=target
      }
    }
    function render(){
      frame=undefined
      if(suspended)return
      try{
        const measured=remeasure,hadGeometry=!!geometry,y=win.scrollY
        if(measured){remeasure=false;measure()}
        if(geometry){
          // The independent anchor also follows natural Hero scrolling while
          // its automatic return animation is still running.
          // Scale is never calculated from scroll distance.
          placeAnchor(layoutFrame(geometry,y,target))
          // A cached reading state below the trigger still remains reading.
          const next=nextTarget(target,y,restoring||!hadGeometry?-Infinity:previousY)
          if(measured)show(next,false)
          else if(next!==target){
            if(target==='hero'&&!animation)motion.style.transform=transform(layoutFrame(geometry,y,'hero'))
            show(next,true)
          }else if(target==='hero'&&!animation)motion.style.transform=transform(layoutFrame(geometry,y,'hero'))
        }
        restoring=false;previousY=y
      }catch{reset()}
    }
    function schedule(){if(!suspended&&frame===undefined)frame=win.requestAnimationFrame(render)}
    function resize(){remeasure=true;schedule()}
    function restore(){suspended=false;restoring=true;observe();resize()}
    function pause(){suspended=true;stopAnimation();win.cancelAnimationFrame(frame);frame=undefined;observer?.disconnect()}
    function observe(){if(observer){observer.observe(story);observer.observe(slot)}}
    try{
      if('ResizeObserver' in win){observer=new win.ResizeObserver(resize);observe()}
      win.addEventListener('scroll',schedule,{passive:true});win.addEventListener('resize',resize,{passive:true})
      win.addEventListener('pageshow',restore);win.addEventListener('pagehide',pause)
      desktop.addEventListener('change',resize);reduced.addEventListener('change',resize)
      image.addEventListener('load',()=>{failed=false;resize()});image.addEventListener('error',()=>{failed=true;resize()})
      doc.fonts?.ready.then(resize,()=>{})
      render()
    }catch{reset()}
  }
  return {layoutFrame,nextTarget,readingTarget,initHomeScroll}
})
