((BEGIN))(
{
  _initKeyListeners: function () {
    var that = this;

    if (this.options.autoFormat) {
      // format number and update flag on keypress
      // use keypress event as we want to ignore all input except for a select few keys,
      // but we don't want to ignore the navigation keys like the arrows etc.
      // NOTE: no point in refactoring this to only bind these listeners on focus/blur because then you would need to have those 2 listeners running the whole time anyway...
      this.telInput.on("keypress" + this.ns, function (e) {
        // 32 is space, and after that it's all chars (not meta/nav keys)
        // this fix is needed for Firefox, which triggers keypress event for some meta/nav keys
        // Update: also ignore if this is a metaKey e.g. FF and Safari trigger keypress on the v of Ctrl+v
        // Update: also ignore if ctrlKey (FF on Windows/Ubuntu)
        // Update: also check that we have utils before we do any autoFormat stuff
        if (e.which >= keys.SPACE && !e.ctrlKey && !e.metaKey && utils.libphonenumber && !that.telInput.prop("readonly")) {
          e.preventDefault();
          // allowed keys are just numeric keys and plus
          // we must allow plus for the case where the user does select-all and then hits plus to start typing a new number. we could refine this logic to first check that the selection contains a plus, but that wont work in old browsers, and I think it's overkill anyway
          var isAllowedKey = ((e.which >= keys.ZERO && e.which <= keys.NINE) || e.which == keys.PLUS),
            input = that.telInput[0],
            noSelection = (that.isGoodBrowser && input.selectionStart == input.selectionEnd),
            max = that.telInput.attr('maxlength'),
            val = that.telInput.val(),
          // assumes that if max exists, it is >0
            isBelowMax = (max) ? (val.length < max) : true;
          // first: ensure we don't go over maxlength. we must do this here to prevent adding digits in the middle of the number
          // still reformat even if not an allowed key as they could by typing a formatting char, but ignore if there's a selection as doesn't make sense to replace selection with illegal char and then immediately remove it
          if (isBelowMax && (isAllowedKey || noSelection)) {
            var newChar = (isAllowedKey) ? String.fromCharCode(e.which) : null;
            that._handleInputKey(newChar, true, isAllowedKey);
            // if something has changed, trigger the input event (which was otherwise squashed by the preventDefault)
            if (val != that.telInput.val()) {
              that.telInput.trigger("input");
            }
          }
          if (!isAllowedKey) {
            that._handleInvalidKey();
          }
        }
      });
    }

    // handle cut/paste event (now supported in all major browsers)
    this.telInput.on("cut" + this.ns + " paste" + this.ns, function () {
      // hack because "paste" event is fired before input is updated
      setTimeout(function () {
        if (that.options.autoFormat && utils.libphonenumber) {
          var cursorAtEnd = (that.isGoodBrowser && that.telInput[0].selectionStart == that.telInput.val().length);
          that._handleInputKey(null, cursorAtEnd);
          that._ensurePlus();
        } else {
          // if no autoFormat, just update flag
          that._updateFlagFromNumber(that.telInput.val());
        }
      });
    });

    // handle keyup event
    // if autoFormat enabled: we use keyup to catch delete events (after the fact)
    // if no autoFormat, this is used to update the flag
    this.telInput.on("keyup" + this.ns, function (e) {
      // the "enter" key event from selecting a dropdown item is triggered here on the input, because the document.keydown handler that initially handles that event triggers a focus on the input, and so the keyup for that same key event gets triggered here. weird, but just make sure we don't bother doing any re-formatting in this case (we've already done preventDefault in the keydown handler, so it wont actually submit the form or anything).
      // ALSO: ignore keyup if readonly
      if (e.which == keys.ENTER || that.telInput.prop("readonly")) {
        // do nothing
      } else if (that.options.autoFormat && utils.libphonenumber) {
        // cursorAtEnd defaults to false for bad browsers else they would never get a reformat on delete
        var cursorAtEnd = (that.isGoodBrowser && that.telInput[0].selectionStart == that.telInput.val().length);

        if (!that.telInput.val()) {
          // if they just cleared the input, update the flag to the default
          that._updateFlagFromNumber("");
        } else if ((e.which == keys.DEL && !cursorAtEnd) || e.which == keys.BSPACE) {
          // if delete in the middle: reformat with no suffix (no need to reformat if delete at end)
          // if backspace: reformat with no suffix (need to reformat if at end to remove any lingering suffix - this is a feature)
          // important to remember never to add suffix on any delete key as can fuck up in ie8 so you can never delete a formatting char at the end
          that._handleInputKey();
        }
        that._ensurePlus();
      } else {
        // if no autoFormat, just update flag
        that._updateFlagFromNumber(that.telInput.val());
      }
    });
  },

  // highlight the next/prev item in the list (and ensure it is visible)
  _handleUpDownKey: function (key) {
    var current = this.countryList.children(".highlight").first();
    var next = (key == keys.UP) ? current.prev() : current.next();
    if (next.length) {
      // skip the divider
      if (next.hasClass("divider")) {
        next = (key == keys.UP) ? next.prev() : next.next();
      }
      this._highlightListItem(next);
      this._scrollTo(next);
    }
  },

  // select the currently highlighted item
  _handleEnterKey: function () {
    var currentCountry = this.countryList.children(".highlight").first();
    if (currentCountry.length) {
      this._selectListItem(currentCountry);
    }
  },

  // alert the user to an invalid key event
  _handleInvalidKey: function () {
    var that = this;

    this.telInput.trigger("invalidkey").addClass("iti-invalid-key");
    setTimeout(function () {
      that.telInput.removeClass("iti-invalid-key");
    }, 100);
  },

  // when autoFormat is enabled: handle various key events on the input:
  // 1) adding a new number character, which will replace any selection, reformat, and preserve the cursor position
  // 2) reformatting on backspace/delete
  // 3) cut/paste event
  _handleInputKey: function (newNumericChar, addSuffix, isAllowedKey) {
    var val = this.telInput.val(),
      cleanBefore = this._getClean(val),
      originalLeftChars,
    // raw DOM element
      input = this.telInput[0],
      digitsOnRight = 0;

    if (this.isGoodBrowser) {
      // cursor strategy: maintain the number of digits on the right. we use the right instead of the left so that A) we don't have to account for the new digit (or multiple digits if paste event), and B) we're always on the right side of formatting suffixes
      digitsOnRight = this._getDigitsOnRight(val, input.selectionEnd);

      // if handling a new number character: insert it in the right place
      if (newNumericChar) {
        // replace any selection they may have made with the new char
        val = val.substr(0, input.selectionStart) + newNumericChar + val.substring(input.selectionEnd, val.length);
      } else {
        // here we're not handling a new char, we're just doing a re-format (e.g. on delete/backspace/paste, after the fact), but we still need to maintain the cursor position. so make note of the char on the left, and then after the re-format, we'll count in the same number of digits from the right, and then keep going through any formatting chars until we hit the same left char that we had before.
        // UPDATE: now have to store 2 chars as extensions formatting contains 2 spaces so you need to be able to distinguish
        originalLeftChars = val.substr(input.selectionStart - 2, 2);
      }
    } else if (newNumericChar) {
      val += newNumericChar;
    }

    // update the number and flag
    this.setNumber(val, null, addSuffix, true, isAllowedKey);

    // update the cursor position
    if (this.isGoodBrowser) {
      var newCursor;
      val = this.telInput.val();

      // if it was at the end, keep it there
      if (!digitsOnRight) {
        newCursor = val.length;
      } else {
        // else count in the same number of digits from the right
        newCursor = this._getCursorFromDigitsOnRight(val, digitsOnRight);

        // but if delete/paste etc, keep going left until hit the same left char as before
        if (!newNumericChar) {
          newCursor = this._getCursorFromLeftChar(val, newCursor, originalLeftChars);
        }
      }
      // set the new cursor
      input.setSelectionRange(newCursor, newCursor);
    }
  },
}
)((END))
