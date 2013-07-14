To build:

    node r.js -o build.main.js

This builds all the js into a single file, ./dist/main.compiled.js

Once built, ensure that this file is referenced by index.html
    <script data-main="build/dist/main.compiled" src="js/lib/require.js"></script>

This means that only two js files are actually being used:
* build/dist/main.compiled.js
* js/lib/require.js (which loads main.compiled.js)

For help:

* http://requirejs.org/docs/optimization.html
* https://github.com/jrburke/r.js/blob/master/build/example.build.js