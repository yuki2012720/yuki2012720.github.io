(function() {
  var hasInit = false;
  
  function savePlayState() {
    if (window.aplayerInstance) {
      var isPlaying = !window.aplayerInstance.audio.paused;
      sessionStorage.setItem('aplayerPlaying', isPlaying ? 'true' : 'false');
    }
  }
  
  function restorePlayState() {
    if (window.aplayerInstance && window.aplayerInstance.audio) {
      var savedState = sessionStorage.getItem('aplayerPlaying');
      if (savedState === 'true') {
        window.aplayerInstance.play();
      }
    }
  }
  
  function tryFirstPlay() {
    if (hasInit) return;
    if (window.aplayerInstance && window.aplayerInstance.audio) {
      var wasPlaying = sessionStorage.getItem('aplayerPlaying');
      if (wasPlaying === null) {
        hasInit = true;
        window.aplayerInstance.play();
        sessionStorage.setItem('aplayerPlaying', 'true');
      }
    }
  }

  document.addEventListener('click', function autoplay(e) {
    if (hasInit) return;
    tryFirstPlay();
  }, { once: false });

  window.addEventListener('load', function() {
    setTimeout(function() {
      tryFirstPlay();
      restorePlayState();
    }, 500);
  });
  
  if (window.aplayerInstance) {
    window.aplayerInstance.on('play', function() {
      sessionStorage.setItem('aplayerPlaying', 'true');
    });
    
    window.aplayerInstance.on('pause', function() {
      sessionStorage.setItem('aplayerPlaying', 'false');
    });
  }
  
  window.addEventListener('beforeunload', savePlayState);
  
  if (typeof pjax !== 'undefined') {
    document.addEventListener('pjax:complete', function() {
      setTimeout(restorePlayState, 100);
    });
  }
})();
