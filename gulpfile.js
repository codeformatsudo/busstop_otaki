var gulp = require('gulp');
var browserSync = require('browser-sync');
var sass = require('gulp-sass');
var plumber = require('gulp-plumber');
var csscomb = require('gulp-csscomb');
var notify = require('gulp-notify');
var autoprefixer = require('gulp-autoprefixer');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var watch = require('gulp-watch');
var changed = require('gulp-changed');
var cache = require('gulp-cached');
var concat = require('gulp-concat');

var destDir = 'docs/'; // 出力用ディレクトリ
var assetsDir = 'common/'; // 案件によってcommonとかassetsとかあるんでとりあえず変数にした

const browserSyncOption = {
  server: {
    baseDir: destDir,
    index: 'index.html'
  },
  reloadOnRestart: true
};

function sync(done) {
  browserSync.init(browserSyncOption);
  done();
}

gulp.task('browser-sync', function () {
  console.log('hogehoge')
	browserSync.init({
		server: {
			baseDir: destDir
		},
    reloadOnRestart: true
	});
});

gulp.task('sass', function () {
	return gulp.src(['resource/' + assetsDir + 'sass/**/*.scss'])
		.pipe(plumber({ // gulp-plumberを咬ますとエラー時にgulpが止まらない。
			errorHandler: notify.onError('Error: <%= error.message %>') // gulp-notifyでエラー通知を表示
		}))
		.pipe(sass()) // gulp-sassでコンパイルし、
		.pipe(autoprefixer({
			browsers: ['last 2 versions', 'Android 3', 'ie 9']
		})) // autoprefixerかけて、（対応ブラウザ。案件によって変更する）
		.pipe(csscomb()) // gulp-csscombで整形してあげて、
		.pipe(gulp.dest('resource/' + assetsDir + 'css/')) // とりあえずresource側cssフォルダに吐き出す。
});
gulp.task('css', function () {
	return gulp.src('resource/**/*.css')
		.pipe(cache('css-cache')) // cssをキャッシュさせつつ、
		.pipe(gulp.dest(destDir)) // destDirに出力して、
		//.pipe(browserSync.stream()) // browser-syncで反映させる。
});

// jsの圧縮リネーム
gulp.task('jsmin', function () {
	return gulp.src(['resource/' + assetsDir + 'js/**/*.js',
    '!resource/' + assetsDir + 'js/**/*.min.js']) // jQueryなどの、すでに.minなjsは除外する。
		.pipe(plumber()) // gulp-plumberを咬ますとエラー時にgulpが止まらない（cssみたいにgulp-notify書いてもエラー通知が何故か出ないのでそのまま）。
		.pipe(changed(destDir + assetsDir + 'js/')) // 変更されたjsのみをgulp.dest対象にする。
		.pipe(uglify({
			preserveComments: 'some'
		})) // uglifyでjsを圧縮するがライセンス表記を残す。
		.pipe(rename({
			suffix: '.min'
		})) // .min付与
		.pipe(gulp.dest('resource/' + assetsDir + 'js/')) // jsもとりあえずresource側jsフォルダに吐き出す。
});
gulp.task('js', function () {
	return gulp.src('resource/**/*.js')
		.pipe(cache('js-cache')) // jsをキャッシュさせつつ、
		.pipe(gulp.dest(destDir)) // destDirに出力して、
		//.pipe(browserSync.stream()) // browser-syncで反映させる。
});
gulp.task('geojson', function () {
	return gulp.src('resource/**/*.geojson')
		.pipe(plumber())
		.pipe(concat('data.geojson'))
		.pipe(gulp.dest(destDir + assetsDir + 'data/')) // destDirに出力して、
		//.pipe(browserSync.stream()) // browser-syncで反映させる。
});

gulp.task('copyResource', function () {
	return gulp.src(['resource/**/*', '!resource/' + assetsDir + 'sass/', '!resource/' + assetsDir + 'sass/*.scss', '!resource/' + assetsDir + 'data/']) // sassディレクトリ以外の全ファイルを対象にし、
		.pipe(cache('resource-cache')) // キャッシュさせて、
		.pipe(gulp.dest(destDir)) // destDirに出力して、
		//.pipe(browserSync.stream()) // browser-syncで反映させる。
});

// watch&リロード 処理
function watchFiles(done) {
  const browserReload = () => {
    browserSync.reload();
    done();
  };
  // browser-syncで反映させるものをbrowserReload関数に任せる
  gulp.watch(['resource/**/*.+(jpg|jpeg|gif|png|html|php)']).on('change', gulp.series('copyResource', browserReload)); // css,sass,js以外に変更があったら実行。
  gulp.watch(['resource/**/*.scss']).on('change', gulp.series('sass', browserReload)); // sassに変更があったら実行。cssを吐き出すので下のwatchが動く。
  gulp.watch(['resource/**/*.css']).on('change', gulp.series('css', browserReload)); // cssに変更があったら実行。つまりsassを変更したらセットで実行となる。
  gulp.watch(['resource/**/*.js']).on('change', gulp.series('jsmin', browserReload)); // jsに変更があったら実行。.minしたjsを吐き出すので下のwatchが動く。
  gulp.watch(['resource/**/*.min.js']).on('change', gulp.series('js', browserReload)); // .min.jsに変更があったら実行。つまりjsを変更したらセットで実行となる。
  gulp.watch(['resource/**/*.geojson'].on('change', gulp.series('geojson', browserReload));
}


// gulp-watchで監視
// ['browser-sync','copyResource','sass','jsmin','geojson']を実行してからdefaultとして内容を実行。
// gulp-watchを使うとフォルダに追加したファイルも対象に監視してくれるのでgulp再実行の必要がない。
gulp.task('default', gulp.series('copyResource', 'sass', 'jsmin', 'geojson', sync, watchFiles));
