/** @type {import('jest').Config} */
const tsTransform = ['ts-jest', { tsconfig: '<rootDir>/tsconfig.test.json' }];
const coreAlias = {
  '^edfi-profile-core$': '<rootDir>/packages/edfi-profile-core/src/index.ts',
  '^edfi-profile-core/(.*)$': '<rootDir>/packages/edfi-profile-core/src/$1',
};

module.exports = {
  projects: [
    {
      displayName: 'node',
      preset: 'ts-jest',
      testEnvironment: 'node',
      roots: [
        '<rootDir>/packages/edfi-profile-core',
        '<rootDir>/packages/metaed-plugin-edfi-implementation-profile',
        '<rootDir>/packages/edfi-profile-cli',
      ],
      testMatch: ['**/test/**/*.test.ts'],
      moduleNameMapper: coreAlias,
      transform: { '^.+\\.tsx?$': tsTransform },
    },
    {
      displayName: 'studio',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      roots: ['<rootDir>/packages/edfi-profile-studio'],
      testMatch: ['**/test/**/*.test.tsx', '**/test/**/*.test.ts'],
      moduleNameMapper: {
        ...coreAlias,
        // Bundled ?raw sample imports — resolve to the file's text via a loader.
        '\\.ya?ml\\?raw$': '<rootDir>/packages/edfi-profile-studio/test/rawYamlLoader.js',
      },
      transform: { '^.+\\.tsx?$': tsTransform },
    },
  ],
};
