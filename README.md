angular-fusebox-seed
====================
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
* ESLint configured with `no-undef: 0`
* ESLint configured with `no-unused-vars: 0`, TypeScript's `noUnusedLocals` will check that
* HMR works only for main module
