# Extract translate string

It extracts all strings to translate and saves them in a file.

## Getting started

```
$ npm install ets -g
```

## Commands

### ignore

An utility to create .etsignore file. The file specifies the resources to be ignored. 

```
$ cd /my/directory
$ ets ignore
```

options:

`-d`, `--dir` <directory> Directory to save .etsignore file

defaults:

```
node_modules/
test/
components/
bowe_components/
css/
img/
video/
.json
.css
.xml
bundle.js
bundle-min.js
```

list of files that will never be scanned:

```
.jpg, .jpeg, .png, .gif, .eot, .ttf, .woff, .svg, .DS_Store, .gitignore, .git, .svn, .md, .manifest, .bowerrc 
```

### extract

This utility will walk you extract string for tranlate. Watch files for: translate(...), t(...), fkt(...).

Note: fkt() (FaKe Translate) was created to translate constants. 

```js
var ERROR_CODE = fkt('PAGE_NOT_FOUND'); 
```

```
$ cd /my/directory
$ ets extract
```

options

`-d`, `--dir` <directory, directory, ...>  List of directory to watch
`-o`, `--out` <file>                       File name output

output file type
	
- txt
- json
- pot (coming soon)

### convert

This utiliy convert a PO file to JSON.

```
$ ets convert -f ./locales/fr/default-fr.po -o ./locales/fr/default.json
```


## License

```
The MIT License (MIT)

Copyright (c) 2014

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```
