/*global module:false*/
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    // Metadata.
    pkg: grunt.file.readJSON('package.json'),
    banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
      '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
      '<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
      '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
      ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */\n',
    // Task configuration.

    // Before generating any new files, remove any previously-created files.
    clean: {
      build: [
        'build',
        '.sass-cache'
      ]
    },

    jshint: {
      options: {
        curly: true,
        eqeqeq: true,
        immed: true,
        latedef: true,
        newcap: true,
        noarg: true,
        sub: true,
        undef: true,
        unused: true,
        boss: true,
        eqnull: true,
        globals: {
          jQuery: true,
          Modernizr: true,
          document: true
        }
      },
      gruntfile: {
        src: 'Gruntfile.js'
      },
      js: {
        src: ['OEBPS/js/script.js']
      }
    },

    concat: {
      options: {
        banner: '<%= banner %>',
        stripBanners: true,
        path_js: 'OEBPS/js',
        path_js_libs: '<%= concat.options.path_js %>/libs'
      },
      // Our scripts, unconcatenated
      script: {
        src: ['<%= concat.options.path_js %>/script.js'],
        dest: 'build/uncompressed/<%= concat.options.path_js %>/script.js'
      },
      modernizr: {
        src: ['<%= concat.options.path_js_libs %>/modernizr.min.js'],
        dest: 'build/uncompressed/<%= concat.options.path_js_libs %>/modernizr.min.js'
      },
      jquery: {
        src: ['<%= concat.options.path_js_libs %>/jquery-1.8.3.min.js'],
        dest: 'build/uncompressed/<%= concat.options.path_js_libs %>/jquery-1.8.3.min.js'
      },
      jquery_fitvids: {
        src: ['<%= concat.options.path_js_libs %>/jquery.fitvids.js'],
        dest: 'build/uncompressed/<%= concat.options.path_js_libs %>/jquery.fitvids.js'
      },
      jquery_easing: {
        src: ['<%= concat.options.path_js_libs %>/jquery.easing.1.3.min.js'],
        dest: 'build/uncompressed/<%= concat.options.path_js_libs %>/jquery.easing.1.3.min.js'
      },
      // Our scripts, concatenated
      compressed: {
        src: ['<%= concat.options.path_js %>/script.js', '<%= concat.options.path_js_libs %>/modernizr.min.js', '<%= concat.options.path_js_libs %>/jquery-1.8.3.min.js', '<%= concat.options.path_js_libs %>/jquery.fitvids.js', '<%= concat.options.path_js_libs %>/jquery.easing.1.3.min.js'],
        dest: 'build/compressed/<%= concat.options.path_js %>/<%= pkg.title || pkg.name %>.js'
      }
    },

    uglify: {
      options: {
        banner: '<%= banner %>',
        // mangle: false
        report: 'min'
      },
      // Our scripts, unconcatenated and uglified
      script: {
        src: ['<%= concat.script.dest %>'],
        dest: 'dist/uncompressed/<%= concat.options.path_js %>/script.min.js'
      },
      modernizr: {
        src: ['<%= concat.modernizr.dest %>'],
        dest: 'dist/uncompressed/<%= concat.options.path_js_libs %>/modernizr.min.js'
      },
      jquery: {
        src: ['<%= concat.jquery.dest %>'],
        dest: 'dist/uncompressed/<%= concat.options.path_js_libs %>/jquery-1.8.3.min.js'
      },

      jquery_fitvids: {
        src: ['<%= concat.modernizr.dest %>'],
        dest: 'dist/uncompressed/<%= concat.options.path_js_libs %>/jquery.fitvids.min.js'
      },
      jquery_easing: {
        src: ['<%= concat.modernizr.dest %>'],
        dest: 'dist/uncompressed/<%= concat.options.path_js_libs %>/jquery.easing.1.3.min.js'
      },
      // Our scripts, concatenated and uglified
      compressed: {
        src: '<%= concat.compressed.dest %>',
        dest: 'dist/compressed/<%= concat.options.path_js %>/<%= pkg.title || pkg.name %>.js.min.js'
      }
    },

    compass: {
      compile_uncompressed: {
        options: {
          sassDir: 'OEBPS/sass',
          cssDir: 'dist/uncompressed/OEBPS/css'
        }
      },
      compile_compressed: {
        options: {
          sassDir: 'OEBPS/sass',
          cssDir: 'dist/compressed/OEBPS/css'
        }
      }
    }
    //,

    //nodeunit: {
    //  files: ['test/**/*_test.js']
    //},

/*
    watch: {
      gruntfile: {
        files: '<%= jshint.gruntfile.src %>',
        tasks: ['jshint:gruntfile']
      },
      lib_test: {
        files: '<%= jshint.lib_test.src %>',
        tasks: ['jshint:lib_test', 'nodeunit']
      }
    }
*/

  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-compass');
  /* grunt.loadNpmTasks('grunt-contrib-nodeunit'); */
  grunt.loadNpmTasks('grunt-contrib-watch');

  // Default task.
  grunt.registerTask('default', ['clean', 'jshint', 'concat', 'uglify', 'compass', 'clean']);

};
