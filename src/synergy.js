(function(root, factory){


  // timeline = [FROM, TO, TO, TO, ....]
  //
  // attribute = {
  //   NAME : [FROM, TO, TO, TO, TO, ..., UNIT],
  //   NAME : [FROM, TO, TO, TO, TO, ..., UNIT],
  // }
  //
  // op = {
  //  debug     : false,
  //  start_out : null,
  //  start_in  : null,
  //  end_out   : null,
  //  end_in    : null,
  //  cross     : null,
  // }
  
  var namespace = 'Synergy';

  // Exposure!!
  ;((typeof exports) === "object" && (typeof module) === "object")
    ? (module.exports = factory())
    : (
      (typeof define === "function" && define.amd)
        ? define([], factory)
        : (root[namespace] = factory())
      );

})(this, function(/*
  Array timeline,
  Object attribute,
  Object Options - callbacks
*/){

  'use strict';

  // Instance definition.
  function Synergy(){
    this.instance = null;
    this.status = {
      border        : 0,
      dest          : 0,
      overflow      : false,
      position      : 0,
      last_position : 0,
      direction     : 0,
      attribute     : {},
      timeline      : [],
      range         : {head: 0, tail: 0, inverted: false},
      rate          : 0,
      step          : 0,
      last_callback : undefined,
      paused        : false,
    };
    this.option = {
      debug         : false,
      // callbacks
      step          : function(e){},
      cross         : function(e){},
      start_out     : function(e){},
      start_in      : function(e){},
      end_out       : function(e){},
      end_in        : function(e){}
    };
  }
  
  var Sp = Synergy.prototype;
  
  Sp.observe = function(value){
    __main(this, value);
    return this;
  }

  Sp.pause = function(){
    this.status.paused = true;
    return this;
  }

  Sp.resume = function(){
    this.status.paused = false;
    return this;
  }

  Sp.update = function(timeline, attribute){
    this.status.timeline = timeline;
    this.status.attribute = attribute;
    __update(this);
    return this;
  }

  Sp.config = function(o){
    var self = this;
    each(o, function(v, i){
      if(self.option.hasOwnProperty(i))
        self.option[i] = v;
    });
    return self;
  }

  Sp.init = function(val){
    __init(this, val);
    return this;
  }

  // Called 3 times or given 3 arguments,
  // this will return Synergy instance.
  return surrogate(this, arguments);


  /*-----------------------------------
   * Privates
   */

  function surrogate(instance, stack, depth){
    var s = Array.prototype.slice.call(stack);
    var expc_cl = 3;
    return function(){
      var d = (depth) ? depth : 1;
      var a = s.concat(Array.prototype.slice.call(arguments));
      return (d >= expc_cl || a.length >= expc_cl)
        ? generator.apply(instance, a)
        : surrogate(instance, a, d)
    }
  }

  function generator(timeline, attribute, option){
    var option = option || {};
    var self = new Synergy;
    self.instance = this;

    each({
      border: timeline[0],
      dest:   timeline[1],
      attribute: attribute || {},
      timeline: timeline || [] 
    }, function(v, i){
      if(self.status[i]) self.status[i] = v;
    });

    // Options
    each(option, function(v, i){
      if(self.option.hasOwnProperty(i))
        self.option[i] = v;
    });

    __update(self);

    return self;
  }



  function __init(self, val){
    __update(self);
    __recalc(self, val || 0);
    __calculate(self);
    return self;
  }

  function __update(self){
    __update_attribute(self);
    var st = self.status;
    var tm = st.timeline;
    st.range.head = tm[0];
    st.range.tail = tm[tm.length - 1];
    st.range.inverted = st.range.head > st.range.tail;
  }

  function __recalc(self, pos){
    var st = self.status;
    var calced = calc_from_to(st.timeline, pos, st.range.inverted);
    st.border = calced[0];
    st.dest   = calced[1];
    st.step   = calced[2];
  }

  function __main(self, pos){
    __recalc(self, pos);
    var st = self.status;
    var p = ( pos - st.border );
    var c = ( st.dest - st.border );
    var rate = 0;

    if(!p){
      rate = 0;
    }else if(!c){
      rate = 1;
    }else{
      rate  = (p/c);
    }

    if(rate <= 0 ){
      st.rate = 0;
      st.overflow = true;
    }else if(rate > 1){
      st.rate = 1;
      st.overflow = true;
    }else{
      st.rate = rate;
      st.overflow = false;
    }

    st.position   = pos;
    st.direction  = (!st.range.inverted)
      ? (st.last_position < pos ? 1 : 0)
      : (st.last_position > pos ? 1 : 0);
    st.last_position = pos;

    __calculate(self);
  }
  
  function __calculate(self){
    __toggle_pause(self);

    var st = self.status;
    var arg = __callback_args(self);
    if(
      !st.paused
      ||
      (st.paused === false && st.paused === true)
    ){
      __call_step(self, arg);
      __call_next_callable(self, arg);
      if(st.border === st.position || st.dest === st.position){
        call(self.option.cross, arg);
      }
    }

    st.last_position = st.position;
  }
  
  function __toggle_pause(self){
    var st = self.status;
    if(
      (!st.range.inverted && (
        st.position > st.range.tail
        || st.position < st.range.head
      ))
      ||
      (st.range.inverted && (
        st.position < st.range.tail
        || st.position > st.range.head
      ))
    ){
      self.pause();
    }else{
      self.resume();
    }
  }

  /* Reformat attribute flow object.
   */
  function __update_attribute(self){
    var st = self.status;
    var sta = st.attribute;
    each(sta, function(v, attr){
      sta[attr] = __update_attribute_values(self, v);
    });
    return sta;
  }
  
  function __update_attribute_values(self, v){
    var st = self.status;
    var prev   = null;
    var next   = null;
    
    v = format_attr(v);

    each(v.seq, function(value, k){

      if(value === null){
        prev = find_prev_available_value(st.timeline, k, v.seq);
        v.seq[k] = prev.value;
      }

      if(value === true){
        prev = find_prev_available_value(st.timeline, k, v.seq);
        next = find_next_available_value(st.timeline, k, v.seq);

        var range_diff = ( st.timeline[next.index] - st.timeline[prev.index] );
        var value_diff = ( next.value - prev.value );

        v.seq[k]
          = prev.value + (
              value_diff / range_diff * (st.timeline[k] - st.timeline[prev.index])
            );
      }
    });
    
    return v;
  }


  function __next_callable(self){
    /*
     * @example
     *
     * If self.status.timeline = [1, 2, 3] ,
     *
     * `>` means self.status.direction === 1
     * `<` means self.status.direction === 0
     *
     * [self.status.position]
     * --------------------------------------------------------
     * 0            1            2            3               4
     * -------------|------------|------------|----------------
     *   start_in ->.<-start_out .
     *              ^            ^  end_out ->.<- end_in
     *              |            |            ^
     *            cross        cross        cross
     */
    var _c = [];
    var st = self.status;

    if(st.position === st.range.head && st.direction === 1) _c.push('start_in');
    if(st.position === st.range.head && st.direction === 0) _c.push('start_out');
    if(st.position === st.range.tail && st.direction === 1) _c.push('end_out');
    if(st.position === st.range.tail && st.direction === 0) _c.push('end_in');

    return _c;
  }

  function __call_step(self, arg){
    var st = self.status;
    if(is_a(self.option.step)){
      var n = st.timeline.indexOf(st.position);
      (n >= 0) && (self.option.step[n]) && call(self.option.step[n], arg);
    }else if(is_f(self.option.step)){
      call(self.option.step, arg)
    }
  }

  function __call_next_callable(self, arg){
    __next_callable(self).map(function(nc){
      if(self.option.hasOwnProperty(nc)){
        call(self.option[nc], arg);
      }
    });
  }

  function __callback_args(self){
    var st = self.status;
    var attr = gen_attr(st.position, st.attribute, st.rate, st.step);
    (self.option.debug) && console.log(attr);
    return [attr, st.position, st.rate];
  }


  // Is it function?
  function is_f(a){
    return (typeof a === 'function');
  };

  // Is it array?
  function is_a(a){
    return toString.call(a) === '[object Array]';
  }

  // Is it object?
  function is_o(a){
    return toString.call(a) === '[object Object]';
  }

  // Iterator for Object, Array.
  function each(obj, callback){
    switch(true){
      case is_o(obj):
        for(var i in obj)
          callback.apply(obj, [obj[i], i]);
        break;
      case is_a(obj):
        obj.map.call(obj, callback);
        break;
    }
  }

  function call(f, args){
    f.apply(self, args);
  }

  function gen_attr(pos, set, rate, step){
    var ret = {};

    each(set, function(v, k){

      if( is_f(v.seq) ){
        ret[k] = v.seq.apply(v.seq, [pos, rate, step, set]);
        return;
      }

      var
        vals = v.seq
      , unit = v.unit
      , from = undefined, to = undefined
      , value = ''
      , addu = (unit ? String(unit) : 0)
      , f_i, t_i
      ;

      // overflow

      if(step + 1 >= vals.length){
        from = vals[vals.length - 1];
        to   = vals[vals.length - 1];
      }else if(vals[step] !== undefined && vals[step+1] !== undefined){
        from = vals[step];
        to   = vals[step+1];
      }else if(typeof vals[step] === 'undefined'){
        from = vals[vals.length - 1];
        to   = vals[vals.length - 1];
      }

      if( is_f(from) ){
        from = from(pos, rate);
      }

      if( is_f(to) ){
        to = to(pos, rate);
      }

      if( typeof to !== 'number' ){
        value = to;
      }else{
        f_i = parseFloat(from);
        t_i = parseFloat(to);

        if(f_i !== NaN && t_i !== NaN){
          if(f_i < t_i){
            value = ( f_i + ( (t_i - f_i)*rate ) ) + addu;
          }else if(f_i > t_i){
            value = ( f_i - ( (f_i - t_i)*rate ) ) + addu;
          }else{
            value = f_i + addu;
          }
        }else{
          if(rate === 0){
            value = from;
          }else if(rate===1){
            value = to;
          }
        }
      }

      ret[k] = value;
    });

    return ret;
  }

  function calc_from_to(range, pos, inverted){
    var b = range[0]
      , d = range[1]
      , t = inverted || false
      , s = 0
      ;

    each(range, function(v, i){
      if(v <= pos){
        b = v; s = i;
        d = (range[i+1] !== undefined) ? range[i+1] : range[i];
      }
    });

    return [b, d, s];
  }
  
  /* find_next_available_value
   * ()
   */
  function find_next_available_value(timeline, index, values){
    var ret  = values[index]
      , vals = values.slice(index)
      ;

    for(var i = 0; i < vals.length; i++ ){
      var val = vals[i];

      if(is_f(val)){
        val = val(timeline[i], 0);
      }

      if(val !== true && val !== null){
        ret = val;
        index = i;
        break;
      }
    }

    return {
      'index': index,
      'value': ret
    };
  }
  
  /* find_prev_available_value
   * ()
   */
  function find_prev_available_value(timeline, index, values){
    var ret = values[index];

    var vals = values.slice(0, index);

    for(var i = vals.length - 1; i >= 0; i-- ){
      var val = vals[i];

      if( is_f(val) ){
        val = val(timeline[i], 0);
      }

      if(val !== true && val !== null){
        ret = val;
        index = i;
        break;
      }
    }

    return {
      'index': index,
      'value': ret
    };
  }
  
  // Check event usable
  //
  //   String -> Boolean
  //
  function detect_event_support(ev){
    var el = document.createElement('div');
    ev = 'on' + ev;
    var is_supported = (ev in el);
    if (!is_supported) {
      el.setAttribute(ev, 'return;');
      is_supported = is_f(el[ev]);
    }
    el = null;
    return is_supported;
  }
  
  function format_attr(v){
    var ret = {};
    ret.orig = v;
    ret.seq = null;
    ret.unit = null;
    
    if(is_f(v)){
      ret.seq = v;
    }else if(is_a(v)){
      var unit = v.slice(-1)[0];
      if(typeof unit === 'string'){
        ret.seq = v.slice(0, -1);
        ret.unit = unit;
      }else{
        ret.seq = v;
        ret.unit = false;
      }
    }else if(is_o(v)){
      ret = v;
    }
    return ret;
  }

});