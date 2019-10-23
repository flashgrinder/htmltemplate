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
	pug           = require('gulp-pug');

const source = {
	root: './app',
	app: {
		pug:   './app/layout/pages/*.+(jade|pug)',
		html:  './app/*.html',
		css:   './app/css/',
		sass:  './app/sass/*.sass',
		fonts: './app/fonts/**/*.*',
		img:   './app/img/**/*.*',
		js:    './app/js/',
		libs:  [
			// './app/libs/jquery-3.3.1.js',
			'./app/libs/common.js'
		]
	},
	build: {
		html:  './build',
		css:   './build/css',
		fonts: './build/fonts',
		img:   './build/img',
		js:    './build/js'
	},
	watch: {
		pug: './app/**/*.+(jade|pug)',
		html: './app/**/*.html',
		css:  './app/css/**/*.css',
		sass: './app/sass/**/*.+(sass|scss)',
		js:   './app/libs/**/*.js',
		php:  './app/**/*.php'
	}
};

function pugproc() {
	return gulp.src(source.app.pug)
	.pipe(pug({pretty: true}))
	.pipe(gulp.dest(source.root))
}

function sassproc() {
	const autoprefixer = require('autoprefixer');
	return gulp.src(source.app.sass)
	.pipe(sourcemaps.init())
	.pipe(sass().on('error', sass.logError))
	.pipe(concat('style.min.css'))
	.pipe(gcmq())
	.pipe(postcss([autoprefixer()]))
	.pipe(sourcemaps.write('.'))
	.pipe(gulp.dest(source.app.css))
	.pipe(browserSync.reload({ stream: true }));
}
gulp.task('sassproc', sassproc);

function jsfiles() {
	return gulp.src(source.app.libs)
	.pipe(sourcemaps.init())
	.pipe(concat('scripts.min.js'))
	.pipe(sourcemaps.write('.'))
	.pipe(gulp.dest(source.app.js))
	.pipe(browserSync.stream());
}
gulp.task('jsfiles', jsfiles);

// Отслеживаем изменения в файлах.

function watch() {
	browserSync.init({
		server: {
			baseDir: source.root
		},
		notify: true,
		tunnel: false
	});
	gulp.watch(source.watch.css);
	gulp.watch(source.watch.sass, sassproc);
	gulp.watch(source.watch.js, jsfiles);
	gulp.watch(source.watch.php);
	gulp.watch(source.watch.pug, pugproc);
	gulp.watch(source.watch.html).on('change', browserSync.reload);
	gulp.watch('./smartgrid.js', grid).on('change', browserSync.reload);
}
gulp.task('watch', watch);

// Генерация препроцессорной-сетки SmartGrid
function grid(done) {
	delete require.cache[require.resolve('./smartgrid.js')];
	let gridOptions = require('./smartgrid.js');
	smartgrid(source.root + '/sass', gridOptions);
	done();
}
gulp.task('grid', grid);

// TASK FOR BUILD (PRODUCTION) - Сборка для продакшена

// Собрать все HTML файлы.
function html() {
	return gulp.src(source.app.html)
	.pipe(gulp.dest(source.build.html));
}
// Собрать все стили.
function styles() {
	return gulp.src(source.app.css + '*.+(css|map)')
	.pipe(cleanCSS({
		level: 2
	}))
	.pipe(gulp.dest(source.build.css));
}
// Собрать все скрипты.
function scripts() {
	return gulp.src(source.app.js + '*.js')
	.pipe(babel({
		presets: ['env']
	}))
	.on('error', console.error.bind(console))
	.pipe(uglify({
		toplevel: true
	}))
	.pipe(gulp.dest(source.build.js));
}

function mapjs() {
	return gulp.src(source.app.js + '*.map')
	.pipe(gulp.dest(source.build.js));
}

// Собрать все шрифты.
function fonts() {
	return gulp.src(source.app.fonts)
	.pipe(gulp.dest(source.build.fonts));
}

// Оptimize images - Оптимизация изображений перед отправкой в продакшн
function optimg() {
	return gulp.src(source.app.img)
	.pipe(imagemin([
		imagemin.gifsicle({interlaced: true}),
		imagemin.jpegtran({progressive: true}),
		imgRecompress({
			loops: 5,
			min: 70,
			max: 80,
			quality:'medium'
		}),
		imagemin.svgo(),
		imagemin.optipng({optimizationLevel: 3}),
		pngquant({quality: '70-80', speed: 5})
	],{
		verbose: true
	}))
	.pipe(gulp.dest(source.build.img));
}
gulp.task('optimg', optimg);

// Uploading files via FTP - Отправка файлов на хостинг
function serverFTP() {
	return gulp.src('./build/**')
	.pipe(ftp({
		host: 'ftp',
		user: 'user',
		pass: '*****',
		// remotePath: 'http://plus-seo.ru/tech/'
	}))
	.pipe(gutil.noop());
}
gulp.task('serverFTP', serverFTP);

// Очистить папку продакшена перед сборкой.
function clean() {
	return del(['build/*']);
}
gulp.task('clean', clean);

// Run the build - Запустить сборку
gulp.task('build', gulp.series(clean, optimg, gulp.parallel(html, styles, scripts, mapjs, fonts)));

gulp.task('dev', gulp.series('build'));

// Дефолтная команда
gulp.task('default', gulp.series(watch));