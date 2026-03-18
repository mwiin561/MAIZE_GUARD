// Required for TF.js: bundle .bin weight files if you ever bundle the model in the app
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
config.resolver.assetExts = [...(config.resolver.assetExts || []), 'bin', 'onnx'];

// Exclude venv folders so Metro doesn't hit EACCES on .venv_wsl/lib64 (WSL symlink)
config.resolver.blockList = [
  /\.venv_wsl[/\\].*/,
  /\.venv[/\\].*/,
];

module.exports = config;
