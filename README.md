#Readk.it: turning digital reading inside out

##Description

Readk.it is a lightweight JavaScript reading system that allows EPUB files to be read in modern browsers on practically all devices. It can be used to web-serve EPUB content statically; no server-side code is required.

Readk.it can be embedded inside an EPUB file and travel with it, allowing future browser users to view the publication as the publisher intended. Readk.it can also be used to serve up a library of EPUB titles, allowing publishers to easily web-serve their existing EPUB files.

Readk.it has been designed to take advantage of responsive design techniques in order to provide a seamless digital reading experience when the EPUB file is accessed via a browser, but where the EPUB file can also fallback to standard behaviour on dedicated EPUB reading devices (in which case Readk.it is quiesecent).

No modifications to any existing EPUB files should be necessary in order to allow the EPUB to be read using Readk.it. However, a better reading experience than is currently possible on most dedicated EPUB reading devices can be acheived by coupling Readk.it with content created using responsive design techniques (see the Readk.it Manifesto for a simple example).

Readk.it has come about because EPUB, in spite of the potential that the standard allows, is being restricted by a lack of features and standardisation on the part of dedicated vendor reading systems. Given that the modern browser is ubiquitous on mobile devices, it makes sense to provide a reading system that allows EPUB to take advantage of its capabilities.

