((BEGIN))(
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
}
)((END))
