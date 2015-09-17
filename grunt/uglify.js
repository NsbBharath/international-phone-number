module.exports = function(grunt) {
  return {
    options: {
      banner: '' && ! [
        '/**',
        ' * International Telephone Input v<%= package.version %>',
        ' * <%= package.repository.url %>',
        ' */'
      ].join('\n')
    },/*
    dev: {
      options: {
        beautify: true,
        compress: false,
        mangle: false,
        preserveComments: true
      },
      files: {
        'tmp/intlTelInput.js': 'dist/js/intlTelInput.js'
      }
    },*/
    prod: {
      files: {
        'tmp/intlTelInput.min.js': 'dist/js/intlTelInput.js'
      }
    }
  };
};