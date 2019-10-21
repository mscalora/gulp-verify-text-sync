#!/usr/bin/env node
'use strict';

const gulpVerifyTextSync = require('./index'),
    fs = require('fs');

let paths = [],
    verbose = false,
    begin,
    end,
    args = process.argv.slice(2);

while(args.length) {
  let arg = args.shift();
  if (arg === '-?' || arg === '-h' || arg === '--help') {
    process.stderr.write('check [options] file...\n  -v turn on verbose output\n  -s <start-marker>\n  -e <end-marker>\n\n');
  } else if (arg === '-v' || arg === '--verbose') {
    verbose = true;
  } else if (arg === '-s') {
    begin = args.shift();
  } else if (arg === '-e') {
    end = args.shift();
  } else {
    paths.push(arg);
    
    if (!fs.existsSync(arg)) {
      process.stderr.write(`Error: The file ${arg} does not exist\n`);
      process.exit(10);
    }
  }
}

if (paths.length < 2) {
  process.stderr.write('Error: check requires at least two files\n');
  process.exit(10);
}

if (verbose) {
  process.stderr.write('Comparing:');
  for (const path of paths) {
    process.stderr.write(`  ${path}\n`);
  }
}

gulpVerifyTextSync.check(paths,{startMarker: begin, endMarker: end}).then(function () {
  if (verbose) {
    process.stderr.write('files match\n');
  }
  process.exit(0);
}).catch(function (err) {
  process.stderr.write(`files do not match: ${err.message}\n`);
  process.exit(10);
});
