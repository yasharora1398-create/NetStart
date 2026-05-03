// Metro config for NetStart mobile.
// `unstable_enablePackageExports` lets Metro resolve subpath exports
// declared in package.json `exports` fields. Required for newer
// versions of @supabase/supabase-js, which split into auth-js, etc.

const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

config.resolver.unstable_enablePackageExports = true;

module.exports = config;
