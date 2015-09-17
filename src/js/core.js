/**
 * @author denim2x <http://denim2x.github.io>
 * @licence MIT License
 */
'use strict';

var isArray = Array.isArray.bind(Array) || function isArray(obj) {
    return obj instanceof Array;
};

function isInstance(obj, type) {
    if (type == null) {
      return obj === type;
    }
    return Object(obj) instanceof type;
}

function isNumeric(obj) {
    return !isNaN(parseInt(obj)) || !isNaN(parseFloat(obj));
}

var ValueError = Error;

String.prototype.forEach = function forEach(sep, callback, self) {
    if (angular.isFunction(sep)) {
        callback = sep;
        self = callback;
        sep = "";
    }
    var list = this.split(sep);
    list.forEach(callback, self);
    return list;
};

"Function String".forEach(' ', function(name) {
    name = "is" + name;
    window[name] = angular[name].bind(angular);
});

Object.fill = function fill(obj, key, val) {
    if (isString(key)) {
        obj[key] = obj[key] || val;
    } else {
        angular.forEach(key, function(val, key) {
            obj[key] = obj[key] || val;
        });
    }
    return obj;
};

Object.among = function among(obj) {
    var result = typeof obj;
    Array.slice(arguments, 1).some(function (type) {
        if (isInstance(obj, type)) {
            result = type;
            return true;
        }
    });
    return result;
};

Object.fill(Object.fill(Array, {
    last: function last(array) {
        return array[array.length - 1];
    },
    shift: function shift(array) {
        return Array.prototype.shift.apply(array, Array.slice(arguments, 1));
    },
    slice: function slice(array) {
        var _slice = Array.prototype.slice;
        return _slice.apply(array, _slice.call(arguments, 1));
    }
}).prototype, {
    extend: function extend(array) {
        Array.prototype.push.apply(this, array);
        return this;
    },
    firstIndex: function firstIndex(callback, self) {
        this.some(function(item, index) {
            if (callback.apply(self, arguments)) {
                self = index;
                return true;
            }
        });
        return self;
    }
});

Object.fill(Object, 'delete', function() {
    var obj = Array.shift(arguments);
    angular.forEach(arguments, function(key) {
        delete obj[key];
    });
    return obj;
});

'international intl i11l'.forEach(' ', function(name) {
    this.directive(name, [ "intlTelInput", function(TelInput) {
        return {
            restrict: "A",
            link: function($scope, $element, $attrs) {
                var attrs = {}, element = $($element[0]);
                angular.forEach($attrs.$attr, function(val, key) {
                    attrs[key] = $attrs[key];
                });
                element.data('$scope', $scope);
                var options = TelInput._config(element, attrs[name], attrs);
                try {
                    element.intlTelInput(options);
                    TelInput._done(element, attrs[name]);
                    $scope.$on("$destroy", function handler() {
                        element.intlTelInput("destroy");
                    });
                } catch (e) {
                    console.warn('[%s="%s"] %s', name, attrs[name], e.message);
                }
            }
        };
    } ]);
}, angular.module('intlTelInput', []));

