/*
** epub.js
**
** Author: Jason Darwin
**
** Utility functions for parsing EPUB files.
** With thanks to Liza Daly.
*/

define([
    'jquery'
], function($){

    var toc_entries;

    /* Constructor */
    function Epub (d, f, callback) {
        this.epub_dir = d;
        toc_callback = callback;
        $.get(d + f, {}, function(data){container(data, this, d, callback);});
    }

    /* Define the instance methods. */
    Epub.prototype = {
        getToc: function(){
            return (toc_entries);
        }
    };

    /* Open the container file to find the resources */
    var container = function (f, epub, epub_dir, callback) {
        epub.toc_entries = [];
        epub.opf_file = $(f).find('rootfile').attr('full-path');
        // Get the OEPBS dir, if there is one
        if (epub.opf_file.indexOf('/') !== -1) {
            epub.oebps_dir = epub.opf_file.substr(0, epub.opf_file.lastIndexOf('/'));
        }
        epub.opf_file = epub_dir + '/' + epub.opf_file;
        $.get(epub.opf_file, {}, function(data){opf(data, epub, epub_dir, callback);});
    };

    /* Open the OPF file and read some useful metadata from it */
    var opf = function (f, epub, epub_dir, callback) {
        // Get the document title
        // Depending on the browser, namespaces may or may not be handled here
        var version = $(f).filter(":first").attr('version');
        var title = $(f).find('title').text();  // Safari
        var author = $(f).find('creator').text();
        $('#content-title').html(title + ' by ' + author);
        // Firefox
        if (title === null || title === '') {
            $('#content-title').html($(f).find('dc\\:title').text() + ' by ' +  $(f).find('dc\\:creator').text());
        }

        var opf_item_tag = 'opf\\:item';
        if ($(f).find('opf\\:item').length === 0) {
           opf_item_tag = 'item';
        }

        switch( version ) {
            case '2.0':
                // Get the NCX
                $(f).find(opf_item_tag).each(function() {
                    // Cheat and find the first file ending in NCX
                    if ( $(this).attr('href').indexOf('.ncx') !== -1) {
                        ncx_file = epub_dir + '/' + epub.oebps_dir + '/' + $(this).attr('href');
                        $.get(ncx_file, {}, function(data){ncx(data, epub, epub_dir, callback);});
                    }
                });
                break;
            case '3.0':
                // Get the TOC
                $(f).find(opf_item_tag).attr('[properties="nav"]').each(function() {
                    toc_file = epub_dir + '/' + epub.oebps_dir + '/' + $(this).attr('href');
                    $.get(toc_file, {}, function(data){toc(data, epub, epub_dir, callback);});
                });
                break;
        }
        
    };

    /* Open the NCX, get the first item and open it */
    var ncx = function (f, epub, epub_dir, callback) {
        $(f).find('navPoint').each(function() {
            epub.toc_entries.push({id: $(this).attr('id'), title: $(this).find('text:first').text(), href: epub_dir + '/' + epub.oebps_dir + '/' + $(this).find('content').attr('src')});
            // If 's' has a parent navPoint, indent it
            //if ($(this).parent()[0].tagName.toLowerCase() == 'navpoint') {
            //  s.addClass('indent');
            //}
        });

        callback(epub.toc_entries);
    };

    /* Open the TOC, get the first item and open it */
    var toc = function (f, epub, epub_dir, callback) {

        $(f).find('li a').each(function() {
            epub.toc_entries.push({id: $(this).attr('href'), title: '', href: epub_dir + '/' + epub.oebps_dir + '/' + $(this).attr('href')});
            // If 's' has a parent navPoint, indent it
            //if ($(this).parent()[0].tagName.toLowerCase() == 'navpoint') {
            //  s.addClass('indent');
            //}
        });

        callback(epub.toc_entries);
    };

    return (Epub);

});
