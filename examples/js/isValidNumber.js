angular.
  module('demo', ['intlTelInput']).
  controller('result', ['intlTelInput', function (TelInput) {
    var telInput = $("#phone"),
      errorMsg = $("#error-msg"),
      validMsg = $("#valid-msg");

    // initialise plugin
    telInput.intlTelInput({
      utilsScript: "../js/libphonenumber.min.js"
    });

    // on blur: validate
    telInput.blur(function () {
      if ($.trim(telInput.val())) {
        if (telInput.intlTelInput("isValidNumber")) {
          validMsg.removeClass("hide");
        } else {
          telInput.addClass("error");
          errorMsg.removeClass("hide");
          validMsg.addClass("hide");
        }
      }
    });

    // on keydown: reset
    telInput.keydown(function () {
      telInput.removeClass("error");
      errorMsg.addClass("hide");
      validMsg.addClass("hide");
    });
  }]);
