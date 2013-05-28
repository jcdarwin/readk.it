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