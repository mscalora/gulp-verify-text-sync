const fs = require('fs'),
    util = require('util'),
    promisify = util.promisify,
    readFileSync = promisify(fs.readFile);

/**
 * get the line number
 * @param {string} fulltext
 * @param {string|RegExp} target
 */
function findLine (fulltext, target) {
  let pos = fulltext.indexOf(target),
      linesNum = pos >= 0 && fulltext.substr(0, pos).split('\n').length - 1;
  return pos < 0 ? pos : linesNum;
}

/**
 * 
 * @param {Array<string>} paths file paths to compare
 * @param {object} options
 * @param {string|RegExp} [options.startMarker] - string or regexp that begins section to check for sync, else from start of file
 * @param {string|RegExp} [options.endMarker] - string or regexp that ends section to check for sync, else to end of file
 * @param {boolean} [options.ignoreLeadingWhitespace] - ignore leading whitespace, default: true
 * @param {boolean} [options.ignoreTrailingWhitespace] - ignore trailing whitespace, default: true
 * @param {boolean} [options.ignoreWhitespaceLength] - ignore length of whitespace, default: false
 * @param {boolean} [options.includeMarkerLines] - compare the marker lines, just the lines between, default: false
 * @return {Promise<string>} - if verify fails, rejected with info message
 */
async function check (paths, options) {
  const opts = Object.assign({
    startMarker: null,
    endMarker: null,
    ignoreLeadingWhitespace: true,
    ignoreTrailingWhitespace: true,
    ignoreWhitespaceLength: false,
    includeMarkerLines: false
  }, options || {});

  let promises = paths.map(path => {
    return readFileSync(path, 'utf8');
  });

  return Promise.all(promises).then(function (texts) {
    let baseline = null,
        fileMap = paths.reduce((map, path) => {
          let text = texts.shift(),
              rec = {
                path: path,
                fullText: text
              };
          map[path] = rec;
          return map;
        }, {});

    for (const path of paths) {
      let rec  = fileMap[path],
          lines = rec.fullText.split(/\n/g);
      rec.startLine = opts.startMarker ? findLine(rec.fullText, opts.startMarker) : -1;
      rec.endLine = opts.endMarker ? findLine(rec.fullText, opts.endMarker) : lines.length;
      if (opts.startMarker && rec.startLine < 0) {
        let err = new Error(`File ${rec.path} does not contain the start marker (${opts.startMarker})`);
        throw err;
      } else if (opts.endMarker && rec.endLine < 0) {
        let err = new Error(`File ${rec.path} does not contain the end marker (${opts.endMarker})`);
        throw err;
      } else if (rec.endLine < rec.startLine) {
        let err = new Error(`The start marker appears after the end marker in file ${rec.path}`);
        throw err;
      } else if (!opts.includeMarkerLines && rec.endLine === rec.startLine) {
        let err = new Error(`The section between the start marker and end marker in file ${rec.path} is empty`);
        throw err;
      }
      if (opts.includeMarkerLines) {
        lines = lines.slice(rec.startLine, rec.endLine + 1);
      } else {
        lines = lines.slice(rec.startLine + 1, rec.endLine);
      }
      lines = lines.map(line => {
        return (opts.ignoreLeadingWhitespace && opts.ignoreTrailingWhitespace ? line.trim() :
            opts.ignoreLeadingWhitespace ? line.trimLeft() :
            opts.ignoreTrailingWhitespace ? line.trimRight() : line)
              .replace(opts.ignoreWhitespaceLength ? /\s+/ : /$^/, ' ');
      });
      if (baseline) {
        if (baseline.join('\n') !== lines.join('\n')) {
          for (let i = 0; i <= lines.length; i++) {
            if (baseline[i] !== lines[i]) {
              let baseRec = fileMap[paths[0]],
                  firstLine = i + rec.startLine + 2,
                  err = new Error(`The file ${rec.path}:${i + rec.startLine + 2} differs from ${baseRec.path}:${i + baseRec.startLine + 2}`);
              throw err;
            }
          }
        }
      } else {
        baseline = lines;
      }
    }
    return `${paths.length} files match`;
  });
}

module.exports = {
  check: check
};