Readk.it does not aspire to cater for all of the functionality of the EPUB standard (as we've got [Readium](http://readium.org/) for that), rather it tries to provide a graceful reading experience for the majority of EPUB which are typically found in the wild. If Readk.it can allow the majority of EPUB files to be read on a wide range of devices, and also content designed with responsive design techniques to appear similarly, then it's done its job.

Readk.it builds on the efforts of others, notably Matteo Spinelli's [iScroll4](http://cubiq.org/iscroll-4), as well as [jQuery](http://jquery.com/) and [RequireJs](http://requirejs.org/), while the Readk.it Manifesto provides an example of the use of [enquire.js](http://wicky.nillia.ms/enquire.js/) for JavaScript-based Media Queries.

##Limitations

###Single-page app
Readk.it chooses a model whereby it loads all EPUB files into a single page. It's smart enough to rewrite internal urls and anchors (preventing collisions), and any JavaScript files specifically required by the EPUB can also be [configured to be loaded](#client.config.js).

The reason Readk.it adopts this behaviour is to allow a simple means of loading the entire EPUB, such that it can then be read without further recourse to the server. With the use of app cache to store all of the EPUB assets client-side and thereby allow further reading offline, this approach also makes sense.

However, the main limitation this imposes is one of file size; this approach works well for normal-length text-based EPUBs but if your EPUB contains lots of media (particularly video), then you may find that it takes a long time for the publication to load (providing the browser doesn't time-out). Similarly, for large text-based publications such as Moby Dick, your experience will differ depending on the capabilities of your deivce. Moby Dick is not so much large as extensive, with the EPUB in the Readk.it library containing around 150 files, each of which has to be loaded before the publication can be displayed. For instance, my testing has shown that it loads generally well in desktop browsers, will load in my Kindle HD tablet (although taking about two minutes to do so), and I've yet to get it to load in my aging iPhone 3GS. The solution to this is simple: split your publication up into a series of smaller publications, and consider using the [Readk.it library configuration](#library) to serve them.

###EPUB-lite
The EPUB standard is verbose and complex ([canonical fragment identifiers](http://www.idpf.org/epub/linking/cfi/), anyone?) and Readk.it makes no attempt to do much more than provide a mechanism for prising open an EPUB and wrapping it with a basic but functional navigation system. That's not to say that it couldn't be extended to support specific (and ocassionally esoteric) EPUB functionality in the way that [Readium](http://readium.org/) has, however the high majority of users should find that what Readk.it provides is ample. This is somewhat in the spirit of [EPUB Zero](http://epubzero.blogspot.co.nz/2013/02/epub-zero-radically-simpler-e-book.html), if somewhat less heretical in being able to cope with the existing EPUB file structure and metadata layout.

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

####<a id="client.config.js"></a>client.config.js
As Readk.it operates by compiling all of the EPUB XHTML files into a single HTML page (and thereby ignoring their HEADs), if your publication needs access to JavaScript files/libraries other than those that Readk.it uses, these can be specified in <code>readk.it/js/client.config.js</code>, for example: 

    var client = {
        // The paths for our EPUB assets
        paths: {
            client_js: '../../../js'
        },
        // The required modules for our EPUB assets
        required: [
            'client_js/libs/modernizr.min',
            'client_js/libs/detectizr.min',
            'client_js/libs/jquery.easing.1.3.min',
            'client_js/libs/jquery.fitvids.min',
            'client_js/libs/enquire.min',
            'client_js/script',
            'client_js/queries'
        ]
    };

Prior to building, this folder tree (<code>readk.it/js/client.config.js</code>) should be dropped into directory of your EPUB that contains the opf file, for example:

    META-INF
    OEBPS
        content.opf
        readk.it
            js
                client.config.js

####Content-opf
In this mode Readk.it is included in the EPUB file, and travels with the EPUB file.


####Building

Readk.it uses [Grunt](http://gruntjs.com/) (the Javascript build tool) as its build tool. In order to compile EPUBs with ReadK.it, you'll need to:

1. [install node](http://nodejs.org/download/)
1. [install grunt](http://gruntjs.com/installing-grunt)
1. copy your EPUB to the EPUB directory
1. At a command line, navigate to the top-level directory and simply issue the command:

        grunt

This will create a <code>dist</code> directory, inside of which you'll find your EPUB file which includes Readk.it, optimised for performance, with all the Readk.it js and css minified and concatenated.

If you want to create a development version, with Readk.it js and css unminified and unconcatenated, then simply run:

        grunt dev

Grunt performs the following tasks:

* compiling the SASS code into CSS
* minifying the Readk.it CSS and javascript
* assembling only the files that actually needs to be in the EPUB
* checking the JavaScript files for consistency
* zipping the files up into an EPUB


* running a web server so that you can view your publication in a browser by navigating to <code>http://localhost:8000/OEBPS/readk.it/</code>

Note that the actual Readk.it Manifesto content is not optimised; this is intentional in order to preserve the sanity of future production staff who have to work with the EPUB content files to produce a new version. Although not ideal, it often happens that production staff only have recourse to the published files when producing the next version of content, say because the original source files have been lost, are not available, or are obsolete.

#####Patches

We've had to make some patches to the moudles in grunt-dom-munger in order to get them to work properly, namely:

1. ```node_modules/grunt-dom-munger/tasks/dom_munger.js```

    In the function ```processFile``` change:

        updatedContents = $.html();  

    to 

        if (options.xmlMode) {
          updatedContents = $.xml();
        } else {
          updatedContents = $.html();  
        }

2. ```node_modules/grunt-dom-munger/node_modules/cheerio/node_modules/htmlparser2/lib/Parser.js```

    Comment out the meta reference in voidElements, otherwise we end up with broken meta tags in the opf file (specifically, meta tags that have both an opening and a closing tag lose their closing tag):

        var voidElements = {
        ...
        //  meta: true,
        ...
        };

###<a id="library"></a>Library mode
Library mode is as easy to setup as single-publication mode:

* Drop your exploded EPUB files into the <code>readk.it/library/html</code> folder

* Create the manifest with <code>readk.it/library/manifest.maker.py</code>:

        python manifest.maker.py > manifest.json

* [fire up a webserver](#webserver) and navigate to <code>http://localhost:8000/readk.it/library/library.html</code>

Note that, in this case, the directory containing the readk.it folder is the web server content root.

##Technical notes

### Design considerations ###

#### Browser compatibility ####
As Readk.it was built to take advantage of the features of modern browsers, it will not work on older browsers such as anything prior to Internet Explorer 10. It makes use of the new <a href="http://blog.jquery.com/2013/04/18/jquery-2-0-released/">jQuery 2.0 build</a>, which is not backwards-compatible with IE 6/7/8.

Also, in terms of modern browsers we discount Opera Mini, and in some cases the native Android Browser (but not other browsers such as Chrome for Android), as both these browsers don't have support certain features such as WOFF.

#### Fonts ####
Readk.it use web-fonts, specifically [WOFF](https://developer.mozilla.org/en-US/docs/Web/Guide/WOFF), to allow the user to switch between a standard serif (Lora) and sans-serif (Source Sans Pro) face if they don't want to use the face natively (if any) used by the EPUB. WOFF has good [cross-browser support](http://caniuse.com/woff) these days in recent browser versions, and is compressed. These two fonts have been optimised using the Font Squirrel generator, so together occupy only 310KB of space. Note that, to achieve this we've had to reduce to weights that we use, as well as removing non-latin glyphs. Before doing this, these fonts occupied 650KB (Lora) and 1.4MB (Source Sans Pro) for a total payload of more than 2MB.

Also, we've used to wonderful [Fontello](http://fontello.com/) service to minimise the font icons we use, meaning that our Fontelloed WOFF occupies only 6KB. Notice that, however, for the actual EPUB content, you should provide both WOFFs (for optimal use in browsers) and Truetypes (for use in dedicated eBook reading devices). The Readk.it Manifesto uses [Lato](http://www.google.com/fonts/specimen/Lato), which occupies aroud 450KB.

#### JavaScript ####
It goes without saying that, without JavaScript support, Readk.it will not function (although the EPUB containing ReadKit will still work fine conventionally in reading systems that don't support JavaScript). Readk.it uses JavaScript to perform the retrieval and layout of the files in the EPUB, as well as linking up the Readk.it navigation controls.

Readk.it uses only CSS for Media Query support for differing device sizes, and not JavaScript. However, if you look into the Readk.it Manifesto EPUB you will find use of a JavaScript library, [enquire.js](http://wicky.nillia.ms/enquire.js/), used to provide JavaScript-based Media Query support for features such as detection of desktop browsers (e.g. for support of full-screen mode, which is not found in mobile browsers or dedicated reading devices).

Readk.it supplies its own version of jQuery and takes advantage of jQuery's behaviour of defining itself globally, so there's no need to include your own version of jQuery, either in your content or in the OPF. 

###<a id="webserver"></a>Setting up a local webserver

We use the [grunt-contrib-connect](https://github.com/gruntjs/grunt-contrib-connect) package to provide a simple web server.

If running the entire grunt process (i.e. <code>grunt</code>), then the webserver will be started as the last step in the process. Once the webserver has started, visit the following URLs:

* [The readk.it manifesto: http://localhost:8000/OEBPS/readk.it/index.html](http://localhost:8000/OEBPS/readk.it/)

* [The readk.it library: http://localhost:8000/OEBPS/readk.it/library/library.html](http://localhost:8000/OEBPS/readk.it/library/library.html)

* [The readk.it testing framework: http://localhost:8000/OEBPS/readk.it/js/test/](http://localhost:8000/OEBPS/readk.it/js/test/)

Note that the <code>Gruntfile.js</code> specifies <code>keepalive: true</code> for the webserver task, so when finished you'll need to <code>CTRL+C</code> to stop it.

###<a id="grunt"></a>Grunt

Install grunt:

    npm uninstall -g grunt

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
    npm install grunt-contrib-compass --save-dev
    npm install grunt-contrib-nodeunit --save-dev
    npm install grunt-contrib-watch --save-dev
    npm install grunt-zip --save-dev
    npm install grunt-shell --save-dev
    npm install grunt-contrib-connect --save-dev
    npm install grunt-contrib-requirejs --save-dev
    npm install grunt-readkit-dom-munger --save-dev
    npm install grunt-readkit-datauris --save-dev
    npm install grunt-image-embed --save-dev
    npm install grunt-bake --save-dev

As we use cygwin, add the following hack into node_modules\grunt-contrib-compass\tasks\compass.js, directly before "compile(args, cb);":

      if (args[0] === 'compass.bat') {
        console.log("Our little hack to get 'grunt compass' to work in cygwin -- don't use compass.bat");
        args.shift();
        args.unshift('/usr/bin/compass');
        args.unshift('ruby.exe');
        console.log(args);
      }
