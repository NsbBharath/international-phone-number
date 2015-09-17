((BEGIN))(
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
}
)((END))
