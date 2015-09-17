angular.
  module('demo', ['intlTelInput']).
  controller('result', ['intlTelInput', function (TelInput) {
    TelInput.countryData.forEach(function (country) {
      country.name = country.name.replace(/.+\((.+)\)/, "$1");
    });

    TelInput.config(function () {
      return {
        // just for formatting/placeholders etc
        utilsScript: "../js/libphonenumber.min.js"
      };
    });
  }]);
