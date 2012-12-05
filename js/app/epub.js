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

    /* Main function controlling the processing of the epub. */
    function Epub (d, f, callback) {
        var self = this;
        this.epub_dir = d;
        this.oebps_dir = '';
        this.opf_file = '';
        this.ncx_file = '';
        this.toc_entries = [];
        $.get(d + f, {}, function(data){container(data, self, callback);});
        return this;
    }

    // Define the instance methods.
    Epub.prototype.getToc = function(id){
        if (!id) {
            return (this.toc_entries);
        } else {
            for(var i = 0; i < toc_entries.length; i++) {
                if (toc_entries[i].id == id) {
                    return toc_entries[i];
                }
            }
        }
    };

    /* Open the container file to find the resources */
    var container = function (f, epub, callback) {
        epub.opf_file = $(f).find('rootfile').attr('full-path');
        // Get the OEPBS dir, if there is one
        if (epub.opf_file.indexOf('/') !== -1) {
            epub.oebps_dir = epub.opf_file.substr(0, epub.opf_file.lastIndexOf('/'));
        }
        epub.opf_file = epub.epub_dir + epub.opf_file;
        $.get(epub.opf_file, {}, function(data){opf(data, epub, callback);});
    };

    /* Open the OPF file and read some useful metadata from it */
    var opf = function (f, epub, callback) {
        // Get the document title
        // Depending on the browser, namespaces may or may not be handled here
        var version = $(f).find('package').attr('version');
        if ( typeof(version) === 'undefined') {
            version = $(f).filter(':first').attr('version');
        }
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

        // Read the spine entries
        $(f).find('spine itemref').each(function() {
            var idref = $(this).attr('idref');
            var href = $(f).find('manifest ' + opf_item_tag + '[id="' + idref + '"]').attr('href');
            var file = href.replace(/\//g, '_');
            epub.toc_entries.push({id: $(this).attr('idref'), file: file, href: epub.epub_dir + '/' + epub.oebps_dir + '/' + href});
        });

        callback(epub.toc_entries);
    };

    return (Epub);

});
