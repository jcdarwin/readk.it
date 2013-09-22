/*
** epub.js
**
** Author: Jason Darwin
**
** Utility functions for parsing EPUB files.
** With thanks to Liza Daly.
*/

 /*global define:false */
define([
    'jquery',
    'app/utility'
], function($, utility){

    /* Main function controlling the processing of the epub. */
    function Epub (d, f, callback, files) {
        var self = this;
        this.epub_dir = d;
        this.oebps_dir = '';
        this.opf_file = '';
        this.ncx_file = '';
        this.nav_file = '';
        this.nav_entries = [];
        this.spine_entries = [];
        this.css_entries = [];
        this.version = '';
        this.title = '';
        this.author = '';
        this.description = '';
        this.publisher = '';
        this.language = '';
        this.rights = '';

        this.identifier = '';
        this.content = '';

        if (files) {
            // Decode Data URIs
            for (var i in files) {
                files[i] = utility.decode(i, files[i]);
            }

            this.content = files;
            container(files[f], self, callback, files);
        } else if (f){
            $.get(d + f, {}, function(data){container(data, self, callback);});
        } else {
            callback(self);
        }
        return this;
    }

    // Define the instance methods.
    Epub.prototype.getToc = function(id){
        if (!id) {
            return (this.spine_entries);
        } else {
            for(var i = 0; i < this.spine_entries.length; i++) {
                if (this.spine_entries[i].id === id) {
                    return this.spine_entries[i];
                }
            }
        }
    };

    /* Open the container file to find the resources */
    var container = function (f, epub, callback, files) {
        epub.opf_file = $(f).find('rootfile').attr('full-path');
        // Get the OEPBS dir, if there is one
        if (epub.opf_file && epub.opf_file.indexOf('/') !== -1) {
            epub.oebps_dir = epub.opf_file.substr(0, epub.opf_file.lastIndexOf('/'));
        }
        epub.opf_file = epub.epub_dir + epub.opf_file;

        if (files) {
            opf(files[epub.opf_file], epub, callback, files);
        } else {
            $.get(epub.opf_file, {}, function(data){opf(data, epub, callback);});
        }
    };

    /* Open the OPF file and read some useful metadata from it */
    var opf = function (f, epub, callback, files) {
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
        if (epub.author === null || epub.author === '') {
            epub.author = $(f).find('dc\\:creator').text();
        }

        epub.description = $(f).find('description').text();
        if (epub.description === null || epub.description === '') {
            epub.description = $(f).find('dc\\:description').text();
        }

        epub.publisher = $(f).find('publisher').text();
        if (epub.publisher === null || epub.publisher === '') {
            epub.publisher = $(f).find('dc\\:publisher').text();
        }

        epub.language = $(f).find('language').text();
        if (epub.language === null || epub.language === '') {
            epub.language = $(f).find('dc\\:language').text();
        }

        epub.rights = $(f).find('rights').text();
        if (epub.rights === null || epub.rights === '') {
            epub.rights = $(f).find('dc\\:rights').text();
        }

        epub.identifier = $($(f).find('identifier')[0]).text();  // Safari
        // Firefox
        if (epub.identifier === null || epub.identifier === '') {
            epub.identifier = $($(f).find('dc\\:identifier')[0]).text();
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
            epub.spine_entries.push({id: $(this).attr('idref'), file: file, title: '', href: '/' + epub.epub_dir + (epub.oebps_dir ? epub.oebps_dir + '/' : '') + href, url: href, path: href.replace(/[^\/]*?$/, '')});
        });

        // Read the css entries
        $(f).find('manifest ' + opf_item_tag + '[media-type="text/css"]').each(function() {
            var href = $(this).attr('href');
            var file = href.replace(/\//g, '_');
            epub.css_entries.push({id: $(this).attr('id'), file: file, title: '', href: '/' + epub.epub_dir + (epub.oebps_dir ? epub.oebps_dir + '/' : '') + href, url: href, path: href.replace(/[^\/]*?$/, '')});
        });

        // processs the ncx or nav file
        var toc = $(f).find('spine[toc]').attr('toc');

        if (toc) {
            // EPUB 2
            epub.ncx_file = $(f).find('manifest ' + opf_item_tag + '[id="' + toc + '"]').attr('href');
            epub.ncx_file = epub.epub_dir + (epub.oebps_dir ? epub.oebps_dir + '/' : '') + epub.ncx_file;

            if (files) {
                ncx(files[epub.ncx_file], epub, callback);
            } else {
                $.get(epub.ncx_file, {}, function(data){ncx(data, epub, callback);});
            }
        } else {
            // EPUB 3
            epub.nav_file = $(f).find('manifest ' + opf_item_tag + '[properties="nav"]').attr('href');
            epub.nav_file = epub.epub_dir + epub.oebps_dir + '/' + epub.nav_file;

            if (files) {
                nav(files[epub.nav_file], epub, callback);
            } else {
                $.get(epub.nav_file, {}, function(data){nav(data, epub, callback);});
            }
        }
    };

    /* Open the ncx file and read some useful metadata from it */
    var ncx = function (f, epub, callback) {
        $(f).find('navMap navPoint').each(function() {
            var id = $(this).attr('id');
            var text = $(this).find('navLabel text').first().text();
            var src = $(this).find('content').attr('src');
            var file = src.replace(/\//g, '_');
            var filtered_spine_entries = epub.spine_entries.filter(function (item) {
                return item.file === file;
            });
            if (filtered_spine_entries[0]) {
                filtered_spine_entries[0]['title'] = text;
            }

            if (/#/.test(src)) {
                if (src.substr(0,1) === '#') {
                    // We must have something like '#milestone1'; convert to '#chapter1_milestone1'
                    src = file + '_' + src.substr(1);
                } else {
                    // We must have something like 'text/chapter2#milestone1'; convert to '#text_chapter2#milestone1'
                    src = src.replace(/\//g, '_').replace(/#/g, '_');
                }
            }

            epub.nav_entries.push({
                id:    id,
                file:  file,
                title: text,
                href:  '/' + epub.epub_dir + epub.oebps_dir + '/' + src,
                url:   src,
                path:  src.replace(/[^\/]*?$/, ''),
                depth: $(this).parents('navPoint').length
            });
        });

        callback(epub);
    };

    var nav = function (f, epub, callback) {
        $(f).find('li a').each(function() {
            var href = $(this).attr('href');
            var file = href.replace(/\//g, '_');
            file = file.replace(/#.*/g, '');
            var filtered_spine_entries = epub.spine_entries.filter(function (item) {
                return item.file === file;
            });
            if (filtered_spine_entries[0]) {
                filtered_spine_entries[0]['title'] = $(this).text();
            }

            if (/#/.test(href)) {
                if (href.substr(0,1) === '#') {
                    // We must have something like '#milestone1'; convert to '#chapter1_milestone1'
                    href = file + '_' + href.substr(1);
                } else {
                    // We must have something like 'text/chapter2#milestone1'; convert to '#text_chapter2#milestone1'
                    href = href.replace(/\//g, '_').replace(/#/g, '_');
                }
            }

            epub.nav_entries.push({
                id:    href,
                file:  file,
                title: $(this).text(),
                href:  '/' + epub.epub_dir + epub.oebps_dir + '/' + href,
                url:   href,
                path:  href.replace(/[^\/]*?$/, ''),
                depth: $(this).parents('ul,ol').length - 1
            });
        });

        callback(epub);
    };

    return (Epub);

});
