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

    clean: {
      // Before generating any new files, remove any previously-created files.
      before: [
        'build',
        'dist',
        '.sass-cache'
      ],
      // Now that we've finished, remove the build directories.
      after: [
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
        browser: true,
        globals: {
          enquire: true,
          jQuery: true,
          Modernizr: true,
          document: true,
          navigator: true
        }
      },
      gruntfile: {
        src: 'Gruntfile.js'
      },
      js: {
        src: ['OEBPS/js/script.js', 'OEBPS/js/queries.js']
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
      queries: {
        src: ['<%= concat.options.path_js %>/queries.js'],
        dest: 'build/uncompressed/<%= concat.options.path_js %>/queries.js'
      },
      enquire: {
        src: ['<%= concat.options.path_js_libs %>/enquire.min.js'],
        dest: 'build/uncompressed/<%= concat.options.path_js_libs %>/enquire.min.js'
      },
      media_match: {
        src: ['<%= concat.options.path_js_libs %>/media.match.min.js'],
        dest: 'build/uncompressed/<%= concat.options.path_js_libs %>/media.match.min.js'
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
        src: ['<%= concat.options.path_js_libs %>/jquery.fitvids.min.js'],
        dest: 'build/uncompressed/<%= concat.options.path_js_libs %>/jquery.fitvids.min.js'
      },
      jquery_easing: {
        src: ['<%= concat.options.path_js_libs %>/jquery.easing.1.3.min.js'],
        dest: 'build/uncompressed/<%= concat.options.path_js_libs %>/jquery.easing.1.3.min.js'
      },
      // Our scripts, concatenated
      compressed: {
        src: ['<%= concat.options.path_js %>/queries.js', '<%= concat.options.path_js %>/script.js', '<%= concat.options.path_js_libs %>/enquire.min.js', '<%= concat.options.path_js_libs %>/modernizr.min.js', '<%= concat.options.path_js_libs %>/jquery-1.8.3.min.js', '<%= concat.options.path_js_libs %>/jquery.fitvids.min.js', '<%= concat.options.path_js_libs %>/jquery.easing.1.3.min.js'],
        dest: 'build/compressed/<%= concat.options.path_js %>/<%= pkg.title || pkg.name %>.js'
      }
    },

    uglify: {
      options: {
        // mangle: false
        report: 'min'
      },
      // Our scripts, unconcatenated and uglified
      /*
      script: {
        src: ['<%= concat.script.dest %>'],
        dest: 'dist/uncompressed/<%= concat.options.path_js %>/script.min.js'
      },
      queries: {
        src: ['<%= concat.queries.dest %>'],
        dest: 'dist/uncompressed/<%= concat.options.path_js %>/queries.min.js'
      },
      */
      enquire: {
        src: ['<%= concat.enquire.dest %>'],
        dest: 'dist/uncompressed/<%= concat.options.path_js_libs %>/enquire.min.js'
      },
      media_match: {
        src: ['<%= concat.media_match.dest %>'],
        dest: 'dist/uncompressed/<%= concat.options.path_js_libs %>/media.match.min.js'
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
        src: ['<%= concat.jquery_fitvids.dest %>'],
        dest: 'dist/uncompressed/<%= concat.options.path_js_libs %>/jquery.fitvids.min.js'
      },
      jquery_easing: {
        src: ['<%= concat.jquery_easing.dest %>'],
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
          config: 'OEBPS/sass/config.rb',
          basePath: 'OEBPS/sass'
        }
      },
      compile_compressed: {
        options: {
          config: 'OEBPS/sass/config.rb',
          basePath: 'OEBPS/sass'
        }
      }
    },

    //nodeunit: {
    //  files: ['test/**/*_test.js']
    //},

    copy: {
      main: {
        options: {
          processContentExclude: ['OEBPS/images/cover_front.psd', 'OEBPS/readk.it/.gitignore', 'OEBPS/readk.it/index.library.html', 'OEBPS/readk.it/offline.manifest']
        },
        files: [
          {expand: true, src: ['mimetype'], dest: 'dist/uncompressed/'},
          {expand: true, src: ['META-INF/**'], dest: 'dist/uncompressed/'}, // includes files in path and its subdirs
          {expand: true, src: ['OEBPS/*'], dest: 'dist/uncompressed/', filter: 'isFile'}, // includes files in path
          {expand: true, src: ['OEBPS/css/**', 'OEBPS/fonts/**', 'OEBPS/images/**'], dest: 'dist/uncompressed/'}, // includes files in path and its subdirs
          {expand: true, flatten: true, src: ['<%= concat.script.dest %>'], dest: 'dist/uncompressed/OEBPS/js', filter: 'isFile'}, // includes files in path
          {expand: true, flatten: true, src: ['<%= concat.queries.dest %>'], dest: 'dist/uncompressed/OEBPS/js', filter: 'isFile'}, // includes files in path
          {expand: true, src: ['OEBPS/readk.it/*'], dest: 'dist/uncompressed/', filter: 'isFile'}, // includes files in path
          {expand: true, src: ['OEBPS/readk.it/css/**', 'OEBPS/readk.it/images/**'], dest: 'dist/uncompressed/'}, // includes files in path and its subdirs
          {expand: true, src: ['OEBPS/readk.it/fonts/fontello/css/**', 'OEBPS/readk.it/fonts/fontello/font/**', 'OEBPS/readk.it/fonts/Lora/**', 'OEBPS/readk.it/fonts/SourceSansPro/**'], dest: 'dist/uncompressed/'}, // includes files in path and its subdirs
          {expand: true, src: ['OEBPS/readk.it/js/*'], dest: 'dist/uncompressed/', filter: 'isFile'}, // includes files in path
          {expand: true, src: ['OEBPS/readk.it/js/app/**', 'OEBPS/readk.it/js/lib/**'], dest: 'dist/uncompressed/'}, // includes files in path and its subdirs
          {expand: true, src: ['mimetype'], dest: 'dist/compressed/'},
          {expand: true, src: ['META-INF/**'], dest: 'dist/compressed/'}, // includes files in path and its subdirs
          {expand: true, src: ['OEBPS/*'], dest: 'dist/compressed/', filter: 'isFile'}, // includes files in path
          {expand: true, src: ['OEBPS/css/**', 'OEBPS/fonts/**', 'OEBPS/images/**'], dest: 'dist/compressed/'}, // includes files in path and its subdirs
          {expand: true, src: ['OEBPS/readk.it/*'], dest: 'dist/compressed/', filter: 'isFile'}, // includes files in path
          {expand: true, src: ['OEBPS/readk.it/css/**', 'OEBPS/readk.it/images/**'], dest: 'dist/compressed/'}, // includes files in path and its subdirs
          {expand: true, src: ['OEBPS/readk.it/fonts/fontello/css/**', 'OEBPS/readk.it/fonts/fontello/font/**', 'OEBPS/readk.it/fonts/Lora/**', 'OEBPS/readk.it/fonts/SourceSansPro/**'], dest: 'dist/compressed/'}, // includes files in path and its subdirs
          {expand: true, src: ['OEBPS/readk.it/js/*'], dest: 'dist/compressed/', filter: 'isFile'}, // includes files in path
          {expand: true, src: ['OEBPS/readk.it/js/app/**', 'OEBPS/readk.it/js/lib/**'], dest: 'dist/compressed/'} // includes files in path and its subdirs
        ]
      }
    }

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
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-watch');

  // Default task.
  grunt.registerTask('default', ['clean:before', 'jshint', 'concat', 'uglify', 'compass', 'copy', 'clean:after']);

};
