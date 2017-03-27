/// <reference path="typings.d.ts" />
import 'core-js/es6';
import 'core-js/es7';
import 'zone.js/dist/zone';
import 'zone.js/dist/long-stack-trace-zone.js';
import 'zone.js/dist/proxy.js';
import 'zone.js/dist/sync-test.js';
import 'zone.js/dist/jasmine-patch.js';
import 'zone.js/dist/async-test.js';
import 'zone.js/dist/fake-async-test.js';

import { TestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());

require('./~tmp.spec-files');
