#Readk.it: turning digital reading inside out

##Description

Readk.it is a lightweight JavaScript reading system that allows EPUB files to be read in modern browsers on practically all devices. It can be used to web-serve EPUB content statically; no server-side code is required.


Readk.it can be embedded inside an EPUB file and travel with it, allowing future browser users to view the publication as the publisher intended. Readk.it can also be used to serve up a library of EPUB titles, allowing publishers to easily web-serve their existing EPUB files.

Readk.it has been designed to take advantage of responsive design techniques in order to provide a seamless digital reading experience when the EPUB file is accessed via a browser, but where the EPUB file can also fallback to standard behaviour on dedicated EPUB reading devices (in which case Readk.it is quiesecent).

No modifications to any existing EPUB files should be necessary in order to allow the EPUB to be read using Readk.it, however a better reading experience than is currently possible on most dedicated EPUB reading devices can be acheived by coupling Readk.it with content created using responsive design techniques (see the Readk.it Manifesto for a simple example).

Readk.it has come about because EPUB, in spite of the potential that the standard allows, is being restricted by a lack of features and standardisation on the part of dedicated vendor reading systems. Given that the modern browser is ubiquitous on mobile devices, it makes sense to provide a reading system that allows EPUB to take advantage of its capabilities.

Readk.it does not aspire to cater for all of the functionality of the EPUB standard (as we've got [Readium](http://readium.org/) for that), rather it tries to provide a graceful reading experience for the majority of EPUB which are typically found in the wild. If Readk.it can allow the majority of EPUB files to be read on a wide range of devices, and also content designed with responsive design techniques to appear similarly, then it's done its job.

Readk.it builds on the efforts of others, notably Matteo Spinelli's [iScroll4](http://cubiq.org/iscroll-4), as well as [jQuery](http://jquery.com/) and [RequireJs](http://requirejs.org/), while the Readk.it Manifesto provides an example of the use of [enquire.js](http://wicky.nillia.ms/enquire.js/) for JavaScript-based Media Queries.

##Before we begin

###Technologies
Although not necessary to make use of Readk.it, a knowledge of certain technologies is useful in order to understand how Readk.it works and how it can be tweaked or extended:

* [EPUB](http://idpf.org/epub)
* [JavaScript](https://en.wikipedia.org/wiki/JavaScript) (naturally)
* [RequireJs](http://requirejs.org/) (for modular Javascript development)
* [Grunt](http://gruntjs.com/) (the Javascript build tool)
* [SASS](http://sass-lang.com/) (for sane CSS development)

##Configuration

Readk.it can be used in either single publication mode, or library mode (or both simultaneously, actually):

###Single publication mode

Embedding Readk.it inside an EPUB file is as easy as dropping the readk.it folder into the OEBPS folder.

To be able to read the publication, you'll then need to serve it with a web-server. I tend to [fire up an instance](#webserver) of python's SimpleHTTPServer and navigate to <code>http://localhost:8000/OEBPS/readk.it/</code>. Note that, in this case, the EPUB directory is the web server content root.

####config.js
If you drop the readk.it folder into the OEBPS folder, you won't need to make changes, however if you decide to place the readk.it folder elsewhere, then you can specify this path in <code>readk.it/js/app/config.js</code>:

    define({
        // Normally the readk.it folder will live directly in the OEBPS folder,
        // so we'll be serving something like http://localhost:8000/OEBPS/readk.it/
        // The Epub directory is therefore ../../, but if we want Readk.it to 
        // live in a different place, we can specify another directory.
        epub_directory: "../../"
    });

This path is used by Readk.it to navigate from the readk.it folder up to where the EPUB's <code>META-INF/container.xml</code> lives.

####client.config.js
As Readk.it operates by compiling all of the EPUB XHTML files into a single HTML page (and thereby ignoring their HEADs), if your publication needs access to JavaScript files/libraries other than those that Readk.it uses, these can be specified in <code>readk.it/js/client.config.js</code>, for example: 

    var client = {
        // The paths for our EPUB assets
        paths: {
            client_js: '../../../js'
        },
        // The required modules for our EPUB assets
        required: [
            'client_js/libs/modernizr.min',
            'client_js/libs/jquery.easing.1.3.min',
            'client_js/libs/jquery.fitvids.min',
            'client_js/libs/enquire.min',
            'client_js/script',
            'client_js/queries'
        ]
    };

####Content-opf
Readk.it is included in the EPUB file, and travels with the EPUB file.

To acheive this, we need to add a bunch of entries to the content.opf to ensure that the EPUB is valid (according to [epubcheck](https://code.google.com/p/epubcheck/)):

    <!-- './readk.it'  -->
        <item id='readk_it_favicon_ico' href='readk.it/favicon.ico'  media-type='image/vnd.microsoft.icon' />
        <item id='readk_it_index_html' href='readk.it/index.html'  media-type='text/html' />
    <!-- './readk.it/css'  -->
        <item id='readk_it_css_styles_css' href='readk.it/css/styles.css'  media-type='text/css' />
    <!-- './readk.it/fonts'  -->
    <!-- './readk.it/fonts/fontello'  -->
    <!-- './readk.it/fonts/fontello/css'  -->
        <item id='readk_it_fonts_fontello_css_fontello_css' href='readk.it/fonts/fontello/css/fontello.css'  media-type='text/css' />
    <!-- './readk.it/fonts/fontello/font'  -->
        <item id='readk_it_fonts_fontello_font_fontello_eot' href='readk.it/fonts/fontello/font/fontello.eot'  media-type='application/vnd.ms-fontobject' />
        <item id='readk_it_fonts_fontello_font_fontello_svg' href='readk.it/fonts/fontello/font/fontello.svg'  media-type='image/svg+xml' />
        <item id='readk_it_fonts_fontello_font_fontello_ttf' href='readk.it/fonts/fontello/font/fontello.ttf'  media-type='application/vnd.ms-opentype' />
        <item id='readk_it_fonts_fontello_font_fontello_woff' href='readk.it/fonts/fontello/font/fontello.woff'  media-type='application/vnd.ms-opentype' />
    <!-- './readk.it/fonts/Lora'  -->
        <item id='readk_it_fonts_Lora_Lora-Bold_woff' href='readk.it/fonts/Lora/Lora-Bold.woff'  media-type='application/vnd.ms-opentype' />
        <item id='readk_it_fonts_Lora_Lora-BoldItalic_woff' href='readk.it/fonts/Lora/Lora-BoldItalic.woff'  media-type='application/vnd.ms-opentype' />
        <item id='readk_it_fonts_Lora_Lora-Italic_woff' href='readk.it/fonts/Lora/Lora-Italic.woff'  media-type='application/vnd.ms-opentype' />
        <item id='readk_it_fonts_Lora_Lora_woff' href='readk.it/fonts/Lora/Lora.woff'  media-type='application/vnd.ms-opentype' />
    <!-- './readk.it/fonts/SourceSansPro'  -->
        <item id='readk_it_fonts_SourceSansPro_SourceSansPro-Bold_woff' href='readk.it/fonts/SourceSansPro/SourceSansPro-Bold.woff'  media-type='application/vnd.ms-opentype' />
        <item id='readk_it_fonts_SourceSansPro_SourceSansPro-BoldIt_woff' href='readk.it/fonts/SourceSansPro/SourceSansPro-BoldIt.woff'  media-type='application/vnd.ms-opentype' />
        <item id='readk_it_fonts_SourceSansPro_SourceSansPro-It_woff' href='readk.it/fonts/SourceSansPro/SourceSansPro-It.woff'  media-type='application/vnd.ms-opentype' />
        <item id='readk_it_fonts_SourceSansPro_SourceSansPro-Light_woff' href='readk.it/fonts/SourceSansPro/SourceSansPro-Light.woff'  media-type='application/vnd.ms-opentype' />
        <item id='readk_it_fonts_SourceSansPro_SourceSansPro-Regular_woff' href='readk.it/fonts/SourceSansPro/SourceSansPro-Regular.woff'  media-type='application/vnd.ms-opentype' />
        <item id='readk_it_fonts_SourceSansPro_SourceSansPro-Semibold_woff' href='readk.it/fonts/SourceSansPro/SourceSansPro-Semibold.woff'  media-type='application/vnd.ms-opentype' />
    <!-- './readk.it/images'  -->
        <item id='readk_it_images_apple-touch-icon-114x114_png' href='readk.it/images/apple-touch-icon-114x114.png'  media-type='image/png' />
        <item id='readk_it_images_apple-touch-icon-57x57-precomposed_png' href='readk.it/images/apple-touch-icon-57x57-precomposed.png'  media-type='image/png' />
        <item id='readk_it_images_apple-touch-icon-57x57_png' href='readk.it/images/apple-touch-icon-57x57.png'  media-type='image/png' />
        <item id='readk_it_images_apple-touch-icon-72x72_png' href='readk.it/images/apple-touch-icon-72x72.png'  media-type='image/png' />
        <item id='readk_it_images_site_preloader_gif' href='readk.it/images/site_preloader.gif'  media-type='image/gif' />
        <item id='readk_it_images_splash_png' href='readk.it/images/splash.png'  media-type='image/png' />
    <!-- './readk.it/js'  -->
        <item id='readk_it_js_client_config_js' href='readk.it/js/client.config.js'  media-type='text/javascript' />
        <item id='readk_it_js_main_js' href='readk.it/js/main.js'  media-type='text/javascript' />
        <item id='readk_it_js_require-jquery_js' href='readk.it/js/require-jquery.js'  media-type='text/javascript' />
        <item id='readk_it_js_require_config_js' href='readk.it/js/require.config.js'  media-type='text/javascript' />
    <!-- './readk.it/js/app'  -->
        <item id='readk_it_js_app_chrome_js' href='readk.it/js/app/chrome.js'  media-type='text/javascript' />
        <item id='readk_it_js_app_config_js' href='readk.it/js/app/config.js'  media-type='text/javascript' />
        <item id='readk_it_js_app_controller_js' href='readk.it/js/app/controller.js'  media-type='text/javascript' />
        <item id='readk_it_js_app_epub_js' href='readk.it/js/app/epub.js'  media-type='text/javascript' />
        <item id='readk_it_js_app_layout_js' href='readk.it/js/app/layout.js'  media-type='text/javascript' />
    <!-- './readk.it/js/lib'  -->
        <item id='readk_it_js_lib_iscroll-mit-license_txt' href='readk.it/js/lib/iscroll-mit-license.txt'  media-type='text/plain' />
        <item id='readk_it_js_lib_iscroll_js' href='readk.it/js/lib/iscroll.js'  media-type='text/javascript' />
        <item id='readk_it_js_lib_jquery_ba-urlinternal_min_js' href='readk.it/js/lib/jquery.ba-urlinternal.min.js'  media-type='text/javascript' />
        <item id='readk_it_js_lib_jquery_hotkeys_js' href='readk.it/js/lib/jquery.hotkeys.js'  media-type='text/javascript' />
        <item id='readk_it_js_lib_jquery_storage_js' href='readk.it/js/lib/jquery.storage.js'  media-type='text/javascript' />
        <item id='readk_it_js_lib_text_js' href='readk.it/js/lib/text.js'  media-type='text/javascript' />
        <item id='readk_it_js_lib_underscore-min_amd_js' href='readk.it/js/lib/underscore-min.amd.js'  media-type='text/javascript' />
    <!-- './readk.it/js/lib/add-to-homescreen'  -->
    <!-- './readk.it/js/lib/add-to-homescreen/src'  -->
        <item id='readk_it_js_lib_add-to-homescreen_src_add2home_js' href='readk.it/js/lib/add-to-homescreen/src/add2home.js'  media-type='text/javascript' />
    <!-- './readk.it/js/lib/add-to-homescreen/style'  -->
        <item id='readk_it_js_lib_add-to-homescreen_style_add2home_css' href='readk.it/js/lib/add-to-homescreen/style/add2home.css'  media-type='text/css' />
    <!-- './readk.it/js/lib/require-css'  -->
        <item id='readk_it_js_lib_require-css_css_js' href='readk.it/js/lib/require-css/css.js'  media-type='text/javascript' />
        <item id='readk_it_js_lib_require-css_normalize_js' href='readk.it/js/lib/require-css/normalize.js'  media-type='text/javascript' />
        <item id='readk_it_js_lib_require-css_LICENSE_txt' href='readk.it/js/lib/require-css/LICENSE.txt'  media-type='text/plain' />


###Library mode
Library mode is as easy to setup as single-publication mode:

* Drop your exploded EPUB files into the <code>readk.it/library/html</code> folder

* Create the manifest with <code>readk.it/library/manifest.maker.py</code>:

        python manifest.maker.py > manifest.json

* [fire up a webserver](#webserver) and navigate to <code>http://localhost:8000/readk.it/library/library.html</code>

Note that, in this case, the directory containing the readk.it folder is the web server content root.

##Technical notes

###<a id="webserver"></a>Setting up a local webserver
Place the following in <code>~/.bash_profile</code>:

    alias server.python='open http://localhost:8000 && python -m SimpleHTTPServer'

Reload <code>.bash_profile</code>:

    . ~/.bash_profile

Fire up a webserver at the location of this README.md:

    server.python

Visit the following URLs:

* [The readk.it testing framework](http://localhost:8000/OEBPS/readk.it/js/test/)

* [The readk.it manifesto](http://localhost:8000/OEBPS/readk.it/index.html)

* [The readk.it library](http://localhost:8000/OEBPS/readk.it/library/library.html)

###Grunt

Install grunt:

    npm uninstall -g grunt
    npm install -g grunt-cli

Install grunt-cli (Cygwin under windows):

    npm install -g grunt-init

    mkdir cygdrive/c/Users/Administrator/.grunt-init
    git clone https://github.com/gruntjs/grunt-init-gruntfile.git cygdrive/c/Users/Administrator/.grunt-init/gruntfile

Create a new project:

    grunt-init cygdrive/c/Users/Administrator/.grunt-init/gruntfile
    npm init

Install dependendices:

    npm install grunt --save-dev
    npm install grunt-contrib-jshint --save-dev
    npm install grunt-contrib-concat --save-dev
    npm install grunt-contrib-uglify --save-dev
    npm install grunt-contrib-compass --save-dev
    npm install grunt-contrib-nodeunit --save-dev
    npm install grunt-contrib-watch --save-dev

As we use cygwin, add the following hack into node_modules\grunt-contrib-compass\tasks\compass.js, directly before "compile(args, cb);":

      if (args[0] === 'compass.bat') {
        console.log("Our little hack to get 'grunt compass' to work in cygwin -- don't use compass.bat");
        args.shift();
        args.unshift('/usr/bin/compass');
        args.unshift('ruby.exe');
        console.log(args);
      }
