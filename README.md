#Readk.it: digital reading simplified

##Introduction

Readk.it is a lightweight JavaScript-based reading system that allows publishers to distribute responsive content that can be read in a book-like form in modern browsers on practically all devices.

Readk.it can be combined with content in a single file, either EPUB or HTML, and travel with it, allowing future browser users to view the publication as the publisher intended. Readk.it can also be used to serve up a library of EPUB titles, allowing publishers to easily web-serve their existing EPUB files.

If you prefer to have a single HTML file that can be distributed to a user such that they can double-click on the file to view it in the browser, Readk.it Solo will provide this. Finally, when viewing any Readk.it-enabled publication in the browser, the user is able to drag-and-drop another (non-DRM) EPUB into the browser page to begin reading the new publication.

Readk.it builds on the efforts of others, notably Matteo Spinelli's [iScroll4](http://cubiq.org/iscroll-4), as well as [jQuery](http://jquery.com/) and [RequireJs](http://requirejs.org/), while the Readk.it Manifesto provides an example of the use of [enquire.js](http://wicky.nillia.ms/enquire.js/) for JavaScript-based Media Queries.

More information, along with examples, can be found on the [Readk.it](http://readk.it) site.

##<a id="flavours"></a>Flavours

Readk.it comes in four flavours:

1. **readkit.solo**: a self-contained HTML file is produced by combining Readk.it with an EPUB. This provides for a single file which can be distributed to users, and which can also be easily opened for reading by double-clicking.

1. **readkit.library**: a number of readkit.solo files that they can be web-served as a collection, with the user able to choose any from the library for reading.

1. **readkit.epub**: a valid EPUB build, with Readk.it included as part of the EPUB such that it can travel along with it. In this case, the EPUB can be opened at any time and Readk.it web-served to allow a browser-based reading experience of the EPUB content.

1. **readkit.reader**: a version of Readk.it which does not itself contain any EPUB content, but which can either be web-served or double-clicked to allow the user to drag-and-drop an EPUB file of their choosing onto the page for reading using Readk.it. Note that all other flavours of Readk.it also provide this functionality.


##Before we begin

###Technologies
Although not necessary to make use of Readk.it, a knowledge of certain technologies is useful in order to understand how Readk.it works and how it can be tweaked or extended:

* [EPUB](http://idpf.org/epub)
* [JavaScript](https://en.wikipedia.org/wiki/JavaScript) (naturally)
* [RequireJs](http://requirejs.org/) (for modular JavaScript development)
* [Grunt](http://gruntjs.com/) (the JavaScript build tool)
* [SASS](http://sass-lang.com/) (for sane CSS development)


##Getting started

###Drag-and-Drop
Perhaps the easiest way to use Readk.it is to simply double-click on the index.html file in the readk.it folder to open it in a browser, and then drag and drop an EPUB onto the page. Providing your EPUB is of a reasonable size, it should then display in the browser.

###Embedding Readk.it
Embedding Readk.it inside an EPUB file can be as easy as dropping the readk.it folder into the OEBPS (or equivalent) folder of your EPUB.
You may want to try this before running a complete build; to be able to read the publication, you'll then need to serve it with a web-server. I tend to fire up an instance of the [node http-server](https://github.com/nodeapps/http-server) and navigate to <code>http://localhost:8000/OEBPS/readk.it/</code>. Note that, in this case, the EPUB directory is the web server content root.

Note that it is assumed that, in this case, the root directory of the EPUB is reached from the readk.it folder using <code>../..</code> &#8212; if this is not the case, amend the <code>epub_directory</code> parameter in <code>readk.it/js/app/config.js</code> accordingly.

##Building

Readk.it uses [Grunt](http://gruntjs.com/) as its build tool. In order to compile EPUBs with Readk.it, you'll need to:

1. Ensure that you have [Python](http://www.python.org/), [Ruby and Compass installed](http://compass-style.org/install/) on your system
1. [Install node](http://nodejs.org/download/) and npm
1. [Install grunt](http://gruntjs.com/getting-started): ```npm install -g grunt-cli```
1. [Install lxml python module](http://lxml.de/): ```pip install lxml```
1. Clone the Readk.it repository
1. ```cd``` to the Readk.it directory
1. Install the node modules for the application: ```npm install```
1. Copy your unzipped EPUBs to the **readkit.epub** directory, one EPUB per folder
1. At a command line, navigate to the top-level directory and simply issue the command:

        grunt

This will create a <code>dist</code> directory, inside of which you'll find the various flavours of Readk.it.

If you want to create a development version, with Readk.it js and css unminified and unconcatenated, then simply run:

        grunt dev

Grunt performs the following tasks:

* compiling the Readk.it SASS code into CSS
* minifying the Readk.it CSS and JavaScript
* assembling only the files that actually needs to be in the output files
* checking the JavaScript files for consistency
* zipping the files up into an EPUB

Note that the actual EPUB content is not optimised; this is intentional in order to preserve the sanity of future production staff who have to work with the EPUB content files to produce a new version. Although not ideal, it often happens that production staff only have recourse to the published files when producing the next version of content, say because the original source files have been lost, are not available, or are obsolete.

###Outputs

A successful Readk.it build will result in the following outputs in the <code>dist</code> folder.

1. **readkit.solo**: a self-contained HTML file produced by combining Readk.it with the content of each EPUB. This provides for a single file which can be distributed to users, but which can also be easily opened for reading by double-clicking.

1. **readkit.epub**: the compiled EPUBs with Readk.it included, each named with the identifier and title in order to provide a unique but recognisable name. Also in this directory is the unzipped content of each EPUB, containting Readk.it. This content can be web-served to allow a browser-based reading experience of the EPUB content, e.g. <code>http://localhost:8000/OEBPS/readk.it/</code>. Note that the root directory for the web server should be the root directory of the EPUB (i.e. the directory containing the META-INF directory).

1. **readkit.library**: the readkit.solo HTML files such that they can be web-served as a collection, with the user able to choose any from the library for reading. In this case, the root directory for the web server should be <code>dist/readkit.library</code>, with the library being served as <code>http://localhost:8000/library/library.html</code>

1. **readkit.reader**: a version of Readk.it which does not itself contain any EPUB content, but which can either be web-served or double-clicked to allow the user to drag-and-drop an EPUB file of their choosing onto the page for reading using Readk.it. Note that all other flavours of Readk.it also provide this functionality.

##Configuration

###config.js
If you build normally or drop the readk.it folder into the OEBPS (or equivalent) folder, you won't need to make changes, however if you decide to place the readk.it folder elsewhere, then you can specify this path in <code>readk.it/js/app/config.js</code>:

    define({
        // Normally the readk.it folder will live directly in the OEBPS folder,
        // so we'll be serving something like http://localhost:8000/OEBPS/readk.it/
        // The Epub directory is therefore ../../, but if we want Readk.it to 
        // live in a different place, we can specify another directory.
        epub_directory: "../../"
    });

This path is used by Readk.it to navigate from the readk.it folder up to where the EPUB's <code>META-INF/container.xml</code> lives.

Other settings in this file control aspects of Readk.it behaviour, such as intervals and durations that may need to be tweaked for larger publications (or slower reading devices).

###<a id="client.config.js"></a>client.config.js
As Readk.it operates by compiling all of the EPUB XHTML files into a single HTML page (and thereby ignoring their HEAD elements and any scripts defined therein), if your publication needs access to JavaScript files/libraries other than those that Readk.it uses, these can be specified in <code>readk.it/js/client.config.js</code>, for example: 

    var client = {
        // The paths for our EPUB assets
        paths: {
            client_js: '../../../js'
        },
        // The required modules for our EPUB assets.
        // Note that we don't need to specify the following as Readk.it 
        // has them baked in:
        // * jQuery2
        // * Modernizr
        // * Detectizr
        required: [
            /* E.G.
            'client_js/libs/enquire.min',
            'client_js/libs/screenfull.min',
            'client_js/script',
            'client_js/queries'
            */
        ],
        shims: {
            // We need to describe the dependencies of any non-AMD modules here
            // so that require.js loads them in the correct order.
            /* E.G.
            'client_js/queries': ['client_js/libs/enquire.min'],
            'client_js/script': ['client_js/queries']
            */
        }
    };

In order to fully understand the above syntax you'll need to be familiar with [RequireJs](http://requirejs.org/). Note that Readk.it makes the following JavaScript libraries globally available, so that your content can take advantage of them:

* [jQuery2](http://blog.jquery.com/2013/04/18/jquery-2-0-released/)
* [Modernizr](http://modernizr.com/)
* [Detectizr](https://github.com/barisaydinoglu/Detectizr)



##Technical notes

###Design considerations

#### Fonts ####
Readk.it use web-fonts, specifically [WOFF](https://developer.mozilla.org/en-US/docs/Web/Guide/WOFF), to allow the user to switch between a standard serif ([Lora](http://www.google.com/fonts/specimen/Lora)) and sans-serif ([Source Sans Pro](http://www.google.com/fonts/specimen/Source+Sans+Pro)) face if they don't want to use the face natively embedded in the EPUB. WOFF has good [cross-browser support](http://caniuse.com/woff) these days in recent browser versions, and is compressed. These two fonts have been optimised using the Font Squirrel generator, so together occupy only 310KB of space. Note that, to achieve this we've had to reduce to weights that we use, as well as removing non-latin glyphs. Before doing this, these fonts occupied 650KB (Lora) and 1.4MB (Source Sans Pro) for a total payload of more than 2MB.

Also, we've used to wonderful [Fontello](http://fontello.com/) service to minimise the font icons we use, meaning that our Fontelloed WOFF occupies only 6KB. Notice that, however, for the actual EPUB content, you should provide both WOFFs (for optimal use in browsers) and Truetypes (for use in dedicated eBook reading devices). The Readk.it Manifesto uses [Lato](http://www.google.com/fonts/specimen/Lato), which is around 450KB in size.

#### JavaScript ####
It goes without saying that, without JavaScript support, Readk.it will not function (although the EPUB containing Readk.it will still work fine conventionally in reading systems that don't support JavaScript). Readk.it uses JavaScript to perform the retrieval and layout of the files in the EPUB, as well as linking up the Readk.it navigation controls.

Readk.it itself uses only CSS for Media Query support for differing device sizes, and not JavaScript. However, if you look into the Readk.it Manifesto EPUB you will find use of a JavaScript library, [enquire.js](http://wicky.nillia.ms/enquire.js/), used to provide JavaScript-based Media Query support for features such as detection of desktop browsers (e.g. for support of full-screen mode, which is not needed in mobile browsers or dedicated reading devices).

###Testing

A simple testing framework is available: [http://localhost:8000/OEBPS/readk.it/js/test/](http://localhost:8000/OEBPS/readk.it/js/test/)

##Limitations

###Single-page app
Readk.it follows a model whereby it loads all EPUB files into a single web page. It's smart enough to rewrite internal URLs and anchors (preventing collisions), and any third-party JavaScript files specifically required by the EPUB can also be [configured to be loaded](#client.config.js).

The reason Readk.it adopts this behaviour is to allow a simple means of loading the entire EPUB, such that it can then be read without further recourse to the server. With the use of application cache to store all of the EPUB assets client-side and thereby allow further reading offline, this approach also makes sense.

However, the main limitation this imposes is one of file size; this approach works well for normal-length text-based EPUBs but if your EPUB contains lots of media (particularly video), then you may find that it takes a long time for the publication to load (providing the browser doesn't time-out). Similarly, for large text-based publications such as Moby Dick, your experience will differ depending on the capabilities of your deivce. Moby Dick is not so much large as extensive, containing around 150 files, each of which has to be loaded before the publication can be displayed. For instance, my testing has shown that it loads generally well in desktop browsers, will load in my Kindle HD tablet (although taking about two minutes to do so), and I've yet to get it to load in my aging iPhone 3GS. The solution to this is simple: split your publication up into a series of smaller publications, and consider using the [Readk.it library configuration](#library) to serve them.

###EPUB-lite
The EPUB standard is verbose and complex ([canonical fragment identifiers](http://www.idpf.org/epub/linking/cfi/), anyone?) and Readk.it does not attempt to do much more than provide a mechanism for prising open an EPUB and wrapping it with a simple but functional navigation system. That's not to say that it couldn't be extended to support specific (and ocassionally esoteric) EPUB functionality in the way that [Readium](http://readium.org/) does, however the high majority of users should find that what Readk.it provides is ample. This is somewhat in the spirit of [EPUB Zero](http://epubzero.blogspot.co.nz/2013/02/epub-zero-radically-simpler-e-book.html), if somewhat less heretical in being able to cope with the existing EPUB file structure and metadata layout.

###Cross-browser support
Readk.it has been designed to work with modern browsers, including Internet Explorer 10. However, it is not guaranteed to work seamlessly in all modern browsers, and known issues include:

####Data-URIs
Readk.it Solo makes use of Data URIs and blobs to allow all of the content to be included in a single file. Unfortuantely Internet Explorer 10 treats blobs as cross-origin and denies access when the content is opened as a file URL (i.e. double-clicked).  A ticket is currently open with Microsoft regarding this behaviour.

####jQuery2
Given that we are targeting modern browsers (and that Readk.it was designed primarily for use on mobile devices), we have made a conscious choice to go with [jQuery2](http://blog.jquery.com/2013/04/18/jquery-2-0-released/), meaning that older browsers are not catered for.

####Non-standard browsers
Browsers such as Opera Mini and the native Android browser are unlikely to support the functionaliy needed to allow Readk.it to work.

####Drag-and-Drop
Because of the security risks of using web-workers for file URLs, drag-and-drop will work when using file urls though it will be noticeably slower than when web-served (in this case the zip.js library falls back to using a single process to unzip EPUB assets).

##Patches

###grunt-readkit-dom-munger

The grunt-readkit-dom-munger plugin is a patched version of [grunt-dom-munger](https://github.com/cgross/grunt-dom-munger), created in order to support Readk.it requirements:

1. ```node_modules/grunt-dom-munger/tasks/dom_munger.js```

    In the function ```processFile``` change:

        updatedContents = $.html();  

    to 

        if (options.xmlMode) {
          updatedContents = $.xml();
        } else {
          updatedContents = $.html();  
        }

    and change

        grunt.config(['readkit_dom_munger','data',options.read.writeto],vals);

    to

        var writeto;
        if (options.read.concatenate) {
          writeto = grunt.config.get(['readkit_dom_munger','data',options.read.writeto]);
          writeto = writeto && writeto.length && vals.length ? writeto.concat(vals) : writeto && writeto.length ? writeto : vals;
        } else {
          writeto = vals;
        }
        grunt.verbose.writeln(('writeto: ' + writeto).cyan);
        grunt.config(['readkit_dom_munger','data',options.read.writeto],writeto);

2. ```node_modules/grunt-readkit-dom-munger/npm-shrinkwrap.json```

    We use ```npm-shrinkwrap.json``` to specify a hard dependency for our own version of [htmlparser2](https://github.com/jcdarwin/htmlparser2) (used by cheerio: ```node_modules/grunt-readkit-dom-munger/node_modules/cheerio/node_modules/htmlparser2/lib/Parser.js```), in which we've commented out the meta reference in voidElements, and added a few of the tags found in the .opf file:

        var voidElements = {
        ...
        //  Add extra tags found in the opf file.
            item: true,
            itemref: true,
            reference: true,
        //  Comment out the link and meta reference in voidElements, otherwise we end up with broken meta tags in the opf file 
        //  (specifically, meta tags that have both an opening and a closing tag lose their closing tag).
        //  meta: true,
        ...
        };
