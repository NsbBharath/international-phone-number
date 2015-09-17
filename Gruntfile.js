module.exports = function(grunt) {

  // load all tasks from package.json
  require('load-grunt-config')(grunt);
  require('time-grunt')(grunt);

  /**
   * TASKS
   */
  // build everything ready for a commit
  grunt.registerTask('build', ['responsive_images', 'exec:evenizer', 'retinafy', 'sprite', 'sass', 'js', 'jasmine']);
  // just javascript
  grunt.registerTask('js', ['js:dev', 'js:prod']);
  grunt.registerTask('js:dev', ['addendum', 'jshint']);
  grunt.registerTask('js:prod', ['uglify:prod', 'replace:one']);//, 'replace:two', 'replace:three', 'replace:four']);
  // build examples
  grunt.registerTask('examples', ['template']);
  // Travis CI
  grunt.registerTask('travis', ['bower', 'jasmine']);
  // bump version number in 3 files, rebuild js to update headers, then commit, tag and push
  grunt.registerTask('version', ['bump-only', 'js', 'bump-commit', 'shell:publish']);
  
  grunt.registerTask('addendum', 'Runs Addendum.js', function () {
    require('./grunt/addendum');
  });

  function file (path, file) {
    return grunt.file.read(path + (file || '') + '.js');
  }

  function files (path, files) {
    return files.map(file.bind(null, path));
  }

  function assemble () {
    return Array.prototype.concat.apply([], arguments).join('');
  }

  // compile libphonenumber
  grunt.registerTask('libphonenumber', 'Compiles libphonenumber', 
    function (type) {
      grunt.file.write('lib/libphonenumber.js',
        assemble(
          files('lib/goog/', ['base', 'string', 'stringbuffer', 'asserts',
            'object', 'array', 'descriptor', 'fielddescriptor', 'message',
            'serializer', 'lazydeserializer', 'pbliteserializer']),
          files('lib/phonenumbers/', ['phonenumber.pb', 'phonemetadata.pb', 
            'metadata', 'phonenumberutil', 'asyoutypeformatter']),
          file('lib/libphonenumber/libphonenumber')
        )
      );
    });

  // compile Zepto
  grunt.registerTask('zepto', 'Compiles Zepto library', function (type) {
    grunt.file.write('lib/zepto.js', assemble(
      files('lib/zepto/', ['zepto', 'event', 'data', 'zepto.cookie'])
    ));
  });

  grunt.registerTask('lib', ['libphonenumber', 'zepto']);
};
