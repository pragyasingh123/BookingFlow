var program = require('commander');
const execSync = require('child_process').execSync;

program
  .option('-p, --basepath [basepath]', 'Webapp base path')
  .parse(process.argv);

var basePath = '';
if (typeof program.basepath !== 'undefined' && program.basepath) {
  basePath = program.basepath;
}

buildTheme(basePath);

function buildTheme(basepath) {
  execSync('node utils/build-themed-app.js --basepath ' + basepath, {
    stdio: [0, 1, 2]
  });
}
