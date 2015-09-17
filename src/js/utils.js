((BEGIN))(
{
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
}
)((END))
