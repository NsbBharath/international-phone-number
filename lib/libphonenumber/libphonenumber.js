goog.require('i18n.phonenumbers.AsYouTypeFormatter');
goog.require('i18n.phonenumbers.PhoneNumberFormat');
goog.require('i18n.phonenumbers.PhoneNumberUtil');

goog.exportSymbol('libphonenumber', {
  // format the given number (optionally add any formatting suffix e.g. a hyphen)
  formatNumber:function formatNumber(val, countryCode, addSuffix, allowExtension, isAllowedKey) {
    try {
      var clean = val.replace(/\D/g, ""),
        // NOTE: we use AsYouTypeFormatter because the default format function can't handle incomplete numbers e.g. "+17024" formats to "+1 7024" as opposed to "+1 702-4"
        formatter = new i18n.phonenumbers.AsYouTypeFormatter(countryCode),
        // if clean is empty, we still need this to be a string otherwise we get errors later
        result = "",
        next,
        extSuffix = " ext. ";

      if (val.substr(0, 1) == "+") {
        clean = "+" + clean;
      }

      for (var i = 0; i < clean.length; i++) {
        // TODO: improve this so don't just pump in every digit every time - we should just cache this formatter object, and just call inputDigit once each time the user enters a new digit
        next = formatter.inputDigit(clean.charAt(i));
        // if adding this char didn't change the length, or made it smaller (and there's no longer any spaces): that means that formatting failed which means the number was no longer a potentially valid number, so if we're allowing extensions: assume the rest is the ext
        if (allowExtension && result && next.length <= result.length && next.indexOf(" ") == -1) {
          // set flag for extension
          next = -1;
          break;
        }
        result = next;
      }

      // for some reason libphonenumber formats "+44" to "+44 ", but doesn't do the same with "+1"
      if (result.charAt(result.length - 1) == " ") {
        result = result.substr(0, result.length - 1);
      }
      // check if there's a suffix to add (unless there's an ext)
      if (addSuffix && !val.split(extSuffix)[1]) {
        // hack to get formatting suffix
        var test = formatter.inputDigit('5');
        // again the "+44 " problem... (also affects "+45" apparently)
        if (test.charAt(test.length - 1) == " ") {
          test = test.substr(0, test.length - 1);
        }
        // if adding a '5' introduces a formatting char - check if the penultimate char is not-a-number
        var penultimate = test.substr(test.length - 2, 1);
        // Note: never use isNaN without parseFloat
        if (isNaN(parseFloat(penultimate))) {
          // return the new value (minus that last '5' we just added)
          return test.substr(0, test.length - 1);
        } else if (allowExtension && result && test.length <= result.length && test.indexOf(" ") == -1 && !isAllowedKey) {
          // else if the next digit would break the formating, and we're allowing extensions, AND this is not an allowed key: add the suffix
          // NOTE: we must check this is not an allowed key because if it was that means it was the last digit in a valid number and we dont want to add the "ext" suffix in that case. This whole condition is just here to catch the case that: after typing a valid number, they try to type "ext" - this will not automatically add it for them.
          return result + extSuffix;
        }
      }

      // if the clean number contains an extension we need to add it
      if (next == -1) {
        result += extSuffix + clean.substring(i, clean.length);
      }
      return result;
    } catch (e) {
      return val;
    }
  },

  // format the given number to the given type
  formatNumberByType: function formatNumberByType(number, countryCode, type) {
    try {
      var phoneUtil = i18n.phonenumbers.PhoneNumberUtil.getInstance();
      var numberObj = phoneUtil.parseAndKeepRawInput(number, countryCode);
      type = (typeof type == "undefined") ? i18n.phonenumbers.PhoneNumberFormat.E164 : type;
      return phoneUtil.format(numberObj, type);
    } catch (e) {
      return "";
    }
  },

  // get an example number for the given country code
  getExampleNumber: function getExampleNumber(countryCode, national, numberType) {
    try {
      var phoneUtil = i18n.phonenumbers.PhoneNumberUtil.getInstance();
      var numberObj = phoneUtil.getExampleNumberForType(countryCode, numberType);
      var format = (national) ? i18n.phonenumbers.PhoneNumberFormat.NATIONAL : i18n.phonenumbers.PhoneNumberFormat.INTERNATIONAL;
      return phoneUtil.format(numberObj, format);
    } catch (e) {
      return "";
    }
  },

  // get the type of the given number e.g. fixed-line/mobile
  getNumberType: function getNumberType(number, countryCode) {
    try {
      var phoneUtil = i18n.phonenumbers.PhoneNumberUtil.getInstance();
      var numberObj = phoneUtil.parseAndKeepRawInput(number, countryCode);
      return phoneUtil.getNumberType(numberObj)
    } catch (e) {
      // broken
      return -99;
    }
  },

  // get more info if the validation has failed e.g. too long/too short
  getValidationError: function getValidationError(number, countryCode) {
    try {
      var phoneUtil = i18n.phonenumbers.PhoneNumberUtil.getInstance();
      var numberObj = phoneUtil.parseAndKeepRawInput(number, countryCode);
      return phoneUtil.isPossibleNumberWithReason(numberObj);
    } catch (e) {
      //console.log(e);

      // here I convert thrown errors into ValidationResult enums (if possible)
      if (e == i18n.phonenumbers.Error.INVALID_COUNTRY_CODE) {
        return i18n.phonenumbers.PhoneNumberUtil.ValidationResult.INVALID_COUNTRY_CODE;
      }
      if (e == i18n.phonenumbers.Error.NOT_A_NUMBER) {
        return 4;
      }
      if (e == i18n.phonenumbers.Error.TOO_SHORT_AFTER_IDD || e == i18n.phonenumbers.Error.TOO_SHORT_NSN) {
        return i18n.phonenumbers.PhoneNumberUtil.ValidationResult.TOO_SHORT;
      }
      if (e == i18n.phonenumbers.Error.TOO_LONG) {
        return i18n.phonenumbers.PhoneNumberUtil.ValidationResult.TOO_LONG;
      }

      // broken
      return -99;
    }
  },

  // check if given number is valid
  isValidNumber: function isValidNumber(number, countryCode) {
    try {
      var phoneUtil = i18n.phonenumbers.PhoneNumberUtil.getInstance();
      var numberObj = phoneUtil.parseAndKeepRawInput(number, countryCode);
      return phoneUtil.isValidNumber(numberObj);
    } catch (e) {
      return false;
    }
  },
  
  // enums
  numberType: i18n.phonenumbers.PhoneNumberType,
  validationError: {
    IS_POSSIBLE: 0,
    INVALID_COUNTRY_CODE: 1,
    TOO_SHORT: 2,
    TOO_LONG: 3,
    NOT_A_NUMBER: 4
  },
  numberFormat: i18n.phonenumbers.PhoneNumberFormat
}, utils);
