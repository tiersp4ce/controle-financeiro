const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Adiciona suporte a arquivos .wasm para o SQLite Web (expo-sqlite)
config.resolver.assetExts.push('wasm');

module.exports = config;
