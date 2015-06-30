var gulp = require('gulp');
var gutil = require('gulp-util');
var bower = require('bower');
var concat = require('gulp-concat');
var sass = require('gulp-sass');
var minifyCss = require('gulp-minify-css');
var rename = require('gulp-rename');
var sh = require('shelljs');

var paths = {
  sass: ['./scss/**/*.scss']
};

gulp.task('default', ['sass']);

gulp.task('sass', function(done) {
  gulp.src('./scss/ionic.app.scss')
    .pipe(sass({
      errLogToConsole: true
    }))
    .pipe(gulp.dest('./www/css/'))
    .pipe(minifyCss({
      keepSpecialComments: 0
    }))
    .pipe(rename({ extname: '.min.css' }))
    .pipe(gulp.dest('./www/css/'))
    .on('end', done);
});

gulp.task('watch', function() {
  gulp.watch(paths.sass, ['sass']);
});

gulp.task('install', ['git-check'], function() {
  return bower.commands.install()
    .on('log', function(data) {
      gutil.log('bower', gutil.colors.cyan(data.id), data.message);
    });
});

gulp.task('git-check', function(done) {
  if (!sh.which('git')) {
    console.log(
      '  ' + gutil.colors.red('Git is not installed.'),
      '\n  Git, the version control system, is required to download Ionic.',
      '\n  Download git here:', gutil.colors.cyan('http://git-scm.com/downloads') + '.',
      '\n  Once git is installed, run \'' + gutil.colors.cyan('gulp install') + '\' again.'
    );
    process.exit(1);
  }
  done();
});

//Here starts the server Part, where socket-events get send and catched
io.on('connection', function(socket) {

  socket.on('joinGroup', function(data) {
    socket.join(data);
  })

  socket.on('songAddedFromRemote', function(data, groupId){
    io.sockets.in(groupId).emit('songAddedFromRemote');
  })
  
  socket.on('playPauseSong', function(groupId){
    io.sockets.in(groupId).emit('playPauseSong');
  })

  socket.on('nextTrack', function(groupId){
    io.sockets.in(groupId).emit('nextTrack');
  })

  socket.on('previousTrack', function(groupId){
    io.sockets.in(groupId).emit('previousTrack');
  })

  socket.on('volumeDownFromRemote', function(groupId){
    io.sockets.in(groupId).emit('volumeDownFromRemote');
  })

  socket.on('volumeUpFromRemote', function(groupId){
    io.sockets.in(groupId).emit('volumeUpFromRemote');
  })

  socket.on('volumeChangedFromRemote', function(data, groupId){
    //io.sockets.in(groupId).emit('volumeChangedFromRemote', data);
  })

  socket.on('volumeChangedFromClient', function(data, groupId){
    //io.sockets.in(groupId).emit('volumeChangedFromClient', data);
  })

  socket.on('playbackTimeCurrentFromClient', function(data, groupId){
    io.sockets.in(groupId).emit('playbackTimeCurrentFromClient', data);
  })

  socket.on('playlistSongsChangedFromRemote', function(data, groupId){
    io.sockets.in(groupId).emit('playlistSongsChangedFromRemote', data);
  })
});
