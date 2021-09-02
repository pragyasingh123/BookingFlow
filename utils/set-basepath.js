var program = require('commander');
var path = require("path");
var fs = require("fs-extra");
var _ = require('lodash');

program
  .version('0.0.1')
  .option('-p, --path [path]', 'Webapp base path')
  .option('-f, --file [filename]', 'Webapp base path')
  .parse(process.argv);


if(!program.path || !program.file){
  throw new Error('Path argument is required');
}

var basePath = program.path;
var filename = path.join(process.cwd(), program.file);


//CSS
var file = fs.readFileSync(filename, "utf8");
file = file.replace(/[\"\']\/?((vendor|bower_components|assets|elements)\/[a-zA-Z0-9\-_\/\.]+)[\"\']/mg, "\"" + basePath + "$1\"");

//<base> tag
file = file.replace(/(<base.+)/m, "<base href=\""+ basePath +"\">");

fs.writeFileSync(filename, file);
