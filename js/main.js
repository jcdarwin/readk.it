var epub_dir = "../html/mansfield_at_the_bay";

requirejs.config({
    // specify our dependencies
    shim: {
        'iscroll': ['jquery'],
        'layout':  ['iscroll'],
        'chrome':  ['layout'],
        'epub_utilities': ['chrome']
    }
});

require(["jquery", "iscroll", "layout", "chrome", "epub_utilities"], function($) {
    $(function() {
         $.get(epub_dir + '/META-INF/container.xml', {}, load_container);
    });
});

function load_container(f) {
    container(f, load_publication);
}

function load_publication(entries) {
    console.log(entries);

    $.each(entries, function(index, value){
        console.log(value.href);
        // Use the requirejs/text plugin to load our html resources.
        // https://github.com/requirejs/text
        require(["text!" + value.href + "!strip"],
            function(html) {
                $('#pageScroller').append('<div class="page"><div id="' + value.id + '" class="wrapper"><div class="scroller">' + html + '</div></div></div>');
                updateLayout();
                scrollers.push( new iScroll(value.id, {hScrollbar: false, vScrollbar: false, lockDirection: true }) );
            }
        );

    });
}
