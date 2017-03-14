/// <reference path="node_modules/@types/node/index.d.ts" />
/// <reference path="node_modules/typescript/lib/lib.es2015.d.ts" />
Error.stackTraceLimit = Infinity;
import * as _ from 'lodash';
import * as fs from 'fs';
import * as Path from 'path';
import { PostCSS, FuseBox, RawPlugin, CSSPlugin, HTMLPlugin, UglifyJSPlugin, SassPlugin, CSSResourcePlugin } from 'fuse-box';
import { File } from 'fuse-box/dist/typings/core/File';
import { Plugin } from 'fuse-box/dist/typings/core/WorkflowContext';
import { EventEmitter } from 'events';
import del = require('del');
import through = require('through2');
const { ChainPlugin } = require('fusebox-chain-plugin');
import { execSync } from 'child_process';
const readPkg = require('read-pkg');
const gulp = require('gulp');
const g = require('gulp-load-plugins')();
const streamFromPromise = require('stream-from-promise');
const { GulpPlugin } = require('fusebox-gulp-plugin');
const args = g.util.env;
const events = new EventEmitter();

const config = {
    devMode: args.prod !== true,
    port: 8083,
    socketPort: 8084,
    dest: 'build',
    specBundle: 'spec.bundle',
    minify: args.nomin !== true,
    get hash() {
        if (this._hash === undefined) {
            this._hash = this.devMode ? '' : ['', readPkg.sync().version, g.util.date(`yyyymmdd'T'HHMMss`)].join('.');
        }
        return this._hash;
    },
};

const filePool = new Map();

const postcssPlugins = _.constant(_.filter([
    require('autoprefixer')({ browsers: ['last 3 version'] }),
    (!config.devMode && config.minify) && require('postcss-csso')
]));

const fuseBox = _.memoize(function createFuseBox(options = {}) {
    const config: any = _.get(options, 'config', {});
    const entry = _.get(options, 'entry', 'app');
    const plugins: any[] = [
        [
            /\.ts$/,
            GulpPlugin([
                (file) => g.preprocess({ context: config }),
            ]),
        ],
        ChainPlugin({ extension: '.scss', test: /\.scss$/ }, {
            '.component.scss': [
                SassPlugin({ sourceMap: false }),
                RawPlugin({}),
            ],
            '.scss': [
                SassPlugin({}),
                CSSPlugin(),
            ]
        }),
        HTMLPlugin({ useDefault: false }),
    ];
    const settings = {
        homeDir: 'src',
        log: false,
        sourcemaps: true,
        tsConfig: `${__dirname}/tsconfig.json`,
        cache: true,
        outFile: `./${config.dest}/${entry}.js`,
        plugins: plugins,
        debug: false,
        // rollup: {
        //     bundle: {
        //         moduleName: 'app',
        //     },
        //     entry: 'main.ts',
        //     treeshake: true,
        // }
        // alias: angularBundlesAliasMap(),
    };
    if (!config.devMode) {
        if (config.minify) {
            plugins.push(UglifyJSPlugin({}));
        }
    }
    const fuse = FuseBox.init({ ...settings, ...options });
    return fuse;
});

const bundles: any = {
    [`${config.dest}/app.js`]: `>main.ts`,
    [`${config.dest}/about.module.js`]: `[app/about/about.module.ts]`,
};

gulp.task('build', (done) => {
    return fuseBox({ config }).bundle(bundles)
        .then(() => {
            events.emit('livereload');
        });
});

gulp.task('bundle:rev', () => {
    return gulp.src(`${config.dest}/*.js`)
        .pipe(through.obj((file, enc, callback) => {
            del.sync(file.path);
            callback(null, file);
        }))
        .pipe(g.rename({ suffix: config.hash }))
        .pipe(gulp.dest(config.dest));
});

gulp.task('spec:bundle', (done) => {
    fuseBox({ config, entry: `${config.specBundle}` })
        .bundle(`>${config.specBundle}.ts`, () => done());
});

gulp.task('spec:watch', (done) => {
    const watchers = [
        gulp.watch('src/**/*.*', gulp.series('spec:bundle')),
    ];
    process.on('SIGINT', () => {
        watchers.forEach(w => w.close());
        done();
    });
});

gulp.task('spec:prepare', () => {
    let fileList = [];
    return gulp.src('src/**/*.spec.ts', { read: false })
        .pipe(through.obj((file, enc, cb) => {
            fileList.push(file.path);
            cb();
        }, function(cb: any) {
            let contents = fileList
                .map(p => Path.relative('./src', p))
                .map(p => `./${p.replace(/\\/g, '/')}`)
                .map(p => p.replace(/\.ts$/, ''))
                .map(p => `require('${p}')`)
                .join('\n')
            let file = new g.util.File({ contents: Buffer.from(contents), path: '~tmp.spec-files.ts' });
            this.push(file);
            cb();
        }))
        .pipe(gulp.dest('src'));
});

