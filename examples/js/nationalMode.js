angular.
  module('demo', ['intlTelInput']).
  controller('result', ['intlTelInput', function (TelInput) {
    var output = $("#output");

    TelInput.
      config(function () {
        return {
          nationalMode: true,
          // just for formatting/placeholders etc
          utilsScript: "../js/libphonenumber.min.js"
        };
      }).
      done(function (input) {
        // listen to "keyup", but also "change" to update when the user selects a country
        input.on("keyup change", function() {
          var intlNumber = input.intlTelInput("getNumber");
          if (intlNumber) {
            output.text("International: " + intlNumber);
          } else {
            output.text("Please enter a number below");
          }
        });
      });
  }]);
