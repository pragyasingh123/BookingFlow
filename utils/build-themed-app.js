var program = require('commander');
var fs = require('fs-extra');
var Vulcanize = require('vulcanize');
const execSync = require('child_process').execSync;
const spawnSync = require('cross-spawn').sync;
var glob = require('glob');
var sriGenerator = require('./helpers/sri-generator');

var buildFileName = 'angular-cli.json';

program
  .option('-p, --basepath [basepath]', 'Webapp base path')
  .parse(process.argv);

// Read angular-cli file and calculate variables
var file_content = fs.readFileSync(buildFileName);
var content = JSON.parse(file_content);
var outDir = content.apps[0].outDir;
var indexFile = outDir + '/index.html';

// Clean output folder
console.log('Cleaning output folder: ', outDir);
fs.emptyDir(outDir, function (err) {
  if (err) {
    console.log(err);
    return;
  }

  // Run ng build and vulcanize
  const buildResult = spawnSync('ng', ['build', '--prod'], {
    stdio: 'inherit'
  });

  if (buildResult.error) {
    throw buildResult.error;
  }

  // Change base path for production build
  var basepath = program.basepath || "/";
  var faviconManifestPath = outDir + "/assets/favicons/manifest.json";
  var faviconsManifest = fs.readFileSync(faviconManifestPath, 'utf8');
  faviconsManifest = faviconsManifest.replace(/(\$path\/)/mg, '\\' + basepath + '\\/assets\\/favicons\\/');
  fs.writeFileSync(faviconManifestPath, faviconsManifest);
  delete faviconManifestPath;
  delete faviconsManifest;

  var faviconBrowserconfigPath = outDir + "/assets/favicons/browserconfig.xml";
  var faviconBrowserconfig = fs.readFileSync(faviconBrowserconfigPath, 'utf8');
  faviconBrowserconfig = faviconBrowserconfig.replace(/(\$path\/)/mg, basepath + 'assets/favicons/');
  fs.writeFileSync(faviconBrowserconfigPath, faviconBrowserconfig);
  delete faviconBrowserconfigPath;
  delete faviconBrowserconfig

  var indexHtml = fs.readFileSync(indexFile, 'utf8');

  var favicons = '<link rel="icon" type="image/png" sizes="16x16" href="' + basepath + 'assets/favicons/favicon-16x16.png">\n' +
    '<link rel="icon" type="image/png" sizes="32x32" href="' + basepath + 'assets/favicons/favicon-32x32.png">\n' +
    '<link rel="icon" type="image/png" sizes="96x96" href="' + basepath + 'assets/favicons/favicon-96x96.png">\n' +
    '<link rel="icon" type="image/png" sizes="194x194" href="' + basepath + 'assets/favicons/favicon-194x194.png">\n' +
    '<link rel="manifest" href="' + basepath + 'assets/favicons/manifest.json">\n' +
    '<link rel="icon" type="image/png" sizes="36x36" href="' + basepath + 'assets/favicons/android-chrome-36x36.png">\n' +
    '<link rel="icon" type="image/png" sizes="48x48" href="' + basepath + 'assets/favicons/android-chrome-48x48.png">\n' +
    '<link rel="icon" type="image/png" sizes="72x72" href="' + basepath + 'assets/favicons/android-chrome-72x72.png">\n' +
    '<link rel="icon" type="image/png" sizes="96x96" href="' + basepath + 'assets/favicons/android-chrome-96x96.png">\n' +
    '<link rel="icon" type="image/png" sizes="144x144" href="' + basepath + 'assets/favicons/android-chrome-144x144.png">\n' +
    '<link rel="icon" type="image/png" sizes="192x192" href="' + basepath + 'assets/favicons/android-chrome-192x192.png">\n' +
    '<link rel="shortcut icon" type="image/x-icon" href="' + basepath + 'assets/favicons/favicon.ico">\n' +
    '<link rel="apple-touch-icon" sizes="57x57" href="' + basepath + 'assets/favicons/apple-touch-icon-57x57.png">\n' +
    '<link rel="apple-touch-icon" sizes="60x60" href="' + basepath + 'assets/favicons/apple-touch-icon-60x60.png">\n' +
    '<link rel="apple-touch-icon" sizes="72x72" href="' + basepath + 'assets/favicons/apple-touch-icon-72x72.png">\n' +
    '<link rel="apple-touch-icon" sizes="76x76" href="' + basepath + 'assets/favicons/apple-touch-icon-76x76.png">\n' +
    '<link rel="apple-touch-icon" sizes="114x114" href="' + basepath + 'assets/favicons/apple-touch-icon-114x114.png">\n' +
    '<link rel="apple-touch-icon" sizes="120x120" href="' + basepath + 'assets/favicons/apple-touch-icon-120x120.png">\n' +
    '<link rel="apple-touch-icon" sizes="144x144" href="' + basepath + 'assets/favicons/apple-touch-icon-144x144.png">\n' +
    '<link rel="apple-touch-icon" sizes="152x152" href="' + basepath + 'assets/favicons/apple-touch-icon-152x152.png">\n' +
    '<link rel="apple-touch-icon" sizes="180x180" href="' + basepath + 'assets/favicons/apple-touch-icon-180x180.png">\n' +
    '<link rel="apple-touch-icon-precomposed" sizes="180x180" href="' + basepath + 'assets/favicons/apple-touch-icon-precomposed.png">\n' +
    '<link rel="apple-touch-icon" sizes="180x180" href="' + basepath + 'assets/favicons/apple-touch-icon.png">\n' +
    '<meta name="msapplication-config" content="' + basepath + 'assets/favicons/browserconfig.xml">\n' +
    '<meta name="msapplication-TileImage" content="' + basepath + 'assets/favicons/mstile-144x144.png">\n';

  indexHtml = indexHtml.replace(/(<link rel="icon" type="image\/x-icon" href="favicon.ico".+)/m, favicons);

  fs.writeFileSync(indexFile, indexHtml);

  // Set basepath
  if (program.basepath && program.basepath.length > 0) {
    console.log("Changing basepath to: ", program.basepath);
    execSync('node utils/set-basepath.js --file ' + indexFile + ' --path ' + program.basepath, {
      stdio: [0, 1, 2]
    });

    //find css url calls and inject the base path there
    var injectBasePathToCSS = function (filePaths) {
      var filePath;
      for (var i = 0; i < filePaths.length; i++) {
        filePath = filePaths[i];
        console.log('fixing css path in: ', filePath, "basepath", program.basepath);
        var file = fs.readFileSync(filePath, "utf8");
        file = file.replace(/\(\/?((assets)\/[a-zA-Z0-9\-\?#_\/\.]+\))/mg, "(" + program.basepath + "$1");
        fs.writeFileSync(filePath, file);
      }
    };

    //CSS
    var mainBundle = glob.sync(outDir + "/main.*bundle.js");
    var styleBundle = glob.sync(outDir + "/styles.*bundle.css");

    injectBasePathToCSS(mainBundle.concat(styleBundle));
  }

  // Subresource integrity
  console.log("Generate SRI attributes in index.html");
  indexHtml = fs.readFileSync(indexFile, 'utf8');
  indexHtml = sriGenerator.applySriAttributes('script', indexHtml, outDir, program.basepath);
  indexHtml = sriGenerator.applySriAttributes('style', indexHtml, outDir, program.basepath);
  fs.writeFileSync(indexFile, indexHtml);

  // Run vulcanize
  console.log("Vulcanize elements.html");
  var vulcan = new Vulcanize({
    stripComments: true,
    inlineCss: true,
    inlineScripts: true
  });
  vulcan.process('src/assets/elements/elements.html', function (err, inlinedHtml) {
    if (err) {
      console.log(err);
      return;
    }

    fs.writeFileSync(outDir + '/assets/elements/elements.html', inlinedHtml);
  });

  // Copy config files
  var configOutput = outDir + '/config';
  console.log('Copy config files to: ', configOutput);
  fs.copySync('src/config', configOutput);
});
