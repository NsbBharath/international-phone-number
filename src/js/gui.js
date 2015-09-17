((BEGIN))(
{
  // generate all of the markup for the selected flag overlay and the dropdown
  _generateMarkup: function () {
    // prevent autocomplete as there's no safe, cross-browser event we can 
    //  react to, so it can easily put the plugin in an inconsistent state e.g. 
    //  the wrong flag selected for the autocompleted number, which on submit 
    //  could mean the wrong number is saved (esp in nationalMode)
    this.telInput.attr('autocomplete', "off");

    // the country list
    if (this.isMobile) {
      // mobile is just a native select element
      this.countryList = $('<select class="iti-mobile-select">');
    } else {
      // desktop is a proper list containing: preferred countries, 
      //  then divider, then all countries
      this.countryList = $('<ul class="country-list v-hide">');
    }

    // containers (mostly for positioning)
    var container = $.html(                                  // @format(false)
      '<div class="intl-tel-input">', [
        '<div class="flag-dropdown">', [ // this.flagsContainer
          '<div class="selected-flag" tabindex="0">', [
            '<div class="iti-flag">',    // this.selectedFlagInner
            '<div class="arrow">'
          ],
          this.countryList
        ]
      ]                                                      // @format(true)
    );

    this.flagsContainer = $('.flag-dropdown', container);
    this.selectedFlagInner = $('.selected-flag > .iti-flag', container);
    container.append(this.telInput.replaceWith(container));

    if (this.preferredCountries.length && !this.isMobile) {
      this._appendListItems(this.preferredCountries, "preferred");
      $('<li class="divider">').appendTo(this.countryList);
    }
    this._appendListItems(this.countries, "");

    if (!this.isMobile) {
      // now we can grab the dropdown height, and hide it properly
      this.dropdownHeight = this.countryList.outerHeight();
      this.countryList.removeClass("v-hide").addClass("hide");

      // this is useful in lots of places
      this.countryListItems = this.countryList.children();
    }
  },

  // add a country <li> to the countryList <ul> container
  // UPDATE: if isMobile, add an <option> to the countryList <select> container
  _appendListItems: function (countries, className) {
    var temp = this.isMobile ? $.html(                       // @format(false)
      '<option dial-code="{{dial}}" value="{{iso2}}">', [
        "{{name}} +{{dial}}"
      ]                                                      // @format(true)
    ) : $.html(                                              // @format(false)
      '<li ng-class="clsName" dial-code="{{dial}}" country-code="{{iso2}}">', [
        '<div class="flag">', [
          '<div class="iti-flag {{iso2}}">'
        ],
        '<span class="country-name">{{name}}</span>',
        '<span class="dial-code">{{dial}}</span>'
      ]                                                      // @format(true)
    );

    for (var item, i = countries.length; i > 0, (item = countries[--i]);) {
      temp.compile({ clsName: "country " + className,        // @format(false)
        dial: item.dialCode, iso2: item.iso2, name: item.name
      }, this.countryList);                                  // @format(true)
    }
  },

  // called when the user selects a list item from the dropdown
  _selectListItem: function (listItem) {
    var countryCodeAttr = (this.isMobile) ? 'value' : 'country-code';

    // update selected flag and active list item
    this._selectFlag(listItem.attr(countryCodeAttr), true);
    if (!this.isMobile) {
      this._closeDropdown();
    }

    this._updateDialCode(listItem.attr('dial-code'), true);

    // always fire the change event as even if nationalMode=true (and we 
    //  haven't updated the input val), the system as a whole has still
    //  changed - see country-sync example; think of it as making a selection
    //  from a select element.
    this.telInput.trigger("change");

    // focus the input
    this.telInput.focus();

    // fix for FF and IE11 (with nationalMode=false i.e. auto inserting dial
    //  code), who try to put the cursor at the beginning the first time
    if (this.isGoodBrowser) {
      var len = this.telInput.val().length;
      this.telInput[0].setSelectionRange(len, len);
    }
  },

  // select the given flag, update the placeholder and the active list item
  _selectFlag: function (countryCode, updateDefault) {
    // do this first as it will throw an error and stop if countryCode is invalid
    this.selectedCountryData = (countryCode) ? 
      this._getCountryData(countryCode, false, false) : {};
    // update the "defaultCountry" - we only need the iso2 from now on, so just store that
    if (updateDefault && this.selectedCountryData.iso2) {
      // can't just make this equal to selectedCountryData as would be a ref to that object
      this.options.defaultCountry = {
        iso2: this.selectedCountryData.iso2
      };
    }

    this.selectedFlagInner.attr('class', "iti-flag " + countryCode);
    // update the selected country's title attribute
    var title = (countryCode) ? this.selectedCountryData.name + ": +" + 
      this.selectedCountryData.dialCode : "Unknown";
    this.selectedFlagInner.parent().attr('title', title);

    // and the input's placeholder
    this._updatePlaceholder();

    if (this.isMobile) {
      this.countryList.val(countryCode);
    } else {
      // update the active list item
      this.countryListItems.removeClass("active");
      if (countryCode) {
        this.countryListItems.find(".iti-flag." + countryCode).first().
          closest(".country").addClass("active");
      }
    }
  },

  // remove highlighting from other list items and highlight the given item
  _highlightListItem: function (listItem) {
    this.countryListItems.removeClass("highlight");
    listItem.addClass("highlight");
  },

  // show the dropdown
  _showDropdown: function () {
    this._setDropdownPosition();

    // update highlighting and scroll to active list item
    var activeListItem = this.countryList.children(".active");
    if (activeListItem.length) {
      this._highlightListItem(activeListItem);
    }

    // show it
    this.countryList.removeClass("hide");
    if (activeListItem.length) {
      this._scrollTo(activeListItem);
    }

    // bind all the dropdown-related listeners: mouseover, click, click-off, keydown
    this._bindDropdownListeners();

    // update the arrow
    this.selectedFlagInner.children(".arrow").addClass("up");
  },

  // decide where to position dropdown (depends on position within viewport, and scroll)
  _setDropdownPosition: function () {
    var inputTop = this.telInput.offset().top,
      windowTop = $(window).scrollTop(),
    // dropdownFitsBelow = (dropdownBottom < windowBottom)
      dropdownFitsBelow = (inputTop + this.telInput.outerHeight() + 
        this.dropdownHeight < windowTop + $(window).height()),
      dropdownFitsAbove = (inputTop - this.dropdownHeight > windowTop);

    // dropdownHeight - 1 for border
    var cssTop = (!dropdownFitsBelow && dropdownFitsAbove) ? "-" + 
      (this.dropdownHeight - 1) + "px" : "";
    this.countryList.css("top", cssTop);
  },

  // close the dropdown and unbind any listeners
  _closeDropdown: function () {
    this.countryList.addClass("hide");

    // update the arrow
    this.selectedFlagInner.children(".arrow").removeClass("up");

    // unbind key events
    $(document).off(this.ns);
    // unbind click-off-to-close
    $("html").off(this.ns);
    // unbind hover and click listeners
    this.countryList.off(this.ns);
  },

  // check if an element is visible within it's container, else scroll until it is
  _scrollTo: function (element, middle) {
    var container = this.countryList,
      containerHeight = container.height(),
      containerTop = container.offset().top,
      containerBottom = containerTop + containerHeight,
      elementHeight = element.outerHeight(),
      elementTop = element.offset().top,
      elementBottom = elementTop + elementHeight,
      newScrollTop = elementTop - containerTop + container.scrollTop(),
      middleOffset = (containerHeight / 2) - (elementHeight / 2);

    if (elementTop < containerTop) {
      // scroll up
      if (middle) {
        newScrollTop -= middleOffset;
      }
      container.scrollTop(newScrollTop);
    } else if (elementBottom > containerBottom) {
      // scroll down
      if (middle) {
        newScrollTop += middleOffset;
      }
      var heightDifference = containerHeight - elementHeight;
      container.scrollTop(newScrollTop - heightDifference);
    }
  },

  // set the initial state of the input value and the selected flag
  _setInitialState: function () {
    var val = this.telInput.val();

    // if there is a number, and it's valid, we can go ahead and set the flag, else fall back to default
    if (this._getDialCode(val)) {
      this._updateFlagFromNumber(val, true);
    } else if (this.options.defaultCountry != "auto") {
      // check the defaultCountry option, else fall back to the first in the list
      if (this.options.defaultCountry) {
        this.options.defaultCountry = this._getCountryData(this.options.
          defaultCountry.toLowerCase(), false, false);
      } else {
        this.options.defaultCountry = (this.preferredCountries.length) ? 
          this.preferredCountries[0] : this.countries[0];
      }
      this._selectFlag(this.options.defaultCountry.iso2);

      // if empty, insert the default dial code (this function will check !nationalMode and !autoHideDialCode)
      if (!val) {
        this._updateDialCode(this.options.defaultCountry.dialCode, false);
      }
    }

    // format
    if (val) {
      // this wont be run after _updateDialCode as that's only called if no val
      this._updateVal(val);
    }
  },
}
)((END))
