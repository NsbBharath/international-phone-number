angular.
  module('demo', ['intlTelInput']).
  controller('result', ['intlTelInput', function (TelInput) {
    // get the country data from the plugin
    var countryData = TelInput.countryData,
      addressDropdown = $("#address-country");

    // populate the country dropdown
    countryData.forEach(function (country) {
      $.html('<option value="{{c.iso2}}">{{c.name}}</option>').
        compile({c: country}, addressDropdown);
    });

    TelInput.
      config(function () {
        return {
          // just for formatting/placeholders etc
          utilsScript: "../js/libphonenumber.min.js"
        };
      }).
      done(function (input) {
        // listen to the telephone input for changes
        input.change(function () {
          var data = input.intlTelInput("getSelectedCountryData");
          addressDropdown.val(data.iso2);
        });

        // trigger a fake "change" event now, to trigger an initial sync
        input.change();

        // listen to the address dropdown for changes
        addressDropdown.change(function () {
          input.intlTelInput("selectCountry", $(this).val());
        });
      });
  }]);
