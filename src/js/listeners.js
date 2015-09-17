((BEGIN))(
{
  // we only bind dropdown listeners when the dropdown is open
  _bindDropdownListeners: function () {
    var that = this;

    // when mouse over a list item, just highlight that one
    // we add the class "highlight", so if they hit "enter" we know which one to select
    this.countryList.on("mouseover" + this.ns, ".country", function (e) {
      that._highlightListItem($(this));
    });

    // listen for country selection
    this.countryList.on("click" + this.ns, ".country", function (e) {
      that._selectListItem($(this));
    });

    // click off to close
    // (except when this initial opening click is bubbling up)
    // we cannot just stopPropagation as it may be needed to close another instance
    var isOpening = true;
    $("html").on("click" + this.ns, function (e) {
      if (!isOpening) {
        that._closeDropdown();
      }
      isOpening = false;
    });

    // listen for up/down scrolling, enter to select, or letters to jump to country name.
    // use keydown as keypress doesn't fire for non-char keys and we want to catch if they
    // just hit down and hold it to scroll down (no keyup event).
    // listen on the document because that's where key events are triggered if no input has focus
    var query = "",
      queryTimer = null;
    $(document).on("keydown" + this.ns, function (e) {
      // prevent down key from scrolling the whole page,
      // and enter key from submitting a form etc
      e.preventDefault();

      if (e.which == keys.UP || e.which == keys.DOWN) {
        // up and down to navigate
        that._handleUpDownKey(e.which);
      } else if (e.which == keys.ENTER) {
        // enter to select
        that._handleEnterKey();
      } else if (e.which == keys.ESC) {
        // esc to close
        that._closeDropdown();
      } else if ((e.which >= keys.A && e.which <= keys.Z) || e.which == keys.SPACE) {
        // upper case letters (note: keyup/keydown only return upper case letters)
        // jump to countries that start with the query string
        if (queryTimer) {
          clearTimeout(queryTimer);
        }
        query += String.fromCharCode(e.which);
        that._searchForCountry(query);
        // if the timer hits 1 second, reset the query
        queryTimer = setTimeout(function () {
          query = "";
        }, 1000);
      }
    });
  },

  // listen for focus and blur
  _initFocusListeners: function () {
    var that = this;

    if (this.options.autoHideDialCode) {
      // mousedown decides where the cursor goes, so if we're focusing we must preventDefault as we'll be inserting the dial code, and we want the cursor to be at the end no matter where they click
      this.telInput.on("mousedown" + this.ns, function (e) {
        if (!that.telInput.is(":focus") && !that.telInput.val()) {
          e.preventDefault();
          // but this also cancels the focus, so we must trigger that manually
          that.telInput.focus();
        }
      });
    }

    this.telInput.on("focus" + this.ns, function (e) {
      var value = that.telInput.val();
      // save this to compare on blur
      that.telInput.data("focusVal", value);

      // on focus: if empty, insert the dial code for the currently selected flag
      if (that.options.autoHideDialCode && !value && !that.telInput.prop("readonly") && that.selectedCountryData.dialCode) {
        that._updateVal("+" + that.selectedCountryData.dialCode, null, true);
        // after auto-inserting a dial code, if the first key they hit is '+' then assume they are entering a new number, so remove the dial code. use keypress instead of keydown because keydown gets triggered for the shift key (required to hit the + key), and instead of keyup because that shows the new '+' before removing the old one
        that.telInput.one("keypress.plus" + that.ns, function (e) {
          if (e.which == keys.PLUS) {
            // if autoFormat is enabled, this key event will have already have been handled by another keypress listener (hence we need to add the "+"). if disabled, it will be handled after this by a keyup listener (hence no need to add the "+").
            var newVal = (that.options.autoFormat && utils.libphonenumber) ? "+" : "";
            that.telInput.val(newVal);
          }
        });

        // after tabbing in, make sure the cursor is at the end we must use setTimeout to get outside of the focus handler as it seems the selection happens after that
        setTimeout(function () {
          var input = that.telInput[0];
          if (that.isGoodBrowser) {
            var len = that.telInput.val().length;
            input.setSelectionRange(len, len);
          }
        });
      }
    });

    this.telInput.on("blur" + this.ns, function () {
      if (that.options.autoHideDialCode) {
        // on blur: if just a dial code then remove it
        var value = that.telInput.val(),
          startsPlus = (value.charAt(0) == "+");
        if (startsPlus) {
          var numeric = that._getNumeric(value);
          // if just a plus, or if just a dial code
          if (!numeric || that.selectedCountryData.dialCode == numeric) {
            that.telInput.val("");
          }
        }
        // remove the keypress listener we added on focus
        that.telInput.off("keypress.plus" + that.ns);
      }

      // if autoFormat, we must manually trigger change event if value has changed
      if (that.options.autoFormat && utils.libphonenumber && that.telInput.val() != that.telInput.data("focusVal")) {
        that.telInput.trigger("change");
      }
    });

    // made the decision not to trigger blur() now, because would only do anything in the case where they manually set the initial value to just a dial code, in which case they probably want it to be displayed.
  },

  // initialise the main event listeners: input keyup, and click selected flag
  _initListeners: function () {
    var that = this;

    this._initKeyListeners();

    // autoFormat prevents the change event from firing, so we need to check for changes between focus and blur in order to manually trigger it
    if (this.options.autoHideDialCode || this.options.autoFormat) {
      this._initFocusListeners();
    }

    if (this.isMobile) {
      this.countryList.on("change" + this.ns, function (e) {
        that._selectListItem($(this).find("option:selected"));
      });
    } else {
      // hack for input nested inside label: clicking the selected-flag to open the dropdown would then automatically trigger a 2nd click on the input which would close it again
      var label = this.telInput.closest("label");
      if (label.length) {
        label.on("click" + this.ns, function (e) {
          // if the dropdown is closed, then focus the input, else ignore the click
          if (that.countryList.hasClass("hide")) {
            that.telInput.focus();
          } else {
            e.preventDefault();
          }
        });
      }

      // toggle country dropdown on click
      var selectedFlag = this.selectedFlagInner.parent();
      selectedFlag.on("click" + this.ns, function (e) {
        // only intercept this event if we're opening the dropdown
        // else let it bubble up to the top ("click-off-to-close" listener)
        // we cannot just stopPropagation as it may be needed to close another instance
        if (that.countryList.hasClass("hide") && !that.telInput.prop("disabled") && !that.telInput.prop("readonly")) {
          that._showDropdown();
        }
      });
    }

    // open dropdown list if currently focused
    this.flagsContainer.on("keydown" + that.ns, function (e) {
      var isDropdownHidden = that.countryList.hasClass('hide');

      if (isDropdownHidden &&
        (e.which == keys.UP || e.which == keys.DOWN ||
        e.which == keys.SPACE || e.which == keys.ENTER)
      ) {
        // prevent form from being submitted if "ENTER" was pressed
        e.preventDefault();

        // prevent event from being handled again by document
        e.stopPropagation();

        that._showDropdown();
      }

      // allow navigation from dropdown to input on TAB
      if (e.which == keys.TAB) {
        that._closeDropdown();
      }
    });
  }
}
)((END))
