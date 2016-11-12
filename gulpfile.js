'use strict';

var gulp = require('gulp');
var plugins = require('gulp-load-plugins')();
var runSequence = require('run-sequence');
var path = require('path');
var del = require('del');
var merge = require('merge-stream');

gulp.task('heroku:dev', ['build-dev']);
gulp.task('heroku:prod', ['build-prod']);

gulp.task('default', ['build-dev']);

gulp.task('build-dev', function (callback) {
    runSequence('sass',
        ['js', 'partials', 'assets', 'index'],
        callback);
});

gulp.task('build-prod', function (callback) {
    runSequence(['js-prod', 'sass-prod'],
        ['partials-prod', 'images', 'index-prod', 'fonts'],
        callback);
});

gulp.task('sass', function () {
    var sassOptions = {
        errLogToConsole: true,
        outputStyle: 'expanded'
    };
    var input = './src/stylesheets/style.scss';
    var output = './public/css';
    return gulp
        .src(input)
        .pipe(plugins.sourcemaps.init())
        .pipe(plugins.sass(sassOptions).on('error', plugins.sass.logError))
        .pipe(plugins.autoprefixer())
        .pipe(plugins.sourcemaps.write('.'))
        .pipe(gulp.dest(output));
});

gulp.task('sass-prod', function () {
    var sassOptions = {
        errLogToConsole: true,
        outputStyle: 'compressed'
    };
    var input = './src/stylesheets/style.scss';
    var output = './public/css';
    return gulp
        .src(input)
        .pipe(plugins.sourcemaps.init())
        .pipe(plugins.sass(sassOptions).on('error', plugins.sass.logError))
        .pipe(plugins.sourcemaps.write())
        .pipe(plugins.autoprefixer())
        .pipe(plugins.cleanCss())
        .pipe(gulp.dest(output));
});

gulp.task('js', function () {
    var input = './src/js/**/*.js';
    var output = './public/js';
    return gulp.src(input)
        .pipe(plugins.ngAnnotate())
        .pipe(gulp.dest(output));
});

gulp.task('js-prod', function () {
    var input = './src/js/**/*.js';
    var output = './public/js';
    return gulp.src(input)
        .pipe(plugins.concat('townCrier.min.js'))
        .pipe(plugins.ngAnnotate())
        .pipe(plugins.uglify())
        .pipe(gulp.dest(output));
});

gulp.task('partials', function () {
    var input = ['./src/js/**/*.html', './src/*.html', '!./src/index.html'];
    var output = './public/js';
    return gulp.src(input)
        .pipe(gulp.dest(output));
});

gulp.task('partials-prod', function () {
    var input = ['./src/js/**/*.html', './src/*.html', '!./src/index.html'];
    var output = './public/js';
    return gulp.src(input)
        .pipe(gulp.dest(output))
        .pipe(plugins.htmlmin({collapseWhitespace: true}));
});

gulp.task('assets', function () {
    var favicon = './src/favicon.ico'
    var favStream = gulp.src(favicon)
        .pipe(gulp.dest('./public'));

    var input = './src/assets/*';
    var output = './public/assets';
    var imgStream =  gulp.src(input)
        .pipe(gulp.dest(output));
    return merge(imgStream, favStream);

});

gulp.task('fonts', function () {
    return gulp.src(mainBowerFiles())
        .pipe(plugins.filter('**/*.{otf,eot,svg,ttf,woff,woff2}'))
        .pipe(gulp.dest('./public/fonts'));
});

gulp.task('index', function () {
    var input = './src/index.html';
    var output = './public';
    var sources = gulp.src('./**/*.js', {read: false, cwd: path.join(__dirname, '/src')});
    return gulp.src(input)
        .pipe(plugins.inject(sources))
        .pipe(gulp.dest(output));
});

gulp.task('index-prod', function () {
    var input = './src/index.html';
    var output = './public';
    var sources = gulp.src('./js/*.js', {read: false, cwd: path.join(__dirname, '/public')});
    return gulp.src(input)
        .pipe(plugins.inject(sources))
        .pipe(plugins.inject(gulp.src(mainBowerFiles(), {read: false}), {name: 'bower'}))
        .pipe(plugins.htmlmin({collapseWhitespace: true}))
        .pipe(gulp.dest(output));
});





