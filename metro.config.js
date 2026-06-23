const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Alias react-native-apple-llm to a local mock so Metro can bundle without
// the package installed. The real package is only available on iOS 26+ and
// will be loaded at runtime on those devices via the native module bridge.
config.resolver = config.resolver || {};
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  'react-native-apple-llm': path.resolve(__dirname, 'mocks/react-native-apple-llm.js'),
};

module.exports = config;
