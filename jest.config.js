/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/tests/framework/**/*.test.ts"],
  maxWorkers: 1,
  workerIdleMemoryLimit: "512MB",
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: {
          module: "commonjs",
          lib: ["ES2022", "DOM"],
        },
        diagnostics: false,
        isolatedModules: true,
      },
    ],
  },
  moduleNameMapper: {
    "^@core/(.*)$": "<rootDir>/src/core/$1",
    "^@audits/(.*)$": "<rootDir>/src/audits/$1",
    "^@reporters/(.*)$": "<rootDir>/src/reporters/$1",
    "^@crawler/(.*)$": "<rootDir>/src/crawler/$1",
    "^@utils/(.*)$": "<rootDir>/src/utils/$1",
    "^@config/(.*)$": "<rootDir>/config/$1",
  },
  collectCoverage: false,
  verbose: true,
};
