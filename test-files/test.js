const gulpVerifyTextSync = require('../index'),
      tests = [
        [
          'same - exact',
          ['test-files/file-a.txt', 'test-files/file-a-same.txt'],
          {},
          true
        ],[
          'same - ignore leading/trailing',
          ['test-files/file-a.txt', 'test-files/file-a-same-x-spaces.txt'],
          {},
          true
        ],[
          'diff - leading whitespace line 5',
          ['test-files/file-a.txt', 'test-files/file-a-same-x-spaces.txt'],
          {ignoreLeadingWhitespace:false},
          ':5'
        ],[
          'diff - trailing whitespace line 6',
          ['test-files/file-a.txt', 'test-files/file-a-same-x-spaces.txt'],
          {ignoreTrailingWhitespace:false},
          /:6/
        ],[
          'missing start marker',
          ['test-files/file-a-1-markers.txt', 'test-files/file-a-end-only.txt'],
          {startMarker: '/*BEGIN*/', endMarker: '/*END*/'},
          /end-only.*does not contain the start marker/
        ],[
          'inverted markers',
          ['test-files/file-a-start-only.txt', 'test-files/file-a-1-markers.txt'],
          {startMarker: '/*BEGIN*/', endMarker: '/*END*/'},
          /start-only.*does not contain the end marker/
        ],[
          'missing end marker',
          ['test-files/file-a-inverted.txt', 'test-files/file-a-1-markers.txt'],
          {startMarker: '/*BEGIN*/', endMarker: '/*END*/'},
          /inverted/
        ],[
          'markers the same',
          ['test-files/file-a-1-markers.txt', 'test-files/file-a-1-markers-diff.txt'],
          {startMarker: '/*BEGIN*/', endMarker: '/*END*/'},
          /:11.*:11/
        ],[
          'markers the same',
          ['test-files/file-a-2-markers.txt', 'test-files/file-a-1-markers.txt'],
          {startMarker: '/*BEGIN*/', endMarker: '/*END*/'},
          true
        ]
      ];

async function testAll (tests, num) {
  let count = 0,
      allGood = true;
  for (let test of num === undefined ? tests : [tests[num-1]]) {
    count++;
    console.log(`Running test: ${test[0]}`);
    try {
      await gulpVerifyTextSync.check(test[1], test[2]);
      if (test[3] === true) {
        console.log(`  test success!`);
      } else {
        console.error(`  test failure:check passed but should have matched: ${test[3]}`);
        allGood = false;
      }
    } catch (err) {
      let msg = err.message,
          exp = test[3];
      if (exp !== true) {
        if (typeof exp === 'string' ? msg.indexOf(exp) >= 0 : msg.search(exp) >= 0) {
          console.log(`  test success!`);
        } else {
          console.error(`  test failure: expected ${exp} but got ${msg}`);
          allGood = false;
        }
      } else {
        console.error(`  test failure: expected check to pass but got ${msg}`);
        allGood = false;
      }
    }
  }
  return allGood ? count : false;
}

let num;

if (process.argv.length > 2) {
  num = parseInt(process.argv[2])  
}

testAll(tests, num).then(function (countPassed) {
  process.stdout.write(`\n TESTS ${countPassed}\n`);
  process.exit(0);
});
