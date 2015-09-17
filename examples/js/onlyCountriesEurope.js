angular.
  module('demo', ['intlTelInput']).
  controller('result', ['intlTelInput', function (TelInput) {
    TelInput.config(function () {
      return {
        onlyCountries: ["al", "ad", "at", "by", "be", "ba", "bg", "hr", "cz",
          "dk", "ee", "fo", "fi", "fr", "de", "gi", "gr", "va", "hu", "is",
          "ie", "it", "lv", "li", "lt", "lu", "mk", "mt", "md", "mc", "me",
          "nl", "no", "pl", "pt", "ro", "ru", "sm", "rs", "sk", "si", "es",
          "se", "ch", "ua", "gb"
        ],
        // just for formatting/placeholders etc
        utilsScript: "../js/libphonenumber.min.js"
      }
    });
  }]);
