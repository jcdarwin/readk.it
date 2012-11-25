/*
** epub_utilities.js
**
** Author: Jason Darwin
**
** Utility functions for parsing EPUB files.
** With thanks to Liza Daly.
*/

// Globals
var oebps_dir = '';
var opf_file = '';
var ncx_file = '';
var toc_entries = [];
var toc_callback;

/* Open the container file to find the resources */
function container(f, c) {
    toc_callback = c;
    opf_file = $(f).find('rootfile').attr('full-path');
    // Get the OEPBS dir, if there is one
    if (opf_file.indexOf('/') != -1) {
        oebps_dir = opf_file.substr(0, opf_file.lastIndexOf('/'));
    }
    opf_file = epub_dir + '/' + opf_file;
    $.get(opf_file, {}, opf);
}

/* Open the OPF file and read some useful metadata from it */
function opf(f) {
    // Get the document title
    // Depending on the browser, namespaces may or may not be handled here
    var title = $(f).find('title').text();  // Safari
    var author = $(f).find('creator').text();
    $('#content-title').html(title + ' by ' + author);
    // Firefox
    if (title === null || title === '') {
        $('#content-title').html($(f).find('dc\\:title').text() + ' by ' +  $(f).find('dc\\:creator').text());
    }
    // Get the NCX
    var opf_item_tag = 'opf\\:item';
    if ($(f).find('opf\\:item').length === 0) {
       opf_item_tag = 'item';
    }

    $(f).find(opf_item_tag).each(function() {
        // Cheat and find the first file ending in NCX
        if ( $(this).attr('href').indexOf('.ncx') != -1) {
            ncx_file = epub_dir + '/' + oebps_dir + '/' + $(this).attr('href');
            $.get(ncx_file, {}, toc);
        }
    });
    
}

/* Open the TOC, get the first item and open it */
function toc(f) {
    
    $(f).find('navPoint').each(function() {
        toc_entries.push({id: $(this).attr('id'), title: $(this).find('text:first').text(), href: epub_dir + '/' + oebps_dir + '/' + $(this).find('content').attr('src')});
        // If 's' has a parent navPoint, indent it
        //if ($(this).parent()[0].tagName.toLowerCase() == 'navpoint') {
        //  s.addClass('indent');
        //}
    });

    toc_callback(toc_entries);
}
