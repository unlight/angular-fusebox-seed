angular-fusebox-seed
====================

[![Greenkeeper badge](https://badges.greenkeeper.io/unlight/angular-fusebox-seed.svg)](https://greenkeeper.io/)
Angular 2 seed project

QUICK START
---
```
git clone https://github.com/unlight/angular-fusebox-seed && cd angular-fusebox-seed
npm i 
npm run start
```

TASKS
---
| Task                  | Description                                |
|:----------------------|:-------------------------------------------|
| `npm run start`       | Local dev server                           |
| `npm run test:watch`  | Unit testing in watch mode                 |
| `npm run clean`       | Clean generated folders                    |
| `npm run dev`         | Local dev server and linting in watch mode |
| `npm run lint`        | Lint code (single run mode)                |
| `npm run testresults` | Unit testsing with verbose reporting       |
| `npm run t`           | Run unit testing in single run mode        |


TODO
---
* multiple bundles lazy loading

KNOWN ISSUES
---
* update zone to 0.8.0 when TS 2.2
* TS 2.2+ https://github.com/monounity/karma-typescript/issues/92
* ESLint configured with `no-undef: 0`
* ESLint configured with `no-unused-vars: 0`, TypeScript's `noUnusedLocals` will check that
* HMR works only for main module

DEBUG
---
* `inspect node_modules\gulp\bin\gulp.js build`
