/**
 * @author denim2x <http://denim2x.github.io>
 * @license MIT License
 * 
 * Addendum.js
 * Replaces '(+"<file>")'' and '[+"<file1>;<file2>;..."]' with the contents 
 *  of each referenced file, located between the '((BEGIN))(' and ')((END))'
 *  tags.
 */
module.exports = function (grunt) {

  function replace (m, file) {
    var src = grunt.file.read('src/js/' + file + '.js');
    var a = src.indexOf('((BEGIN))(\n'), b = src.lastIndexOf('\n)((END))');
    return src.slice(a + 11, b);
  }

  var dest = grunt.file.read('src/js/core.js');
  var src = dest.
    replace(/\(\+\s*"(.+)"\s*\)/g, replace).
    replace(/\[\+\s*"(.+)"\s*\]/g, function (m, files) {
      return files.split(';').map(replace.bind(null, m)).join(', ');
    });

  grunt.file.write('dist/js/intlTelInput.js', src);

  return {};
};
