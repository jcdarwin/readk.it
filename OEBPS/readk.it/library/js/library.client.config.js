var client = {
    // The paths for our EPUB assets
    paths: {
        client_js: '../../library/js',
        client_css: '../../library/css'
    },
    // The required modules for our EPUB assets
    required: [
    'client_js/script',
        'css!client_css/epub.css'
    ]
};