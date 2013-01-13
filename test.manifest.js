var manifest =
[
    {   "file": "html/thirdparty/30/accessible_epub_3/EPUB/ch02s02.xhtml",
        "name": "At the Bay",
        "version": "2.0",
        "identifier": "84ba3092-022a-460d-bb4f-fa558a022793",
        "path": "./mansfield_at_the_bay/",
        "total_pages": 13,
        "opf": ["package", {
                "unique-identifier": "BookID",
                "version": 2.0
            }, ["metadata", ["dc:title", "At the Bay"],
                ["dc:rights", "Public Domain"],
                ["dc:contributor", {
                    "opf:role": "pro"
                }, "Jason Darwin"],
                ["dc:creator", {
                    "opf:role": "aut"
                }, "Katherine Mansfield"],
                ["dc:publisher", "meBooks"],
                ["dc:language", "en"],
                ["dc:identifier", {
                    "id": "BookID",
                    "opf:scheme": "UUID"
                }, "84ba3092-022a-460d-bb4f-fa558a022793"],
                ["meta", {
                    "name": "Sigil version",
                    "content": "0.2.3"
                }]
            ],
                ["manifest", ["item", {
                    "id": "ncx",
                    "href": "toc.ncx",
                    "media-type": "application/x-dtbncx+xml"
                }],
                    ["item", {
                        "id": "page-template.xpgt",
                        "href": "Styles/page-template.xpgt",
                        "media-type": "application/vnd.adobe-page-template+xml"
                    }],
                    ["item", {
                        "id": "stylesheet.css",
                        "href": "Styles/stylesheet.css",
                        "media-type": "text/css"
                    }],
                    ["item", {
                        "id": "chap01.xhtml",
                        "href": "Text/chap01.xhtml",
                        "media-type": "application/xhtml+xml"
                    }],
                    ["item", {
                        "id": "chap02.xhtml",
                        "href": "Text/chap02.xhtml",
                        "media-type": "application/xhtml+xml"
                    }],
                    ["item", {
                        "id": "chap03.xhtml",
                        "href": "Text/chap03.xhtml",
                        "media-type": "application/xhtml+xml"
                    }],
                    ["item", {
                        "id": "chap04.xhtml",
                        "href": "Text/chap04.xhtml",
                        "media-type": "application/xhtml+xml"
                    }],
                    ["item", {
                        "id": "chap05.xhtml",
                        "href": "Text/chap05.xhtml",
                        "media-type": "application/xhtml+xml"
                    }],
                    ["item", {
                        "id": "chap06.xhtml",
                        "href": "Text/chap06.xhtml",
                        "media-type": "application/xhtml+xml"
                    }],
                    ["item", {
                        "id": "chap07.xhtml",
                        "href": "Text/chap07.xhtml",
                        "media-type": "application/xhtml+xml"
                    }],
                    ["item", {
                        "id": "chap08.xhtml",
                        "href": "Text/chap08.xhtml",
                        "media-type": "application/xhtml+xml"
                    }],
                    ["item", {
                        "id": "chap09.xhtml",
                        "href": "Text/chap09.xhtml",
                        "media-type": "application/xhtml+xml"
                    }],
                    ["item", {
                        "id": "chap10.xhtml",
                        "href": "Text/chap10.xhtml",
                        "media-type": "application/xhtml+xml"
                    }],
                    ["item", {
                        "id": "chap11.xhtml",
                        "href": "Text/chap11.xhtml",
                        "media-type": "application/xhtml+xml"
                    }],
                    ["item", {
                        "id": "chap12.xhtml",
                        "href": "Text/chap12.xhtml",
                        "media-type": "application/xhtml+xml"
                    }],
                    ["item", {
                        "id": "title_page.xhtml",
                        "href": "Text/title_page.xhtml",
                        "media-type": "application/xhtml+xml"
                    }]
                ],
                ["spine", {
                    "toc": "ncx"
                    },
                    ["itemref", {
                        "idref": "title_page.xhtml"
                    }],
                    ["itemref", {
                        "idref": "chap01.xhtml"
                    }],
                    ["itemref", {
                        "idref": "chap02.xhtml"
                    }],
                    ["itemref", {
                        "idref": "chap03.xhtml"
                    }],
                    ["itemref", {
                        "idref": "chap04.xhtml"
                    }],
                    ["itemref", {
                        "idref": "chap05.xhtml"
                    }],
                    ["itemref", {
                        "idref": "chap06.xhtml"
                    }],
                    ["itemref", {
                        "idref": "chap07.xhtml"
                    }],
                    ["itemref", {
                        "idref": "chap08.xhtml"
                    }],
                    ["itemref", {
                        "idref": "chap09.xhtml"
                    }],
                    ["itemref", {
                        "idref": "chap10.xhtml"
                    }],
                    ["itemref", {
                        "idref": "chap11.xhtml"
                    }],
                    ["itemref", {
                        "idref": "chap12.xhtml"
                    }]
                ]
            ]
    },
    {   "name": "Accessible EPUB 3",
        "root": "html/thirdparty/30/accessible_epub_3/EPUB/",
        "version": "3.0",
        "identifier": "urn:isbn:9781449328030",
        "path": "./thirdparty/30/accessible_epub_3/",
        "total_pages": 22,
        "opf": {
            "title" : "Accessible EPUB 3",
            "spine": [
                {"itemref": {
                    "idref": "cover",
                    "href": "cover.xhtml",
                    "linear": "no"
                }},
                {"itemref": {
                    "idref": "id-id2624850",
                    "href": "ch03.xhtml"
                }}
            ]
        }
    }
];