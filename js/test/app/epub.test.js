define(function (require) {

    require(['./controller', './config', './epub', './layout'], function(controller, config, epub, layout){

        var initialized = function () {
            QUnit.test("layout: contains correct number of pages, returns 13", function () {
                QUnit.equal( $(layout.body).find('.page').size(), 13 );
            });
        };

        config.epub_dir = config.epub_directory;
        controller.initialize(initialized);

    });

});