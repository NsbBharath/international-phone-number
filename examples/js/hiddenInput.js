angular.
  module('demo', ['intlTelInput']).
  controller('result', ['$scope', 'intlTelInput', 
    function ($scope) {
      var input = $('[name="phone"]'), hidden = $("#hidden");
      input.intlTelInput({
        // just for formatting/placeholders etc
        utilsScript: "../js/libphonenumber.min.js"
      });

      // update the hidden input on submit
      $scope.submit = function () {
        hidden.val(input.intlTelInput("getNumber"));
      };
    }
  ]);
