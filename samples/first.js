;(function(){

  var p = $('#preview-first');

  var observer = new Synergy([0, 100, 400], {
    'left': [0, 120, 0, 'px']
  })({
    step: function(attr, i){
      p.css(attr);
    },
  });

  $(window).scroll(function(){
    observer.observe($(window).scrollTop());
  });

})();
