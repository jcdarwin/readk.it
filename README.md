Place the following in <code>~/.bash_profile</code>:

    alias server.python='open http://localhost:8000 && python -m SimpleHTTPServer'

Reload <code>.bash_profile</code>:

    . ~/.bash_profile

Fire up a webserver at the location of this README.md:

    server.python

Visit the following URLs:

* [The readk.it testing framework](http://localhost:8000/OEBPS/readk.it/js/test/)

* [The readk.it manifesto](http://localhost:8000/OEBPS/readk.it/index.html)

* [The readk.it library](http://localhost:8000/OEBPS/readk.it/library/library.html)

!Grunt

Install grunt:

    npm uninstall -g grunt
    npm install -g grunt-cli

Install grunt-cli (Cygwin under windows):

    npm install -g grunt-init

    mkdir cygdrive/c/Users/Administrator/.grunt-init
    git clone https://github.com/gruntjs/grunt-init-gruntfile.git cygdrive/c/Users/Administrator/.grunt-init/gruntfile

Create a new project:

    grunt-init cygdrive/c/Users/Administrator/.grunt-init/gruntfile
    npm init

Install dependendices:

    npm install grunt --save-dev
    npm install grunt-contrib-jshint --save-dev
    npm install grunt-contrib-concat --save-dev
    npm install grunt-contrib-uglify --save-dev
    npm install grunt-contrib-compass --save-dev
    npm install grunt-contrib-nodeunit --save-dev
    npm install grunt-contrib-watch --save-dev

Add the following hack into node_modules\grunt-contrib-compass\tasks\compass.js, directly before "compile(args, cb);"

      if (args[0] === 'compass.bat') {
        console.log("Our little hack to get 'grunt compass' to work in cygwin -- don't use compass.bat");
        args.shift();
        args.unshift('/usr/bin/compass');
        args.unshift('ruby.exe');
        console.log(args);
      }
