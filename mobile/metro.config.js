const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Prevent Metro from externalizing node: builtins on Windows
// (Windows file system doesn't allow ':' in directory names)
if (config.resolver) {
  config.resolver.unstable_conditionNames = ['require', 'default'];
}

module.exports = config;
