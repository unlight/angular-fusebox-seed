import 'es6-shim';
import 'reflect-metadata';
import 'zone.js/dist/zone';
import './style.scss';

if (process.env.NODE_ENV === 'development') {
    require('fusebox-hmr-style');
    require('fusebox-reload');
}

import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { enableProdMode } from '@angular/core';
import { AppModule } from './app/app.module';

if (process.env.NODE_ENV === 'production') {
    enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule);
