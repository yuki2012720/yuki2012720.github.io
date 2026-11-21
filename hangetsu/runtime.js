(function(root,factory){
 const api=factory()
 if(typeof module==='object'&&module.exports)module.exports=api
 if(root?.document){
  const node=root.document.getElementById('site-runtime')
  if(!node)return
  const update=()=>{node.textContent=api.formatRuntime(node.dataset.since,Date.now())}
  update()
  if(api.elapsed(node.dataset.since,Date.now())){
   root.setInterval(update,1000)
   root.document.addEventListener('visibilitychange',()=>{if(!root.document.hidden)update()})
  }
 }
})(typeof window==='undefined'?null:window,function(){
 'use strict'
 function elapsed(since,now=Date.now()){
  const start=Date.parse(since)
  if(!Number.isFinite(start)||!Number.isFinite(now))return null
  const total=Math.max(0,Math.floor((now-start)/1000))
  return {days:Math.floor(total/86400),hours:Math.floor(total%86400/3600),minutes:Math.floor(total%3600/60),seconds:total%60}
 }
 function formatRuntime(since,now=Date.now()){
  const value=elapsed(since,now)
  return value?`${value.days} 天 ${value.hours} 时 ${value.minutes} 分 ${value.seconds} 秒`:'计时暂不可用'
 }
 return {elapsed,formatRuntime}
})
