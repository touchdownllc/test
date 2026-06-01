/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: [
    '<rootDir>/packages/edfi-profile-core',
    '<rootDir>/packages/metaed-plugin-edfi-implementation-profile',
    '<rootDir>/packages/edfi-profile-cli',
  ],
  testMatch: ['**/test/**/*.test.ts'],
  moduleNameMapper: {
    '^edfi-profile-core$': '<rootDir>/packages/edfi-profile-core/src/index.ts',
    '^edfi-profile-core/(.*)$': '<rootDir>/packages/edfi-profile-core/src/$1',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.test.json' }],
  },
};
