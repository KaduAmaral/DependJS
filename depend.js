var DependJS = (function() {
   //callbackSuccess, callbackError;
   var Watching = false;
   var CallBacks = {
      success: [],
      error: []
   };

   function extend() {
      var ret = {};
      for (var i in arguments) {
         for (var j in arguments[i]) {
            ret[j] = arguments[i][j];
         }
      }
      return ret;
   };

   var Loaded = {};
   function Dependencies(d, success, error, async) {
      if (d == undefined) return;

      if (typeof success == 'function')
         CallBacks.success.push(success);

      if (typeof error == 'function')
         CallBacks.error.push(error);

      this.dependencies = {
         count: 0,
         loaded: 0,
         error: 0,
         ignored: 0,
         d: [],
         allReady: function() {
            return (this.count == (this.loaded + this.error + this.ignored));
         },
         allSuccess: function() {
            return (this.count == (this.loaded + this.ignored) && this.error == 0);
         },
         someError: function () {
            return (this.error > 0);
         }
      };

      for (var i in d) {
         this.dependencies.count++;
         this.dependencies.d.push(extend({}, {
               //src: '/Caminho/Para/arquivo.js',
               key: (!!d[i].src ? getScriptName(d[i].src) : null),
               success: function(){},
               error: function(){},
               ignore: function(){},
               check: function(){return false;},
               waitthis: false,
               styles: []
            }, d[i], {
               i: i,
               ready: false,
               loaded: null,
               ignored: false,
               el: null
            })
         );
      }
      startLoad.apply(this);
   };

   Dependencies.prototype.debug = false;

   Dependencies.prototype.complete = function(callback) {
      var self = this;
      if (this.dependencies.allReady())
         callback.apply(self);
      else if (!this.dependencies.allReady())
         setTimeout(function(){self.complete.apply(self, [callback])}, 50);

      return this;
   };

   Dependencies.prototype.getD = function(key){
      for (var i in this.dependencies.d) {
         if (
            (this.dependencies.d[i].key != null && this.dependencies.d[i].key == key) || 
            (!!this.dependencies.d[i].src && this.dependencies.d[i].src == key)
         ) {
            return this.dependencies.d[i];
         }
      }

      return null;
   };

   Dependencies.prototype.done = function(a, b) {
      var self = this;

      var callback = (typeof(a) == 'function' ? a : b);
      var target = (typeof(b) == 'function' ? a : undefined);

      if (target == undefined) {
         if (this.dependencies.allReady() && this.dependencies.allSuccess())
            setTimeout(function(){callback.apply(self);}, 10);
         else if (!this.dependencies.allReady())
            setTimeout(function(){self.done.apply(self, [callback])}, 50);
      } else {
         var d = this.getD(target);
         if (d != null) {
            if (d.loaded !== null) {
               if (d.loaded)
                  setTimeout(function(){callback.apply(self);}, 10);
            } else {
               setTimeout(function(){self.done.apply(self, [callback, target])}, 50);
            }
         } else {
            console.error('Dependencia "'+target+'" não encontrada.');
         }
      }

      return this;
   };
   Dependencies.prototype.success = Dependencies.prototype.done;

   Dependencies.prototype.fail = function(a, b) {
      var self = this;

      var callback = (typeof(a) == 'function' ? a : b);
      var target = (typeof(b) == 'function' ? a : undefined);

      if (target == undefined) {
         if (this.dependencies.allReady() && this.dependencies.someError()) 
            callback.apply(self);
         else if (!this.dependencies.allReady())
            setTimeout(function(){self.fail.apply(self, [callback])}, 50);
      } else {
         var d = this.getD(target);
         if (d != null) {
            if (d.loaded !== null) {
               if (!d.loaded)
                  setTimeout(function(){callback.apply(self);}, 10);
            } else {
               setTimeout(function(){self.fail.apply(self, [callback, target])}, 50);
            }
         } else {
            console.error('Dependencia "'+target+'" não encontrada.');
         }
      }

      return this;
   };
   Dependencies.prototype.error = Dependencies.prototype.fail;

   var ki = 0;
   Dependencies.prototype.load = function(src, success, error, script) {
      if (script == undefined) var script = true;
      var scr = document.createElement(script ? 'script' : 'link');
      if (script)
         scr.src = src;
      else {
         scr.href = src;
         scr.rel = 'stylesheet';
      }
      scr.type = script ? 'text/javascript' : 'text/css';
      scr.onload = success;
      scr.onerror = error;
      scr.setAttribute('data-i', ki++);
      document.querySelector('head').appendChild(scr);
      return this;
   };

   function startLoad() {
      loadD.apply(this, [0]);
   };

   function loadD(i) {
      var self = this;

      if (this.dependencies.d[i].check()) {
         self.dependencies.ignored++;
         this.dependencies.d[i].ignored = true;
         this.dependencies.d[i].ready = true;
         this.dependencies.d[i].loaded = false;
         this.dependencies.d[i].ignore.apply(this);
      } else {
         if (!this.dependencies.d[i].loaded && document.querySelector('script[src="'+this.dependencies.d[i].src+'"]') == null) {
            load.apply(this, [this.dependencies.d[i]]);
         }
      }

      if (!this.dependencies.d[i].ignored && this.dependencies.d[i].waitthis && !this.dependencies.d[i].ready && !this.dependencies.d[i].ignored) {
         var time = 50;
      } else {
         var time = 1;
         i++;
      }

      if (i >= this.dependencies.d.length)
         return this;

      setTimeout(function(){
         loadD.apply(self, [i]);
      }, time);
   };

   function load(d) {
      var self = this;
      if (!!d.src) {
         this.load(d.src, function(){
            self.dependencies.loaded++;
            self.dependencies.d[d.i].ready = true;
            self.dependencies.d[d.i].loaded = true;
            self.dependencies.d[d.i].el = this;
            self.dependencies.d[d.i].success.apply(this);
         }, function(){
            self.dependencies.error++;
            self.dependencies.d[d.i].ready = true;
            self.dependencies.d[d.i].loaded = false;
            self.dependencies.d[d.i].error.apply(this);
         });
      } else {
         self.dependencies.loaded++;
         self.dependencies.d[d.i].ready = true;
         self.dependencies.d[d.i].loaded = false;
      }

      if (!!self.dependencies.d[d.i].styles && self.dependencies.d[d.i].styles.length > 0) {
         for (var i in self.dependencies.d[d.i].styles) {
            this.load(self.dependencies.d[d.i].styles[i].href, self.dependencies.d[d.i].styles[i].success, self.dependencies.d[d.i].styles[i].error, false);
         }
      }
   };

   function getScriptName(src) {
      return src.slice(-1*src.lastIndexOf('/'), src.lastIndexOf('.js')+3);
   }

   function watcher() {
      Watching = true;
      var self = this;
      if (this.dependencies.allReady()) {
         Watching = false;
         executeCallbacks.apply(self);
      } else {
         setTimeout(function() {
            watcher.apply(self)
         }, 100);
      }
   };

   return Dependencies;
})();