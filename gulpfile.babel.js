'use strict';

import fs from 'fs';

import gulp from 'gulp';
import gif from 'gulp-if';
import rename from 'gulp-rename';
import tap from 'gulp-tap';
import unretina from 'gulp-unretina';
import newer from 'gulp-newer';
import sass from 'gulp-sass';
import imagemin from 'gulp-imagemin';
import htmlmin from 'gulp-htmlmin';

import babelify from 'babelify';
import watchify from 'watchify';
import browserify from 'browserify';
import exorcist from 'exorcist';
import source from 'vinyl-source-stream';
import gutil from 'gulp-util';

import handlebars from 'gulp-compile-handlebars';
import sourcemaps from 'gulp-sourcemaps';
import autoprefixer from 'gulp-autoprefixer';

import bs from 'browser-sync';

const site = {
  title: 'Startover',
  description: 'Startover is a boilerplate for developing static websites. With Startover you don\'t have to start over!',
  keywords: 'boilerplate,template,site,static,js,sass,gulp',
  url: 'https://github.com/ksmandersen/startover',
  fb: {
    appName: '',
    appId: ''
  }
};

const config = {
  build: './build',
  paths: {
    html: 'index.handlebars',
    partials: './assets/templates/**/*.handlebars',
    images: './assets/images/**/*.{png,jpg,gif,svg}',
    sass: './assets/sass/**/*.{scss,sass}',
    js: './assets/js/main.js'
  },
  production: false,
  watching: false,
  retina_suffix: '_2x'
};

function configure_bundler() {
  let bundler = null;

  const browserify_opts = {
    entries: ['./assets/js/main.js'],
    debug: !config.production
  };

  if (config.watching) {
    watchify.args.debug = true;
    bundler = watchify(browserify(browserify_opts, watchify.args));
  } else {
    bundler = browserify(browserify_opts);
  }

  let rebundle = () => {
    bundle(bundler);
  };

  bundler.on('update', () => {
    gutil.log('Rebundling');
    rebundle();
  });

  rebundle();
}

function bundle(bundler) {
  gutil.log('Bundling javascript');

  return bundler.bundle()
    .on('error', function(err) {
      gutil.log(err.message);
      browserSync.notify('Bundle error!');
      this.emit('end');
    })
    // .pipe(exorcist(`${config.build}/js/bundle.js.map`))
    .pipe(source('main.js'))
    .pipe(rename('bundle.js'))
    .pipe(gulp.dest(`${config.build}/js/`))
    .pipe(gif(config.watching, browserSync.stream({once: true})));
}

const browserSync = bs.create();

function retina_path(path) {
  const components = path.split('.');
  return `${components[0]}_2x.${components[1]}`
}

function unretina_path(path) {
  const components = path.split(config.retina_suffix);
  return `${components[0]}${components[1]}`;
}

function file_exists(path) {
  return !path.match(`\n`) && fs.existsSync(path);
}

function load_partial(name) {
  const path = `./assets/templates/${name}.handlebars`;

  if(file_exists(path)) {
    return fs.readFileSync(path, 'utf8');
  }

  return null;
}

function image_helper(path, cls = null, has_retina = true) {
  const retina = retina_path(path);
  var str = `<img src="/images/${path}"`;
  if (retina) {
    str += ` data-at2x="/images/${retina}"`;
  }
  if (typeof cls === 'string') {
    str += ` class="${cls}"`;
  }
  str += ">";

  return str;
}

gulp.task('sass', () => {
  const options = {
    imagePath: '/images',
    includePaths: [
      './node_modules/normalize.css',
      './node_modules/ladda/css'
    ]
  };

  if (config.production) {
    options.outputStyle = 'compressed';
    options.sourceComments = false;
  }

  return gulp.src(config.paths.sass)
    .pipe(sourcemaps.init())
    .pipe(sass(options))
    .pipe(autoprefixer({browsers: ['last 2 versions'], cascade: false}))
    .pipe(sourcemaps.write('./maps', {includeContent: false, sourceRoot: './assets/sass'}))
    .pipe(gulp.dest(`${config.build}/css`))
    .pipe(gif(!config.production, browserSync.stream({match: '**/*.css'})));
});

gulp.task('imagecopy', () => {
  return gulp.src([config.paths.images, `!*${config.retina_suffix}.{png,jpg,gif,svg}`])
    .pipe(imagemin())
    .pipe(gulp.dest(`${config.build}/images`));
});

gulp.task('unretina', () => {
  const dest = `${config.build}/images`;

  return gulp.src(`./assets/images/**/*${config.retina_suffix}.{png,jpg,gif}`)
    .pipe(newer({
      dest: dest,
      map: unretina_path
    }))
    .pipe(unretina({suffix: config.retina_suffix}))
    .pipe(imagemin())
    .pipe(gulp.dest(dest));
});

gulp.task('images', ['imagecopy', 'unretina']);

gulp.task('html', () => {
  const data = {
    config: config,
    site: site
  };

  let options = {
    ignorePartials: true,
    partials: {
      get header() { return load_partial('header') },
      get footer() { return load_partial('footer') }
    },
    helpers: {
      img: (path, cls = null, has_retina = true) => image_helper(path, cls, has_retina)
    }
  };

  return gulp.src(config.paths.html)
    .pipe(handlebars(data, options))
    .pipe(rename({extname: '.html'}))
    .pipe(gif(config.production, htmlmin()))
    .pipe(gulp.dest(config.build))
    .pipe(browserSync.stream());
});

gulp.task('sync', () => {
  browserSync.init({
    server: {
      baseDir: config.build
    },
    open: false
  });
});

gulp.task('set-production', () => {
  config.production = true;
});

gulp.task('bundle', () => {
  return configure_bundler();
});

gulp.task('build', ['html', 'images', 'sass', 'bundle']);
gulp.task('production', ['set-production', 'build'])

gulp.task('watch', ['sync'], () => {
  config.watching = true;
  configure_bundler();

  gulp.watch(config.paths.html, ['html']);
  gulp.watch(config.paths.partials, ['html']);
  gulp.watch(config.paths.images, ['images']);
  gulp.watch(config.paths.sass, ['sass']);
});

gulp.task('default', ['build', 'watch']);