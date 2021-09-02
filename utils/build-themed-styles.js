var program       = require('commander');
var SassBuilder   = require('./helpers/sass-builder');


program
  .option('-f, --file [file]', 'relative path to the destination css file')
  .option('-v, --variables [variables]', 'relative path to the variables')
  .parse(process.argv);

var sassVariables = {
  'is-tpe-theme-on': 'true'
};

var destFile = 'dist/style2.css';

var builder = new SassBuilder({
  includePaths: [
    'src/assets/styles'
  ],
  outputStyle:  'compressed',
  outFile: destFile
});


builder.renderStyles('src/assets/styles/styles.scss', destFile, sassVariables);
builder.renderStyles('src/app/**/*.scss', destFile, sassVariables);