gulp.task('spec:fix_sourcemaps', (done) => {
    var contents = fs.readFileSync(`./${config.dest}/${config.specBundle}.js`, 'utf8');
    var lastLine = _.last(contents.split('\n'));
    contents = contents.replace(/\/\/# sourceMappingURL=.+/gm, '//# ') + lastLine;
    fs.writeFileSync(`./${config.dest}/${config.specBundle}.js`, contents);
    done();
});

gulp.task('spec:build', gulp.series('spec:prepare', 'spec:bundle', 'spec:fix_sourcemaps'));

gulp.task('server', (done) => {
    // var history = require('connect-history-api-fallback');
    const folders = [config.dest];
    if (config.devMode) {
        folders.push('src'); // Serve sourcemaps.
    }
    const connect = g.connect.server({
        root: folders,
        livereload: false,
        port: config.port,
        // middleware: (connect, opt) => [ // eslint-disable-line no-unused-vars
        //     history()
        // ]
    });
    connect.server.on('close', done);
});

gulp.task('devserver', (done) => {
    if (!config.devMode) {
        return done();
    }
    // TODO: Other bundles?
    const ds = fuseBox({ config }).devServer(`>main.ts`, {
        port: config.socketPort,
        httpServer: false,
        emitter: (self, fileInfo) => {
            let path = fileInfo.path;
            let file = filePool.get(path);
            if (file) {
                self.socketServer.send('source-changed', fileInfo);
                filePool.delete(path);
            }
        }
    });

    events.on('livereload', () => {
        ds.socketServer.send('source-changed', { type: 'reload' });
    });

    process.on('SIGINT', () => {
        ds.socketServer.server.close();
        done();
    });
});

gulp.task('devserver:pool', (done) => {

    const w = gulp.watch('src/**/*.*').on('all', (event, path, stats) => {
        path = Path.relative('src', path).replace(/\\/g, '/');
        if (_.endsWith(path, '.ts')) path = `${path.slice(0, -3)}.js`;
        if (event === 'change') {
            filePool.set(path, { path, mtime: stats.mtime });
        } else {
            setTimeout(() => events.emit('livereload'), 500);
        }
    });

    process.on('SIGINT', () => {
        w.close();
        done();
    });

});

gulp.task('watch', (done) => {
    const watchers = [
        gulp.watch('src/**/!(*.spec).*', gulp.series('build')),
    ];
    process.on('SIGINT', () => {
        watchers.forEach(w => w.close());
        done();
    });
});

gulp.task('clean', function clean() {
    return del(['.fusebox', '.testresults', config.dest]);
});

gulp.task('htdocs', function htdocs() {
    let scripts = gulp.src(`${config.dest}/app*.js`, { read: false });
    // let styles = gulp.src(`${config.dest}/*.css`, { read: false });
    return gulp.src('src/index.html')
        // .pipe(g.inject(styles, { addRootSlash: false, ignorePath: config.dest }))
        .pipe(g.inject(scripts, { addRootSlash: false, ignorePath: config.dest }))
        .pipe(gulp.dest(config.dest))
        .on('end', () => events.emit('livereload'));
});

gulp.task('htdocs:watch', done => {
    let w = gulp.watch('src/index.html', gulp.series('htdocs'));
    process.on('SIGINT', () => {
        w.close();
        done();
    });
});

gulp.task('eslint', () => {
    return gulp.src('src/**/*.ts', { since: g.memoryCache.lastMtime('ts') })
        .pipe(g.ignore.exclude('~tmp.spec-files.ts'))
        .pipe(g.memoryCache('ts'))
        .pipe(g.eslint())
        .pipe(g.eslint.format());
});

gulp.task('eslint:watch', (done) => {
    let w = gulp.watch('src/**/*.ts', { ignoreInitial: false }, gulp.series('eslint'));
    w.on('change', g.memoryCache.update('ts'));
    process.on('SIGINT', () => {
        w.close();
        done();
    });
});

gulp.task('bump', () => {
    const options: any = {};
    if (args.m) {
        options.type = 'minor';
    }
    let onEnd = () => { };
    if (args.commit) {
        onEnd = () => {
            const { version } = readPkg.sync();
            execSync(`git add package.json`);
            execSync(`git commit -m "${version}"`);
        };
    }
    return gulp.src('./package.json')
        .pipe(g.bump())
        .pipe(gulp.dest('.'))
        .on('end', onEnd);
});

gulp.task('start', gulp.series(...[
    // ...(args.clean || args.c ? ['clean'] : []),
    'build',
    'htdocs',
    gulp.parallel('devserver', 'server', 'htdocs:watch', 'devserver:pool'),
]));

gulp.task('release', gulp.series(...[
    'clean',
    'build',
    'bundle:rev',
    'htdocs',
]));

function angularBundlesAliasMap() {
    const resolve = require('resolve');
    const packages = [
        '@angular/core/testing',
        '@angular/platform-browser-dynamic/testing',
        '@angular/compiler/testing',
        '@angular/platform-browser/testing',
    ];
    const nodeModulesPath = Path.resolve('node_modules');
    return _.reduce(packages, (result, value, key) => {
        let relative = resolve.sync(value)
            .slice(nodeModulesPath.length + 1)
            .replace(/\\/g, '/');
        return result;
    }, {});
}

gulp.task('angular:fix_bundles', (done) => {
    const resolve = require('resolve');
    const streams = [
        '@angular/core/testing',
        '@angular/platform-browser-dynamic/testing',
        '@angular/compiler/testing',
        '@angular/platform-browser/testing',
    ].map(name => {
        let bundle = resolve.sync(name);
        let result = Path.join('node_modules', name, 'index.js');
        return fs.createReadStream(bundle).pipe(fs.createWriteStream(result));
    });
    return _.last(streams);
});
