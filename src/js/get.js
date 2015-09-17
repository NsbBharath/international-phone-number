((BEGIN))(
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
}
)((END))
