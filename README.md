cipherJS
============

cipherJS is a cryptographic library written in Javascript and intended for client side usage.

It is based on SJCL, JSBN, titaniumcore and some implementations from bitcoinjs-lib.

cipherJS provides easy access to symmetric and asymmetric cryptographic functions as well as hashing, encoding and random numbers/ strings, optimized for web applications. All input and output is text based.
Additionally, cipherJS defines a block based cryptographic system working similar to PGP (not as fully featured of course).

Please READ THE DOCS if you wish to use cipherJS safely. If you don't read and understand the docs, using cipherJS is neither simple nor secure.
Check out the examples as well, as they show you how to use cipherJS in a real application.
As always when working with cryptography, be especially careful.

You'll find the minified versions of cipherJS and it's dependencies in the folder "bin".

Credits
============

This library uses:

* [JSBN] (http://www-cs-students.stanford.edu/~tjw/jsbn/)
* [SJCL](https://github.com/bitwiseshiftleft/sjcl)
* [titaniumcore](http://ats.oka.nu/titaniumcore/js/crypto/readme.txt)
* [bitcoinjs-lib](https://github.com/bitcoinjs/bitcoinjs-lib)
* [YUI Compressor](http://yui.github.io/yuicompressor/) - for compiling

Please Note
============

cipherJS is a beta stage library, so DON'T rely on it in extremely dangerous situations. 

cipherJS was created with client side applications like web apps and add-ons in mind, and is not compatible with PHP crypto functions or does work with OpenSSL. It was not created for client-server-encryption.

Browser support
============

cipherJS is compatible with current versions of most major browsers, but does not support Internet Explorer version <10. 
It was tested with Firefox, Google Chrome, Opera, Safari, Seamonkey, Midori and Epiphany and some other webkit implementations.
Support for old IE will not be implemented. If there are problems with other browsers, please report them.
