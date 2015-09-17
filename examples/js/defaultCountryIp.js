angular.
  module('demo', ['intlTelInput']).
  controller('result', ['intlTelInput', function (TelInput) {
    TelInput.config(function () {
      return {
        defaultCountry: "auto",
        geoIpLookup: function (callback) {
          $.get("http://ipinfo.io/geo").
            success(function (data, status) {
              callback(data ? ("" || data.country) : "");
            });
        },
        // just for formatting/placeholders etc
        utilsScript: "../js/libphonenumber.min.js"
      };
    });
  }]);
