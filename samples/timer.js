(function(){

  var $el = $('#preview-timer-output');

  var timer = new Synergy([1, 2, 3, 5, 7])({
    value: function(v){ return v; }
  },
  {
    step: [
      function(attr, pos, rate){
        $el.html('One: ' + attr.value);
      },
      function(attr){
        $el.html('Two?' + attr.value);
      },
      function(attr){
        $el.html('Three...' + attr.value);
      },
      function(attr){
        $el.html('Five!!!');
      },
      function(){
        $el.html('Nothing to say anymore.');
      }
    ]
  });

  $(document).on('click', '#run-timer', function(){
    var i = 0;
    setInterval(function(){
      i++;
      timer.observe(i);
    }, 1000);
  })

})();
