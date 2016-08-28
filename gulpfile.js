var gulp = require('gulp');
var browserify = require('browserify');
var transform = require('vinyl-transform');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');

gulp.task('browserify', function () {
    var browserified = transform(function (filename) {
        var b = browserify(filename);
        return b.bundle();
    });

    return gulp.src(['./assets/*.js'])
        .pipe(browserified)
        .pipe(uglify())
        .pipe(rename('index.min.js'))
        .pipe(gulp.dest('./'));
});