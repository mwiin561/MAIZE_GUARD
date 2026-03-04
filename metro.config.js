// Required for TF.js: bundle .bin weight files if you ever bundle the model in the app
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
config.resolver.assetExts = [...(config.resolver.assetExts || []), 'bin'];
module.exports = config;
