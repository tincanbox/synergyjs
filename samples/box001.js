var box001   = $('#box001');
var timeline = [280, 380, 480, 620, 680];
var timer    = null;


var synergy001 = new Synergy(timeline, {
  'width'  :   function(i){ var a = (-2 * Math.pow(i/134, 2) + 100) + "%"; return a; },
  'height' :   [40, true, function(i){ return (i/4); }, null, 0, 'px'],
  'transform': [0, true, function(i){ return i/2.4; }, null, 0]
})({
  step: function(attr, i){
    if(attr.transform) attr.transform = 'rotate(' + attr.transform + 'deg)';
    box001.css(attr);
  }
}).init();


$('#run001').on('click', function(){
  (timer) && clearInterval(timer);

  var i = 200;
  timer = setInterval(function(){
    (i>timeline[timeline.length - 1]) && clearInterval(timer); i++;
    synergy001.observe(i);
  });
});
