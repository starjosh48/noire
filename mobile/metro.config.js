// Learn more: https://docs.expo.dev/guides/customizing-metro
const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// The app reuses a few pure modules from the website (see src/shared.ts), so Metro must be able
// to see the website's src/ folder. Every package (zod, …) resolves from this app's own
// node_modules, also for those shared files, so the bundle never mixes in the website's copies.
config.watchFolders = [path.resolve(__dirname, "../src")];
config.resolver.nodeModulesPaths = [path.resolve(__dirname, "node_modules")];
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
