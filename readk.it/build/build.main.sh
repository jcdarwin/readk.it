#!/bin/sh
 
echo running build task
node r.js -o build.main.js
 
echo "done!"
 
read -n1 -r -p "Press any key to continue..." key