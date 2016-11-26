/*
  NotificationBar 0.1.0 - The panel that displays messages
  Oleksand Melnyk (moris912@gmail.com)
*/

(function(root, factory){
  if (typeof define === 'function' && define.amd){
    define(factory);
  } else if (typeof exports === 'object') {
    module.exports = factory();
  } else {
    root.NotificationBar = factory();
  }
})(this, function(){

  'use strict';

  var NotificationBar = {};

  NotificationBar.version = '0.1.0';

  var parent = null;

  var config = {
    max: 6,
    ttl: 60000,
    parent: "nb",
    onChange: function(msg, action, count){},
    info:     '<p><i class="fa fa-check ui-nb-ic ui-nb-ic-info"></i> Text </p><p class="ui-nb-tm"> tms </p>',
    progress: '<p><i class="fa fa-check ui-nb-ic ui-nb-ic-prog"></i> Text </p><progress max="1" value="Percent"></progress><p class="ui-nb-tm"> tms </p>',
    error:    '<p><i class="fa fa-times ui-nb-ic ui-nb-ic-erro"></i> Text </p><p class="ui-nb-tm"> tms </p>'
  };

  NotificationBar.config = config;

  /**
  * Setup configuration
  * @param {Config} options
  *
  * NotificationBar.configure({
  *  max: 10
  * });
  */
  NotificationBar.configure = function(options){
    var key, val;
    for (key in options) {
      val = options[key];
      if (val !== undefined && options.hasOwnProperty(key)){
        config[key] = val;
      }
    }
    return this;
  };

  var STATUS_TYPE  = { On: 0, Off: 1};

  NotificationBar.status = STATUS_TYPE.Off;

  /**
  * Start to receive messages
  *
  * NotificationBar.on();
  */
  NotificationBar.on = function(){

    parent = document.getElementById(NotificationBar.config.parent);

    NotificationBar.status = STATUS_TYPE.On;

    return this;
  };

  /**
  * Stop to receive messages
  *
  * NotificationBar.off()
  */
  NotificationBar.off = function(){
    
    NotificationBar.status = STATUS_TYPE.Off;

    return this;
  };


  var MESSAGE_TYPE = { Info: 0, Progress: 1, Error: 2};
  var ACTIONS_TYPE = { Add: 0, Remove: 1, Update: 2 };
  

  NotificationBar.queue = [];

  /**
  * Adds new message
  * @param {Message} msg 
  *
  * NotificationBar.add({
  *  "Id"   : "bc1e61f8-b832-4793-92bd-57e61f538c64",
  *  "Text" : "Hello world",
  *  "Type" : 0,
  *  "CreateOn" : "2016-08-09T18:31:42"
  * });
  */
  NotificationBar.add = function(msg){

    if (NotificationBar.status === STATUS_TYPE.Off){
      return;
    }

    valid(msg);
  
    var que = NotificationBar.queue,
        max = NotificationBar.config.max,
        cur = get(que, msg);

    // Update
    if (cur){
      msg.uid = cur.uid; 
      cur = msg;
      render(cur, ACTIONS_TYPE.Update);
      return;
    }

    // Remove
    if (que.length >= max){
      cur = que.shift();
      render(cur, ACTIONS_TYPE.Remove);
    }

    // Add
    que.push(msg);
    render(msg, ACTIONS_TYPE.Add);

    return this;
  };

  /**
   * Valids message
   * @param {Message} msg 
   * @return {Message} msg
   */
  function valid(msg){
    if (!msg || !msg.Text){
      throw "Wrong messages format";
    }
    if (!msg.Id){
      msg.Id = guid();
    }
    if (!msg.Type){
      msg.Type = MESSAGE_TYPE.Info;
    }
    if (!msg.CreateOn){
      msg.CreateOn = new Date().toISOString();
    }
    if (!msg.Percent){
      msg.Percent = 1;
    }

    msg.uid = unid();
    msg.ttl = NotificationBar.config.ttl;
    msg.tms = time(msg.CreateOn);
  }

  /**
   * Gets guid
   * @return {string} uid
   *
   * @input:
   * @output: "bc650795-2f41-43da-8166-3f083ee8c0e0"
  */
  function guid(){
    var id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
    return id.replace(/[xy]/g, function(c) {
      var r = Math.random()*16|0,v=c=='x'?r:r&0x3|0x8;return v.toString(16);
    });
  }

  /**
   * Finds element by Id
   * @param {array} queue 
   * @param {Message} msg 
   * @return {Message} el
   */
  function get(queue, msg){
    var i = 0;
    for (i = 0; i < queue.length; i++) {
      if (queue[i].Id === msg.Id){
        return queue[i];
      }
    }
    return null;
  }

  /**
   * Formats date
   * @param {string} str 
   * @return {string} t
   *
   * @input:  "2016-11-26T11:18:13.835Z"
   * @output: "13:18"
  */
  function time(str){
    var t = new Date(str);
    return t.getHours() + ":" + (("0" + t.getMinutes()).substr(-2));
  }

  /**
   * Gets unique id
   * @return {string} uid
   *
   * @input:
   * @output: "_m8i6um88q"
  */
  function unid(){
    var uid = '_' + Math.random().toString(36).substr(2, 9);
    return uid;
  }

  /**
   * Gets template
   * @param {MESSAGE_TYPE} type 
   * @return {string} tmp
  */
  function template(type){

    var cfg = NotificationBar.config,
        tmp = "";
  
    if (type === MESSAGE_TYPE.Info){
      tmp = cfg.info;
    } else if (type === MESSAGE_TYPE.Progress){
      tmp = cfg.progress;
    } else if (type === MESSAGE_TYPE.Error){
      tmp = cfg.error;
    }

    return tmp;
  }

  /**
   * Bind message to template
   * @param {string} str 
   * @param {Message} map
   * @return {string} str
  */
  function replace(str, map){

    var tmp = str;

    tmp = tmp.replace(/Text|Percent|tms/gi, function(matched){
        return map[matched];
    });

    return tmp;
  }
  
  /**
   * Renders the message
   * @param {Message} msg 
   * @param {ACTIONS_TYPE} action
  */
  function render(msg, action){
      
    var len = NotificationBar.queue.length,
      run = NotificationBar.config.onChange,
        tmp = "";

    run(msg, action, len);

    if (action === ACTIONS_TYPE.Remove){
      deleteElement(parent, msg.uid);
      return;
    }

    if (action === ACTIONS_TYPE.Update){
      updateElement(parent, msg.uid, msg.Percent);
      return;
    }
  
    if (action === ACTIONS_TYPE.Add){
      tmp = template(msg.Type);
      tmp = replace(tmp, msg);
      insertElement(parent, msg.uid, tmp);
      return;
    }
  }

  /**
   * Deletes the element
   * @param {DOMElement} parent 
   * @param {string} id
  */
  function deleteElement(parent, id){
    var el = parent.querySelector("#" + id);
    if (el) parent.removeChild(el);
  }

  /**
   * Updates the progress bar
   * @param {DOMElement} parent 
   * @param {string} id
   * @param {double} percent
  */
  function updateElement(parent, id, percent){
    var el = parent.querySelector("#" + id + " progress");
    if (el) el.setAttribute("value", percent);
  }

  /**
   * Adds new element
   * @param {DOMElement} parent 
   * @param {string} id
   * @param {string} html
   *
   * <ul>
   *   <li id="@id">@html</li>
   *   <li id="001"></li>
   *   <li id="002"></li>
   * </ul>
  */
  function insertElement(parent, id, html){
    var el = document.createElement('li');
    el.setAttribute("id", id);
    el.innerHTML = html;
    parent.insertBefore(el, parent.childNodes[0]);
  }

  return NotificationBar;

});