import * as _ from 'lodash';
import { Config } from 'karma';
const argv = require('minimist')(process.argv.slice(2));
const specBundleFile = 'spec.bundle';

module.exports = (config: any) => {

    const karma: Config = config;

    karma.set({
        basePath: './build',
        files: [
            { pattern: `${specBundleFile}.js` },
        ],
        browsers: ['PhantomJS'],
        frameworks: [
            'jasmine',
        ],
        preprocessors: {
            [`${specBundleFile}.js`]: ['sourcemap'],
        },
        reporters: ['progress'],
        autoWatch: true,
        singleRun: false,
        port: 9876,
        logLevel: config.LOG_INFO
    });

    if (argv.testresults) {
        config.set({
            reporters: ['mocha', 'html', 'junit'],
            mochaReporter: {
                symbols: {
                    success: '+',
                    info: '#',
                    warning: '!',
                    error: '-'
                }
            },
            htmlReporter: {
                outputDir: __dirname + '/.testresults',
                namedFiles: true,
                reportName: 'index',
                pageTitle: 'JsTest',
            },
            junitReporter: {
                outputDir: __dirname + '/.testresults',
                outputFile: 'js-junit.xml',
                useBrowserName: false
            },
        });
    }

    if (argv.coverage) {
        const reporterOptions = {
            'text-summary': null,
            html: {
                directory: __dirname,
                subdirectory: '.testresults',
                filename: 'coverage',
            }
        };
        config.set({
            basePath: '.',
            frameworks: ['jasmine', 'karma-typescript'],
            files: [
                { pattern: `src/${specBundleFile}.ts` },
                { pattern: `src/~tmp.spec-files.ts` },
                { pattern: 'src/app/**/*.+(ts|html)' },
            ],
            preprocessors: {
                '**/*.ts': ['karma-typescript'],
            },
            reporters: ['progress', 'karma-typescript'],
            karmaTypescriptConfig: {
                reports: reporterOptions,
                coverageOptions: {
                    instrumentation: true,
                    exclude: /\.(d|spec|test|bundle|spec-files)\.ts/
                },
            }
        });
    }
};
