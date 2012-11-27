define(function (require) {

    require(['./controller', './config', './layout'], function(controller, config, layout){
        config.epub_dir = config.epub_directory;
        controller.initialize();
        QUnit.test("testing 1", function () {
            QUnit.equal(layout.body().html(), 16);
        });
    });

    //var $ = require('jquery');
    var epub = require('./epub');

});