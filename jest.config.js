module.exports = {
  preset: '@react-native/jest-preset',
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-native-community|lucide-react-native|react-native-svg|react-native-safe-area-context)/)',
  ],
};
