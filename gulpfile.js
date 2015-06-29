var gulp = require('gulp'),
coffee = require('gulp-coffee'),
gutil = require('gulp-util'),
uglify = require('gulp-uglify'),
// imagemin = require('gulp-imagemin'),
cache = require('gulp-cache'),
sass = require('gulp-ruby-sass'),
autoprefixer = require('gulp-autoprefixer'),
minifycss = require('gulp-minify-css'),
rename = require('gulp-rename');
var tinylr;
gulp.task('livereload', function() {
  tinylr = require('tiny-lr')();
  tinylr.listen(35729);
});

function notifyLiveReload(event) {
  var fileName = require('path').relative(__dirname, event.path);
  tinylr.changed({
    body: {
      files: [fileName]
    }
  });
}

var staticRoot = 'public/';

gulp.task('coffee', function() {
  gulp.src(staticRoot+'coffee/*.coffee')
    .pipe(coffee({bare: true}).on('error', gutil.log))
    .pipe(gulp.dest(staticRoot+'js'))
    // .pipe(rename({suffix: '.min'}))
    .pipe(uglify())
    .pipe(gulp.dest(staticRoot+'js'))
});

gulp.task('styles', function() {
  gulp.src(staticRoot+'sass/*.scss')
  .pipe(sass({ style: 'expanded',"sourcemap=none": true }))
  .pipe(autoprefixer('last 2 version', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1'))
  .pipe(gulp.dest(staticRoot+'css'))
  // .pipe(rename({suffix: '.min'}))
  .pipe(minifycss())
  .pipe(gulp.dest(staticRoot+'css'));
});

// gulp.task('images', function() {
//   return gulp.src('public/images/**')
//     .pipe(cache(imagemin({ optimizationLevel: 3, progressive: true, interlaced: true })))
//     .pipe(gulp.dest('public/client/images'));
// });

gulp.task('watch', function() {
  gulp.watch(staticRoot+'coffee/**', ['coffee']);
  gulp.watch(staticRoot+'sass/**', ['styles']);
  // gulp.watch('public/images/*', ['images']);

  gulp.watch(staticRoot+'**', notifyLiveReload);
  gulp.watch(staticRoot+'js/**', notifyLiveReload);
  gulp.watch(staticRoot+'css/**', notifyLiveReload);
});

gulp.task('default', ['styles',"coffee",'watch','livereload'], function() {

});
