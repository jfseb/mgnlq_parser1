/* standard_v1.0.0*/

var gulp = require('gulp');

var ts = require('gulp-typescript');
var sourcemaps = require('gulp-sourcemaps');

/**
 * Directory containing generated sources which still contain
 * JSDOC etc.
 */
var srcDir = 'src';
var testDir = 'test';

var sourcemaproot = '/projects/nodejs/botbuilder/mgnlq_parser1/';


gulp.task('watch', function () {
  gulp.watch([srcDir + '/**/*.js', testDir + '/**/*.js', srcDir + '/**/*.tsx',  srcDir + '/**/*.ts', 'gulpfile.js'],
    ['tsc', 'eslint', 'test']);
});


var makeToken = require('./src/makeToken.js');

gulp.task('makeToken' , function(cb) {
  makeToken.run();
  cb();
});


/**
 * Definition files
 */
gulp.task('tsc_d_ts', gulp.series('makeToken', function () {
  var tsProject = ts.createProject('tsconfig.json', { inlineSourceMap: true
  });
  var tsResult = tsProject.src() // gulp.src('lib/*.ts')
    .pipe(sourcemaps.init()) // This means sourcemaps will be generated
    .pipe(tsProject());
  return tsResult.dts
    .pipe(gulp.dest('js'));
}));

/**
 * compile tsc (including srcmaps)
 * @input srcDir
 * @output js
 */
gulp.task('tsc', gulp.series( 'makeToken', 'tsc_d_ts', function () {
  var tsProject = ts.createProject('tsconfig.json', { inlineSourceMap: true
  });
  var tsResult = tsProject.src() // gulp.src('lib/*.ts')
    .pipe(sourcemaps.init()) // This means sourcemaps will be generated
    .pipe(tsProject());

  return tsResult.js
    .pipe(sourcemaps.write('.', {
      sourceRoot: function (file) {
        file.sourceMap.sources[0] = sourcemaproot + 'src/' + file.sourceMap.sources[0];
        // console.log('here is************* file' + JSON.stringify(file, undefined, 2))
        return 'ABC';
      },
      mapSources: function (src) {
        //console.log('here we remap' + src);
        return /* sourcemaproot  +*/ src;
      }}
    )) // ,  { sourceRoot: './' } ))
    // Now the sourcemaps are added to the .js file
    .pipe(gulp.dest('js'));
}));


var del = require('del');

gulp.task('clean:models', function () {
  return del([
    'sensitive/_cachefalse.js.zip',
    'testmodel2/_cachefalse.js.zip',
    'testmodel/_cachefalse.js.zip',
    'sensitive/_cachetrue.js.zip',
    'testmodel2/_cachetrue.js.zip',
    'testmodel/_cachetrue.js.zip',
    // here we use a globbing pattern to match everything inside the `mobile` folder
    //  'dist/mobile/**/*',
    // we don't want to clean this file though so we negate the pattern
    //    '!dist/mobile/deploy.json'
  ]);
});


gulp.task('clean', gulp.series('clean:models'));

var nodeunit = require('gulp-nodeunit');

gulp.task('test', gulp.series('tsc', function () {
  return gulp.src(['test/**/*.js'])
    .pipe(nodeunit({
      reporter: 'minimal'
    // reporterOptions: {
    //  output: 'testcov'
    // }
    })).on('error', function (err) { console.log('This is weird: ' + err.message); })
    .pipe(gulp.dest('./out/lcov.info'));
}));

var jsdoc = require('gulp-jsdoc3');

gulp.task('doc', gulp.series( 'test', function (cb) {
  return gulp.src([srcDir + '/**/*.js', 'README.md', './js/**/*.js'], { read: false })
    .pipe(jsdoc(cb));
}));

const eslint = require('gulp-eslint');

gulp.task('eslint', () => {
  // ESLint ignores files with "node_modules" paths.
  // So, it's best to have gulp ignore the directory as well.
  // Also, Be sure to return the stream from the task;
  // Otherwise, the task may end before the stream has finished.
  return gulp.src(['src/**/*.js', 'test/**/*.js', 'gulpfile.js'])
    // eslint() attaches the lint output to the "eslint" property
    // of the file object so it can be used by other modules.
    .pipe(eslint())
    // eslint.format() outputs the lint results to the console.
    // Alternatively use eslint.formatEach() (see Docs).
    .pipe(eslint.format())
    // To have the process exit with an error code (1) on
    // lint error, return the stream and pipe to failAfterError last.
    .pipe(eslint.failAfterError());
});


// Default Task
gulp.task('default', gulp.series('tsc', 'eslint', 'test', 'doc'));
gulp.task('build', gulp.series('tsc', 'eslint'));
