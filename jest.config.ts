const { pathsToModuleNameMapper } = require('ts-jest');
const { compilerOptions } = require('./tsconfig.json');

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jest-environment-jsdom',
  verbose: true,

  // only run your .spec.ts files
  testMatch: ['<rootDir>/**/*.spec.@(ts)', '!**/tests/e2e/**'],
  moduleFileExtensions: ['vue', 'ts', 'js', 'jsx', 'json', 'node', 'svg'],
  transformIgnorePatterns: ['node_modules/(?!(?:vue-i18n|@intlify|lodash-es)/).+\\.(js|mjs)$'],
  transform: {
    '^.+\\.vue$': '@vue/vue3-jest',
    '^.+\\.js$': 'babel-jest',
    '^.+\\.[tj]sx?$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.json',
        diagnostics: false
      }
    ]
  },
  // make your snapshots readable
  snapshotSerializers: ['jest-serializer-vue'],

  // mirror your tsconfig path‐aliases
  moduleNameMapper: {
    ...pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>/' }),
    '\\.(css|scss)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/tests/__mocks__/fileMock.js',
    '^vue-i18n$': 'vue-i18n/dist/vue-i18n.cjs.js',
    '^@intlify/core-base$': '@intlify/core-base/dist/core-base.cjs.js',
    '^@intlify/message-compiler$': '@intlify/message-compiler/dist/message-compiler.cjs.js',
    '^@intlify/shared$': '@intlify/shared/dist/shared.cjs.js',
    '^lodash-es$': 'lodash'
  },

  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.{ts,vue}', 'index.ts', '!**/*.d.ts', '!**/__mocks__/**'],
  coveragePathIgnorePatterns: ['/__mocks__/', '<rootDir>/build/', '<rootDir>/node_modules/', '<rootDir>/out/'],
  coverageDirectory: '<rootDir>/tests/test-results/.nyc_output',
  setupFilesAfterEnv: ['<rootDir>/tests/jest.setup.ts'],
  reporters: ['default', ['jest-junit', { outputDirectory: 'tests/test-results', outputName: 'junit.xml' }]],
  coverageReporters: ['json', 'text', ['json-summary', { file: '../unit-result.json' }]]
};
