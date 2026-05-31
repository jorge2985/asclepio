// jest.config.js
module.exports = {
  preset: 'jest-expo',
  testEnvironment: 'node',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
  ],
  moduleNameMapper: {
    'expo-secure-store': '<rootDir>/__mocks__/expo-secure-store.js',
    'expo-notifications': '<rootDir>/__mocks__/expo-notifications.js',
    'expo-device': '<rootDir>/__mocks__/expo-device.js',
    'expo-constants': '<rootDir>/__mocks__/expo-constants.js',
  },
  testMatch: ['**/__tests__/**/*.test.js'],
};
