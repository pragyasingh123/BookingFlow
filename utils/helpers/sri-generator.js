var fs = require('fs-extra');
var sriToolbox = require('sri-toolbox');

const SRI_Mapping = {
  script: {
    regex: /<script.+?src="((?!http|\/\/).+?)".*?>.*?<\/script>/gm,
    map: function (resourceUrl, integrity) {
      return '<script type="text/javascript" src="' + resourceUrl + '" integrity="'+ integrity +'" crossorigin="anonymous"></script>';
    }
  },
  style: {
    regex: /(?=<link.*? rel="stylesheet").+? href="(.+?)".+?>/gm,
    map: function (resourceUrl, integrity) {
      return '<link rel="stylesheet" href="' + resourceUrl + '" integrity="'+ integrity +'" crossorigin="anonymous" />';
    }
  }
}

module.exports = {
  applySriAttributes: function (resourceType, htmlSource, resourceBaseDir, htmlBasePath) {
    return htmlSource.replace(SRI_Mapping[resourceType].regex, function (match, g1) {
      try {
        let resourceUrl = g1;
        if (htmlBasePath && g1.startsWith(htmlBasePath)) {
          resourceUrl = g1.substr(htmlBasePath.length);
        }

        var filePath = resourceBaseDir + (resourceUrl.startsWith('\\') ? resourceUrl : ('\\' + resourceUrl));
        console.log('Generate SI for ' +  filePath)
        var fileContent = fs.readFileSync(filePath);
        var sri = sriToolbox.generate({
          full: true,
          algorithms: ['sha512']
        }, fileContent);

        return SRI_Mapping[resourceType].map(g1, sri.integrity);
      }
      catch (ex) {
        console.warn('SRI failed for '+ g1, ex);
        return match;
      }
    })
  }
}
