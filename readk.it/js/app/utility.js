/*
** utility.js
**
** Author: Jason Darwin
**
** Utility functions for Readk.it.
*/

 /*global define:false, console:false */
define([
    'app/config',
    'jquery',
    'jquery.storage',
    'tinytim',
    'modernizr',
    'detectizr'
], function(config, $, $storage, tinytim, Modernizr, Detectizr){

    var isTextFile = function(filename){
        var suffix = filename.lastIndexOf('.') === -1 ? '' : filename.substr(filename.lastIndexOf('.') + 1).toLowerCase();
        return ['opf', 'xml', 'htm', 'html', 'xhtml', 'css', 'ncx', 'txt', ''].indexOf(suffix) !== -1;
    };

    // Compile our html templates using tinytim
    var compile = function(template, data) {
        return tinytim(template, data);
    };

    // Local / session / cookie storage
    var storage = function self(identifier, key, value) {
        // If only key is provided, it's a getter,
        // otherwise it's a setter.
        var pub = $.localStorage(identifier) || [];

        if (value !== undefined) {
            var entry = {};
            entry[key] = value;
            // Filter out any existing entries with the supplied key.
            pub = pub.filter(function (item) {
                if (item[key] === undefined) {
                    return true;
                }
            });
            pub.push(entry);
            return $.localStorage(identifier, pub);
        } else {
            pub = pub.filter(function (item) {
                if (item[key] !== undefined) {
                    return true;
                }
            });
            if (pub.length > 0) {
                return pub[0][key];
            } else {
                return null;
            }
        }
    };

    // Classic pubsub, as per https://gist.github.com/addyosmani/1321768
    var queue = $({});
    var subscribe = function() {
        queue.on.apply(queue, arguments);
    };
    var unsubscribe = function() {
        queue.off.apply(queue, arguments);
    };
    var publish = function() {
        queue.trigger.apply(queue, arguments);
    };

    var _hasArrayBufferView = new Blob([new Uint8Array(100)]).size === 100;

    var decode = function decode (index, dataURI) {
        var data;
        if (/^data\:/.test(dataURI)) {
            // We've got a data URI
            var content = dataURI.indexOf(","),
                meta = dataURI.substr(5, content).toLowerCase();

            data = decodeURIComponent(dataURI.substr(content + 1));
            
            if (/;\s*base64\s*[;,]/.test(meta)) {
                data = atob(data); // decode base64

                // Convert non-text files to blobs
                if (!isTextFile(index)) {
                    var buf = new ArrayBuffer(data.length);
                    var arr = new Uint8Array(buf);
                    for (var i = 0; i < data.length; i++) {
                         arr[i] = data.charCodeAt(i);
                    }
                    if (!_hasArrayBufferView) {
                        arr = buf;
                    }
                    var blob = new Blob([arr], { type: meta.split(';')[0] });
                    blob.slice = blob.slice || blob.webkitSlice;
                    data = blob;
                } else {
                    data = decodeURIComponent(escape(data)); // decode UTF-8
                }
            } else if (/;\s*charset=[uU][tT][fF]-?8\s*[;,]/.test(meta)) {
                data = decodeURIComponent(escape(data)); // decode UTF-8
            }
        } else {
            // Presumably we have a blob URL
            data = dataURI;
        }
        
        return data;
    };

    var operation = {
        'fontSwitch': 'fontSwitch'
    };

    var log = function(msg) {
        if (config.log) {
            if (console && console.log) {
                console.log(msg);
            }
        }
    };

    var debug = function(msg) {
        if (config.log) {
            if (console && console.debug) {
                console.debug(msg);
            }
        }
    };

    var error = function(msg) {
        if (config.log) {
            if (console && console.error) {
                console.error(msg);
            }
        }
    };

    // Deal with device/browser support issues
    var supported = function (op) {
        if (!config.lite && Detectizr) {
            Modernizr.Detectizr.detect({
                detectDeviceModel: true,
                detectScreen: true,
                detectOS: true,
                detectBrowser: true,
                detectPlugins: false
            });
        }
        switch(op) {
            case operation.fontSwitch:
                // Looks like iPad iOS is behaving itself for the time being
                /*
                if (Modernizr.Detectizr.device.model === 'ipad' && Modernizr.Detectizr.device.browser === 'safari') {
                    // Font-switching crashes Safari on iOS (at least 6.0.1)
                    return false;
                } else {
                    return true;
                }
                */
                return true;
            default:
                return true;
        }
    };

    return {
        isTextFile: isTextFile,
        compile: compile,
        storage: storage,
        subscribe: subscribe,
        unsubscribe: unsubscribe,
        publish: publish,
        decode: decode,
        supported: supported,
        operation: operation,
        log: log,
        debug: debug,
        error: error
    };
});
