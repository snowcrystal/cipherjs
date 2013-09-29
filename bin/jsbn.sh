#!/bin/bash

rm *.js
cat "../src/lib/jsbn/jsbn.js" >> "jsbn.uncompressed.js"
cat "../src/lib/jsbn/jsbn2.js" >> "jsbn.uncompressed.js"
cat "../src/lib/jsbn/prng4.js" >> "jsbn.uncompressed.js"
cat "../src/lib/jsbn/rng.js" >> "jsbn.uncompressed.js"
cat "../src/lib/jsbn/ec.js" >> "jsbn.uncompressed.js"
cat "../src/lib/jsbn/sec.js" >> "jsbn.uncompressed.js"

java -jar yuicompressor-2.4.2.jar -o "jsbn.min.js" "jsbn.uncompressed.js"
