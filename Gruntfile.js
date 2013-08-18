/*global module:false*/
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    // Metadata.
    pkg: grunt.file.readJSON('package.json'),
    epub_src: 'EPUB',
    readkit_app: 'readk.it/build/dist', // readk.it compiled
    // readkit_app: '/readk.it', // readk.it source
    readkit_src: 'readk.it', // readk.it source
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

    dom_munger: {
      // Set dynamically
    },

    jshint: {
      // Set dynamically
    },

    uglify: {
      // Set dynamically
    },

    compass: {
      // Set dynamically
    },

    //nodeunit: {
    //  files: ['test/**/*_test.js']
    //},

    copy: {
      // Set dynamically
    },

    readkit_datauris: {
      // Set dynamically
    },

    shell: {
      // We use grunt-shell rather than grunt-contrib-requirejs as
      // the latter can only cope with JSON config files.
      requirejs: {
        command: [
          'cd readk.it/build',
          'echo Building readkit...',
          'node r.js -o build.main.js',
          'echo readkit built'
        ].join('&&'),
        options: {
          stdout: true,
          stderr: true
        }
      }
      // Other tasks set dynamically
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

  // Register our static tasks.
  grunt.registerTask('cleanBefore', ['clean:before']);
  grunt.registerTask('cleanAfter', ['clean:after']);
  grunt.registerTask('mung', ['dom_munger:metaInf', 'dom_munger:opf', 'readkit_datauris']);

  // We have to create our grunt tasks dynamically, as we don't necessarily 
  // know the EPUBs we'll be processing ahead of time.
  // This page helped a lot: https://gist.github.com/brianfeister/4294776
  function generateDynamicTask(registerDynamicTasks){
    var manifest = grunt.file.readJSON('EPUB/manifest.json');
    for (var entry in manifest) {

      var path = manifest[entry].path;
      var identifier = manifest[entry].identifier;

      // Determine the location of the opf file
      grunt.config('dom_munger.' + identifier + '_metaInf', {
        options: {
          read: {selector: 'container rootfiles rootfile', attribute: 'full-path', writeto: 'metaInfRef', isPath:false},
          callback: function($){
            grunt.option(identifier + '_opf-path', $(this.read.selector).attr(this.read.attribute));
            grunt.option(identifier + '_oebps', $(this.read.selector).attr(this.read.attribute).replace(/\/.*$/, ''));
          }
        },
        src: '<%= epub_src %>/' + path + 'META-INF/container.xml'
      });

      // Read the manifest entries from the opf file
      grunt.config('dom_munger.' + identifier + '_opf', {
        options: {
          read: {selector: 'manifest item', attribute: 'href', writeto: 'manifestRefs', isPath:true}
        },
        src: '<%= epub_src %>/' + path + '<%= grunt.option(\'' + identifier + '_opf-path\') %>'
      });

      // Check our js
      grunt.config('jshint.' + identifier, {
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
          src: ['<%= epub_src %>/' + path + '<%= grunt.option(\'' + identifier + '_oebps\') %>/**/*.js']
        }
      });

/*
      // Compile our SASS
      grunt.config('compass.' + identifier, {
        options: {
          config: '<%= epub_src %>/' + path + '<%= grunt.option(\'' + identifier + '_oebps\') %>/sass/config.rb',
          basePath: '<%= epub_src %>/' + path + '<%= grunt.option(\'' + identifier + '_oebps\') %>/sass'
        }
      });
*/
      // Copy our EPUB files to the dist directory
      grunt.config('copy.' + identifier + '_epub', {
        options: {
          processContentExclude: ['<%= grunt.option(\'' + identifier + '_oebps\') %>/sass/**']
        },
        files: [
          {expand: true, src: ['<%= epub_src %>/' + path + 'mimetype'], dest: 'dist/'},
          {expand: true, src: ['<%= epub_src %>/' + path + 'META-INF/**'], dest: 'dist/'}, // includes files in path and its subdirs
          {expand: true, src: ['<%= epub_src %>/' + path + '<%= grunt.option(\'' + identifier + '_oebps\') %>/**', '!**/sass/**'], dest: 'dist/', filter: 'isFile'} // includes files and subdirs in path
        ]
      });

      // Copy Readk.it files to the dist directory
      grunt.config('copy.' + identifier + '_readkit', {
        options: {
          processContentExclude: ['<%= readkit_src %>/.gitignore']
        },
        files: [
          // <%= readkit_app %> allows us to easily change between source readk.it and built readk.it
          {expand: true, cwd: '<%= readkit_app %>/', src: ['**'],
            // includes files in path
            dest: 'dist/<%= epub_src %>/' + path + '<%= grunt.option(\'' + identifier + '_oebps\') %>/readk.it', filter: 'isFile'},
          {expand: true, cwd: '<%= readkit_src %>', src: ['*', '!index.library.html'],
            // includes files in path
            dest: 'dist/<%= epub_src %>/' + path + '<%= grunt.option(\'' + identifier + '_oebps\') %>/readk.it', filter: 'isFile'},
          {expand: true, cwd: '<%= readkit_src %>/', src: ['css/**', 'images/**', 'js/client.config.js', 'js/lib/require.js', 'js/lib/Detectizr.js', 'js/lib/Modernizr.js', 'js/lib/text.js'],
            // includes files in path and its subdirs
            dest: 'dist/<%= epub_src %>/' + path + '<%= grunt.option(\'' + identifier + '_oebps\') %>/readk.it'},
          {expand: true, cwd: '<%= readkit_src %>/', src: [
            'fonts/fontello/css/**',
            'fonts/fontello/font/**',
            'fonts/Lora/**',
            'fonts/SourceSansPro/**'],
            // includes files in path and its subdirs
            dest: 'dist/<%= epub_src %>/' + path + '<%= grunt.option(\'' + identifier + '_oebps\') %>/readk.it'},
/*
          {expand: true, cwd: '<%= readkit_src %>', src: ['js/*'],
            // includes files in path
            dest: 'dist/<%= epub_src %>/' + path + '<%= grunt.option(\'' + identifier + '_oebps\') %>/readk.it', filter: 'isFile'},
          {expand: true, cwd: '<%= readkit_src %>/', src: [
            'js/app/**',
            'js/lib/**'],
            // includes files in path and its subdirs
            dest: 'dist/<%= epub_src %>/' + path + '<%= grunt.option(\'' + identifier + '_oebps\') %>/readk.it'}
*/
        ]
      });

      // Uglify our js
      grunt.config('uglify.' + identifier, {
        options: {
          // mangle: false
          report: 'min',
          path_js: '<%= epub_src %>/' + path + '<%= grunt.option(\'' + identifier + '_oebps\') %>/**/*.js',
        },
        all: {
          src: ['<%= uglify.' + identifier + '.options.path_js %>'],
          dest: 'dist/<%= uglify.' + identifier + '.options.path_js %>'
        }
      });

      // Assemble data URIs
/*
      grunt.config('readkit_datauris.' + identifier, {
        'dist/standalone/<%= grunt.option(\'oebps\') %>/readk.it/js/app/content.js': ['META-INF/container.xml', '<%= epub_src %>/<%= grunt.option(\'oebps\') %>/content.opf', '<%= dom_munger.data.manifestRefs %>']
      });
*/

      grunt.config('shell.' + identifier + '_zip', {
        command: [
          'export READKIT_GRUNTDIR=`pwd`',
          'cd dist/<%= epub_src %>/' + path,
          'echo Zipping ' + identifier + '.epub...',
          'zip -X0 ' + identifier + '.epub mimetype -x ._',
          'zip -rDX9 ' + identifier + '.epub META-INF -x *.DS_Store -x ._*',
          'zip -rDX9 ' + identifier + '.epub <%= grunt.option(\'' + identifier + '_oebps\') %> -x *.DS_Store -x ._*',
          'mv ' + identifier + '.epub ${READKIT_GRUNTDIR}/dist',
          'echo Zipped ' + identifier + '.epub to ${READKIT_GRUNTDIR}/dist'
        ].join('&&'),
        options: {
          stdout: true,
          stderr: true
        }
      });

    }

    registerDynamicTasks();
  }

  generateDynamicTask(function(){
    // Tasks the happen before the EPUBs have been processed
    var allTasks = ['clean:before', 'shell:requirejs'];

    var manifest = grunt.file.readJSON('EPUB/manifest.json');
    for (var entry in manifest) {
      grunt.log.writeln(manifest[entry].path);
      var tasks = ['dom_munger:'  + manifest[entry].identifier + '_metaInf', 'dom_munger:' + manifest[entry].identifier + '_opf', 'jshint:' + manifest[entry].identifier, 'copy:' + manifest[entry].identifier + '_epub', 'copy:' + manifest[entry].identifier + '_readkit', 'uglify:' + manifest[entry].identifier, 'shell:' + manifest[entry].identifier + '_zip'];
      allTasks = allTasks.concat(tasks);
      grunt.registerTask(manifest[entry].identifier, tasks);
    }

    // Tasks the happen after the EPUBs have been processed
    allTasks = allTasks.concat(['clean:after']);

    // Register our long list of tasks as default
    grunt.registerTask( 'default', allTasks);


  });


/*
  ,
  grunt.registerTask('stuff2', function() {
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

        files += "'" + filename + "': '" + compiled + "', ";
    });

    files += '};';
    grunt.file.write('dist/templates/compiled.js', files);

  });
*/
};
