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
        this.nav_file = '';
        this.toc_entries = [];
        this.css_entries = [];
        this.version = '';
        this.title = '';
        this.author = '';
        this.identifier = '';
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
        epub.version = $(f).find('package').attr('version');
        if ( typeof(epub.version) === 'undefined') {
            epub.version = $(f).filter(':first').attr('version');
        }

        epub.title = $(f).find('title').text();  // Safari
        // Firefox
        if (epub.title === null || epub.title === '') {
            epub.title = $(f).find('dc\\:title').text();
        }

        epub.author = $(f).find('creator').text();

        epub.identifier = $(f).find('identifier').text();  // Safari
        // Firefox
        if (epub.identifier === null || epub.identifier === '') {
            epub.identifier = $(f).find('dc\\:identifier').text();
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
            epub.toc_entries.push({id: $(this).attr('idref'), file: file, title: '', href: '/' + epub.epub_dir + epub.oebps_dir + '/' + href, path: href.replace(/[^\/]*?$/, '')});
        });

        // Read the css entries
        $(f).find('manifest ' + opf_item_tag + '[media-type="text/css"]').each(function() {
            var href = $(this).attr('href');
            var file = href.replace(/\//g, '_');
            epub.css_entries.push({id: $(this).attr('id'), file: file, title: '', href: '/' + epub.epub_dir + epub.oebps_dir + '/' + href, path: href.replace(/[^\/]*?$/, '')});
        });

        // processs the ncx or nav file
        var toc = $(f).find('spine[toc]').attr('toc');

        if (toc) {
            // EPUB 2
            epub.ncx_file = $(f).find('manifest ' + opf_item_tag + '[id="' + toc + '"]').attr('href');
            epub.ncx_file = epub.epub_dir + epub.oebps_dir + '/' + epub.ncx_file;
            $.get(epub.ncx_file, {}, function(data){ncx(data, epub, callback);});
        } else {
            // EPUB 3
            epub.nav_file = $(f).find('manifest ' + opf_item_tag + '[properties="nav"]').attr('href');
            epub.nav_file = epub.epub_dir + epub.oebps_dir + '/' + epub.nav_file;
            $.get(epub.nav_file, {}, function(data){nav(data, epub, callback);});
        }
    };

    /* Open the ncx file and read some useful metadata from it */
    var ncx = function (f, epub, callback) {
        $(f).find('navMap navPoint').each(function() {
            var text = $(this).find('navLabel text').text();
            var src = $(this).find('content').attr('src');
            var file = src.replace(/\//g, '_');
            var filtered_toc_entries = epub.toc_entries.filter(function (item) {
                return item.file == file;
            });
            filtered_toc_entries[0]['title'] = text;
        });

        callback(epub.toc_entries, epub.css_entries);
    };

    var nav = function (f, epub, callback) {
        $(f).find('li a').each(function() {
            var href = $(this).attr('href');
            var file = href.replace(/\//g, '_');
            file = file.replace(/#.*/g, '');
            var filtered_toc_entries = epub.toc_entries.filter(function (item) {
                return item.file == file;
            });
            filtered_toc_entries[0]['title'] = $(this).text();
        });

        callback(epub.toc_entries, epub.css_entries);
    };



    return (Epub);

});
