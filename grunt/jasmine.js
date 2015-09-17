module.exports = function(grunt) {
  return {
    src: [
      'src/js/data.js',
      'dist/js/intlTelInput.min.js',
      'lib/libphonenumber/dist/utils.js'
    ],
    options: {
      vendor: [
        'lib/jquery/jquery.js',
        'lib/jasmine-jquery/jasmine-jquery.js'
      ],
      helpers: [
        'src/spec/helpers/**/*.js'
      ],
      specs: [
        'src/spec/tests/**/*.js'
      ],
      outfile: 'spec.html',
      keepRunner: true
    }
  };
};