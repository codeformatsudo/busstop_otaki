var gulp = require('gulp');
var browserSync = require('browser-sync');
var sass = require('gulp-sass');
var plumber = require('gulp-plumber');
var sourcemaps = require('gulp-sourcemaps');
var csscomb = require('gulp-csscomb');
var notify = require('gulp-notify');
var autoprefixer = require('gulp-autoprefixer');
var imagemin = require('gulp-imagemin');
var imageminJpg = require('imagemin-jpeg-recompress');
var imageminPng = require('imagemin-pngquant');
var imageminGif = require('imagemin-gifsicle');
var svgmin = require('gulp-svgmin');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var watch = require('gulp-watch');
var changed = require('gulp-changed');
var cache = require('gulp-cached');
var concat = require('gulp-concat');
var jshint = require('gulp-jshint');

var srcDir = 'resource/'; //作業ディレクトリ
var destDir = 'docs/'; // 出力用ディレクトリ
var assetsDir = 'common/';

//Sass
gulp.task('sass', function () {
	return gulp.src(srcDir + assetsDir + 'sass/**/*.scss')
		.pipe(plumber())
		.pipe(sourcemaps.init())
		.pipe(sass({
			outputStyle: 'expanded'
		}))
		.pipe(autoprefixer({
			broweser: ['last 2 version', 'iOS >= 8.1', 'Android = 4.4'],
			cascade: false
		}))
		.pipe(sourcemaps.write())
		.pipe(gulp.dest(destDir + assetsDir + 'css/'));
});


//img jpg,png,gif
gulp.task('imagemin', function () {
	return gulp.src(srcDir + assetsDir + 'img/photo/*.+(jpg|jpeg|png|gif)')
		.pipe(changed(destDir + assetsDir + 'img/photo/'))
		.pipe(imagemin([
			imageminPng(),
			imageminJpg(),
			imageminGif({
				interlaced: false,
				optimizationLevel: 3,
				colors: 180
			})
		]))
		.pipe(gulp.dest(destDir + assetsDir + 'img/photo/'));
});

//img svg
gulp.task('svgmin', function () {
	return gulp.src(srcDir + assetsDir + 'img/*.+svg')
		.pipe(changed(destDir + assetsDir + 'img/'))
		.pipe(svgmin())
		.pipe(gulp.dest(destDir + assetsDir + 'img/photo/'));
});

//js
gulp.task('js.concat', function () {
	return gulp.src(
			srcDir + assetsDir + 'js/main.js'
		)
		.pipe(plumber())
		.pipe(jshint())
		.pipe(jshint.reporter('default'))
		.pipe(concat('bundle.js'))
		.pipe(gulp.dest(destDir + assetsDir + 'js/'));
});

gulp.task('js.compress', function () {
	return gulp.src(destDir + assetsDir + 'js/bundle.js')
		.pipe(plumber())
		.pipe(uglify())
		.pipe(rename('bundle.min.js'))
		.pipe(gulp.dest(destDir + assetsDir + 'js/'));
});

// Browser Sync
var browserSyncOption = {
	server: {
		baseDir: destDir,
		index: "index.html"
	},
	reloadOnRestart: true
};

function browserSync(done) {
	browserSync.init(browserSyncOption);
	done();
}

gulp.task('browser-sync', function () {
	browserSync.init({
		server: {
			baseDir: destDir
		},
		reloadOnRestart: true
	});
});


// Reload Browser
function watchFiles(done) {
	const browserReload = function () {
		browserSync.reload();
		done();
	};
	gulp.watch(srcDir + assetsDir + 'sass/**/*.scss').on('change', gulp.series('sass', browserReload));
	gulp.watch(srcDir + assetsDir + 'js/*.js').on('change', gulp.series('js.concat', 'js.compress', browserReload));
	gulp.watch(srcDir + assetsDir + 'img/photo/*').on('change', gulp.series('imagemin', browserReload));
}

gulp.task('default', gulp.series(gulp.parallel('browser-sync', 'sass', 'js.concat', 'js.compress', 'imagemin', 'svgmin'), gulp.series(browserSync, watchFiles)));
