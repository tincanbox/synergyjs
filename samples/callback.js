;(function(){

  var observer = new Synergy([3,6,9], {});

  var val = 0;

  var UI_add     = $('#preview-callback-sample-add-button');
  var UI_red     = $('#preview-callback-sample-minus-button');
  var UI_prv_clb = $('#preview-callback-sample-event');
  var UI_prv_val = $('#preview-callback-sample-value');


  function update(txt){
    console.log(txt);
    var def = UI_prv_clb.text();
    var msg = (txt ? (def ? def+', ' : '') + txt: '');
    UI_prv_clb.text(msg);
    UI_prv_val.text(val);
    $('#preview-callback-pre').css('transform', 'rotate('+(val*2)+'deg)');
  }


  var action = observer({
    step: function(attr, i){
      // If function assigned to 'step' property,
      // it will be called everytime when observe method is called.
    },
    start_in:  function(){ update('start_in'); },
    start_out: function(){ update('start_out'); },
    end_in:    function(){ update('end_in'); },
    end_out:   function(){ update('end_out'); },
    cross:     function(){ update('cross'); },
    in_range:  function(){ update('in_range'); }
  });


  (function(){
    update();

    UI_add.on('click', function(){
      if(val + 1 > 10) return;
      val++; update();
      action.observe(val);
    });

    UI_red.on('click', function(){
      if(val - 1 < 0) return;
      val--; update();
      action.observe(val);
    });
  })();

})();
