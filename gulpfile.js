var gulp = require('gulp');
var htmlmin = require('gulp-htmlmin');
var clean = require('gulp-clean');
var server = require('gulp-server-livereload');
var watch = require('gulp-watch');
var uglifyjs = require('gulp-uglifyjs');
var concatCss = require('gulp-concat-css');
var uglifycss = require('gulp-uglifycss');
var header = require('gulp-header');
var replace = require('gulp-replace');
var critical = require('critical');
var sass = require('gulp-sass');

var pkg = require('./package.json');
    // var banner = ['/**',
    // ' * <%= pkg.name %> - <%= pkg.description %>',
    // ' * @version v<%= pkg.version %>',
    // ' * @link <%= pkg.homepage %>',
    // ' * @license <%= pkg.license %>',
    // ' */',
    // ''].join('\n');
var banner = '/* v1.0.0 | (c)' + new Date().getFullYear() + ' SETLEVEL, LLC. All rights reserved. */\n';
 

// Shared
gulp.task('clean', function() {
    return gulp.src('dist/*')
            .pipe(clean());
});

gulp.task('sass', function () {
  return gulp.src('src/sass/**/*.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('src/css'));
});

gulp.task('sass:watch', function () {
  gulp.watch('src/sass/**/*.scss', ['sass']);
});

/* Development 
//////////////////////////////////////////*/

// Copy html to dist folder
gulp.task('dev-html', function() {
    return gulp.src('src/index.html')
            .pipe(gulp.dest('dist'));
});

// Copy js files
gulp.task('dev-js', function() {
    return gulp.src(['src/**/*.js'])
            .pipe(uglifyjs('app.min.js', {
                outSourceMap: false,
                toplevel: false,
                mangle: false,
                compress: false,
                output: { beautify: true }
            }))
            .pipe(header(banner, { pkg : pkg } ))
            .pipe(gulp.dest('dist/js'));
});

// Copy css files
gulp.task('minify-css', function() {
    return gulp.src(['src/**/*.css'])
            .pipe(concatCss('main.min.css'))
            .pipe(uglifycss())
            .pipe(header(banner, { pkg : pkg } ))
            .pipe(gulp.dest('dist/css'));
});

// Watch
gulp.task('watch', function () {
	gulp.watch('src/**/*', ['dev-html', 'dev-js', 'minify-css', 'sass']);
});

gulp.task('serve', function() {
  gulp.src(['dist'])
    .pipe(server({
      livereload: true,
      directoryListing: false,
      open: true,
      defaultFile: 'index.html'
    }));
});

gulp.task('dev', ['clean'], function() {
  gulp.start('dev-html', 'dev-js', 'minify-css', 'watch', 'serve');
});

/* //-> Development */


/* Production 
//////////////////////////////////////////*/

gulp.task('prod-html', function() {
  return gulp.src('src/*.html')
    .pipe(replace(/<!-- BOF: Remove for prod -->[\s\S]*?<!-- EOF: Remove for prod -->/g, ''))
    .pipe(htmlmin({
        collapseWhitespace: true,
        minifyCSS: true,
        minifyJS: true,
        removeComments: true
    }))
    .pipe(gulp.dest('dist'));
});

// Copy js files
gulp.task('prod-js', function() {
    return gulp.src(['src/**/*.js'])
            .pipe(uglifyjs('app.min.js', {
                outSourceMap: false,
                mangle: true,
                toplevel: true,
                compress: { unused: false }
            }))
            .pipe(header(banner, { pkg : pkg } ))
            .pipe(gulp.dest('dist/js'));
});

// Copy css files
gulp.task('prod-css', function() {
    return gulp.src(['src/**/*.css'])
            .pipe(concatCss('main.min.css'))
            .pipe(uglifycss())
            .pipe(header(banner, { pkg : pkg } ))
            .pipe(gulp.dest('dist/css'));
});

// Generate & Inline Critical-path CSS
gulp.task('critical', function () {
    critical.generate({
        inline: true,
        base: 'dist/',
        src: 'index.html',
        dest: 'dist/index-critical.html',
        width: 320,
        height: 480,
        minify: true,
        ignore: ['@font-face',/url\(/]
    });
});

gulp.task('prod', ['clean'], function() {
  gulp.start('build-prod-html');
});

gulp.task('build-prod-html', ['prod-html'], function() {
  gulp.start('build-prod-js');
});

gulp.task('build-prod-js', ['prod-js'], function() {
  gulp.start('build-prod-sass');
});

gulp.task('build-prod-sass', ['sass'], function() {
  gulp.start('build-prod-css');
});

gulp.task('build-prod-css', ['prod-css'], function() {
  critical.generate({
        inline: true,
        base: 'dist/',
        src: 'index.html',
        dest: 'dist/index.html',
        width: 320,
        height: 480,
        minify: true,
        ignore: ['@font-face',/url\(/]
    }).then(function (output) {
        // Recompress html
        return gulp.src('dist/*.html')
            .pipe(htmlmin({
                collapseWhitespace: true,
                minifyCSS: true,
                minifyJS: true,
                removeComments: true
            }))
            .pipe(gulp.dest('dist'));
    });
});

/* //-> Production */