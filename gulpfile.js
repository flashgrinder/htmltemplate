'use strict';
/*jshint esversion: 6 */
let gulp          = require('gulp'),
	postcss       = require('gulp-postcss'),
	cleanCSS      = require('gulp-clean-css'),
	browserSync   = require('browser-sync').create(),
	sourcemaps    = require('gulp-sourcemaps'),
	sass          = require('gulp-sass'),
	gcmq          = require('gulp-group-css-media-queries'),
	uglify        = require('gulp-uglify'),
	smartgrid     = require('smart-grid'),
	cache         = require('gulp-cache'),
	concat        = require('gulp-concat'),
	imagemin      = require('gulp-imagemin'),
	imgRecompress = require('imagemin-jpeg-recompress'),
	pngquant      = require('imagemin-pngquant'),
	ftp           = require('gulp-ftp'),
	gutil         = require('gulp-util'),
	babel         = require('gulp-babel'),
	del           = require('del'),
	pug           = require('gulp-pug'),
	nunjucks      = require('gulp-nunjucks'),
	prettify      = require('gulp-html-prettify'),
    browserify    = require('browserify'),
    babelify      = require('babelify'),
    vss           = require('vinyl-source-stream'),
    rename        = require('gulp-rename'),
    vbuffer       = require('vinyl-buffer');

const source = {
	root: './src',
	src: {
		pug:   './src/layout/pages/*.+(jade|pug)',
        html:  './src/*.html',
        nunchucks: './src/templates/[^_]**.html',
		css:   './src/css/',
		sass:  './src/scss/*.scss',
		fonts: './src/fonts/**/*.*',
		img:   './src/img/**/*.*',
		js:    './src/js/*.js',
		libs: './src/libs/scripts.js'
	},
	dist: {
		html:  './dist',
		css:   './dist/css',
		fonts: './dist/fonts',
		img:   './dist/img',
		js:    './dist/js'
	},
	watch: {
		pug: './src/**/*.+(jade|pug)',
		html: './src/**/*.html',
		nunchucks: './src/templates/**/*.html',
		css:  './src/css/**/*.css',
		sass: './src/scss/**/*.+(sass|scss)',
		js:   './src/libs/**/*.js',
		php:  './src/**/*.php'
	}
};

function pugs() {
	return gulp.src(source.src.pug)
	.pipe(pug({pretty: true}))
	.pipe(gulp.dest(source.root))
}
gulp.task('pugs', pugs);

function nunjucksTmpl () {
	return gulp.src(source.src.nunchucks)
	.pipe(nunjucks.compile())
	.pipe(prettify({
		indent_size : 4
	}))
	.pipe(gulp.dest(source.root))
	.pipe(browserSync.reload({ stream: true }));
}
gulp.task('nunjucksTmpl', nunjucksTmpl);

function styles() {
	const autoprefixer = require('autoprefixer');
	const prt = require('postcss-responsive-type');

	const plugins = [
		autoprefixer({grid: "autoplace"}),
		prt()
	]
	
	return gulp.src(source.src.sass)
	.pipe(sass().on('error', sass.logError))
	.pipe(concat('style.min.css'))
	.pipe(gcmq())
	.pipe(postcss(plugins))
	.pipe(gulp.dest(source.src.css))
	.pipe(browserSync.reload({ stream: true }));
}
gulp.task('styles', styles);

function js() {
    const entry = 'scripts.js';
    const jsFolder = './src/libs/';
    return browserify({
        entries: [jsFolder + entry]
    })
    .transform(babelify, {presets: ['@babel/preset-env']})
    .bundle()
    .pipe(vss(entry))
    .pipe(rename({extname: '.min.js'}))
    .pipe(vbuffer())
    .pipe(gulp.dest('./src/js'))
}
gulp.task('js', js);

// Watch files
function watch() {
	browserSync.init({
		server: {
			baseDir: source.root
		},
		notify: true,
		tunnel: false
	});
	gulp.watch(source.watch.css);
	gulp.watch(source.watch.sass, styles);
	gulp.watch(source.watch.js, js);
	gulp.watch(source.watch.php);
	gulp.watch(source.watch.pug, pugs);
	gulp.watch(source.watch.nunchucks, nunjucksTmpl).on('change', browserSync.reload);
	gulp.watch(source.watch.html).on('change', browserSync.reload);
	gulp.watch('./smartgrid.js', grid).on('change', browserSync.reload);
}
gulp.task('watch', watch);

// SmartGrid preprocessor generation
function grid(done) {
	delete require.cache[require.resolve('./smartgrid.js')];
	let gridOptions = require('./smartgrid.js');
	smartgrid(source.root + '/scss/base', gridOptions);
	done();
}
gulp.task('grid', grid);

// TASKS FOR BUILD (PRODUCTION)

// Collect all html
function htmlBuild() {
	return gulp.src(source.src.html)
	.pipe(gulp.dest(source.dist.html));
}
// Collect all styles
function stylesBuild() {
	return gulp.src(source.src.css + '*.+(css|map)')
    .pipe(sourcemaps.init({loadMaps: true}))
	.pipe(cleanCSS({
		level: 2
	}))
    .pipe(sourcemaps.write('./'))
	.pipe(gulp.dest(source.dist.css));
}
// Collect all scripts
function scriptsBuild() {
	return gulp.src(source.src.js)
    .pipe(sourcemaps.init({loadMaps: true}))
	.pipe(uglify({
		toplevel: true
	}))
    .pipe(sourcemaps.write('./'))
	.pipe(gulp.dest(source.dist.js));
}

// Collect all fonts
function fontsBuild() {
	return gulp.src(source.src.fonts)
	.pipe(gulp.dest(source.dist.fonts));
}

// Оptimize images
function optimgBuild() {
	return gulp.src(source.src.img)
	.pipe(imagemin([
		imagemin.gifsicle({interlaced: true}),
		imagemin.mozjpeg({quality: 75, progressive: true}),
		imgRecompress({
			loops: 5,
			min: 70,
			max: 80,
			quality:'medium'
		}),
		imagemin.svgo(),
		imagemin.optipng({optimizationLevel: 3}),
		pngquant({quality: [0.7, 0.8], speed: 5})
	],{
		verbose: true
	}))
	.pipe(gulp.dest(source.dist.img));
}
gulp.task('optimgBuild', optimgBuild);

// Uploading files via FTP
function serverFTP() {
	return gulp.src('./dist/**')
	.pipe(ftp({
		host: 'ftp',
		user: 'user',
		pass: '*****',
		// remotePath: 'http://plus-seo.ru/tech/'
	}))
	.pipe(gutil.noop());
}
gulp.task('serverFTP', serverFTP);

// Clear production folder before building
function clean() {
	return del(['dist/*']);
}
gulp.task('clean', clean);

// Run the build
gulp.task('dev', gulp.series(clean, optimgBuild, gulp.parallel(htmlBuild, stylesBuild, scriptsBuild, fontsBuild)));

gulp.task('build', gulp.series('dev'));

// Default cmd
gulp.task('default', gulp.series(watch));