angular.
  module('intlTelInput').
  factory('intlTelInput', ['$compile', '$http', '$q',
    function ($compile, $http, $q) {
      var utils = (+"utils");
      var defaults = utils._defaults, keys = utils.keys, regex = utils.regex;
      Object.delete(utils, "_defaults", "keys", "regex");

      var id = 1, 
        isGoodBrowser = !!HTMLInputElement.prototype.setSelectionRange,
        isIEMobile = navigator.userAgent.match(/IEMobile/i),
        /**
         * We can't just test screen size as some smartphones/website meta tags
         *  will report desktop resolutions
         * Note: To target Android Mobiles (and not Tablets), we must find
         *  "Android" and "Mobile"
         */
        isMobile = navigator.userAgent.match(regex.mobile);

      function TelInput(element, options) {
          if (isString(element)) {
              element = document.getElementById(element);
          }
          if (!isInstance(element, HTMLInputElement)) {
              throw new TypeError("'element' must be an id or a HTMLInputElement");
          }
          if (element.type != "tel") {
              throw new ValueError("Attribute 'type': expected 'tel', got '" + element.type + "'");
          }
          $(element).data('$scope', angular.element(element).scope());

          // event namespace
          this.ns = "." + pluginName + id++;
          this.options = $.extend({}, defaults, options);
          this.isGoodBrowser = isGoodBrowser;
          this.isMobile = isMobile;
          this.telInput = $(element);
          this.hadInitialPlaceholder = !!this.telInput.attr("placeholder");
          // If in nationalMode, disable options relating to dial codes
          if (this.options.nationalMode) {
              this.options.autoHideDialCode = false;
          }
          // IE Mobile doesn't support the keypress event (see issue 68) which
          //  makes autoFormat impossible
          if (isIEMobile) {
              this.options.autoFormat = false;
          }
          // these deferred objects will be resolved when each specific request
          //  returns
          this.autoCountryDeferred = new $.Deferred();
          this.utilsScriptDeferred = new $.Deferred();
          this._deferreds = [ this.autoCountryDeferred, this.utilsScriptDeferred ];
          // process all the data: onlyCountries, preferredCountries etc
          this._processCountryData();
          // generate the markup
          this._generateMarkup();
          // set the initial state of the input value and the selected flag
          this._setInitialState();
          // start all of the event listeners: autoHideDialCode, input keydown,
          //  selectedFlag click
          this._initListeners();
          // utils script, and auto country
          this._initRequests();
      }
      function _html(parent, children) {
          var foster, text;
          children.forEach(function(child) {
              text = false;
              switch (Object.among(child, Array, String, Node, $.Object)) {
                case Array:
                  _html(foster, child);
                  break;
                case String:
                  if (child[0] != '<') {
                      text = true;
                      child = document.createTextNode(child);
                  }
                  /* falls through */
                case Node:
                  child = $(child);
                  /* falls through */
                case $.Object:
                  child.appendTo(parent);
                  if (text) break;
                  foster = child;
              }
          });
          return foster;
      }
      var _parent = $("<div>"), pluginName = "intlTelInput";
      var deferred = $q.defer();
      Object.fill(Object.fill($, {
          data: function data(element) {
              return $.fn.data.apply($(element), Array.slice(arguments, 1));
          },
          Deferred: deferred.constructor,
          get: $http.get.bind($http),
          html: function html(parent, children) {
              parent = _html(_parent, [parent, children || []]);
              var temp = $compile(parent.get(0));
              parent.compile = function compile(scope, parent) {
                //parent.attr('ng-scope', '');
                var $scope = angular.element(parent.get(0)).scope();
                scope = $.extend($scope.$new(true), scope);
                return temp(scope, parent ? function (element) {
                  $(element[0]).appendTo(parent);
                } : angular.noop);
              };
              return parent;
          },
          jsonp: $http.jsonp.bind($http),
          Object: $.fn.constructor
        }).fn, {
          outerHeight: function outerHeight () {
            return this.get(0).scrollHeight;
          }
        })[pluginName] = $.extend(function (options) {
          var args = arguments;

          // Is the first parameter an object (options), or was omitted,
          // instantiate a new instance of the plugin.
          if (options === undefined || typeof options === "object") {
            var deferreds = [];
            this.each(function() {
              if (!$.data(this, "plugin_" + pluginName)) {
                var instance = new TelInput(this, options);
                deferreds.extend(instance._deferreds);
                $.data(this, "plugin_" + pluginName, instance);
              }
            });
            // return the promise from the "master" deferred object that tracks all the others
            return $q.all(deferreds);
          } else if (isString(options) && options[0] !== "_") {
            // If the first parameter is a string and it doesn't start
            // with an underscore or "contains" the `init`-function,
            // treat this as a call to a public method.

            // Cache the method call to make it possible to return a value
            var returns;

            this.each(function() {
              var instance = $.data(this, "plugin_" + pluginName);

              // Tests that there's already a plugin-instance
              // and checks that the requested public method exists
              if (instance instanceof TelInput && isFunction(instance[options])) {
                // Call the method of our plugin instance,
                // and pass it the supplied arguments.
                returns = instance[options].apply(instance, Array.slice(args, 1));
              }

              // Allow instances to be destroyed via the 'destroy' method
              if (options === "destroy") {
                $.data(this, "plugin_" + pluginName, null);
              }
            });

            // If the earlier cached method gives a value back return the value,
            // otherwise return this to preserve chainability.
            return returns !== undefined ? returns : this;
          }
        }, {
          version: '0.0.1'
        });

      Object.fill(deferred.promise.constructor.prototype, {
        always: function always () {
          var self = this;
          angular.forEach(arguments, function (callback) {
            self.then(callback, callback, angular.noop);
          });
          return this;
        }
      });

      // loop over all of the countries above
      var allCountries = [], data = (+"data");
      for (var item, i = data.length; i > 0, (item = data[--i]);) {
        allCountries.push({
          name: item[0],
          iso2: item[1],
          dialCode: item[2],
          priority: item[3] || 0,
          areaCodes: item[4] || null
        });
      }

      $.extend($.extend(TelInput, {
        _config: angular.noop,
        _done: angular.noop,
        config: function config (callback) {
          this._config = callback;
          return this;
        },
        countryData: Object.freeze(allCountries),  // may be unnecessary
        done: function (callback) {
          this._done = callback;
          return this;
        }
      }).prototype, [+"country;get;gui;key;listeners;update"], utils);
      
      utils = {};
      return TelInput;
    }
  ]);
