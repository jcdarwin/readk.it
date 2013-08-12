/*global module:false*/
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    // Metadata.
    pkg: grunt.file.readJSON('package.json'),
    // readkit_src: 'OEBPS/readk.it', // readk.it source
    readkit_src: 'OEBPS/readk.it/build/dist', // readk.it compiled
    readkit_dest: 'OEBPS/readk.it',
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
          screenfull: true,
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


    uglify: {
      options: {
        // mangle: false
        report: 'min',
        path_js: 'OEBPS/js',
        path_js_libs: '<%= uglify.options.path_js %>/libs'
      },
      // Our scripts, unconcatenated and uglified
      /*
      script: {
        src: ['<%= uglify.options.path_js %>/script.js'],
        dest: 'dist/uncompressed/<%= uglify.options.path_js %>/script.min.js'
      },
      queries: {
        src: ['<%= uglify.options.path_js %>/queries.js'],
        dest: 'dist/uncompressed/<%= uglify.options.path_js %>/queries.min.js'
      },
      */
      detectizr: {
        src: ['<%= uglify.options.path_js_libs %>/detectizr.min.js'],
        dest: 'dist/uncompressed/<%= uglify.options.path_js_libs %>/detectizr.min.js'
      },
      enquire: {
        src: ['<%= uglify.options.path_js_libs %>/enquire.min.js'],
        dest: 'dist/uncompressed/<%= uglify.options.path_js_libs %>/enquire.min.js'
      },
      media_match: {
        src: ['<%= uglify.options.path_js_libs %>/media.match.min.js'],
        dest: 'dist/uncompressed/<%= uglify.options.path_js_libs %>/media.match.min.js'
      },
      modernizr: {
        src: ['<%= uglify.options.path_js_libs %>/modernizr.min.js'],
        dest: 'dist/uncompressed/<%= uglify.options.path_js_libs %>/modernizr.min.js'
      },
      jquery_fitvids: {
        src: ['<%= uglify.options.path_js_libs %>/jquery.fitvids.min.js'],
        dest: 'dist/uncompressed/<%= uglify.options.path_js_libs %>/jquery.fitvids.min.js'
      },
      jquery_easing: {
        src: ['<%= uglify.options.path_js_libs %>/jquery.easing.1.3.min.js'],
        dest: 'dist/uncompressed/<%= uglify.options.path_js_libs %>/jquery.easing.1.3.min.js'
      },
      screenfull: {
        src: ['<%= uglify.options.path_js_libs %>/screenfull.min.js'],
        dest: 'dist/uncompressed/<%= uglify.options.path_js_libs %>/screenfull.min.js'
      }
    },

    compass: {
      compile_uncompressed: {
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
      epub: {
        options: {
          processContentExclude: ['OEBPS/images/cover_front.psd']
        },
        files: [
          {expand: true, src: ['mimetype'], dest: 'dist/uncompressed/'},
          {expand: true, src: ['META-INF/**'], dest: 'dist/uncompressed/'}, // includes files in path and its subdirs
          {expand: true, src: ['OEBPS/*'], dest: 'dist/uncompressed/', filter: 'isFile'}, // includes files in path
          {expand: true, src: ['OEBPS/js/*'], dest: 'dist/uncompressed/', filter: 'isFile'}, // includes files in path
          {expand: true, src: ['OEBPS/css/**', 'OEBPS/fonts/**', 'OEBPS/images/**'], dest: 'dist/uncompressed/'} // includes files in path and its subdirs
          /*
          {expand: true, flatten: true, src: ['<%= uglify.script.dest %>'], dest: 'dist/uncompressed/OEBPS/js', filter: 'isFile'}, // includes files in path
          {expand: true, flatten: true, src: ['<%= uglify.queries.dest %>'], dest: 'dist/uncompressed/OEBPS/js', filter: 'isFile'} // includes files in path
          */
        ]
      },
      // Copy across the readk.it files.
      // <%= readkit_src %> allows us to easily change between source readk.it and built readk.it
      readkit: {
        options: {
          processContentExclude: ['OEBPS/readk.it/.gitignore', 'OEBPS/readk.it/index.library.html', 'OEBPS/readk.it/offline.manifest']
        },
        files: [
          {expand: true, cwd: 'OEBPS/readk.it/', src: ['*'], dest: 'dist/uncompressed/<%= readkit_dest %>/', filter: 'isFile'}, // includes files in path
          {expand: true, cwd: 'OEBPS/readk.it/', src: ['css/**', 'images/**'], dest: 'dist/uncompressed/<%= readkit_dest %>/'}, // includes files in path and its subdirs
          {expand: true, cwd: 'OEBPS/readk.it/', src: ['fonts/fontello/css/**', 'fonts/fontello/font/**', 'fonts/Lora/**', 'fonts/SourceSansPro/**'], dest: 'dist/uncompressed/<%= readkit_dest %>/'}, // includes files in path and its subdirs
          {expand: true, cwd: 'OEBPS/readk.it/', src: ['js/*'], dest: 'dist/uncompressed/<%= readkit_dest %>/', filter: 'isFile'}, // includes files in path
          {expand: true, cwd: '<%= readkit_src %>', src: ['js/*'], dest: 'dist/uncompressed/<%= readkit_dest %>/', filter: 'isFile'}, // includes files in path
          {expand: true, cwd: 'OEBPS/readk.it/', src: ['js/app/**', 'js/lib/**'], dest: 'dist/uncompressed/<%= readkit_dest %>/'} // includes files in path and its subdirs
        ]
      }
    },

    dom_munger: {
      options: {
        read: {selector: 'manifest item', attribute: 'href', writeto: 'manifestRefs', isPath:true},
      },
      src: 'OEBPS/content.opf'
    },

    readkit_datauris: {
      'dist/standalone/OEBPS/readk.it/js/app/content.js': ['META-INF/container.xml', 'OEBPS/content.opf', '<%= dom_munger.data.manifestRefs %>']
    },

    shell: {
      zip: {
        command: [
          'cd dist/uncompressed',
          'echo Zipping <%= pkg.title || pkg.name %>.epub...',
          'zip -X0 <%= pkg.title || pkg.name %>.epub mimetype -x ._',
          'zip -rDX9 <%= pkg.title || pkg.name %>.epub META-INF -x *.DS_Store -x ._*',
          'zip -rDX9 <%= pkg.title || pkg.name %>.epub OEBPS -x *.DS_Store -x ._*',
          'echo Zipped <%= pkg.title || pkg.name %>.epub'
        ].join('&&'),
        options: {
          stdout: true,
          stderr: true
        }
      }
    },

  connect: {
    server: {
      options: {
        port: 8000,
        base: '.',
        keepalive: true
      }
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
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-compass');
  /* grunt.loadNpmTasks('grunt-contrib-nodeunit'); */
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-shell');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-dom-munger');
  grunt.loadNpmTasks('grunt-readkit-datauris');

  // Default task.
  grunt.registerTask('default', ['clean:before', 'jshint', 'uglify', 'compass', 'copy', 'shell', 'clean:after']);
  grunt.registerTask('mung', ['dom_munger', 'readkit_datauris']);

  grunt.registerTask('stuff', function() {
    //var tmpl = grunt.file.read('dist/templates/compiled.js');
    //console.log(tmpl);

    var lf = grunt.util.linefeed;

    var options = this.options({
      processContent: function (src) { return src; },
      separator: lf + lf
    });

    var files = 'var files = {';

    grunt.file.expand(['<%= dom_munger.data.manifestRefs %>']).forEach(function(f) {
    //grunt.file.expand(['OEBPS/*html']).forEach(function(f) {
        var filepath = f;
        var src = options.processContent(grunt.file.read(filepath));
        var compiled, filename;

        compiled = src;
        if (options.prettify) {
          compiled = compiled.replace(new RegExp('\n', 'g'), '');
        }
        filename = filepath;

        console.log(compiled);
        console.log(filename);

        files += "'" + filename + "': '" + compiled + "', ";
    });

    files += '};';
    grunt.file.write('dist/templates/compiled.js', files);

  });
};
