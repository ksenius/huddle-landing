'use strict';

const { src, dest, watch, series, parallel } = require('gulp');
const gp = require('gulp-load-plugins')();
const browserSync = require('browser-sync').create();
const postcssPresetEnv = require('postcss-preset-env');
const postcssNormalize = require('postcss-normalize');
const cssnano = require('cssnano');
const del = require('del');
const argv = require('yargs').argv;

const production = !!argv.production;

const paths = {
  html: {
    src: './src/*.html',
    dest: './build'
  },
  scss: {
    src: './src/scss/**/*.scss',
    dest: './build/css'
  },
  js: {
    dest: './build/js'
  },
  images: {
    src: './src/images/*.*',
    dest: './build/images'
  },
  iconFont: {
    dest: './build/webfonts'
  }
}

function clean() {
  return del(['./build/*']);
}

function htmlTask() {
  return src(paths.html.src)
    .pipe(gp.if(production, gp.removeEmptyLines({
      removeComments: true
    })))
    .pipe(gp.if(production, gp.replace('.css', '.min.css')))
    .pipe(dest(paths.html.dest))
    .pipe(browserSync.stream());
}

function scssTask() {
  let postcssPlugins = [
    postcssNormalize(),
    postcssPresetEnv({
      autoprefixer: { grid: true }
    })
  ];

  if (production) postcssPlugins.push(cssnano());

  return src(paths.scss.src)
    .pipe(gp.sourcemaps.init())
    .pipe(gp.sass({
      includePaths: ['node_modules']
    }))
    .pipe(gp.postcss(postcssPlugins))
    .pipe(gp.if(production, gp.rename({
      suffix: '.min'
    })))
    .pipe(gp.sourcemaps.write('./'))
    .pipe(dest(paths.scss.dest))
    .pipe(browserSync.stream());
}

function jsLibsTask() {
  return src(['node_modules/svgxuse/svgxuse.min.js'])
    .pipe(gp.concat('vendor.min.js'))
    .pipe(dest(paths.js.dest));
}

function imagesTask() {
  return src(paths.images.src)
    .pipe(dest(paths.images.dest))
    .on('end', browserSync.reload);
}

function iconFontTask() {
  return src(
    'node_modules/@fortawesome/fontawesome-free/webfonts/fa-brands-*'
    ).pipe(dest(paths.iconFont.dest));
}

function watchTask() {
  watch(paths.html.src, htmlTask);
  watch(paths.scss.src, scssTask);
  watch(paths.images.src, imagesTask);
}

function syncTask() {
  browserSync.init({
    server: {
      baseDir: './build'
    }
  });
}

exports.default = series(clean,
  parallel(htmlTask, scssTask, jsLibsTask, imagesTask, iconFontTask),
  parallel(watchTask, syncTask)
);

exports.prod = series(clean,
  series(htmlTask, scssTask, jsLibsTask, imagesTask, iconFontTask)
);
