module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testMatch: [
    '**/__tests__/**/*.(test|spec).+(ts|tsx|js)',
    '**/*.(test|spec).+(ts|tsx|js)'
  ],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: 'tsconfig.json' }]
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/**/*.stories.{ts,tsx}',
    '!src/**/__tests__/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/main/(.*)$': '<rootDir>/src/main/$1',
    '^@/renderer/(.*)$': '<rootDir>/src/renderer/$1',
    '^@/shared/(.*)$': '<rootDir>/src/shared/$1',
    '^@/preload/(.*)$': '<rootDir>/src/preload/$1',
    '\\.(css|less|sass|scss)$': '<rootDir>/src/__tests__/mocks/styleMock.js',
    '^better-sqlite3$': '<rootDir>/src/__tests__/mocks/betterSqlite3Mock.js'
  },
  testPathIgnorePatterns: ['<rootDir>/src/__tests__/integration/'],
  testTimeout: 10000
};