/*!
+---------------------------------------------------------------------+
|                                                                     |
|                ____                _ _      _ _                     |
|               |  _ \ ___  __ _  __| | | __ (_) |_                   |
|               | |_) / _ \/ _` |/ _` | |/ / | | __|                  |
|               |  _ <  __/ (_| | (_| |   < _| | |_                   |
|               |_| \_\___|\__,_|\__,_|_|\_(_)_|\__|                  |
|                                                                     |                                     
| URL:                                                                |
| VERSION: 0.0.1                                                      |
| GITHUB:                                                             |
| AUTHOR: Jason Darwin (@nzmebooks)                                   |
| LICENSE: MIT                                                        |
| http://opensource.org/licenses/MIT                                  |
|                                                                     |
| To create a production readkit (optimised js):                      |
| > grunt                                                             |
|                                                                     |
| To create a development readkit (source js):                        |
| > grunt dev                                                         |
|                                                                     |
+---------------------------------------------------------------------+
*/

/*global module:false*/
module.exports = function(grunt) {
  var globals = {
    identifier: [],
    identifier_client_scripts_to_build: [],
    identifier_mixin_client_config: [],
    path: [],
    oebps_path_src: []
  };

  function processManifestDev(err, stdout, stderr, cb) {
    generateDynamicTasks(runDynamicTasks, 'dev', cb);
  }

  function processManifestProd(err, stdout, stderr, cb) {
    var config = grunt.file.read('readk.it/js/app/config.js');
    if (/lite\:\s*true/.test(config)) {
      // prod_lite is a version of Readk.it that is smaller, as it foregoes:
      // * Drag and drop (not needed for mobile)
      // * Modernizr / Detectizr
      generateDynamicTasks(runDynamicTasks, 'prod_lite', cb);
    } else {
      generateDynamicTasks(runDynamicTasks, 'prod', cb);
    }

  }

  // Project configuration.
  grunt.initConfig({
    // Metadata.
    pkg: grunt.file.readJSON('package.json'),
    epub_src: 'readkit.epub',
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
        'dist',
        'build',
        '.sass-cache'
      ],
      build_readkit: [
        'build/readkit'
      ],
      build_readkit_js: [
        'build/readkit.js'
      ],
      // Now that we've finished, remove the build directories.
      after: [
        'build',
        '.sass-cache'
      ]
    },

    readkit_dom_munger: {
      index_reader: {
        // Update our index.html to point to the built readkit,
        // remove unnecessary data attributes, and add tags for bake.
        options: {
          callback: function($) {
            $('.readkit-library').removeAttr('data-library');
            $('#readkit-entry').removeAttr('data-main');
            $('head link').remove();
            $('head meta[name="apple-mobile-web-app-capable"]').before('<style><!--(bake css/screen.css)--></style>');
            $('head meta[name="apple-mobile-web-app-capable"]').remove();
            $('head meta[name="apple-mobile-web-app-status-bar-style"]').remove();
            $('script#readkit-client').removeAttr('src').append('<!--(bake js/client.config.js)-->');
            $('script#readkit-entry').removeAttr('src').append('<!--(bake ../readkit.js)-->');
          }
        },
        src: ['build/readkit/index.html']
      },
      index_library: {
        // Update our index.html to point to the built readkit,
        // and remove unnecessary data attributes.
        options: {
          update: {selector: '#readkit-entry', attribute: 'src', value: 'js/readkit.js'},
          callback: function($) {
            $('#readkit-client').attr('src', 'library/js/library.client.config.js');
            $('#readkit-entry').removeAttr('data-main');
          }
        },
        src: ['dist/readkit.library/index.html']
      },
      library: {
        // Remove unnecessary data attributes.
        options: {
          update: {selector: '#library-entry', attribute: 'src', value: 'js/main.compiled.js'},
          callback: function($) {
            $('#library-entry').removeAttr('data-main');
          }
        },
        src: ['dist/readkit.library/library/library.html']
      }
      // Others set dynamically
    },

    bake: {
      reader: {
        options: {
        },
        files: {
          // Remember, bake specifies dest: src
          'dist/readkit.reader/readkit.reader.html': 'build/readkit/index.html'
        }
      }
    },

    jshint: {
      // Check our js
      readkit: {
        options: {
          '-W061': true, // W061: eval can be harmful.
          '-W083': true, // W083: Don't make functions within a loop.
          '-W098': true, // W098: 'e' is defined but never used.
          '-W117': true, // W117: 'client' is not defined.
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
          },
          ignores: ['<%= readkit_src %>/js/lib/*.js', '<%= readkit_src %>/js/lib/**/*.js', '<%= readkit_src %>/js/test/qunit/*.js', '<%= readkit_src %>/library/js/lib/*.js', '<%= readkit_src %>/library/js/lib/**/*.js']
        },
        files: {
          src: ['Gruntfile.js', '<%= readkit_src %>/**/*.js']
        }
      }
    },

    compass: {
      readkit: {
        options: {
          config: '<%= readkit_src %>/sass/config.rb',
          basePath: '<%= readkit_src %>/sass'
        }
      },
      library: {
        options: {
          config: '<%= readkit_src %>/library/sass/config.rb',
          basePath: '<%= readkit_src %>/library/sass'
        }
      }
      // Set dynamically
    },

    cssmin: {
      readkit: {
        expand: true,
        cwd: '<%= readkit_src %>/css/',
        src: ['*.css', '!*.min.css'],
        dest: 'build/readkit/css/',
        ext: '.css'
      },
      library: {
        expand: true,
        cwd: '<%= readkit_src %>/library/css/',
        src: ['*.css', '!*.min.css'],
        dest: 'build/readkit/library/css/',
        ext: '.css'
      }
    },

    concat: {
      options: {
        separator: '',
      },
      readkit: {
          src: ['build/readkit/css/*.css', 'build/readkit/fonts/fontello/css/*.css'],
          dest: 'build/readkit/css/screen.css',
      },
      library: {
          src: ['build/readkit/library/css/*.css', 'build/readkit/library/fonts/fontello/css/*.css'],
          dest: 'build/readkit/library/css/screen.css',
      }
    },

    imageEmbed: {
      build: {
        src: [ "build/readkit/css/screen.css"],
        dest: "build/readkit/css/screen.css",
        options: {
          maxImageSize: 0,
          deleteAfterEncoding : false
        }
      }
    },

    //nodeunit: {
    //  files: ['test/**/*_test.js']
    //},

    copy: {
      content_js_to_build: {
        // Copy the default (empty) content.js to the build directory
        options: {
        },
        files: [
          {expand: true, cwd: '<%= readkit_src %>', src: ['index.html'],
            dest: 'build/readkit'},
          {expand: true, cwd: '<%= readkit_src %>/js/app', src: ['content.js'],
            dest: 'build/readkit/js/app'}
        ]
      },
      readkit_prod_to_build: {
        // Copy prod Readk.it to the build directory
        options: {
        },
        files: [
          {expand: true, cwd: '<%= readkit_src %>/', src: ['**'],
            dest: 'build/readkit/'}
        ]
      },
      readkit_prodlite_to_build: {
        // For our prod lite version, copy Readk.it to the build directory, replacing libs with stubs
        options: {
        },
        files: [
          {expand: true, cwd: '<%= readkit_src %>/', src: ['**'],
            dest: 'build/readkit/'},
          {expand: true, cwd: '<%= readkit_src %>/js/stubs', src: ['**'],
            dest: 'build/readkit/js'}
        ]
      },
      reader_dev_to_dist: {
        options: {
          processContentExclude: ['<%= readkit_src %>/.gitignore']
        },
        files: [
          {expand: true, cwd: '<%= readkit_src %>', src: ['*'],
            dest: 'dist/readkit.reader', filter: 'isFile'},
          {expand: true, cwd: '<%= readkit_src %>/js', src: ['**'],
            dest: 'dist/readkit.reader/js'},
          {expand: true, cwd: 'readk.it/css', src: ['**'],
            dest: 'dist/readkit.reader/css', filter: 'isFile'},
          {expand: true, cwd: '<%= readkit_src %>/', src: ['images/**'],
            dest: 'dist/readkit.reader'},
          {expand: true, cwd: '<%= readkit_src %>/', src: [
            'fonts/fontello/css/**',
            'fonts/fontello/font/**',
            'fonts/Lora/**',
            'fonts/SourceSansPro/**'],
            dest: 'dist/readkit.reader'}
        ]
      },
      library_prod_to_build: {
        // Copy Readk.it to the build directory for the library
        options: {
        },
        files: [
          {expand: true, cwd: 'build', src: ['readkit.js'],
            dest: 'dist/readkit.library/js'},
          {expand: true, cwd: '<%= readkit_src %>/library/js', src: ['**'],
            dest: 'build/readkit/library/js'}
        ]
      },
      library_prod_to_dist: {
        options: {
        },
        files: [
          {expand: true, cwd: 'build/readkit/css', src: ['**'],
            dest: 'dist/readkit.library/css', filter: 'isFile'},
          {expand: true, cwd: 'build/readkit', src: ['js/lib/zip/inflate.js', 'js/app/config.js'],
            dest: 'dist/readkit.library'},
          {expand: true, cwd: 'build/readkit/library/css', src: ['**', '!screen.css'],
            dest: 'dist/readkit.library/library/css', filter: 'isFile'}
        ]
      },
      library_dev_to_dist: {
        options: {
        },
        files: [
          {expand: true, cwd: '<%= readkit_src %>/js', src: ['**'],
            dest: 'dist/readkit.library/js'},
          {expand: true, cwd: 'readk.it/css', src: ['**'],
            dest: 'dist/readkit.library/css', filter: 'isFile'},
          {expand: true, cwd: 'readk.it/library/css', src: ['**'],
            dest: 'dist/readkit.library/library/css', filter: 'isFile'},
          {expand: true, cwd: '<%= readkit_src %>/library/js', src: ['**'],
            dest: 'dist/readkit.library/library/js'}
        ]
      },
      library_assets_to_dist: {
        options: {
          processContentExclude: ['<%= readkit_src %>/.gitignore']
        },
        files: [
          {expand: true, cwd: '<%= readkit_src %>/js', src: ['test/**'],
            dest: 'dist/readkit.library/js'},
          {expand: true, cwd: '<%= readkit_src %>', src: ['*', '!**/*.appcache'],
            dest: 'dist/readkit.library', filter: 'isFile'},
          {expand: true, cwd: '<%= readkit_src %>/', src: ['images/**'],
            dest: 'dist/readkit.library'},
          {expand: true, cwd: '<%= readkit_src %>/', src: [
            'fonts/fontello/css/**',
            'fonts/fontello/font/**',
            'fonts/Lora/**',
            'fonts/SourceSansPro/**'],
            dest: 'dist/readkit.library'},
          {expand: true, cwd: '<%= readkit_src %>/library', src: ['fonts/**', 'images/**', 'library.html'],
            dest: 'dist/readkit.library/library'},
          {expand: true, cwd: '<%= readkit_src %>', src: ['readkit.appcache'],
            dest: 'dist/readkit.library/library/solo'},
        ]
      },
      library_manifest_to_dist: {
        options: {
        },
        files: [
          {expand: true, cwd: '<%= epub_src %>', src: ['manifest.json'],
            dest: 'dist/readkit.library/library', filter: 'isFile'}
        ]
      },
      library_epubs_to_dist: {
        options: {
        },
        files: [
          {expand: true, cwd: '<%= epub_src %>', src: ['**', '!manifest.json', '!manifest.maker.py'],
            dest: 'dist/readkit.library/library'}
        ]
      },
      // Copy the client config across if there is one
      library_client_config_to_dist: {
        options: {
        },
        files: [
          {expand: true, cwd: '<%= readkit_src %>/library/js', src: ['library.client.config.js', 'script.js'],
            dest: 'dist/readkit.library/library/js', filter: 'isFile'}
        ]
      }
      // Others set dynamically
    },

    readkit_datauris: {
      // Set dynamically
    },

    shell: {
      make_manifest: {
        command: [
          'cd <%= epub_src %>',
          'python manifest.maker.py > manifest.json',
          'echo Created manifest: manifest.json'
        ].join('&&'),
        options: {
          stdout: true,
          stderr: true
        }
      },
      make_manifest_prod: {
        // Create our manifest describing the EPUB files
        command: [
          'cd <%= epub_src %>',
          'python manifest.maker.py > manifest.json',
          'echo Created manifest: manifest.json'
        ].join('&&'),
        options: {
          stdout: true,
          stderr: true,
          callback: processManifestProd
        }
      },
      make_manifest_dev: {
        // Create our manifest describing the EPUB files
        command: [
          'cd <%= epub_src %>',
          'python manifest.maker.py > manifest.json',
          'echo Created manifest: manifest.json'
        ].join('&&'),
        options: {
          stdout: true,
          stderr: true,
          callback: processManifestDev
        }
      },
      dir: {
        command: [
          'dir',
        ].join('&&'),
        options: {
          stdout: true,
          stderr: true,
          failOnError: true
        }
      },
      // Others set dynamically
    },

    requirejs: {
      compile_readkit: {
        // Compile down our Readkit js to a single file.
        options: {
          baseUrl: 'build/readkit/js/lib',
          waitSeconds: 0,
          paths: {
              requireLib: 'require',
              app: '../app'
          },
          name: '../readkit',
          include: [
              'requireLib',
              'jquery',
              'text',
              'app/controller',
              'app/config',
              'app/content',
              'add-to-homescreen/src/add2home',
          ],
          out: 'build/readkit.js',
          map: {
            '*': {
              'css': 'require-css/css'
            }
          },
          shim: {
              // Shim in any files that aren't AMD modules
              'jquery.storage': ['jquery'],
              'jquery.ba-urlinternal': ['jquery'],
              'jquery.ba-resize': ['jquery'],
              'jquery.hotkeys': ['jquery'],
              // Make certain non-AMD modules available globally
              'modernizr': {deps: ['jquery'], exports: 'Modernizr'},
              'detectizr': {deps: ['jquery', 'modernizr'], exports: 'Detectizr'},
              'iscroll': {exports: 'iScroll'},
              'zip/zip': {exports: 'zip'},
              'zip/inflate': {exports: 'inflate'},
          }
        }
      },
      compile_library: {
        // Compile down our library js to a single file.
        options: {
          baseUrl: 'build/readkit/library/js/lib',
          paths: {
              requireLib: 'require',
              app: '../app',
              underscore: 'underscore-min.amd',
              client_js: '../'
          },
          name: '../main',
          include: [
              'requireLib',
              'jquery',
              'app/controller',
              'app/config',
              'add-to-homescreen/src/add2home',
              'client_js/script'
          ],
          out: 'dist/readkit.library/library/js/main.compiled.js',
          shim: {
              // Shim in our jQuery plugins etc, as they aren't AMD modules
              'sly': ['jquery']
          }

        }
      }
    },

  });

  // Load our grunt plugins.
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-compass');
  /* grunt.loadNpmTasks('grunt-contrib-nodeunit'); */
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-shell');
  grunt.loadNpmTasks('grunt-readkit-dom-munger');
  grunt.loadNpmTasks('grunt-readkit-datauris');
  grunt.loadNpmTasks('grunt-contrib-requirejs');
  grunt.loadNpmTasks("grunt-image-embed");
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-bake');

  // We have to create many of our grunt tasks dynamically, as we don't
  // which or how many EPUBs we'll be processing ahead of time.
  // This page helped a lot: https://gist.github.com/brianfeister/4294776
  function generateDynamicTasks(callback, target, cb){
    var manifest = grunt.file.readJSON('readkit.epub/manifest.json');

    // Each entry in the manifest describes a particular EPUB file
    for (var entry in manifest) {

      // Certain characters found in the EPUB id cause problems for grunt
      var identifier = manifest[entry].identifier.replace(/\:/g, '_');
      var name = manifest[entry].name.replace(/[^a-z\d]/gi, '_').toLowerCase();
      var path = manifest[entry].path;
      var cover = manifest[entry].cover;

      globals.identifier.push(identifier);
      globals.path[identifier] = manifest[entry].path;

      // Determine the location of the opf file
      grunt.config('readkit_dom_munger.' + identifier + '_metaInf', {
        options: {
          read: {selector: 'container rootfiles rootfile', attribute: 'full-path', writeto: 'metaInfRef', isPath:false}
        },
        src: '<%= epub_src %>/' + path + 'META-INF/container.xml'
      });

      var opf_path_src = '<%= epub_src %>/' + path + '<%= readkit_dom_munger.data.metaInfRef %>';
      var opf_path_dest = 'dist/readkit.epub/' + path + '<%= readkit_dom_munger.data.metaInfRef %>';

      // Determine the location of the OEBPS directory
      grunt.config('readkit_dom_munger.' + identifier + '_oebps', {
        options: {
          read: {selector: 'container rootfiles rootfile', attribute: 'full-path', replace: '\/.*$', replacewith: '', writeto: 'oebpsRef', isPath:false},
          callback: function($) {
            var regexp = new RegExp('\/.*$');
            // Store the OEBPS path for the publication
            var identifier = globals.identifier.shift();
            globals.oebps_path_src[identifier] = grunt.template.process('<%= epub_src %>/') + globals.path[identifier] + $('container rootfiles rootfile').attr('full-path').replace(regexp, '');
          }
        },
        src: '<%= epub_src %>/' + path + 'META-INF/container.xml'
      });

      var oebps = '<%= readkit_dom_munger.data.oebpsRef %>';
      var oebps_path_src = '<%= epub_src %>/' + path + '<%= readkit_dom_munger.data.oebpsRef %>';
      var oebps_path_dest = 'dist/readkit.epub/' + path + '<%= readkit_dom_munger.data.oebpsRef %>';

      var solo_path_dest = 'dist/readkit.solo/<%= epub_src %>/' + path;

      // Read the manifest entries from the opf file
      grunt.config('readkit_dom_munger.' + identifier + '_opf', {
        options: {
          read: {selector: 'manifest item', attribute: 'href', writeto: 'manifestRefs', isPath:true}
        },
        src: [opf_path_src]
      });

      // Read the manifest html entries from the opf file
      grunt.config('readkit_dom_munger.' + identifier + '_opf_html', {
        options: {
          read: {selector: 'manifest item[media-type="application/xhtml+xml"]', attribute: 'href', writeto: 'manifestHtmlRefs', isPath:true}
        },
        src: [opf_path_src]
      });

      // Read the client scripts from the html files
      grunt.config('readkit_dom_munger.' + identifier + '_client_scripts', {
        options: {
          read: {selector: 'script', attribute: 'src', writeto: 'clientScriptRefs', isPath:false, concatenate: true},
        },
        src: ['<%= readkit_dom_munger.data.manifestHtmlRefs %>']
      });

      // Copy our client script files to the build directory
      grunt.config('copy.' + identifier + '_client_scripts_to_build', {
        options: {
        },
        files: [
          {expand: true, src: ['<%= readkit_dom_munger.data.clientScriptRefs %>'], cwd: oebps_path_src, dest: 'build/readkit/', filter: 'isFile'}
        ]
      });

      // Copy our EPUB files to the dist directory
      grunt.config('copy.' + identifier + '_epub_to_dist', {
        options: {
          processContentExclude: [oebps + '/sass/**']
        },
        files: [
          {expand: true, src: ['<%= epub_src %>/' + path + 'mimetype'], dest: 'dist/'},
          {expand: true, src: ['<%= epub_src %>/' + path + 'META-INF/**'], dest: 'dist/'}, // includes files in path and its subdirs
          {expand: true, src: ['<%= readkit_dom_munger.data.manifestRefs %>', opf_path_src], dest: 'dist/', filter: 'isFile'}
        ]
      });

      // Copy production Readk.it to the dist directory
      grunt.config('copy.' + identifier + '_readkit_prod_to_dist', {
        options: {
        },
        files: [
          {expand: true, cwd: 'build', src: ['readkit.js'],
            dest: oebps_path_dest + '/readk.it/js', filter: 'isFile'},
          {expand: true, cwd: 'build/readkit', src: ['js/lib/zip/inflate.js'],
            dest: oebps_path_dest + '/readk.it'},
          {expand: true, cwd: 'build/readkit/css', src: ['**', '!screen.css'],
            dest: oebps_path_dest + '/readk.it/css', filter: 'isFile'}
        ]
      });

      // Copy development Readk.it to the dist directory
      grunt.config('copy.' + identifier + '_readkit_dev_to_dist', {
        options: {
        },
        files: [
          {expand: true, cwd: 'readk.it/js', src: ['**'],
            dest: oebps_path_dest + '/readk.it/js', filter: 'isFile'},
          {expand: true, cwd: 'readk.it/css', src: ['**'],
            dest: oebps_path_dest + '/readk.it/css', filter: 'isFile'}
        ]
      });

      // Copy development Readk.it to the solo directory
      grunt.config('copy.' + identifier + '_readkit_dev_to_solo', {
        options: {
        },
        files: [
          {expand: true, cwd: 'readk.it/js', src: ['**'],
            dest: solo_path_dest + '/readk.it/js', filter: 'isFile'},
          {expand: true, cwd: 'build/readkit/js', src: ['content.js'],
            dest: solo_path_dest + '/readk.it/js', filter: 'isFile'}
        ]
      });

      // Copy the index.html for this publication to the solo directory
      grunt.config('copy.' + identifier + '_solo_index_to_dist', {
        files: [
          {
            src: ['build/readkit/index.html'],
            dest: 'dist/readkit.solo/' + identifier + '_' + name + '.html'
          }
        ]
      });

      // Copy the index.html for this publication to the library directory
      grunt.config('copy.' + identifier + '_solo_index_to_library', {
        files: [
          {
            src: ['build/readkit/index.html'],
            dest: 'dist/readkit.library/library/solo/' + identifier + '_' + name + '.html'
          },
          {
            cwd: 'build/readkit/images/',
            expand: true,
            src: ['*.png'],
            dest: 'dist/readkit.library/library/solo/images/'
          }
        ]
      });

      // Copy the cover for this publication to the library directory
      grunt.config('copy.' + identifier + '_cover_to_library', {
        files: [
          {expand: true, cwd: '<%= epub_src %>',
            src: [cover],
            dest: 'dist/readkit.library/library/',
            filter: 'isFile'
          }
        ]
      });

      // Copy Readk.it assets to the dist directory
      grunt.config('copy.' + identifier + '_readkit_assets_to_dist', {
        options: {
          processContentExclude: ['<%= readkit_src %>/.gitignore']
        },
        files: [
          {expand: true, cwd: '<%= readkit_src %>', src: ['*'],
            dest: oebps_path_dest + '/readk.it', filter: 'isFile'},
          {expand: true, cwd: '<%= readkit_src %>/', src: ['images/**', 'js/client.config.js'],
            dest: oebps_path_dest + '/readk.it'},
          {expand: true, cwd: '<%= readkit_src %>/', src: [
            'fonts/fontello/css/**',
            'fonts/fontello/font/**',
            'fonts/Lora/**',
            'fonts/SourceSansPro/**'],
            dest: oebps_path_dest + '/readk.it'}
        ]
      });

      // Copy the client config across if there is one
      grunt.config('copy.' + identifier + '_client_config_to_dist', {
        options: {
        },
        files: [
          {expand: true, cwd: oebps_path_src + '/readk.it/js/',
            src: ['client.config.js'],
            dest: oebps_path_dest + '/readk.it/js', filter: 'isFile'}
        ]
      });

      grunt.config('copy.' + identifier + '_client_config_to_build', {
        options: {
        },
        files: [
          {expand: true, cwd: oebps_path_src + '/readk.it/js/',
            src: ['client.config.js'],
            dest: 'build/readkit/js', filter: 'isFile'}
        ]
      });

      // Update our production index.html to point to the built readkit,
      // and remove the now unnecessary data-main attribute.
      grunt.config('readkit_dom_munger.' + identifier + '_readkit_index', {
        options: {
          update: {selector: '#readkit-entry', attribute: 'src', value: 'js/readkit.js'},
          callback: function($) {
            $('.readkit-library').removeAttr('data-library');
            $('#readkit-client').attr('src', 'js/client.config.js');
            $('#readkit-entry').removeAttr('data-main');
          }
        },
        src: [oebps_path_dest + '/readk.it/index.html']
      });

      // Update our solo production index.html to point to the built readkit,
      // and remove the now unnecessary data-main attribute.
      grunt.config('readkit_dom_munger.' + identifier + '_solo_index', {
        options: {
          callback: function($) {
            $('html').attr('manifest', 'readkit.appcache');
            $('.library_link').attr('href', '../library.html');
            $('#readkit-entry').removeAttr('data-main');
            $('head link').remove();
            $('head meta[name="apple-mobile-web-app-capable"]').before('<style><!--(bake css/screen.css)--></style>');
            $('script#readkit-client').remove();
            $('script#readkit-entry').removeAttr('src').append('<!--(bake ../readkit.js)-->');
          }
        },
        src: ['build/readkit/index.html']
      });

      grunt.config('readkit_dom_munger.' + identifier + '_solo_index_remove_library', {
        options: {
          callback: function($) {
            $('.readkit-library').removeAttr('data-library');
            $('head meta[name="apple-mobile-web-app-capable"]').remove();
            $('head meta[name="apple-mobile-web-app-status-bar-style"]').remove();
          }
        },
        src: ['build/readkit/index.html']
      });

      grunt.config('bake.' + identifier + '_solo', {
        options: {
        },
        files: {
          'build/readkit/index.html': 'build/readkit/index.html'
        }
      });

      // Mixin the prod readkit mainfest entries to the opf file.
      // We use text/plain for css as otherwise epubcheck throws spurious errors.
      // We use a useful technique here to wrap a multi-line string temporarily in a comment.
      grunt.config('readkit_dom_munger.' + identifier + '_opf_mixin_prod', {
        options: {
          xmlMode: true,
          append: {selector: 'manifest', html: function () {/*
            <!-- './readk.it'  -->
                <item id="readk_it_favicon_ico" href="readk.it/favicon.ico" media-type="image/vnd.microsoft.icon"></item>
                <item id="readk_it_index_html" href="readk.it/index.html" media-type="text/plain"></item>
                <item id="readk_it_offline_manifest" href="readk.it/offline.manifest" media-type="text/plain"></item>
            <!-- './readk.it/css'  -->
                <item id="readk_it_css_fontello_css" href="readk.it/css/fontello.css" media-type="text/plain"></item>
                <item id="readk_it_css_screen_css" href="readk.it/css/readkit-screen.css" media-type="text/plain"></item>
                <item id="readk_it_css_drag_and_drop_css" href="readk.it/css/drag_and_drop.css" media-type="text/plain"></item>
                <item id="readk_it_css_add-to-homescreen_style_add2home_css" href="readk.it/css/add2home.css" media-type="text/plain"></item>
            <!-- './readk.it/fonts'  -->
            <!-- './readk.it/fonts/fontello'  -->
            <!-- './readk.it/fonts/fontello/font'  -->
                <item id="readk_it_fonts_fontello_font_fontello_ttf" href="readk.it/fonts/fontello/font/fontello.ttf" media-type="application/vnd.ms-opentype"></item>
                <item id="readk_it_fonts_fontello_font_fontello_woff" href="readk.it/fonts/fontello/font/fontello.woff" media-type="application/vnd.ms-opentype"></item>
            <!-- './readk.it/fonts/Lora'  -->
                <item id="readk_it_fonts_Lora_Lora-Bold_woff" href="readk.it/fonts/Lora/Lora-Bold.woff" media-type="application/vnd.ms-opentype"></item>
                <item id="readk_it_fonts_Lora_Lora-BoldItalic_woff" href="readk.it/fonts/Lora/Lora-BoldItalic.woff" media-type="application/vnd.ms-opentype"></item>
                <item id="readk_it_fonts_Lora_Lora-Italic_woff" href="readk.it/fonts/Lora/Lora-Italic.woff" media-type="application/vnd.ms-opentype"></item>
                <item id="readk_it_fonts_Lora_Lora_woff" href="readk.it/fonts/Lora/Lora.woff" media-type="application/vnd.ms-opentype"></item>
            <!-- './readk.it/fonts/SourceSansPro'  -->
                <item id="readk_it_fonts_SourceSansPro_SourceSansPro-Bold_woff" href="readk.it/fonts/SourceSansPro/SourceSansPro-Bold.woff" media-type="application/vnd.ms-opentype"></item>
                <item id="readk_it_fonts_SourceSansPro_SourceSansPro-BoldIt_woff" href="readk.it/fonts/SourceSansPro/SourceSansPro-BoldIt.woff" media-type="application/vnd.ms-opentype"></item>
                <item id="readk_it_fonts_SourceSansPro_SourceSansPro-It_woff" href="readk.it/fonts/SourceSansPro/SourceSansPro-It.woff" media-type="application/vnd.ms-opentype"></item>
                <item id="readk_it_fonts_SourceSansPro_SourceSansPro-Regular_woff" href="readk.it/fonts/SourceSansPro/SourceSansPro-Regular.woff" media-type="application/vnd.ms-opentype"></item>
            <!-- './readk.it/images'  -->
                <item id="readk_it_images_apple-touch-icon-114x114_png" href="readk.it/images/apple-touch-icon-114x114.png" media-type="image/png"></item>
                <item id="readk_it_images_apple-touch-icon-144x144_png" href="readk.it/images/apple-touch-icon-144x144.png" media-type="image/png"></item>
                <item id="readk_it_images_apple-touch-icon-57x57_png" href="readk.it/images/apple-touch-icon-57x57.png" media-type="image/png"></item>
                <item id="readk_it_images_apple-touch-icon-72x72_png" href="readk.it/images/apple-touch-icon-72x72.png" media-type="image/png"></item>
                <item id="readk_it_images_site_preloader_gif" href="readk.it/images/site_preloader.gif" media-type="image/gif"></item>
                <item id="readk_it_images_spinner_gif" href="readk.it/images/spinner.gif" media-type="image/gif"></item>
                <item id="readk_it_images_apple-touch-startup-image-320x460_png" href="readk.it/images/apple-touch-startup-image-320x460.png" media-type="image/png"></item>
                <item id="readk_it_images_apple-touch-startup-image-640x920_png" href="readk.it/images/apple-touch-startup-image-640x920.png" media-type="image/png"></item>
                <item id="readk_it_images_apple-touch-startup-image-640x1096_png" href="readk.it/images/apple-touch-startup-image-640x1096.png" media-type="image/png"></item>
                <item id="readk_it_images_apple-touch-startup-image-748x1024_png" href="readk.it/images/apple-touch-startup-image-748x1024.png" media-type="image/png"></item>
                <item id="readk_it_images_apple-touch-startup-image-768x1004_png" href="readk.it/images/apple-touch-startup-image-768x1004.png" media-type="image/png"></item>
                <item id="readk_it_images_apple-touch-startup-image-1536x2008_png" href="readk.it/images/apple-touch-startup-image-1536x2008.png" media-type="image/png"></item>
                <item id="readk_it_images_apple-touch-startup-image-2048x1496_png" href="readk.it/images/apple-touch-startup-image-2048x1496.png" media-type="image/png"></item>
            <!-- './readk.it/js'  -->
                <item id="readk_it_js_client_config_js" href="readk.it/js/client.config.js" media-type="text/javascript"></item>
                <item id="readk_it_js_readkit_js" href="readk.it/js/readkit.js" media-type="text/javascript"></item>
            <!-- './readk.it/js/lib/zip'  -->
                <item id='readk_it_js_lib_zip_inflate_js' href='readk.it/js/lib/zip/inflate.js' media-type='text/javascript' />
            */}.toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1]
          }
        },
        src: [opf_path_dest]
      });

      // Mixin the dev readkit mainfest entries to the opf file.
      // We use text/plain for css as otherwise epubcheck throws spurious errors.
      // We use a useful technique here to wrap a multi-line string temporarily in a comment.
      grunt.config('readkit_dom_munger.' + identifier + '_opf_mixin_dev', {
        options: {
          xmlMode: true,
          append: {selector: 'manifest', html: function () {/*
            <!-- './readk.it'  -->
                <item id='readk_it_favicon_ico' href='readk.it/favicon.ico' media-type='image/vnd.microsoft.icon' />
                <item id='readk_it_index_html' href='readk.it/index.html' media-type='text/plain' />
                <item id="readk_it_offline_manifest" href="readk.it/offline.manifest" media-type="text/plain"></item>
            <!-- './readk.it/css'  -->
                <item id="readk_it_css_fontello_css" href="readk.it/css/fontello.css" media-type="text/plain"></item>
                <item id='readk_it_css_add2home_css' href='readk.it/css/add2home.css' media-type='text/plain' />
                <item id='readk_it_css_drag_and_drop_css' href='readk.it/css/drag_and_drop.css' media-type='text/plain' />
                <item id='readk_it_css_readkit-screen_css' href='readk.it/css/readkit-screen.css' media-type='text/plain' />
            <!-- './readk.it/fonts'  -->
            <!-- './readk.it/fonts/fontello'  -->
            <!-- './readk.it/fonts/fontello/font'  -->
                <item id='readk_it_fonts_fontello_font_fontello_ttf' href='readk.it/fonts/fontello/font/fontello.ttf' media-type='application/vnd.ms-opentype' />
                <item id='readk_it_fonts_fontello_font_fontello_woff' href='readk.it/fonts/fontello/font/fontello.woff' media-type='application/vnd.ms-opentype' />
            <!-- './readk.it/fonts/Lora'  -->
                <item id='readk_it_fonts_Lora_Lora-Bold_woff' href='readk.it/fonts/Lora/Lora-Bold.woff' media-type='application/vnd.ms-opentype' />
                <item id='readk_it_fonts_Lora_Lora-BoldItalic_woff' href='readk.it/fonts/Lora/Lora-BoldItalic.woff' media-type='application/vnd.ms-opentype' />
                <item id='readk_it_fonts_Lora_Lora-Italic_woff' href='readk.it/fonts/Lora/Lora-Italic.woff' media-type='application/vnd.ms-opentype' />
                <item id='readk_it_fonts_Lora_Lora_woff' href='readk.it/fonts/Lora/Lora.woff' media-type='application/vnd.ms-opentype' />
            <!-- './readk.it/fonts/SourceSansPro'  -->
                <item id='readk_it_fonts_SourceSansPro_SourceSansPro-Bold_woff' href='readk.it/fonts/SourceSansPro/SourceSansPro-Bold.woff' media-type='application/vnd.ms-
            opentype' />
                <item id='readk_it_fonts_SourceSansPro_SourceSansPro-BoldIt_woff' href='readk.it/fonts/SourceSansPro/SourceSansPro-BoldIt.woff' media-type='application/vnd
            .ms-opentype' />
                <item id='readk_it_fonts_SourceSansPro_SourceSansPro-It_woff' href='readk.it/fonts/SourceSansPro/SourceSansPro-It.woff' media-type='application/vnd.ms-open
            type' />
                <item id='readk_it_fonts_SourceSansPro_SourceSansPro-Regular_woff' href='readk.it/fonts/SourceSansPro/SourceSansPro-Regular.woff' media-type='application/v
            nd.ms-opentype' />
            <!-- './readk.it/images'  -->
                <item id='readk_it_images_apple-touch-icon-114x114_png' href='readk.it/images/apple-touch-icon-114x114.png' media-type='image/png' />
                <item id="readk_it_images_apple-touch-icon-144x144_png" href="readk.it/images/apple-touch-icon-144x144.png" media-type="image/png"></item>
                <item id='readk_it_images_apple-touch-icon-57x57_png' href='readk.it/images/apple-touch-icon-57x57.png' media-type='image/png' />
                <item id='readk_it_images_apple-touch-icon-72x72_png' href='readk.it/images/apple-touch-icon-72x72.png' media-type='image/png' />
                <item id='readk_it_images_site_preloader_gif' href='readk.it/images/site_preloader.gif' media-type='image/gif' />
                <item id='readk_it_images_spinner_gif' href='readk.it/images/spinner.gif' media-type='image/gif' />
                <item id="readk_it_images_apple-touch-startup-image-320x460_png" href="readk.it/images/apple-touch-startup-image-320x460.png" media-type="image/png"></item>
                <item id="readk_it_images_apple-touch-startup-image-640x920_png" href="readk.it/images/apple-touch-startup-image-640x920.png" media-type="image/png"></item>
                <item id="readk_it_images_apple-touch-startup-image-640x1096_png" href="readk.it/images/apple-touch-startup-image-640x1096.png" media-type="image/png"></item>
                <item id="readk_it_images_apple-touch-startup-image-748x1024_png" href="readk.it/images/apple-touch-startup-image-748x1024.png" media-type="image/png"></item>
                <item id="readk_it_images_apple-touch-startup-image-768x1004_png" href="readk.it/images/apple-touch-startup-image-768x1004.png" media-type="image/png"></item>
                <item id="readk_it_images_apple-touch-startup-image-1536x2008_png" href="readk.it/images/apple-touch-startup-image-1536x2008.png" media-type="image/png"></item>
                <item id="readk_it_images_apple-touch-startup-image-2048x1496_png" href="readk.it/images/apple-touch-startup-image-2048x1496.png" media-type="image/png"></item>
            <!-- './readk.it/js'  -->
                <item id='readk_it_js_client_config_js' href='readk.it/js/client.config.js' media-type='text/javascript' />
                <item id='readk_it_js_readkit_js' href='readk.it/js/readkit.js' media-type='text/javascript' />
            <!-- './readk.it/js/app'  -->
                <item id='readk_it_js_app_chrome_js' href='readk.it/js/app/chrome.js' media-type='text/javascript' />
                <item id='readk_it_js_app_config_js' href='readk.it/js/app/config.js' media-type='text/javascript' />
                <item id='readk_it_js_app_content_js' href='readk.it/js/app/content.js' media-type='text/javascript' />
                <item id='readk_it_js_app_controller_js' href='readk.it/js/app/controller.js' media-type='text/javascript' />
                <item id='readk_it_js_app_epub_js' href='readk.it/js/app/epub.js' media-type='text/javascript' />
                <item id='readk_it_js_app_layout_js' href='readk.it/js/app/layout.js' media-type='text/javascript' />
                <item id='readk_it_js_app_utility_js' href='readk.it/js/app/utility.js' media-type='text/javascript' />
            <!-- './readk.it/js/lib'  -->
                <item id='readk_it_js_lib_detectizr_js' href='readk.it/js/lib/detectizr.js' media-type='text/javascript' />
                <item id='readk_it_js_lib_iscroll-mit-license_txt' href='readk.it/js/lib/iscroll-mit-license.txt' media-type='text/plain' />
                <item id='readk_it_js_lib_iscroll_js' href='readk.it/js/lib/iscroll.js' media-type='text/javascript' />
                <item id='readk_it_js_lib_jquery_ba-resize_js' href='readk.it/js/lib/jquery.ba-resize.js' media-type='text/javascript' />
                <item id='readk_it_js_lib_jquery_ba-urlinternal_js' href='readk.it/js/lib/jquery.ba-urlinternal.js' media-type='text/javascript' />
                <item id='readk_it_js_lib_jquery_hotkeys_js' href='readk.it/js/lib/jquery.hotkeys.js' media-type='text/javascript' />
                <item id='readk_it_js_lib_jquery_js' href='readk.it/js/lib/jquery.js' media-type='text/javascript' />
                <item id='readk_it_js_lib_jquery_storage_js' href='readk.it/js/lib/jquery.storage.js' media-type='text/javascript' />
                <item id='readk_it_js_lib_lodash_js' href='readk.it/js/lib/lodash.js' media-type='text/javascript' />
                <item id='readk_it_js_lib_modernizr_js' href='readk.it/js/lib/modernizr.js' media-type='text/javascript' />
                <item id='readk_it_js_lib_require_js' href='readk.it/js/lib/require.js' media-type='text/javascript' />
                <item id='readk_it_js_lib_text_js' href='readk.it/js/lib/text.js' media-type='text/javascript' />
                <item id='readk_it_js_lib_tinytim_js' href='readk.it/js/lib/tinytim.js' media-type='text/javascript' />
            <!-- './readk.it/js/lib/add-to-homescreen'  -->
            <!-- './readk.it/js/lib/add-to-homescreen/src'  -->
                <item id='readk_it_js_lib_add-to-homescreen_src_add2home_js' href='readk.it/js/lib/add-to-homescreen/src/add2home.js' media-type='text/javascript' />
            <!-- './readk.it/js/lib/add-to-homescreen/style'  -->
                <item id='readk_it_js_lib_add-to-homescreen_style_add2home_css' href='readk.it/js/lib/add-to-homescreen/style/add2home.css' media-type='text/plain' />
            <!-- './readk.it/js/lib/require-css'  -->
                <item id='readk_it_js_lib_require-css_css_js' href='readk.it/js/lib/require-css/css.js' media-type='text/javascript' />
                <item id='readk_it_js_lib_require-css_LICENSE_txt' href='readk.it/js/lib/require-css/LICENSE.txt' media-type='text/plain' />
                <item id='readk_it_js_lib_require-css_normalize_js' href='readk.it/js/lib/require-css/normalize.js' media-type='text/javascript' />
            <!-- './readk.it/js/lib/zip'  -->
                <item id='readk_it_js_lib_zip_deflate_js' href='readk.it/js/lib/zip/deflate.js' media-type='text/javascript' />
                <item id='readk_it_js_lib_zip_inflate_js' href='readk.it/js/lib/zip/inflate.js' media-type='text/javascript' />
                <item id='readk_it_js_lib_zip_mime-types_js' href='readk.it/js/lib/zip/mime-types.js' media-type='text/javascript' />
                <item id='readk_it_js_lib_zip_zip-ext_js' href='readk.it/js/lib/zip/zip-ext.js' media-type='text/javascript' />
                <item id='readk_it_js_lib_zip_zip-fs_js' href='readk.it/js/lib/zip/zip-fs.js' media-type='text/javascript' />
                <item id='readk_it_js_lib_zip_zip_js' href='readk.it/js/lib/zip/zip.js' media-type='text/javascript' />
            <!-- './readk.it/js/test'  -->
                <item id='readk_it_js_test_index_html' href='readk.it/js/test/index.html' media-type='text/html' />
                <item id='readk_it_js_test_testsuite_js' href='readk.it/js/test/testsuite.js' media-type='text/javascript' />
            <!-- './readk.it/js/test/app'  -->
                <item id='readk_it_js_test_app_epub_test_js' href='readk.it/js/test/app/epub.test.js' media-type='text/javascript' />
            <!-- './readk.it/js/test/qunit'  -->
                <item id='readk_it_js_test_qunit_qunit_css' href='readk.it/js/test/qunit/qunit.css' media-type='text/plain' />
                <item id='readk_it_js_test_qunit_qunit_js' href='readk.it/js/test/qunit/qunit.js' media-type='text/javascript' />
            */}.toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1]
          }
        },
        src: [opf_path_dest]
      });

      // Assemble data URIs for use in the solo version
      grunt.config('readkit_datauris.' + identifier, {
        options: {
          base: '<%= epub_src %>/' + path
        },
        src: ['<%= epub_src %>/' + path + 'META-INF/container.xml', opf_path_src, '<%= readkit_dom_munger.data.manifestRefs %>'],
        dest: 'build/readkit/js/app/content.js'
      });

      // Zip up our EPUB assets into an EPUB file.
      grunt.config('shell.' + identifier + '_zip', {
        command: [
          'echo Zipping ' + identifier + '_' + name + '.epub to <%= grunt.config(\'shell.' + identifier + '_set_pwd.pwd\') %>/dist',
          'cd dist/readkit.epub/' + path,
          'echo Zipping ' + identifier + '_' + name + '.epub...',
          'zip -X0 ' + identifier + '_' + name + '.epub mimetype -x ._',
          'zip -rDX9 ' + identifier + '_' + name + '.epub META-INF -x *.DS_Store -x ._*',
          'zip -rDX9 ' + identifier + '_' + name + '.epub ' + oebps + ' -x *.DS_Store -x ._*',
        ].join('&&'),
        options: {
          stdout: true,
          stderr: true
        }
      });

      // Move the EPUB file to the top level of the readkit.epub directory.
      grunt.config('shell.' + identifier + '_mv', {
        command: [
          'mv dist/readkit.epub/' + path + identifier + '_' + name + '.epub dist/readkit.epub',
          'echo Zipped ' + identifier + '_' + name + '.epub to dist'
        ].join('&&'),
        options: {
          stdout: true,
          stderr: true
        }
      });

      // Zip up our solo file.
      grunt.config('shell.' + identifier + '_zip_solo', {
        command: [
          'echo Zipping ' + identifier + '_' + name + '.html...',
          'cd dist/readkit.solo/',
          'zip -DX9 ' + identifier + '_' + name + '.zip ' + identifier + '_' + name + '.html',
        ].join('&&'),
        options: {
          stdout: true,
          stderr: true
        }
      });

    }

    callback(target, cb);
  }

  var runDynamicTasks = function(target, cb) {
      // Prod tasks that happen before the EPUBs have been processed
      var prodTasks = [
        'clean:before',
        'compass:readkit',
        'copy:readkit_prod_to_build',
        'jshint:readkit',
        'cssmin:readkit',
        'concat:readkit',
        'imageEmbed:build',
        'config_mode_reader',
        'requirejs:compile_readkit',
        'readkit_dom_munger:index_reader',
        'bake:reader',
        'config_mode_publication',
        'library_config_prod',
        'requirejs:compile_readkit',
        'compass:library',
        'cssmin:library',
        'copy:library_manifest_to_dist',
        'copy:library_prod_to_build',
        'requirejs:compile_library',
        'copy:library_prod_to_dist',
        'copy:library_assets_to_dist',
        'library_dist_appcache_date',
        'readkit_dom_munger:index_library',
        'readkit_dom_munger:library',
        'copy:library_client_config_to_dist'];

      // Prod lite tasks that happen before the EPUBs have been processed
      var prodLiteTasks = [
        'clean:before',
        'compass:readkit',
        'copy:readkit_prod_to_build',
        'cssmin:readkit',
        'concat:readkit',
        'imageEmbed:build',
        'copy:readkit_prodlite_to_build',
        'jshint:readkit',
        'config_mode_reader',
        'requirejs:compile_readkit',
        'readkit_dom_munger:index_reader',
        'bake:reader',
        'config_mode_publication',
        'library_config_prod',
        'requirejs:compile_readkit',
        'compass:library',
        'cssmin:library',
        'copy:library_manifest_to_dist',
        'copy:library_prod_to_build',
        'requirejs:compile_library',
        'copy:library_prod_to_dist',
        'copy:library_assets_to_dist',
        'library_dist_appcache_date',
        'readkit_dom_munger:index_library',
        'readkit_dom_munger:library',
        'copy:library_client_config_to_dist'];

      // Dev tasks that happen before the EPUBs have been processed
      var devTasks = [
        'clean:before',
        'compass:readkit',
        'copy:reader_dev_to_dist',
        'compass:library',
        'copy:library_dev_to_dist',
        'library_config_dev',
        'copy:library_assets_to_dist',
        'copy:library_epubs_to_dist'];

      var manifest = grunt.file.readJSON('readkit.epub/manifest.json');

      // Process our manifest -- each entry in the manifest describes a particular EPUB file
      for (var entry in manifest) {
        grunt.log.writeln(manifest[entry].path);
        var identifier = manifest[entry].identifier.replace(/\:/g, '_');

        // Ensure that drag-and-drop unzip can find the web worker
        grunt.registerTask(identifier + '_config_prod', 'Configure location of the webworkers (for drag and drop)', function(){
          var config = grunt.file.read('build/readkit/js/app/config.js');
          grunt.file.write('build/readkit/js/app/config.js', config.replace(/workerScriptsPath\:[^\,\}]*/, 'workerScriptsPath: "js/lib/zip/"'));
        });

        // We have to define our own task to gather information about any client scripts.
        // Originally we used 'readkit_dom_munger.' + identifier + '_client_scripts'
        // but unfortunately this caused some succeeding tasks to fail silently.
        globals.identifier_client_scripts_to_build.push(identifier);
        grunt.registerTask(identifier + '_client_scripts_to_build', 'Move the client scripts to the build directory', function(){
          var identifier = globals.identifier_client_scripts_to_build.shift();
            if (grunt.file.exists(globals.oebps_path_src[identifier] + '/readk.it/js/client.config.js')) {
              var config = grunt.file.read(globals.oebps_path_src[identifier] + '/readk.it/js/client.config.js');
              var lines = config.split(/\r\n|\r|\n/g);
              var regexp_script = /client_js_build\:\s*['"]([^'"]*)['"]/i;
              for (var j = 0; j < lines.length; j++) {
                var matches = regexp_script.exec(lines[j]);
                if (matches) {
                  matches.shift();
                  // Copy our client script files to the build directory
                  grunt.config('copy.' + identifier + '_client_scripts_to_build', {
                    options: {
                    },
                    files: [
                      // Note that the dest ('build/readkit/js/lib/'') is a fake path, as matches[0] is likely something like '../../js'
                      // and will resolve to 'build/readkit'.
                      {expand: true, src: [matches[0] + '/**'], cwd: globals.oebps_path_src[identifier] + '/readk.it/js/', dest: 'build/readkit/js/lib/'}
                    ]
                  });
                  grunt.task.run('copy:' + identifier + '_client_scripts_to_build');
                }
              }
            }
        });

        globals.identifier_mixin_client_config.push(identifier);
        grunt.registerTask(identifier + '_mixin_client_config', 'Mixin the client config to the require compilation', function(){
          var identifier = globals.identifier_mixin_client_config.shift();
          // Mixin any client EPUB paths to the Readk.it paths
          var extend = function(obj, defaults) {
              for (var i in defaults) {
                  if (!obj[i]) {
                      obj[i] = defaults[i];
                  }
              }
          };
          eval(grunt.file.read('build/readkit/js/client.config.js'));

          grunt.config('requirejs.' + identifier + '_compile_readkit', {
            options: grunt.config.get('requirejs.compile_readkit.options')
          });

          // Mixin our client paths to our readkit paths
          var paths = grunt.config.get('requirejs.' + identifier + '_compile_readkit.options.paths');
          extend(paths, client.paths);
          paths.client_js = paths.client_js_build;
          grunt.config.set('requirejs.' + identifier + '_compile_readkit.options.paths', paths);

          // Mixin our client includes to our readkit includes
          var include = grunt.config.get('requirejs.' + identifier + '_compile_readkit.options.include');
          grunt.config.set('requirejs.' + identifier + '_compile_readkit.options.include', include.concat(client.required));

          // Mixin our client shims to our readkit shims
          var shim = grunt.config.get('requirejs.' + identifier + '_compile_readkit.options.shim');
          extend(shim, client.shims);
          grunt.config.set('requirejs.' + identifier + '_compile_readkit.options.shim', shim);

          // Compile readk.it for this publication
          grunt.task.run('requirejs:' + identifier + '_compile_readkit');
        });

        // Our publication-specific prod/prod lite tasks
        var tasksForProd = [
          'clean:build_readkit',
          'copy:readkit_prod_to_build',
          'cssmin:readkit',
          'concat:readkit',
          'imageEmbed:build',
          'config_mode_publication',
          'readkit_dom_munger:' + identifier + '_metaInf',
          'readkit_dom_munger:' + identifier + '_oebps',
          'readkit_dom_munger:' + identifier + '_opf',
          'readkit_dom_munger:' + identifier + '_opf_html',
          'copy:' + identifier + '_epub_to_dist',
          identifier + '_config_prod',
          'clean:build_readkit_js',
          'requirejs:compile_readkit',
          'copy:' + identifier + '_readkit_prod_to_dist',
          'copy:' + identifier + '_readkit_assets_to_dist',
          'copy:' + identifier + '_client_config_to_dist',
          'readkit_dom_munger:' + identifier + '_readkit_index',
          'readkit_dom_munger:' + identifier + '_opf_mixin_prod',
          'shell:' + identifier + '_zip',
          'shell:' + identifier + '_mv',
          'config_mode_solo',
          identifier + '_client_scripts_to_build',
          'copy:' + identifier + '_client_config_to_build',
          'readkit_datauris:' + identifier,
          identifier + '_mixin_client_config',
          'readkit_dom_munger:' + identifier + '_solo_index',
          'bake:' + identifier + '_solo',
          'copy:' + identifier + '_solo_index_to_library',
          'readkit_dom_munger:' + identifier + '_solo_index_remove_library',
          'copy:' + identifier + '_solo_index_to_dist',
          'shell:' + identifier + '_zip_solo',
          'copy:' + identifier + '_cover_to_library'
        ];
        prodTasks = prodTasks.concat(tasksForProd);
        prodLiteTasks = prodLiteTasks.concat(tasksForProd);

        // Our publication-specific dev tasks
        var tasksForDev = [
          'readkit_dom_munger:'  + identifier + '_metaInf',
          'readkit_dom_munger:'  + identifier + '_oebps',
          'readkit_dom_munger:' + identifier + '_opf',
          'copy:' + identifier + '_epub_to_dist',
          'copy:' + identifier + '_readkit_dev_to_dist',
          'copy:' + identifier + '_readkit_assets_to_dist',
          'copy:' + identifier + '_client_config_to_dist',
          'readkit_dom_munger:' + identifier + '_opf_mixin_dev',
          'shell:' + identifier + '_zip',
          'shell:' + identifier + '_mv',
          'readkit_datauris:' + identifier,
          'copy:' + identifier + '_readkit_dev_to_solo',
          'readkit_dom_munger:' + identifier + '_solo_index',
          'bake:' + identifier + '_solo',
          'copy:' + identifier + '_solo_index_to_library',
          'readkit_dom_munger:' + identifier + '_solo_index_remove_library',
          'copy:' + identifier + '_solo_index_to_dist',
          'shell:' + identifier + '_zip_solo',
          'copy:' + identifier + '_cover_to_library'
        ];
        devTasks = devTasks.concat(tasksForDev);
      }

      // Tasks that happen after the EPUBs have been processed
      var afterTasks = ['readme_epub', 'readme_library', 'readme_reader', 'readme_solo', 'clean:after'];
      prodTasks = prodTasks.concat(afterTasks);
      prodLiteTasks = prodLiteTasks.concat(afterTasks);
      devTasks = devTasks.concat(afterTasks);

      switch(target) {
        case 'dev':
          grunt.task.run(devTasks);
          break;
        case 'prod_lite':
          grunt.task.run(prodLiteTasks);
          break;
        default:
          // Fallback to running prod tasks if no target specified
          grunt.task.run(prodTasks);
      }

      cb();
   };

  // Register our static tasks.
  grunt.registerTask('cleanBefore', ['clean:before']);
  grunt.registerTask('cleanAfter', ['clean:after']);

  grunt.registerTask('config_mode_publication', 'Configure the publication mode', function(){
    var config = grunt.file.read('build/readkit/js/app/config.js');
    grunt.file.write('build/readkit/js/app/config.js', config.replace(/mode\:[^\,\}]*/, 'mode: "publication"'));
  });

  grunt.registerTask('config_mode_reader', 'Configure the reader mode (no content)', function(){
    var config = grunt.file.read('build/readkit/js/app/config.js');
    grunt.file.write('build/readkit/js/app/config.js', config.replace(/mode\:[^\,\}]*/, 'mode: "reader"'));
  });

  grunt.registerTask('config_mode_solo', 'Configure the solo mode', function(){
    var config = grunt.file.read('build/readkit/js/app/config.js');
    grunt.file.write('build/readkit/js/app/config.js', config.replace(/mode\:[^\,\}]*/, 'mode: "solo"'));
  });

  grunt.registerTask('library_config_prod', 'Configure the library to use webworkers (for drag and drop unzipping)', function(){
    var config = grunt.file.read('build/readkit/js/app/config.js');
    grunt.file.write('build/readkit/js/app/config.js', config.replace(/workerScriptsPath\:[^\,\}]*/, 'workerScriptsPath: "../../js/lib/zip/"'));
  });

  // Configure the library to server dev versions instead of solo versions of EPUB content.
  grunt.registerTask('library_config_dev', 'Configure the library to use dev instead of solo', function(){
    var config = grunt.file.read('dist/readkit.library/library/js/app/config.js');
    grunt.file.write('dist/readkit.library/library/js/app/config.js', config.replace(/solo\:\s*true/, 'solo: false'));
  });

  grunt.registerTask('library_dist_appcache_date', 'Include the datetime in appcache for cache busting purposes', function(){
    var appcache = grunt.file.read('dist/readkit.library/library/solo/readkit.appcache');
    var date = new Date();
    grunt.file.write('dist/readkit.library/library/solo/readkit.appcache', appcache.replace(/<%datetime%>/, date));
  });

  grunt.registerTask('readme_epub', 'Write the Readkit EPUB Readme file', function(){
    var readme = function () {/*
#Readkit EPUB

The EPUB files in this directory contain Readkit, meaning they will function as conventional EPUB files, readable in all compliant EPUB reading systems.

However, they can also be opened for reading in a browser as follows:

* Unzip the EPUB (or use the unzipped form of the EPUB content, also in this directory)

The EPUB content can then be read in one of three different ways using Readkit:

1. Navigate to the readk.it folder, which will be normally found within the OEBPS (or equivalent) folder of the EPUB content, and double-click the index.html file to open the content in a browser (i.e. using a file URL)
2. Web-serve the EPUB from the its root directory, and then in the browser navigate to the Readk.it index.html file, e.g. <code>http://localhost:8000/OEBPS/readk.it/index.html</code>
3. Either using a file URL or web-served, drag and drop another EPUB file onto the browser window to start reading the new file.

For more information, visit the [Readk.it home page](http://readk.it)
      */}.toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1];
    grunt.file.write('dist/readkit.epub/README.md', readme);
  });

  grunt.registerTask('readme_library', 'Write the Readkit Library Readme file', function(){
    var readme = function () {/*
#Readkit Library

To access the Readkit Library, webserve Readk.it from the readkit.library directory, and then in your browser navigate to the library index.html file, e.g. <code>http://localhost:8000/library/library.html</code>

You'll then be able to choose the EPUB content you want to read.

For more information, visit the [Readk.it home page](http://readk.it)
      */}.toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1];
    grunt.file.write('dist/readkit.library/README.md', readme);
  });

  grunt.registerTask('readme_reader', 'Write the Readkit Reader Readme file', function(){
    var readme = function () {/*
#Readkit Reader

The Readk.it Reader is a single html file which allows you to read EPUB content in one of two ways:

1. Double-click the readkit.reader.html file to open it in a browser (i.e. using a file URL)
2. Web-serve the readkit.reader.html file

Either using a file URL or web-served, drag and drop another EPUB file onto the browser window to start reading.

For more information, visit the [Readk.it home page](http://readk.it)
      */}.toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1];
    grunt.file.write('dist/readkit.reader/README.md', readme);
  });

  grunt.registerTask('readme_solo', 'Write the Readkit Solo Readme file', function(){
    var readme = function () {/*
#Readkit Solo

Each html file in this directory contains EPUB content which can be read in one of two ways:

1. Double-click a html file in this directory to open the it in a browser (i.e. using a file URL)
2. Web-serve the html file

Either using a file URL or web-served, drag and drop another EPUB file onto the browser window to start reading

For more information, visit the [Readk.it home page](http://readk.it)
      */}.toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1];
    grunt.file.write('dist/readkit.solo/README.md', readme);
  });

  grunt.registerTask('default', ['shell:make_manifest_prod']);
  grunt.registerTask('dev', ['shell:make_manifest_dev']);
};
