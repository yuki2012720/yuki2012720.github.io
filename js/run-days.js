(function() {
  var startDate = new Date('2026-02-25T22:21:00+08:00');
  
  function updateRuntime() {
    var now = new Date();
    var diffTime = now - startDate;
    
    if (diffTime < 0) diffTime = 0;
    
    var totalSeconds = Math.floor(diffTime / 1000);
    var days = Math.floor(totalSeconds / (60 * 60 * 24));
    var hours = Math.floor((totalSeconds % (60 * 60 * 24)) / (60 * 60));
    var minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
    var seconds = totalSeconds % 60;
    
    var runDaysElement = document.getElementById('run-days');
    if (runDaysElement) {
      runDaysElement.innerHTML = '<span style="font-size: 16px;">© 2026 By 藍二乘｜ 在孤独之海已等待 <span style="color: #fff; text-shadow: 0 0 3px rgba(0,0,0,0.8); font-weight: bold;">' + days + '</span> 天 ' +
        '<span style="color: #fff; text-shadow: 0 0 3px rgba(0,0,0,0.8); font-weight: bold;">' + hours + '</span> 时 ' +
        '<span style="color: #fff; text-shadow: 0 0 3px rgba(0,0,0,0.8); font-weight: bold;">' + minutes + '</span> 分 ' +
        '<span style="color: #fff; text-shadow: 0 0 3px rgba(0,0,0,0.8); font-weight: bold;">' + seconds + '</span> 秒</span>';
    }
  }
  
  updateRuntime();
  
  setInterval(updateRuntime, 1000);
})();
