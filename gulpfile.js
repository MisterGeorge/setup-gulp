import gulp from 'gulp'
import gulpSass from 'gulp-sass'
import * as sass from 'sass'
import autoprefixer from 'autoprefixer'
import babel from 'gulp-babel'
import bourbon from 'bourbon'
import neat from 'bourbon-neat'
import browserSync from 'browser-sync'
import { deleteAsync } from 'del'
import gutil from 'gulp-util'
import notify from 'gulp-notify'
import plumber from 'gulp-plumber'
import postcss from 'gulp-postcss'
import rename from 'gulp-rename'
import sasslint from 'gulp-sass-lint'
import sourcemaps from 'gulp-sourcemaps'
import imagemin, { gifsicle, mozjpeg, optipng, svgo } from 'gulp-imagemin'
import uglify from 'gulp-uglify'
import eslint from 'gulp-eslint'
import size from 'gulp-size'
import cleanCSS from 'gulp-clean-css'
import concat from 'gulp-concat'
import merge from 'merge-stream'

const sassCompiler = gulpSass(sass)
const { includePaths: bourbonPaths } = bourbon
const { includePaths: neatPaths } = neat

// Set asset paths.
const paths = {
  sassComponents: './src/scss/components/*.scss',
  sassSections: './src/scss/sections/*.scss',
  sass: './src/scss/*.scss',
  css: './src/css/*.css',
  jsComponents: './src/js/components/*.ts',
  jsSections: './src/js/sections/*.ts',
  js: './src/js/*.ts',
  font: './src/fonts/**/*',
  img: './src/img/**/*.+(png|jpg|jpeg|gif|svg)',
  dest: './assets',
  root: './index.html'
}

gulp.task('serve', (done) => {
  browserSync.init({
    server: {
      baseDir: './',
    },
  })
  gulp.watch(paths.root).on('change', browserSync.reload)

  done()
})

/**
 * Handle errors.
 */
function handleErrors() {
  // eslint-disable-next-line prefer-rest-params
  const args = Array.prototype.slice.call(arguments)

  notify
    .onError({
      title: 'Task Failed [<%= error.message %>',
      message: 'See console.',
    })
    .apply(this, args)

  gutil.beep()

  // eslint-disable-next-line no-undef
  process.exit(1)
}

/**
 * Clean compiled files.
 */
gulp.task('cleanAssets', () => deleteAsync(['./assets/**', '!./assets', './src/css/**', '!./src/css']))

/**
 * Compile Sass and run stylesheet through PostCSS.
 */
const compileSass = (srcPath, prefix) => {
  return gulp.src(srcPath)
    .pipe(plumber({ errorHandler: handleErrors }))
    .pipe(
      sassCompiler({
        includePaths: [].concat(bourbonPaths, neatPaths),
        errLogToConsole: true
      })
    )
    .pipe(postcss([autoprefixer()]))
    .pipe(size({ gzip: true, showFiles: true }))
    .pipe(rename({ prefix, suffix: '', dirname: '' }))
    .pipe(gulp.dest('./src/css'))
    .pipe(browserSync.stream())
}

// Tareas específicas para compilar Sass en componentes y secciones
gulp.task('sassComponents', () => compileSass(paths.sassComponents, 'component-'))
gulp.task('sassSections', () => compileSass(paths.sassSections, 'section-'))

// Tarea para compilar Sass y aplicar concatenación si es necesario
gulp.task('sass', () => {
  const reset = gulp.src('node_modules/normalize.css/normalize.css')
  const scss = gulp.src(paths.sass)

  return merge(reset, scss)
    .pipe(plumber({ errorHandler: handleErrors }))
    .pipe(concat('styles.css'))
    .pipe(compileSass(paths.sass, ''))
});

/**
 * Run Sass through a linter.
 */
gulp.task('lintScss', () =>
  gulp
    .src(paths.sass)
    .pipe(plumber({ errorHandler: handleErrors }))
    .pipe(sasslint())
    .pipe(sasslint.format())
    .pipe(sasslint.failOnError())
)

gulp.task('minifyCss', () =>
  gulp
    .src(paths.css)
    .pipe(sourcemaps.init())
    .pipe(cleanCSS())
    .pipe(sourcemaps.write())
    .pipe(size({ gzip: true, showFiles: true }))
    .pipe(rename({ suffix: '.min' }))
    .pipe(gulp.dest(paths.dest))
    .pipe(browserSync.stream())
)

/**
 * Process tasks fonts for the project.
 */
gulp.task('fonts', () =>
  gulp
    .src(paths.font)
    .pipe(plumber({ errorHandler: handleErrors }))
    .pipe(gulp.dest(paths.dest))
)

/**
 * Process tasks optimize image for the project.
 */
gulp.task('images', () =>
  gulp
    .src(paths.img)
    .pipe(plumber({ errorHandler: handleErrors }))
    .pipe(
      imagemin([
        gifsicle({ interlaced: true }),
        mozjpeg({ quality: 75, progressive: true }),
        optipng({ optimizationLevel: 5 }),
        svgo({
          plugins: [
            {
              name: 'removeViewBox',
              active: true,
            },
            {
              name: 'cleanupIDs',
              active: false,
            },
          ],
        }),
      ])
    )
    .pipe(gulp.dest(paths.dest))
)

/**
 * Minify and optimize scripts files.
 */
const optimizeJs = (srcPath, prefix) => {
  return gulp
    .src(srcPath)
    .pipe(plumber({ errorHandler: handleErrors }))
    .pipe(babel())
    .pipe(uglify())
    .pipe(sourcemaps.init())
    .pipe(size({ gzip: true, showFiles: true }))
    .pipe(rename({ prefix, suffix: '.min' }))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(paths.dest))
}

gulp.task('jsComponents', () => optimizeJs(paths.jsComponents, 'component-'))
gulp.task('jsSections', () => optimizeJs(paths.jsSections, 'section-'))
gulp.task('js', () => optimizeJs(paths.js, ''))

/**
 * Run Js through a linter.
 */
gulp.task('lintJs', () => gulp.src([paths.js]).pipe(eslint()).pipe(eslint.format()).pipe(eslint.failAfterError()))

/**
 * Process tasks.
 */
gulp.task('watch', () => {
  gulp.watch(paths.font, gulp.series('fonts'))
  gulp.watch(paths.img, gulp.series('images'))
  gulp.watch(paths.jsComponents, gulp.series('jsComponents'))
  gulp.watch(paths.jsSections, gulp.series('jsSections'))
  gulp.watch(paths.js, gulp.series('js'))
  gulp.watch(paths.sassComponents, gulp.series('sassComponents'))
  gulp.watch(paths.sassSections, gulp.series('sassSections'))
  gulp.watch(paths.sass, gulp.series('sass'))
  gulp.watch(paths.css, gulp.series('minifyCss'))
  browserSync.stream()
})

gulp.task(
  'build',
  gulp.parallel(
    'cleanAssets',
    'fonts',
    'images',
    'jsComponents',
    'jsSections',
    'js',
    'sassComponents',
    'sassSections',
    'sass',
    'minifyCss'
  )
)

gulp.task('default', gulp.series('build'))
