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
      var utils = {
  _initRequests: function () {
    var that = this;

    // load the utils script if the user has specified the path to it
    if (this.options.utilsScript) {
      this.loadUtils();
    } else {
      this.utilsScriptDeferred.resolve();
    }

    if (this.options.defaultCountry == "auto") {
      this._loadAutoCountry();
    } else {
      this.autoCountryDeferred.resolve();
    }
  },

  // check if (uppercase) string a starts with string b
  _startsWith: function (a, b) {
    return (a.substr(0, b.length).toUpperCase() == b);
  },

  // check if the given number contains an unknown area code from the North American Numbering Plan i.e. the only dialCode that could be extracted was +1 but the actual number's length is >=4
  _isUnknownNanp: function (number, dialCode) {
    return (dialCode == "+1" && this._getNumeric(number).length >= 4);
  },

  // prevent deleting the plus (if not in nationalMode)
  _ensurePlus: function () {
    if (!this.options.nationalMode) {
      var val = this.telInput.val(),
        input = this.telInput[0];
      if (val.charAt(0) != "+") {
        // newCursorPos is current pos + 1 to account for the plus we are about to add
        var newCursorPos = (this.isGoodBrowser) ? input.selectionStart + 1 : 0;
        this.telInput.val("+" + val);
        if (this.isGoodBrowser) {
          input.setSelectionRange(newCursorPos, newCursorPos);
        }
      }
    }
  },

  // remove plugin
  destroy: function () {
    if (!this.isMobile) {
      // make sure the dropdown is closed (and unbind listeners)
      this._closeDropdown();
    }

    // key events, and focus/blur events if autoHideDialCode=true
    this.telInput.off(this.ns);

    if (this.isMobile) {
      // change event on select country
      this.countryList.off(this.ns);
    } else {
      // click event to open dropdown
      this.selectedFlagInner.parent().off(this.ns);
      // label click hack
      this.telInput.closest("label").off(this.ns);
    }

    // remove markup
    var container = this.telInput.parent();
    container.before(this.telInput).remove();
  },

  // validate the input val - assumes the global function isValidNumber (from utilsScript)
  isValidNumber: function () {
    var val = $.trim(this.telInput.val()),
      countryCode = (this.options.nationalMode) ? this.selectedCountryData.iso2 : "";
    if (utils.libphonenumber) {
      return utils.libphonenumber.isValidNumber(val, countryCode);
    }
    return false;
  },

  // load the utils script
  loadUtils: function (path) {
    var that = this,
      msg = "[%s:loadUtils] Couldn't load the utils script (%s)";

    var utilsScript = path || this.options.utilsScript;
    if (!$.fn[pluginName].loadedUtilsScript && utilsScript) {
      // don't do this twice! (dont just check if the global intlTelInputUtils exists as if init plugin multiple times in quick succession, it may not have finished loading yet)
      $.fn[pluginName].loadedUtilsScript = true;

      // dont use $.getScript as it prevents caching
      $http({
        url: utilsScript,
        cache: true,
        transformResponse: function (data) {
          try {
            eval(data);
          } catch (e) {
            console.warn(msg, pluginName, "'eval' failed");
          }
        }
      }).then(function success () {
        // tell all instances the utils are ready
        $(".intl-tel-input input").intlTelInput("utilsLoaded");
      }, function error () {
        console.warn(msg, pluginName, 'HTTP error');
      }).finally(function complete () {
        that.utilsScriptDeferred.resolve();
      });
    } else {
      this.utilsScriptDeferred.resolve();
    }
  },

  // set the input value and update the flag
  setNumber: function (number, format, addSuffix, preventConversion, isAllowedKey) {
    // ensure starts with plus
    if (!this.options.nationalMode && number.charAt(0) != "+") {
      number = "+" + number;
    }
    // we must update the flag first, which updates this.selectedCountryData, which is used later for formatting the number before displaying it
    this._updateFlagFromNumber(number);
    this._updateVal(number, format, addSuffix, preventConversion, isAllowedKey);
  },

  // this is called when the utils are ready
  utilsLoaded: function () {
    // if autoFormat is enabled and there's an initial value in the input, then format it
    if (this.options.autoFormat && this.telInput.val()) {
      this._updateVal(this.telInput.val());
    }
    this._updatePlaceholder();
  },

  keys: {
    UP: 38,
    DOWN: 40,
    ENTER: 13,
    ESC: 27,
    PLUS: 43,
    A: 65,
    Z: 90,
    ZERO: 48,
    NINE: 57,
    SPACE: 32,
    BSPACE: 8,
    TAB: 9,
    DEL: 46,
    CTRL: 17,
    CMD1: 91, // Chrome
    CMD2: 224 // FF
  },

  _defaults: {
    // typing digits after a valid number will be added to the extension part of the number
    allowExtensions: false,
    // automatically format the number according to the selected country
    autoFormat: true,
    // if there is just a dial code in the input: remove it on blur, and re-add it on focus
    autoHideDialCode: true,
    // add or remove input placeholder with an example number for the selected country
    autoPlaceholder: true,
    // default country
    defaultCountry: "",
    // geoIp lookup function
    geoIpLookup: null,
    // don't insert international dial codes
    nationalMode: true,
    // number type to use for placeholders
    numberType: "MOBILE",
    // display only these countries
    onlyCountries: [],
    // the countries at the top of the list. defaults to united states and united kingdom
    preferredCountries: ["us", "gb"],
    // specify the path to the libphonenumber script to enable validation/formatting
    utilsScript: ""
  },

  regex: {
    mobile: /Android.+Mobile|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i
  }
};
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
      var allCountries = [], data = [
  [
    "Afghanistan (\u202B\u0627\u0641\u063A\u0627\u0646\u0633\u062A\u0627\u0646\u202C\u200E)",
    "af",
    "93"
  ],
  [
    "Albania (Shqip\u00EBri)",
    "al",
    "355"
  ],
  [
    "Algeria (\u202B\u0627\u0644\u062C\u0632\u0627\u0626\u0631\u202C\u200E)",
    "dz",
    "213"
  ],
  [
    "American Samoa",
    "as",
    "1684"
  ],
  [
    "Andorra",
    "ad",
    "376"
  ],
  [
    "Angola",
    "ao",
    "244"
  ],
  [
    "Anguilla",
    "ai",
    "1264"
  ],
  [
    "Antigua and Barbuda",
    "ag",
    "1268"
  ],
  [
    "Argentina",
    "ar",
    "54"
  ],
  [
    "Armenia (\u0540\u0561\u0575\u0561\u057D\u057F\u0561\u0576)",
    "am",
    "374"
  ],
  [
    "Aruba",
    "aw",
    "297"
  ],
  [
    "Australia",
    "au",
    "61"
  ],
  [
    "Austria (\u00D6sterreich)",
    "at",
    "43"
  ],
  [
    "Azerbaijan (Az\u0259rbaycan)",
    "az",
    "994"
  ],
  [
    "Bahamas",
    "bs",
    "1242"
  ],
  [
    "Bahrain (\u202B\u0627\u0644\u0628\u062D\u0631\u064A\u0646\u202C\u200E)",
    "bh",
    "973"
  ],
  [
    "Bangladesh (\u09AC\u09BE\u0982\u09B2\u09BE\u09A6\u09C7\u09B6)",
    "bd",
    "880"
  ],
  [
    "Barbados",
    "bb",
    "1246"
  ],
  [
    "Belarus (\u0411\u0435\u043B\u0430\u0440\u0443\u0441\u044C)",
    "by",
    "375"
  ],
  [
    "Belgium (Belgi\u00EB)",
    "be",
    "32"
  ],
  [
    "Belize",
    "bz",
    "501"
  ],
  [
    "Benin (B\u00E9nin)",
    "bj",
    "229"
  ],
  [
    "Bermuda",
    "bm",
    "1441"
  ],
  [
    "Bhutan (\u0F60\u0F56\u0FB2\u0F74\u0F42)",
    "bt",
    "975"
  ],
  [
    "Bolivia",
    "bo",
    "591"
  ],
  [
    "Bosnia and Herzegovina (\u0411\u043E\u0441\u043D\u0430 \u0438 \u0425\u0435\u0440\u0446\u0435\u0433\u043E\u0432\u0438\u043D\u0430)",
    "ba",
    "387"
  ],
  [
    "Botswana",
    "bw",
    "267"
  ],
  [
    "Brazil (Brasil)",
    "br",
    "55"
  ],
  [
    "British Indian Ocean Territory",
    "io",
    "246"
  ],
  [
    "British Virgin Islands",
    "vg",
    "1284"
  ],
  [
    "Brunei",
    "bn",
    "673"
  ],
  [
    "Bulgaria (\u0411\u044A\u043B\u0433\u0430\u0440\u0438\u044F)",
    "bg",
    "359"
  ],
  [
    "Burkina Faso",
    "bf",
    "226"
  ],
  [
    "Burundi (Uburundi)",
    "bi",
    "257"
  ],
  [
    "Cambodia (\u1780\u1798\u17D2\u1796\u17BB\u1787\u17B6)",
    "kh",
    "855"
  ],
  [
    "Cameroon (Cameroun)",
    "cm",
    "237"
  ],
  [
    "Canada",
    "ca",
    "1",
    1,
    ["204", "226", "236", "249", "250", "289", "306", "343", "365", "387", "403", "416", "418", "431", "437", "438", "450", "506", "514", "519", "548", "579", "581", "587", "604", "613", "639", "647", "672", "705", "709", "742", "778", "780", "782", "807", "819", "825", "867", "873", "902", "905"]
  ],
  [
    "Cape Verde (Kabu Verdi)",
    "cv",
    "238"
  ],
  [
    "Caribbean Netherlands",
    "bq",
    "599",
    1
  ],
  [
    "Cayman Islands",
    "ky",
    "1345"
  ],
  [
    "Central African Republic (R\u00E9publique centrafricaine)",
    "cf",
    "236"
  ],
  [
    "Chad (Tchad)",
    "td",
    "235"
  ],
  [
    "Chile",
    "cl",
    "56"
  ],
  [
    "China (\u4E2D\u56FD)",
    "cn",
    "86"
  ],
  [
    "Colombia",
    "co",
    "57"
  ],
  [
    "Comoros (\u202B\u062C\u0632\u0631 \u0627\u0644\u0642\u0645\u0631\u202C\u200E)",
    "km",
    "269"
  ],
  [
    "Congo (DRC) (Jamhuri ya Kidemokrasia ya Kongo)",
    "cd",
    "243"
  ],
  [
    "Congo (Republic) (Congo-Brazzaville)",
    "cg",
    "242"
  ],
  [
    "Cook Islands",
    "ck",
    "682"
  ],
  [
    "Costa Rica",
    "cr",
    "506"
  ],
  [
    "C\u00F4te d\u2019Ivoire",
    "ci",
    "225"
  ],
  [
    "Croatia (Hrvatska)",
    "hr",
    "385"
  ],
  [
    "Cuba",
    "cu",
    "53"
  ],
  [
    "Cura\u00E7ao",
    "cw",
    "599",
    0
  ],
  [
    "Cyprus (\u039A\u03CD\u03C0\u03C1\u03BF\u03C2)",
    "cy",
    "357"
  ],
  [
    "Czech Republic (\u010Cesk\u00E1 republika)",
    "cz",
    "420"
  ],
  [
    "Denmark (Danmark)",
    "dk",
    "45"
  ],
  [
    "Djibouti",
    "dj",
    "253"
  ],
  [
    "Dominica",
    "dm",
    "1767"
  ],
  [
    "Dominican Republic (Rep\u00FAblica Dominicana)",
    "do",
    "1",
    2,
    ["809", "829", "849"]
  ],
  [
    "Ecuador",
    "ec",
    "593"
  ],
  [
    "Egypt (\u202B\u0645\u0635\u0631\u202C\u200E)",
    "eg",
    "20"
  ],
  [
    "El Salvador",
    "sv",
    "503"
  ],
  [
    "Equatorial Guinea (Guinea Ecuatorial)",
    "gq",
    "240"
  ],
  [
    "Eritrea",
    "er",
    "291"
  ],
  [
    "Estonia (Eesti)",
    "ee",
    "372"
  ],
  [
    "Ethiopia",
    "et",
    "251"
  ],
  [
    "Falkland Islands (Islas Malvinas)",
    "fk",
    "500"
  ],
  [
    "Faroe Islands (F\u00F8royar)",
    "fo",
    "298"
  ],
  [
    "Fiji",
    "fj",
    "679"
  ],
  [
    "Finland (Suomi)",
    "fi",
    "358"
  ],
  [
    "France",
    "fr",
    "33"
  ],
  [
    "French Guiana (Guyane fran\u00E7aise)",
    "gf",
    "594"
  ],
  [
    "French Polynesia (Polyn\u00E9sie fran\u00E7aise)",
    "pf",
    "689"
  ],
  [
    "Gabon",
    "ga",
    "241"
  ],
  [
    "Gambia",
    "gm",
    "220"
  ],
  [
    "Georgia (\u10E1\u10D0\u10E5\u10D0\u10E0\u10D7\u10D5\u10D4\u10DA\u10DD)",
    "ge",
    "995"
  ],
  [
    "Germany (Deutschland)",
    "de",
    "49"
  ],
  [
    "Ghana (Gaana)",
    "gh",
    "233"
  ],
  [
    "Gibraltar",
    "gi",
    "350"
  ],
  [
    "Greece (\u0395\u03BB\u03BB\u03AC\u03B4\u03B1)",
    "gr",
    "30"
  ],
  [
    "Greenland (Kalaallit Nunaat)",
    "gl",
    "299"
  ],
  [
    "Grenada",
    "gd",
    "1473"
  ],
  [
    "Guadeloupe",
    "gp",
    "590",
    0
  ],
  [
    "Guam",
    "gu",
    "1671"
  ],
  [
    "Guatemala",
    "gt",
    "502"
  ],
  [
    "Guinea (Guin\u00E9e)",
    "gn",
    "224"
  ],
  [
    "Guinea-Bissau (Guin\u00E9 Bissau)",
    "gw",
    "245"
  ],
  [
    "Guyana",
    "gy",
    "592"
  ],
  [
    "Haiti",
    "ht",
    "509"
  ],
  [
    "Honduras",
    "hn",
    "504"
  ],
  [
    "Hong Kong (\u9999\u6E2F)",
    "hk",
    "852"
  ],
  [
    "Hungary (Magyarorsz\u00E1g)",
    "hu",
    "36"
  ],
  [
    "Iceland (\u00CDsland)",
    "is",
    "354"
  ],
  [
    "India (\u092D\u093E\u0930\u0924)",
    "in",
    "91"
  ],
  [
    "Indonesia",
    "id",
    "62"
  ],
  [
    "Iran (\u202B\u0627\u06CC\u0631\u0627\u0646\u202C\u200E)",
    "ir",
    "98"
  ],
  [
    "Iraq (\u202B\u0627\u0644\u0639\u0631\u0627\u0642\u202C\u200E)",
    "iq",
    "964"
  ],
  [
    "Ireland",
    "ie",
    "353"
  ],
  [
    "Israel (\u202B\u05D9\u05E9\u05E8\u05D0\u05DC\u202C\u200E)",
    "il",
    "972"
  ],
  [
    "Italy (Italia)",
    "it",
    "39",
    0
  ],
  [
    "Jamaica",
    "jm",
    "1876"
  ],
  [
    "Japan (\u65E5\u672C)",
    "jp",
    "81"
  ],
  [
    "Jordan (\u202B\u0627\u0644\u0623\u0631\u062F\u0646\u202C\u200E)",
    "jo",
    "962"
  ],
  [
    "Kazakhstan (\u041A\u0430\u0437\u0430\u0445\u0441\u0442\u0430\u043D)",
    "kz",
    "7",
    1
  ],
  [
    "Kenya",
    "ke",
    "254"
  ],
  [
    "Kiribati",
    "ki",
    "686"
  ],
  [
    "Kuwait (\u202B\u0627\u0644\u0643\u0648\u064A\u062A\u202C\u200E)",
    "kw",
    "965"
  ],
  [
    "Kyrgyzstan (\u041A\u044B\u0440\u0433\u044B\u0437\u0441\u0442\u0430\u043D)",
    "kg",
    "996"
  ],
  [
    "Laos (\u0EA5\u0EB2\u0EA7)",
    "la",
    "856"
  ],
  [
    "Latvia (Latvija)",
    "lv",
    "371"
  ],
  [
    "Lebanon (\u202B\u0644\u0628\u0646\u0627\u0646\u202C\u200E)",
    "lb",
    "961"
  ],
  [
    "Lesotho",
    "ls",
    "266"
  ],
  [
    "Liberia",
    "lr",
    "231"
  ],
  [
    "Libya (\u202B\u0644\u064A\u0628\u064A\u0627\u202C\u200E)",
    "ly",
    "218"
  ],
  [
    "Liechtenstein",
    "li",
    "423"
  ],
  [
    "Lithuania (Lietuva)",
    "lt",
    "370"
  ],
  [
    "Luxembourg",
    "lu",
    "352"
  ],
  [
    "Macau (\u6FB3\u9580)",
    "mo",
    "853"
  ],
  [
    "Macedonia (FYROM) (\u041C\u0430\u043A\u0435\u0434\u043E\u043D\u0438\u0458\u0430)",
    "mk",
    "389"
  ],
  [
    "Madagascar (Madagasikara)",
    "mg",
    "261"
  ],
  [
    "Malawi",
    "mw",
    "265"
  ],
  [
    "Malaysia",
    "my",
    "60"
  ],
  [
    "Maldives",
    "mv",
    "960"
  ],
  [
    "Mali",
    "ml",
    "223"
  ],
  [
    "Malta",
    "mt",
    "356"
  ],
  [
    "Marshall Islands",
    "mh",
    "692"
  ],
  [
    "Martinique",
    "mq",
    "596"
  ],
  [
    "Mauritania (\u202B\u0645\u0648\u0631\u064A\u062A\u0627\u0646\u064A\u0627\u202C\u200E)",
    "mr",
    "222"
  ],
  [
    "Mauritius (Moris)",
    "mu",
    "230"
  ],
  [
    "Mexico (M\u00E9xico)",
    "mx",
    "52"
  ],
  [
    "Micronesia",
    "fm",
    "691"
  ],
  [
    "Moldova (Republica Moldova)",
    "md",
    "373"
  ],
  [
    "Monaco",
    "mc",
    "377"
  ],
  [
    "Mongolia (\u041C\u043E\u043D\u0433\u043E\u043B)",
    "mn",
    "976"
  ],
  [
    "Montenegro (Crna Gora)",
    "me",
    "382"
  ],
  [
    "Montserrat",
    "ms",
    "1664"
  ],
  [
    "Morocco (\u202B\u0627\u0644\u0645\u063A\u0631\u0628\u202C\u200E)",
    "ma",
    "212"
  ],
  [
    "Mozambique (Mo\u00E7ambique)",
    "mz",
    "258"
  ],
  [
    "Myanmar (Burma) (\u1019\u103C\u1014\u103A\u1019\u102C)",
    "mm",
    "95"
  ],
  [
    "Namibia (Namibi\u00EB)",
    "na",
    "264"
  ],
  [
    "Nauru",
    "nr",
    "674"
  ],
  [
    "Nepal (\u0928\u0947\u092A\u093E\u0932)",
    "np",
    "977"
  ],
  [
    "Netherlands (Nederland)",
    "nl",
    "31"
  ],
  [
    "New Caledonia (Nouvelle-Cal\u00E9donie)",
    "nc",
    "687"
  ],
  [
    "New Zealand",
    "nz",
    "64"
  ],
  [
    "Nicaragua",
    "ni",
    "505"
  ],
  [
    "Niger (Nijar)",
    "ne",
    "227"
  ],
  [
    "Nigeria",
    "ng",
    "234"
  ],
  [
    "Niue",
    "nu",
    "683"
  ],
  [
    "Norfolk Island",
    "nf",
    "672"
  ],
  [
    "North Korea (\uC870\uC120 \uBBFC\uC8FC\uC8FC\uC758 \uC778\uBBFC \uACF5\uD654\uAD6D)",
    "kp",
    "850"
  ],
  [
    "Northern Mariana Islands",
    "mp",
    "1670"
  ],
  [
    "Norway (Norge)",
    "no",
    "47"
  ],
  [
    "Oman (\u202B\u0639\u064F\u0645\u0627\u0646\u202C\u200E)",
    "om",
    "968"
  ],
  [
    "Pakistan (\u202B\u067E\u0627\u06A9\u0633\u062A\u0627\u0646\u202C\u200E)",
    "pk",
    "92"
  ],
  [
    "Palau",
    "pw",
    "680"
  ],
  [
    "Palestine (\u202B\u0641\u0644\u0633\u0637\u064A\u0646\u202C\u200E)",
    "ps",
    "970"
  ],
  [
    "Panama (Panam\u00E1)",
    "pa",
    "507"
  ],
  [
    "Papua New Guinea",
    "pg",
    "675"
  ],
  [
    "Paraguay",
    "py",
    "595"
  ],
  [
    "Peru (Per\u00FA)",
    "pe",
    "51"
  ],
  [
    "Philippines",
    "ph",
    "63"
  ],
  [
    "Poland (Polska)",
    "pl",
    "48"
  ],
  [
    "Portugal",
    "pt",
    "351"
  ],
  [
    "Puerto Rico",
    "pr",
    "1",
    3,
    ["787", "939"]
  ],
  [
    "Qatar (\u202B\u0642\u0637\u0631\u202C\u200E)",
    "qa",
    "974"
  ],
  [
    "R\u00E9union (La R\u00E9union)",
    "re",
    "262"
  ],
  [
    "Romania (Rom\u00E2nia)",
    "ro",
    "40"
  ],
  [
    "Russia (\u0420\u043E\u0441\u0441\u0438\u044F)",
    "ru",
    "7",
    0
  ],
  [
    "Rwanda",
    "rw",
    "250"
  ],
  [
    "Saint Barth\u00E9lemy (Saint-Barth\u00E9lemy)",
    "bl",
    "590",
    1
  ],
  [
    "Saint Helena",
    "sh",
    "290"
  ],
  [
    "Saint Kitts and Nevis",
    "kn",
    "1869"
  ],
  [
    "Saint Lucia",
    "lc",
    "1758"
  ],
  [
    "Saint Martin (Saint-Martin (partie fran\u00E7aise))",
    "mf",
    "590",
    2
  ],
  [
    "Saint Pierre and Miquelon (Saint-Pierre-et-Miquelon)",
    "pm",
    "508"
  ],
  [
    "Saint Vincent and the Grenadines",
    "vc",
    "1784"
  ],
  [
    "Samoa",
    "ws",
    "685"
  ],
  [
    "San Marino",
    "sm",
    "378"
  ],
  [
    "S\u00E3o Tom\u00E9 and Pr\u00EDncipe (S\u00E3o Tom\u00E9 e Pr\u00EDncipe)",
    "st",
    "239"
  ],
  [
    "Saudi Arabia (\u202B\u0627\u0644\u0645\u0645\u0644\u0643\u0629 \u0627\u0644\u0639\u0631\u0628\u064A\u0629 \u0627\u0644\u0633\u0639\u0648\u062F\u064A\u0629\u202C\u200E)",
    "sa",
    "966"
  ],
  [
    "Senegal (S\u00E9n\u00E9gal)",
    "sn",
    "221"
  ],
  [
    "Serbia (\u0421\u0440\u0431\u0438\u0458\u0430)",
    "rs",
    "381"
  ],
  [
    "Seychelles",
    "sc",
    "248"
  ],
  [
    "Sierra Leone",
    "sl",
    "232"
  ],
  [
    "Singapore",
    "sg",
    "65"
  ],
  [
    "Sint Maarten",
    "sx",
    "1721"
  ],
  [
    "Slovakia (Slovensko)",
    "sk",
    "421"
  ],
  [
    "Slovenia (Slovenija)",
    "si",
    "386"
  ],
  [
    "Solomon Islands",
    "sb",
    "677"
  ],
  [
    "Somalia (Soomaaliya)",
    "so",
    "252"
  ],
  [
    "South Africa",
    "za",
    "27"
  ],
  [
    "South Korea (\uB300\uD55C\uBBFC\uAD6D)",
    "kr",
    "82"
  ],
  [
    "South Sudan (\u202B\u062C\u0646\u0648\u0628 \u0627\u0644\u0633\u0648\u062F\u0627\u0646\u202C\u200E)",
    "ss",
    "211"
  ],
  [
    "Spain (Espa\u00F1a)",
    "es",
    "34"
  ],
  [
    "Sri Lanka (\u0DC1\u0DCA\u200D\u0DBB\u0DD3 \u0DBD\u0D82\u0D9A\u0DCF\u0DC0)",
    "lk",
    "94"
  ],
  [
    "Sudan (\u202B\u0627\u0644\u0633\u0648\u062F\u0627\u0646\u202C\u200E)",
    "sd",
    "249"
  ],
  [
    "Suriname",
    "sr",
    "597"
  ],
  [
    "Swaziland",
    "sz",
    "268"
  ],
  [
    "Sweden (Sverige)",
    "se",
    "46"
  ],
  [
    "Switzerland (Schweiz)",
    "ch",
    "41"
  ],
  [
    "Syria (\u202B\u0633\u0648\u0631\u064A\u0627\u202C\u200E)",
    "sy",
    "963"
  ],
  [
    "Taiwan (\u53F0\u7063)",
    "tw",
    "886"
  ],
  [
    "Tajikistan",
    "tj",
    "992"
  ],
  [
    "Tanzania",
    "tz",
    "255"
  ],
  [
    "Thailand (\u0E44\u0E17\u0E22)",
    "th",
    "66"
  ],
  [
    "Timor-Leste",
    "tl",
    "670"
  ],
  [
    "Togo",
    "tg",
    "228"
  ],
  [
    "Tokelau",
    "tk",
    "690"
  ],
  [
    "Tonga",
    "to",
    "676"
  ],
  [
    "Trinidad and Tobago",
    "tt",
    "1868"
  ],
  [
    "Tunisia (\u202B\u062A\u0648\u0646\u0633\u202C\u200E)",
    "tn",
    "216"
  ],
  [
    "Turkey (T\u00FCrkiye)",
    "tr",
    "90"
  ],
  [
    "Turkmenistan",
    "tm",
    "993"
  ],
  [
    "Turks and Caicos Islands",
    "tc",
    "1649"
  ],
  [
    "Tuvalu",
    "tv",
    "688"
  ],
  [
    "U.S. Virgin Islands",
    "vi",
    "1340"
  ],
  [
    "Uganda",
    "ug",
    "256"
  ],
  [
    "Ukraine (\u0423\u043A\u0440\u0430\u0457\u043D\u0430)",
    "ua",
    "380"
  ],
  [
    "United Arab Emirates (\u202B\u0627\u0644\u0625\u0645\u0627\u0631\u0627\u062A \u0627\u0644\u0639\u0631\u0628\u064A\u0629 \u0627\u0644\u0645\u062A\u062D\u062F\u0629\u202C\u200E)",
    "ae",
    "971"
  ],
  [
    "United Kingdom",
    "gb",
    "44"
  ],
  [
    "United States",
    "us",
    "1",
    0
  ],
  [
    "Uruguay",
    "uy",
    "598"
  ],
  [
    "Uzbekistan (O\u02BBzbekiston)",
    "uz",
    "998"
  ],
  [
    "Vanuatu",
    "vu",
    "678"
  ],
  [
    "Vatican City (Citt\u00E0 del Vaticano)",
    "va",
    "39",
    1
  ],
  [
    "Venezuela",
    "ve",
    "58"
  ],
  [
    "Vietnam (Vi\u1EC7t Nam)",
    "vn",
    "84"
  ],
  [
    "Wallis and Futuna",
    "wf",
    "681"
  ],
  [
    "Yemen (\u202B\u0627\u0644\u064A\u0645\u0646\u202C\u200E)",
    "ye",
    "967"
  ],
  [
    "Zambia",
    "zm",
    "260"
  ],
  [
    "Zimbabwe",
    "zw",
    "263"
  ]
];
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
      }).prototype, 
{

  // add a country code to this.countryCodes
  _addCountryCode: function (iso2, dialCode, priority) {
    if (!(dialCode in this.countryCodes)) {
      this.countryCodes[dialCode] = [];
    }
    var index = priority || 0;
    this.countryCodes[dialCode][index] = iso2;
  },

  // prepare all of the country data, including onlyCountries and preferredCountries options
  _processCountryData: function () {
    // set the instances country data objects
    this._setInstanceCountryData();

    // set the preferredCountries property
    this._setPreferredCountries();
  },

  // process onlyCountries array if present, and generate the countryCodes map
  _setInstanceCountryData: function (i, j, item) {
    // process onlyCountries option
    if (this.options.onlyCountries.length) {
      // standardise case
      this.countries = this.options.onlyCountries;
      for (i = this.countries.length; i > 0, --i;) {
        this.countries[i] = this.countries[i].toLowerCase();
      }

      this.countries = [];
      // build instance country array
      for (i = -1; i < allCountries.length, (item = allCountries[++i]);) {
        if (this.options.onlyCountries.indexOf(item.iso2) >= 0) {
          this.countries.push(item);
        }
      }
    } else {
      this.countries = allCountries;
    }

    // generate countryCodes map
    this.countryCodes = {};
    for (i = this.countries.length; i > 0, (item = this.countries[--i]);) {
      this._addCountryCode(item.iso2, item.dialCode, item.priority);
      if (item.areaCodes) {
        for (j = 0; j < item.areaCodes.length; j++) {
          // full dial code is country code + dial code
          this._addCountryCode(item.iso2, item.dialCode + item.areaCodes[j]);
        }
      }
    }
  },

  // find the first list item whose name starts with the query string
  _searchForCountry: function (query) {
    for (var i = 0; i < this.countries.length; i++) {
      if (this._startsWith(this.countries[i].name, query)) {
        var listItem = this.countryList.children(
          "[country-code=" + this.countries[i].iso2 + "]"
        ).not(".preferred");
        // update highlighting and scroll
        this._highlightListItem(listItem);
        this._scrollTo(listItem, true);
        break;
      }
    }
  },

  _loadAutoCountry: function () {
    var that = this;

    // check for cookie
    var cookieAutoCountry = ($.cookie) ? $.cookie("itiAutoCountry") : "";
    if (cookieAutoCountry) {
      $.fn[pluginName].autoCountry = cookieAutoCountry;
    }

    // 3 options:
    // 1) already loaded (we're done)
    // 2) not already started loading (start)
    // 3) already started loading (do nothing - just wait for loading callback to fire)
    if ($.fn[pluginName].autoCountry) {
      this.autoCountryLoaded();
    } else if (!$.fn[pluginName].startedLoadingAutoCountry) {
      // don't do this twice!
      $.fn[pluginName].startedLoadingAutoCountry = true;

      if (isFunction(this.options.geoIpLookup)) {
        try {
          this.options.geoIpLookup(function (countryCode) {
            $.fn[pluginName].autoCountry = countryCode.toLowerCase();
            if ($.cookie) {
              $.cookie("itiAutoCountry", $.fn[pluginName].autoCountry, {
                path: '/'
              });
            }
            // tell all instances the auto country is ready
            // TODO: this should just be the current instances
            // UPDATE: use setTimeout in case their geoIpLookup function calls this callback straight away (e.g. if they have already done the geo ip lookup somewhere else). Using setTimeout means that the current thread of execution will finish before executing this, which allows the plugin to finish initialising.
            setTimeout(function () {
              $(".intl-tel-input input").intlTelInput("autoCountryLoaded");
            });
          });
        } catch (e) {
          console.warn('[%s:geoIpLookup] %s', pluginName, e.message);
        }
      }
    }
  },

  // this is called when the geoip call returns
  autoCountryLoaded: function () {
    if (this.options.defaultCountry == "auto") {
      this.options.defaultCountry = $.fn[pluginName].autoCountry;
      this._setInitialState();
      this.autoCountryDeferred.resolve();
    }
  },

  // update the selected flag, and update the input val accordingly
  selectCountry: function (countryCode) {
    countryCode = countryCode.toLowerCase();
    // check if already selected
    if (!this.selectedFlagInner.hasClass(countryCode)) {
      this._selectFlag(countryCode, true);
      this._updateDialCode(this.selectedCountryData.dialCode, false);
    }
  },
}, 
{
  // we start from the position in guessCursor, and work our way left until we hit the originalLeftChars or a number to make sure that after reformatting the cursor has the same char on the left in the case of a delete etc
  _getCursorFromLeftChar: function (val, guessCursor, originalLeftChars) {
    for (var i = guessCursor; i > 0; i--) {
      var leftChar = val.charAt(i - 1);
      if (isNumeric(leftChar) || val.substr(i - 2, 2) == originalLeftChars) {
        return i;
      }
    }
    return 0;
  },

  // after a reformat we need to make sure there are still the same number of digits to the right of the cursor
  _getCursorFromDigitsOnRight: function (val, digitsOnRight) {
    for (var i = val.length - 1; i >= 0; i--) {
      if (isNumeric(val.charAt(i))) {
        if (--digitsOnRight === 0) {
          return i;
        }
      }
    }
    return 0;
  },

  // get the number of numeric digits to the right of the cursor so we can reposition the cursor correctly after the reformat has happened
  _getDigitsOnRight: function (val, selectionEnd) {
    var digitsOnRight = 0;
    for (var i = selectionEnd; i < val.length; i++) {
      if (isNumeric(val.charAt(i))) {
        digitsOnRight++;
      }
    }
    return digitsOnRight;
  },

  // extract the numeric digits from the given string
  _getNumeric: function (s) {
    return s.replace(/\D/g, "");
  },

  _getClean: function (s) {
    var prefix = (s.charAt(0) == "+") ? "+" : "";
    return prefix + this._getNumeric(s);
  },

  // try and extract a valid international dial code from a full telephone number
  // Note: returns the raw string inc plus character and any whitespace/dots etc
  _getDialCode: function (number) {
    var dialCode = "";
    // only interested in international numbers (starting with a plus)
    if (number.charAt(0) == "+") {
      var numericChars = "";
      // iterate over chars
      for (var i = 0; i < number.length; i++) {
        var c = number.charAt(i);
        // if char is number
        if (isNumeric(c)) {
          numericChars += c;
          // if current numericChars make a valid dial code
          if (this.countryCodes[numericChars]) {
            // store the actual raw string (useful for matching later)
            dialCode = number.substr(0, i + 1);
          }
          // longest dial code is 4 chars
          if (numericChars.length == 4) {
            break;
          }
        }
      }
    }
    return dialCode;
  },

  // find the country data for the given country code
  // the ignoreOnlyCountriesOption is only used during init() while parsing the onlyCountries array
  _getCountryData: function (countryCode, ignoreOnlyCountriesOption, allowFail) {
    var countryList = (ignoreOnlyCountriesOption) ? allCountries : this.countries;
    for (var i = 0; i < countryList.length; i++) {
      if (countryList[i].iso2 == countryCode) {
        return countryList[i];
      }
    }
    if (allowFail) {
      return null;
    } else {
      throw new Error("No country data for '" + countryCode + "'");
    }
  },

  // get the country data for the currently selected flag
  getSelectedCountryData: function () {
    // if this is undefined, the plugin will return it's instance instead, so in that case an empty object makes more sense
    return this.selectedCountryData || {};
  },

  // extract the phone number extension if present
  getExtension: function () {
    return this.telInput.val().split(" ext. ")[1] || "";
  },

  // format the number to the given type
  getNumber: function (type) {
    if (utils.libphonenumber) {
      return utils.libphonenumber.formatNumberByType(this.telInput.val(), this.selectedCountryData.iso2, type);
    }
    return "";
  },

  // get the type of the entered number e.g. landline/mobile
  getNumberType: function () {
    if (utils.libphonenumber) {
      return utils.libphonenumber.getNumberType(this.telInput.val(), this.selectedCountryData.iso2);
    }
    return -99;
  },

  // get the validation error
  getValidationError: function () {
    if (utils.libphonenumber) {
      return utils.libphonenumber.getValidationError(this.telInput.val(), this.selectedCountryData.iso2);
    }
    return -99;
  },
}, {
  // generate all of the markup for the selected flag overlay and the dropdown
  _generateMarkup: function () {
    // prevent autocomplete as there's no safe, cross-browser event we can 
    //  react to, so it can easily put the plugin in an inconsistent state e.g. 
    //  the wrong flag selected for the autocompleted number, which on submit 
    //  could mean the wrong number is saved (esp in nationalMode)
    this.telInput.attr('autocomplete', "off");

    // the country list
    if (this.isMobile) {
      // mobile is just a native select element
      this.countryList = $('<select class="iti-mobile-select">');
    } else {
      // desktop is a proper list containing: preferred countries, 
      //  then divider, then all countries
      this.countryList = $('<ul class="country-list v-hide">');
    }

    // containers (mostly for positioning)
    var container = $.html(                                  // @format(false)
      '<div class="intl-tel-input">', [
        '<div class="flag-dropdown">', [ // this.flagsContainer
          '<div class="selected-flag" tabindex="0">', [
            '<div class="iti-flag">',    // this.selectedFlagInner
            '<div class="arrow">'
          ],
          this.countryList
        ]
      ]                                                      // @format(true)
    );

    this.flagsContainer = $('.flag-dropdown', container);
    this.selectedFlagInner = $('.selected-flag > .iti-flag', container);
    container.append(this.telInput.replaceWith(container));

    if (this.preferredCountries.length && !this.isMobile) {
      this._appendListItems(this.preferredCountries, "preferred");
      $('<li class="divider">').appendTo(this.countryList);
    }
    this._appendListItems(this.countries, "");

    if (!this.isMobile) {
      // now we can grab the dropdown height, and hide it properly
      this.dropdownHeight = this.countryList.outerHeight();
      this.countryList.removeClass("v-hide").addClass("hide");

      // this is useful in lots of places
      this.countryListItems = this.countryList.children();
    }
  },

  // add a country <li> to the countryList <ul> container
  // UPDATE: if isMobile, add an <option> to the countryList <select> container
  _appendListItems: function (countries, className) {
    var temp = this.isMobile ? $.html(                       // @format(false)
      '<option dial-code="{{dial}}" value="{{iso2}}">', [
        "{{name}} +{{dial}}"
      ]                                                      // @format(true)
    ) : $.html(                                              // @format(false)
      '<li ng-class="clsName" dial-code="{{dial}}" country-code="{{iso2}}">', [
        '<div class="flag">', [
          '<div class="iti-flag {{iso2}}">'
        ],
        '<span class="country-name">{{name}}</span>',
        '<span class="dial-code">{{dial}}</span>'
      ]                                                      // @format(true)
    );

    for (var item, i = countries.length; i > 0, (item = countries[--i]);) {
      temp.compile({ clsName: "country " + className,        // @format(false)
        dial: item.dialCode, iso2: item.iso2, name: item.name
      }, this.countryList);                                  // @format(true)
    }
  },

  // called when the user selects a list item from the dropdown
  _selectListItem: function (listItem) {
    var countryCodeAttr = (this.isMobile) ? 'value' : 'country-code';

    // update selected flag and active list item
    this._selectFlag(listItem.attr(countryCodeAttr), true);
    if (!this.isMobile) {
      this._closeDropdown();
    }

    this._updateDialCode(listItem.attr('dial-code'), true);

    // always fire the change event as even if nationalMode=true (and we 
    //  haven't updated the input val), the system as a whole has still
    //  changed - see country-sync example; think of it as making a selection
    //  from a select element.
    this.telInput.trigger("change");

    // focus the input
    this.telInput.focus();

    // fix for FF and IE11 (with nationalMode=false i.e. auto inserting dial
    //  code), who try to put the cursor at the beginning the first time
    if (this.isGoodBrowser) {
      var len = this.telInput.val().length;
      this.telInput[0].setSelectionRange(len, len);
    }
  },

  // select the given flag, update the placeholder and the active list item
  _selectFlag: function (countryCode, updateDefault) {
    // do this first as it will throw an error and stop if countryCode is invalid
    this.selectedCountryData = (countryCode) ? 
      this._getCountryData(countryCode, false, false) : {};
    // update the "defaultCountry" - we only need the iso2 from now on, so just store that
    if (updateDefault && this.selectedCountryData.iso2) {
      // can't just make this equal to selectedCountryData as would be a ref to that object
      this.options.defaultCountry = {
        iso2: this.selectedCountryData.iso2
      };
    }

    this.selectedFlagInner.attr('class', "iti-flag " + countryCode);
    // update the selected country's title attribute
    var title = (countryCode) ? this.selectedCountryData.name + ": +" + 
      this.selectedCountryData.dialCode : "Unknown";
    this.selectedFlagInner.parent().attr('title', title);

    // and the input's placeholder
    this._updatePlaceholder();

    if (this.isMobile) {
      this.countryList.val(countryCode);
    } else {
      // update the active list item
      this.countryListItems.removeClass("active");
      if (countryCode) {
        this.countryListItems.find(".iti-flag." + countryCode).first().
          closest(".country").addClass("active");
      }
    }
  },

  // remove highlighting from other list items and highlight the given item
  _highlightListItem: function (listItem) {
    this.countryListItems.removeClass("highlight");
    listItem.addClass("highlight");
  },

  // show the dropdown
  _showDropdown: function () {
    this._setDropdownPosition();

    // update highlighting and scroll to active list item
    var activeListItem = this.countryList.children(".active");
    if (activeListItem.length) {
      this._highlightListItem(activeListItem);
    }

    // show it
    this.countryList.removeClass("hide");
    if (activeListItem.length) {
      this._scrollTo(activeListItem);
    }

    // bind all the dropdown-related listeners: mouseover, click, click-off, keydown
    this._bindDropdownListeners();

    // update the arrow
    this.selectedFlagInner.children(".arrow").addClass("up");
  },

  // decide where to position dropdown (depends on position within viewport, and scroll)
  _setDropdownPosition: function () {
    var inputTop = this.telInput.offset().top,
      windowTop = $(window).scrollTop(),
    // dropdownFitsBelow = (dropdownBottom < windowBottom)
      dropdownFitsBelow = (inputTop + this.telInput.outerHeight() + 
        this.dropdownHeight < windowTop + $(window).height()),
      dropdownFitsAbove = (inputTop - this.dropdownHeight > windowTop);

    // dropdownHeight - 1 for border
    var cssTop = (!dropdownFitsBelow && dropdownFitsAbove) ? "-" + 
      (this.dropdownHeight - 1) + "px" : "";
    this.countryList.css("top", cssTop);
  },

  // close the dropdown and unbind any listeners
  _closeDropdown: function () {
    this.countryList.addClass("hide");

    // update the arrow
    this.selectedFlagInner.children(".arrow").removeClass("up");

    // unbind key events
    $(document).off(this.ns);
    // unbind click-off-to-close
    $("html").off(this.ns);
    // unbind hover and click listeners
    this.countryList.off(this.ns);
  },

  // check if an element is visible within it's container, else scroll until it is
  _scrollTo: function (element, middle) {
    var container = this.countryList,
      containerHeight = container.height(),
      containerTop = container.offset().top,
      containerBottom = containerTop + containerHeight,
      elementHeight = element.outerHeight(),
      elementTop = element.offset().top,
      elementBottom = elementTop + elementHeight,
      newScrollTop = elementTop - containerTop + container.scrollTop(),
      middleOffset = (containerHeight / 2) - (elementHeight / 2);

    if (elementTop < containerTop) {
      // scroll up
      if (middle) {
        newScrollTop -= middleOffset;
      }
      container.scrollTop(newScrollTop);
    } else if (elementBottom > containerBottom) {
      // scroll down
      if (middle) {
        newScrollTop += middleOffset;
      }
      var heightDifference = containerHeight - elementHeight;
      container.scrollTop(newScrollTop - heightDifference);
    }
  },

  // set the initial state of the input value and the selected flag
  _setInitialState: function () {
    var val = this.telInput.val();

    // if there is a number, and it's valid, we can go ahead and set the flag, else fall back to default
    if (this._getDialCode(val)) {
      this._updateFlagFromNumber(val, true);
    } else if (this.options.defaultCountry != "auto") {
      // check the defaultCountry option, else fall back to the first in the list
      if (this.options.defaultCountry) {
        this.options.defaultCountry = this._getCountryData(this.options.
          defaultCountry.toLowerCase(), false, false);
      } else {
        this.options.defaultCountry = (this.preferredCountries.length) ? 
          this.preferredCountries[0] : this.countries[0];
      }
      this._selectFlag(this.options.defaultCountry.iso2);

      // if empty, insert the default dial code (this function will check !nationalMode and !autoHideDialCode)
      if (!val) {
        this._updateDialCode(this.options.defaultCountry.dialCode, false);
      }
    }

    // format
    if (val) {
      // this wont be run after _updateDialCode as that's only called if no val
      this._updateVal(val);
    }
  },
}, 
{
  _initKeyListeners: function () {
    var that = this;

    if (this.options.autoFormat) {
      // format number and update flag on keypress
      // use keypress event as we want to ignore all input except for a select few keys,
      // but we don't want to ignore the navigation keys like the arrows etc.
      // NOTE: no point in refactoring this to only bind these listeners on focus/blur because then you would need to have those 2 listeners running the whole time anyway...
      this.telInput.on("keypress" + this.ns, function (e) {
        // 32 is space, and after that it's all chars (not meta/nav keys)
        // this fix is needed for Firefox, which triggers keypress event for some meta/nav keys
        // Update: also ignore if this is a metaKey e.g. FF and Safari trigger keypress on the v of Ctrl+v
        // Update: also ignore if ctrlKey (FF on Windows/Ubuntu)
        // Update: also check that we have utils before we do any autoFormat stuff
        if (e.which >= keys.SPACE && !e.ctrlKey && !e.metaKey && utils.libphonenumber && !that.telInput.prop("readonly")) {
          e.preventDefault();
          // allowed keys are just numeric keys and plus
          // we must allow plus for the case where the user does select-all and then hits plus to start typing a new number. we could refine this logic to first check that the selection contains a plus, but that wont work in old browsers, and I think it's overkill anyway
          var isAllowedKey = ((e.which >= keys.ZERO && e.which <= keys.NINE) || e.which == keys.PLUS),
            input = that.telInput[0],
            noSelection = (that.isGoodBrowser && input.selectionStart == input.selectionEnd),
            max = that.telInput.attr('maxlength'),
            val = that.telInput.val(),
          // assumes that if max exists, it is >0
            isBelowMax = (max) ? (val.length < max) : true;
          // first: ensure we don't go over maxlength. we must do this here to prevent adding digits in the middle of the number
          // still reformat even if not an allowed key as they could by typing a formatting char, but ignore if there's a selection as doesn't make sense to replace selection with illegal char and then immediately remove it
          if (isBelowMax && (isAllowedKey || noSelection)) {
            var newChar = (isAllowedKey) ? String.fromCharCode(e.which) : null;
            that._handleInputKey(newChar, true, isAllowedKey);
            // if something has changed, trigger the input event (which was otherwise squashed by the preventDefault)
            if (val != that.telInput.val()) {
              that.telInput.trigger("input");
            }
          }
          if (!isAllowedKey) {
            that._handleInvalidKey();
          }
        }
      });
    }

    // handle cut/paste event (now supported in all major browsers)
    this.telInput.on("cut" + this.ns + " paste" + this.ns, function () {
      // hack because "paste" event is fired before input is updated
      setTimeout(function () {
        if (that.options.autoFormat && utils.libphonenumber) {
          var cursorAtEnd = (that.isGoodBrowser && that.telInput[0].selectionStart == that.telInput.val().length);
          that._handleInputKey(null, cursorAtEnd);
          that._ensurePlus();
        } else {
          // if no autoFormat, just update flag
          that._updateFlagFromNumber(that.telInput.val());
        }
      });
    });

    // handle keyup event
    // if autoFormat enabled: we use keyup to catch delete events (after the fact)
    // if no autoFormat, this is used to update the flag
    this.telInput.on("keyup" + this.ns, function (e) {
      // the "enter" key event from selecting a dropdown item is triggered here on the input, because the document.keydown handler that initially handles that event triggers a focus on the input, and so the keyup for that same key event gets triggered here. weird, but just make sure we don't bother doing any re-formatting in this case (we've already done preventDefault in the keydown handler, so it wont actually submit the form or anything).
      // ALSO: ignore keyup if readonly
      if (e.which == keys.ENTER || that.telInput.prop("readonly")) {
        // do nothing
      } else if (that.options.autoFormat && utils.libphonenumber) {
        // cursorAtEnd defaults to false for bad browsers else they would never get a reformat on delete
        var cursorAtEnd = (that.isGoodBrowser && that.telInput[0].selectionStart == that.telInput.val().length);

        if (!that.telInput.val()) {
          // if they just cleared the input, update the flag to the default
          that._updateFlagFromNumber("");
        } else if ((e.which == keys.DEL && !cursorAtEnd) || e.which == keys.BSPACE) {
          // if delete in the middle: reformat with no suffix (no need to reformat if delete at end)
          // if backspace: reformat with no suffix (need to reformat if at end to remove any lingering suffix - this is a feature)
          // important to remember never to add suffix on any delete key as can fuck up in ie8 so you can never delete a formatting char at the end
          that._handleInputKey();
        }
        that._ensurePlus();
      } else {
        // if no autoFormat, just update flag
        that._updateFlagFromNumber(that.telInput.val());
      }
    });
  },

  // highlight the next/prev item in the list (and ensure it is visible)
  _handleUpDownKey: function (key) {
    var current = this.countryList.children(".highlight").first();
    var next = (key == keys.UP) ? current.prev() : current.next();
    if (next.length) {
      // skip the divider
      if (next.hasClass("divider")) {
        next = (key == keys.UP) ? next.prev() : next.next();
      }
      this._highlightListItem(next);
      this._scrollTo(next);
    }
  },

  // select the currently highlighted item
  _handleEnterKey: function () {
    var currentCountry = this.countryList.children(".highlight").first();
    if (currentCountry.length) {
      this._selectListItem(currentCountry);
    }
  },

  // alert the user to an invalid key event
  _handleInvalidKey: function () {
    var that = this;

    this.telInput.trigger("invalidkey").addClass("iti-invalid-key");
    setTimeout(function () {
      that.telInput.removeClass("iti-invalid-key");
    }, 100);
  },

  // when autoFormat is enabled: handle various key events on the input:
  // 1) adding a new number character, which will replace any selection, reformat, and preserve the cursor position
  // 2) reformatting on backspace/delete
  // 3) cut/paste event
  _handleInputKey: function (newNumericChar, addSuffix, isAllowedKey) {
    var val = this.telInput.val(),
      cleanBefore = this._getClean(val),
      originalLeftChars,
    // raw DOM element
      input = this.telInput[0],
      digitsOnRight = 0;

    if (this.isGoodBrowser) {
      // cursor strategy: maintain the number of digits on the right. we use the right instead of the left so that A) we don't have to account for the new digit (or multiple digits if paste event), and B) we're always on the right side of formatting suffixes
      digitsOnRight = this._getDigitsOnRight(val, input.selectionEnd);

      // if handling a new number character: insert it in the right place
      if (newNumericChar) {
        // replace any selection they may have made with the new char
        val = val.substr(0, input.selectionStart) + newNumericChar + val.substring(input.selectionEnd, val.length);
      } else {
        // here we're not handling a new char, we're just doing a re-format (e.g. on delete/backspace/paste, after the fact), but we still need to maintain the cursor position. so make note of the char on the left, and then after the re-format, we'll count in the same number of digits from the right, and then keep going through any formatting chars until we hit the same left char that we had before.
        // UPDATE: now have to store 2 chars as extensions formatting contains 2 spaces so you need to be able to distinguish
        originalLeftChars = val.substr(input.selectionStart - 2, 2);
      }
    } else if (newNumericChar) {
      val += newNumericChar;
    }

    // update the number and flag
    this.setNumber(val, null, addSuffix, true, isAllowedKey);

    // update the cursor position
    if (this.isGoodBrowser) {
      var newCursor;
      val = this.telInput.val();

      // if it was at the end, keep it there
      if (!digitsOnRight) {
        newCursor = val.length;
      } else {
        // else count in the same number of digits from the right
        newCursor = this._getCursorFromDigitsOnRight(val, digitsOnRight);

        // but if delete/paste etc, keep going left until hit the same left char as before
        if (!newNumericChar) {
          newCursor = this._getCursorFromLeftChar(val, newCursor, originalLeftChars);
        }
      }
      // set the new cursor
      input.setSelectionRange(newCursor, newCursor);
    }
  },
}, {
  // we only bind dropdown listeners when the dropdown is open
  _bindDropdownListeners: function () {
    var that = this;

    // when mouse over a list item, just highlight that one
    // we add the class "highlight", so if they hit "enter" we know which one to select
    this.countryList.on("mouseover" + this.ns, ".country", function (e) {
      that._highlightListItem($(this));
    });

    // listen for country selection
    this.countryList.on("click" + this.ns, ".country", function (e) {
      that._selectListItem($(this));
    });

    // click off to close
    // (except when this initial opening click is bubbling up)
    // we cannot just stopPropagation as it may be needed to close another instance
    var isOpening = true;
    $("html").on("click" + this.ns, function (e) {
      if (!isOpening) {
        that._closeDropdown();
      }
      isOpening = false;
    });

    // listen for up/down scrolling, enter to select, or letters to jump to country name.
    // use keydown as keypress doesn't fire for non-char keys and we want to catch if they
    // just hit down and hold it to scroll down (no keyup event).
    // listen on the document because that's where key events are triggered if no input has focus
    var query = "",
      queryTimer = null;
    $(document).on("keydown" + this.ns, function (e) {
      // prevent down key from scrolling the whole page,
      // and enter key from submitting a form etc
      e.preventDefault();

      if (e.which == keys.UP || e.which == keys.DOWN) {
        // up and down to navigate
        that._handleUpDownKey(e.which);
      } else if (e.which == keys.ENTER) {
        // enter to select
        that._handleEnterKey();
      } else if (e.which == keys.ESC) {
        // esc to close
        that._closeDropdown();
      } else if ((e.which >= keys.A && e.which <= keys.Z) || e.which == keys.SPACE) {
        // upper case letters (note: keyup/keydown only return upper case letters)
        // jump to countries that start with the query string
        if (queryTimer) {
          clearTimeout(queryTimer);
        }
        query += String.fromCharCode(e.which);
        that._searchForCountry(query);
        // if the timer hits 1 second, reset the query
        queryTimer = setTimeout(function () {
          query = "";
        }, 1000);
      }
    });
  },

  // listen for focus and blur
  _initFocusListeners: function () {
    var that = this;

    if (this.options.autoHideDialCode) {
      // mousedown decides where the cursor goes, so if we're focusing we must preventDefault as we'll be inserting the dial code, and we want the cursor to be at the end no matter where they click
      this.telInput.on("mousedown" + this.ns, function (e) {
        if (!that.telInput.is(":focus") && !that.telInput.val()) {
          e.preventDefault();
          // but this also cancels the focus, so we must trigger that manually
          that.telInput.focus();
        }
      });
    }

    this.telInput.on("focus" + this.ns, function (e) {
      var value = that.telInput.val();
      // save this to compare on blur
      that.telInput.data("focusVal", value);

      // on focus: if empty, insert the dial code for the currently selected flag
      if (that.options.autoHideDialCode && !value && !that.telInput.prop("readonly") && that.selectedCountryData.dialCode) {
        that._updateVal("+" + that.selectedCountryData.dialCode, null, true);
        // after auto-inserting a dial code, if the first key they hit is '+' then assume they are entering a new number, so remove the dial code. use keypress instead of keydown because keydown gets triggered for the shift key (required to hit the + key), and instead of keyup because that shows the new '+' before removing the old one
        that.telInput.one("keypress.plus" + that.ns, function (e) {
          if (e.which == keys.PLUS) {
            // if autoFormat is enabled, this key event will have already have been handled by another keypress listener (hence we need to add the "+"). if disabled, it will be handled after this by a keyup listener (hence no need to add the "+").
            var newVal = (that.options.autoFormat && utils.libphonenumber) ? "+" : "";
            that.telInput.val(newVal);
          }
        });

        // after tabbing in, make sure the cursor is at the end we must use setTimeout to get outside of the focus handler as it seems the selection happens after that
        setTimeout(function () {
          var input = that.telInput[0];
          if (that.isGoodBrowser) {
            var len = that.telInput.val().length;
            input.setSelectionRange(len, len);
          }
        });
      }
    });

    this.telInput.on("blur" + this.ns, function () {
      if (that.options.autoHideDialCode) {
        // on blur: if just a dial code then remove it
        var value = that.telInput.val(),
          startsPlus = (value.charAt(0) == "+");
        if (startsPlus) {
          var numeric = that._getNumeric(value);
          // if just a plus, or if just a dial code
          if (!numeric || that.selectedCountryData.dialCode == numeric) {
            that.telInput.val("");
          }
        }
        // remove the keypress listener we added on focus
        that.telInput.off("keypress.plus" + that.ns);
      }

      // if autoFormat, we must manually trigger change event if value has changed
      if (that.options.autoFormat && utils.libphonenumber && that.telInput.val() != that.telInput.data("focusVal")) {
        that.telInput.trigger("change");
      }
    });

    // made the decision not to trigger blur() now, because would only do anything in the case where they manually set the initial value to just a dial code, in which case they probably want it to be displayed.
  },

  // initialise the main event listeners: input keyup, and click selected flag
  _initListeners: function () {
    var that = this;

    this._initKeyListeners();

    // autoFormat prevents the change event from firing, so we need to check for changes between focus and blur in order to manually trigger it
    if (this.options.autoHideDialCode || this.options.autoFormat) {
      this._initFocusListeners();
    }

    if (this.isMobile) {
      this.countryList.on("change" + this.ns, function (e) {
        that._selectListItem($(this).find("option:selected"));
      });
    } else {
      // hack for input nested inside label: clicking the selected-flag to open the dropdown would then automatically trigger a 2nd click on the input which would close it again
      var label = this.telInput.closest("label");
      if (label.length) {
        label.on("click" + this.ns, function (e) {
          // if the dropdown is closed, then focus the input, else ignore the click
          if (that.countryList.hasClass("hide")) {
            that.telInput.focus();
          } else {
            e.preventDefault();
          }
        });
      }

      // toggle country dropdown on click
      var selectedFlag = this.selectedFlagInner.parent();
      selectedFlag.on("click" + this.ns, function (e) {
        // only intercept this event if we're opening the dropdown
        // else let it bubble up to the top ("click-off-to-close" listener)
        // we cannot just stopPropagation as it may be needed to close another instance
        if (that.countryList.hasClass("hide") && !that.telInput.prop("disabled") && !that.telInput.prop("readonly")) {
          that._showDropdown();
        }
      });
    }

    // open dropdown list if currently focused
    this.flagsContainer.on("keydown" + that.ns, function (e) {
      var isDropdownHidden = that.countryList.hasClass('hide');

      if (isDropdownHidden &&
        (e.which == keys.UP || e.which == keys.DOWN ||
        e.which == keys.SPACE || e.which == keys.ENTER)
      ) {
        // prevent form from being submitted if "ENTER" was pressed
        e.preventDefault();

        // prevent event from being handled again by document
        e.stopPropagation();

        that._showDropdown();
      }

      // allow navigation from dropdown to input on TAB
      if (e.which == keys.TAB) {
        that._closeDropdown();
      }
    });
  }
}, 
{
  // replace any existing dial code with the new one (if not in nationalMode)
  // also we need to know if we're focusing for a couple of reasons e.g. if so, we want to add any formatting suffix, also if the input is empty and we're not in nationalMode, then we want to insert the dial code
  _updateDialCode: function (newDialCode, focusing) {
    var inputVal = this.telInput.val(), newNumber;

    // save having to pass this every time
    newDialCode = "+" + newDialCode;

    if (this.options.nationalMode && inputVal.charAt(0) != "+") {
      // if nationalMode, we just want to re-format
      newNumber = inputVal;
    } else if (inputVal) {
      // if the previous number contained a valid dial code, replace it
      // (if more than just a plus character)
      var prevDialCode = this._getDialCode(inputVal);
      if (prevDialCode.length > 1) {
        newNumber = inputVal.replace(prevDialCode, newDialCode);
      } else {
        // if the previous number didn't contain a dial code, we should persist it
        var existingNumber = (inputVal.charAt(0) != "+") ? $.trim(inputVal) : "";
        newNumber = newDialCode + existingNumber;
      }
    } else {
      newNumber = (!this.options.autoHideDialCode || focusing) ? newDialCode : "";
    }

    this._updateVal(newNumber, null, focusing);
  },

  // check if need to select a new flag based on the given number
  _updateFlagFromNumber: function (number, updateDefault) {
    // if we're in nationalMode and we're on US/Canada, make sure the number starts with a +1 so _getDialCode will be able to extract the area code
    // update: if we don't yet have selectedCountryData, but we're here (trying to update the flag from the number), that means we're initialising the plugin with a number that already has a dial code, so fine to ignore this bit
    if (number && this.options.nationalMode && this.selectedCountryData && this.selectedCountryData.dialCode == "1" && number.charAt(0) != "+") {
      if (number.charAt(0) != "1") {
        number = "1" + number;
      }
      number = "+" + number;
    }
    // try and extract valid dial code from input
    var dialCode = this._getDialCode(number),
      countryCode = null;
    if (dialCode) {
      // check if one of the matching countries is already selected
      var countryCodes = this.countryCodes[this._getNumeric(dialCode)],
        alreadySelected = (this.selectedCountryData && $.inArray(this.selectedCountryData.iso2, countryCodes) != -1);
      // if a matching country is not already selected (or this is an unknown NANP area code): choose the first in the list
      if (!alreadySelected || this._isUnknownNanp(number, dialCode)) {
        // if using onlyCountries option, countryCodes[0] may be empty, so we must find the first non-empty index
        for (var j = 0; j < countryCodes.length; j++) {
          if (countryCodes[j]) {
            countryCode = countryCodes[j];
            break;
          }
        }
      }
    } else if (number.charAt(0) == "+" && this._getNumeric(number).length) {
      // invalid dial code, so empty
      // Note: use getNumeric here because the number has not been formatted yet, so could contain bad shit
      countryCode = "";
    } else if (!number || number == "+") {
      // empty, or just a plus, so default
      countryCode = this.options.defaultCountry.iso2;
    }

    if (countryCode !== null) {
      this._selectFlag(countryCode, updateDefault);
    }
  },

  // update the input placeholder to an example number from the currently selected country
  _updatePlaceholder: function () {
    if (utils.libphonenumber && !this.hadInitialPlaceholder && this.options.autoPlaceholder && this.selectedCountryData) {
      var iso2 = this.selectedCountryData.iso2,
        numberType = utils.libphonenumber.numberType[this.options.numberType || "FIXED_LINE"],
        placeholder = (iso2) ? utils.libphonenumber.getExampleNumber(iso2, this.options.nationalMode, numberType) : "";

      if (typeof this.options.customPlaceholder === 'function') {
        placeholder = this.options.customPlaceholder(placeholder, this.selectedCountryData);
      }

      this.telInput.attr('placeholder', placeholder);
    }
  },

  // update the input's value to the given val
  // if autoFormat=true, format it first according to the country-specific formatting rules
  // Note: preventConversion will be false (i.e. we allow conversion) on init and when dev calls public method setNumber
  _updateVal: function (val, format, addSuffix, preventConversion, isAllowedKey) {
    var formatted;

    if (this.options.autoFormat && utils.libphonenumber && this.selectedCountryData) {
      if (typeof(format) == "number" && utils.libphonenumber.isValidNumber(val, this.selectedCountryData.iso2)) {
        // if user specified a format, and it's a valid number, then format it accordingly
        formatted = utils.libphonenumber.formatNumberByType(val, this.selectedCountryData.iso2, format);
      } else if (!preventConversion && this.options.nationalMode && val.charAt(0) == "+" && utils.libphonenumber.isValidNumber(val, this.selectedCountryData.iso2)) {
        // if nationalMode and we have a valid intl number, convert it to ntl
        formatted = utils.libphonenumber.formatNumberByType(val, this.selectedCountryData.iso2, utils.libphonenumber.numberFormat.NATIONAL);
      } else {
        // else do the regular AsYouType formatting
        formatted = utils.libphonenumber.formatNumber(val, this.selectedCountryData.iso2, addSuffix, this.options.allowExtensions, isAllowedKey);
      }
      // ensure we don't go over maxlength. we must do this here to truncate any formatting suffix, and also handle paste events
      var max = this.telInput.attr('maxlength');
      if (max && formatted.length > max) {
        formatted = formatted.substr(0, max);
      }
    } else {
      // no autoFormat, so just insert the original value
      formatted = val;
    }

    this.telInput.val(formatted);
  },

  // process preferred countries - iterate through the preferences,
  // fetching the country data for each one
  _setPreferredCountries: function () {
    this.preferredCountries = [];
    for (var i = 0; i < this.options.preferredCountries.length; i++) {
      var countryCode = this.options.preferredCountries[i].toLowerCase(),
        countryData = this._getCountryData(countryCode, false, true);
      if (countryData) {
        this.preferredCountries.push(countryData);
      }
    }
  }
}, utils);
      
      utils = {};
      return TelInput;
    }
  ]);
