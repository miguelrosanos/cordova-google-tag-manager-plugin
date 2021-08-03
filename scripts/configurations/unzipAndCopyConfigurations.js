"use strict";

var path = require("path");
var AdmZip = require("adm-zip");

var utils = require("./utilities");

var constantsIOS = {
  IOS: "iOS - GTM-PN82Q5R_v2.zip"
};

var constantsAndroid = {
  Android: "Android - GTM-W8HGSTJ_v2.zip"
};

module.exports = function(context) {
  var cordovaAbove8 = utils.isCordovaAbove(context, 8);
  var cordovaAbove7 = utils.isCordovaAbove(context, 7);
  var defer;
  if (cordovaAbove8) {
    defer = require("q").defer();
  } else {
    defer = context.requireCordovaModule("q").defer();
  }
  
  var platform = context.opts.plugin.platform;
  var platformConfig = utils.getPlatformConfigs(platform);
  if (!platformConfig) {
    utils.handleError("Invalid platform", defer);
  }
  
  var wwwPath = utils.getResourcesFolderPath(context, platform, platformConfig);
  var sourceFolderPath = utils.getSourceFolderPath(context, wwwPath);
  
  var iosGTMZipFile = utils.getZipFile(sourceFolderPath, constantsIOS.IOS);
  if (!iosGTMZipFile) {
    utils.handleError("No zip file found containing IOS configuration file", defer);
  }
  
  var androidGTMZipFile = utils.getZipFile(sourceFolderPath, constantsIOS.IOS);
  if (!androidGTMZipFile) {
    utils.handleError("No zip file found containing IOS configuration file", defer);
  }
  
  var zipIOS = new AdmZip(iosGTMZipFile);
  var zipAndroid = new AdmZip(androidGTMZipFile);
  
  var targetPathIOS = path.join(wwwPath, constantsIOS.IOS);
  var targetPathAndroid = path.join(wwwPath, constantsAndroid.Android);
  console.log('targetPathIOS ' + targetPathIOS);

  zipIOS.extractAllTo(targetPathIOS, true);
  zipAndroid.extractAllTo(targetPathAndroid, true);
  
  var filesIOS = utils.getFilesFromPath(targetPathIOS);
  if (!filesIOS) {
    utils.handleError("No directory found", defer);
  }
  
  var filesAndroid = utils.getFilesFromPath(targetPathAndroid);
  if (!filesAndroid) {
    utils.handleError("No directory found", defer);
  }

  var fileNameIOS = filesIOS.find(function (name) {
    return name.endsWith(platformConfig.firebaseFileExtension);
  });
  if (!fileNameIOS) {
    utils.handleError("No file found", defer);
  }
  
  var fileNameAndroid = filesAndroid.find(function (name) {
    return name.endsWith(platformConfig.firebaseFileExtension);
  });
  if (!fileNameAndroid) {
    utils.handleError("No file found", defer);
  }
  
  var sourceFilePathIOS = path.join(targetPathIOS, fileNameIOS);
  var sourceFilePathAndroid = path.join(targetPathAndroid, fileNameAndroid);
  var destFilePath = path.join(context.opts.plugin.dir, fileName);

  utils.copyFromSourceToDestPath(defer, sourceFilePathIOS, destFilePath);
  utils.copyFromSourceToDestPath(defer, sourceFilePathAndroid, destFilePath);
  //console.log('Copied ' + sourceFilePath + ' to ' + destFilePath);
  if (cordovaAbove7) {
    var destPath = path.join(context.opts.projectRoot, "platforms", platform, "app");
    
    if (!utils.checkIfFolderExists(destPath) && platform == "ios") {
      destPath = path.join(context.opts.projectRoot,"platforms",platform);
      var projectName = utils.getFilesFromPath(destPath).find(function (name) {
        return name.endsWith(".xcodeproj");                                                    
      }).replace(".xcodeproj","");

      destPath = path.join(context.opts.projectRoot,"platforms",platform,projectName);
      
      //console.log(utils.getFilesFromPath(destPath));
    }

    if (utils.checkIfFolderExists(destPath)) {
      var destFilePath = path.join(destPath, fileName);
      utils.copyFromSourceToDestPath(defer, sourceFilePathIOS, destFilePath);
	  utils.copyFromSourceToDestPath(defer, sourceFilePathAndroid, destFilePath);
      //console.log('Copied ' + sourceFilePath + ' to ' + destFilePath);
    }
  }
      
  return defer.promise;
}
