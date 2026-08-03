export default {
    preset: 'ts-jest/presets/default-esm',
    testEnvironment: 'node',
    testTimeout: 30000,
    roots: ['<rootDir>/tests'],
    extensionsToTreatAsEsm: ['.ts'],
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
    },
    setupFilesAfterEnv: ['<rootDir>/tests/jest.setup.ts'],
    transform: {
        '^.+\\.tsx?$': [
            'ts-jest',
            {
                useESM: true,
                tsconfig: 'tsconfig.json',
            },
        ],
    },
    coverageDirectory: 'coverage',
    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/server.ts',
        '!src/types/**',
    ],
};
