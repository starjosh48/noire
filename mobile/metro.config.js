// Learn more: https://docs.expo.dev/guides/customizing-metro
const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);
const websiteSrc = path.resolve(__dirname, "../src");

// The app reuses a few pure modules from the website (see src/shared.ts), so Metro must be able
// to see the website's src/ folder.
config.watchFolders = [websiteSrc];

// Packages imported by those shared files (e.g. zod) resolve from this app's node_modules, as if
// imported by the app itself, so the bundle never picks up the website's copies.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const isPackage = !moduleName.startsWith(".") && !moduleName.startsWith("@/") && !path.isAbsolute(moduleName);
  if (isPackage && context.originModulePath.startsWith(websiteSrc)) {
    return context.resolveRequest({ ...context, originModulePath: path.join(__dirname, "index.js") }, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
