
var frame = new Synergy([700, 900, 1020]);
var box002 = $('#box002');


// Make synergy frame.
var action002_1 = frame({
  "height"     : [40, null, 'px'],
  "width"      : [40, 200, 'px']
});

var action002_2 = frame({
  "margin-left": [0, 280, 4000, 'px'],
});


// Make observer.
var anim002_1 = action002_1({
  step: function(attr){
    box002.css(attr);
  }
}).init(0);

var anim002_2 = action002_2({
  step: function(attr){
    box002.css(attr);
  }
}).init(0);


// Main action
var timer = null;
$('#run002').on('click', function(){
  var i = 660;
  if(timer) return;
  timer = setInterval(function(){
    anim002_1.observe(i * 1.1);
    anim002_2.observe(i);
    if(i>1020){
      clearInterval(timer);
      timer = null;
    }
    i++;
  });
});
