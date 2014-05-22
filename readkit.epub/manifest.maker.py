#! /usr/bin/env python
# Generate entries in the config file describing EPUB files.
# Files are assumed to be from the current directory tree.

import sys
import os
import re

try:
    from lxml import etree as ET
except:
    print("ERROR: lxml library must be installed.")
    sys.exit(1)

info = {}
namespaces = {"opf": "http://www.idpf.org/2007/opf", "dc": "http://purl.org/dc/elements/1.1/", "xhtml": "http://www.w3.org/1999/xhtml"}
comma = ''

#import glob
#for files in glob.glob("*.xhtml"):
#    print files


def printer(name, version, identifier, path, pages, cover):
    # {"name": "At the Bay", "version": "2.0", identifier": "12345678", "total_pages": 13}
    print "{\"name\": \"%(name)s\", \"version\": \"%(version)s\", \"identifier\": \"%(identifier)s\", \"path\": \"%(path)s\", \"total_pages\": %(pages)s, \"cover\": \"%(cover)s\", \"solo\": \"%(solo)s\"}" % {'name': name, 'version': version, 'identifier': identifier, 'path': path, 'pages': pages, 'cover': cover, 'solo': identifier.replace(':', '_') + '_' + re.sub('[^a-z\d]', '_', name.lower()) + '.html'}

def parseInfo(r, f):
    try:
        f = open(os.path.join(r, f)).read()
    except:
        print("The %s file is not a valid OCF." % str(os.path.join(r, f)))
    try:
        f = ET.fromstring(f)
        info["path_to_opf"] = r + "/../" + f[0][0].get("full-path")
        info["root_folder"] = os.path.dirname(info["path_to_opf"])
    except:
        pass
    opf = ET.fromstring(open(info["path_to_opf"]).read())

    id = opf.xpath("//opf:spine", namespaces=namespaces)[0].get("toc")
    expr = "//*[@id='%s']" % id
    try:
        info["ncx_name"] = opf.xpath(expr)[0].get("href")
        if os.path.exists(info["root_folder"] + "/" + info["ncx_name"]):
            info["ncx_exists"] = True
        else:
            info["ncx_exists"] = False
            #info.pop("ncx_name")
    except:
        info["ncx_name"] = 'toc.ncx'
        info["ncx_exists"] = False
        pass

    info["path_to_ncx"] = info["root_folder"] + "/" + info["ncx_name"]
    #return info


def parseOPF(r, f):
    parseInfo(r, f)
    opf = ET.fromstring(open(info["path_to_opf"]).read())

    return opf


print "["
for r, d, files in os.walk("."):
    files = [f for f in files if re.match('container.xml', f)]
    for f in files:
        if f.endswith(".xml"):

            opf = parseOPF(r, f)

            title = opf.xpath("//dc:title", namespaces=namespaces)
            identifier = opf.xpath("//dc:identifier", namespaces=namespaces)
            version = opf.xpath("//opf:package/@version", namespaces=namespaces)
            itemref = opf.xpath("//opf:spine/opf:itemref", namespaces=namespaces)
            pages = len(itemref)

            path = re.sub(r'^(?:./)?(.*)(META-INF)$', r"\g<1>", r)
            path = re.sub(r'\\', r"/", path)

            #For our special case, where we want to use Readk.it to both be used embedded in an
            #EPUB file (http://localhost:8000/OEBPS/readk.it/) and also to serve the library
            #(http://localhost:8000/OEBPS/readk.it/library/library.html)
            #path = 'OEBPS/readk.it/library/' + re.sub(r'^(?:./)?(.*)(META-INF)$', r"\g<1>", r)

            #For the normal case, where we only want to serve the library
            #(http://localhost:8000/readk.it/library/library.html)
            #path = 'readk.it/library/' + re.sub(r'^(?:./)?(.*)(META-INF)$', r"\g<1>", r)

            cover = opf.xpath("//opf:item[contains(@properties, 'cover-image')]/@href", namespaces=namespaces)
            if not cover:
                coverid = opf.xpath("//opf:meta[contains(@name, 'cover')]/@content", namespaces=namespaces)
                if coverid:
                    cover = opf.xpath("//opf:item[@id='" + coverid[0] + "']/@href", namespaces=namespaces)
            if cover:
                cover = info["root_folder"] + '/' + cover[0]
            else:
                cover = ''

            cover = re.sub(r'\\', r"/", cover)

            print comma
            printer(title[0].text.encode('utf-8'), version[0], identifier[0].text, path, pages, cover)
            comma = ','
print "]"
