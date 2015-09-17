module.exports = function(grunt) {
  return {
    main: {
      options: {
        sourcemap: "none",
        style: "compressed"
      },
      files: {
        'dist/css/intlTelInput.css': 'src/css/intlTelInput.scss'
      }
    },
    demo: {
      options: {
        sourcemap: "none"
      },
      files: {
        'dist/css/demo.css': 'src/css/demo.scss'
      }
    }
  };
};