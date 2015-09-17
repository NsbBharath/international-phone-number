module.exports = function(grunt) {
  return {
    build: "dist/js/intlTelInput.js",
    options: {
      browser: true,
      devel: true,
      eqnull: true,
      evil: true,          // <--- this is for 'eval(data)' in utils.js
      jquery: true,
      laxcomma: true,
      globalstrict: true,
      globals: {
      	angular: false,
      	isFunction: false,
      	isString: false,
      }
    }
  };
};
