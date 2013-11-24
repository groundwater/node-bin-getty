#!/usr/bin/env node

console.log('Starting nodeos-getty');

var cp = require('child_process');
var fs = require('fs');

var io = require('src-termios');
var us = require('src-unistd');

// Defaults
// On Ubuntu /dev/console and /dev/tty0 are aliases for the 
// current TTY. The *actual* console is /dev/tty1
//
// Should migrate these to --tty=XXX and --shell=XXX
var ttypath = '/dev/console';
var shell   = process.argv[2];
console.log('Getty Args',process.argv);

// Must be session leader to set a controlling TTY
// Sometimes you're already the sesion leader,
// so we'll leave any following alone.
if( us.setsid() < 0 )
  console.log('Warn: Cannot become session leader');

// Open a TTY as the session leader *should* make it
// the controlling TTY
var tty = fs.openSync(ttypath,'r+');

// If the above doesn't work, we explicitly set
// the controlling TTY. If this fails, something
// went wrong and we should bail.
if( io.setControllingTTY(tty) != 0 )
  return console.log('Cannot assume controlling TTY');

// Need to duplicate the fds before we pass them
// off to the child process
var ttyi = tty;
var ttyo = us.dup(tty);
var ttye = us.dup(tty);

// Write a nice header that clears the screen first
// fs.writeSync(ttyo,'\033[2J\033[1;1H\n');
fs.writeSync(ttyo,'Welcome to NodeOS\n');
fs.writeSync(ttyo,'-----------------\n\n');

// Normal Node.js child process magic
var comm = shell;
var args = [];
// process.env['TERM'] = 'xterm-256color';
// process.env['SHELL'] = '/root/bin/nsh';
// process.env['USER'] = 'vagrant';
// process.env['LS_COLORS'] = 'rs=0:di=01;34:ln=01;36:mh=00:pi=40;33:so=01;35:do=01;35:bd=40;33;01:cd=40;33;01:or=40;31;01:su=37;41:sg=30;43:ca=30;41:tw=30;42:ow=34;42:st=37;44:ex=01;32:*.tar=01;31:*.tgz=01;31:*.arj=01;31:*.taz=01;31:*.lzh=01;31:*.lzma=01;31:*.tlz=01;31:*.txz=01;31:*.zip=01;31:*.z=01;31:*.Z=01;31:*.dz=01;31:*.gz=01;31:*.lz=01;31:*.xz=01;31:*.bz2=01;31:*.bz=01;31:*.tbz=01;31:*.tbz2=01;31:*.tz=01;31:*.deb=01;31:*.rpm=01;31:*.jar=01;31:*.war=01;31:*.ear=01;31:*.sar=01;31:*.rar=01;31:*.ace=01;31:*.zoo=01;31:*.cpio=01;31:*.7z=01;31:*.rz=01;31:*.jpg=01;35:*.jpeg=01;35:*.gif=01;35:*.bmp=01;35:*.pbm=01;35:*.pgm=01;35:*.ppm=01;35:*.tga=01;35:*.xbm=01;35:*.xpm=01;35:*.tif=01;35:*.tiff=01;35:*.png=01;35:*.svg=01;35:*.svgz=01;35:*.mng=01;35:*.pcx=01;35:*.mov=01;35:*.mpg=01;35:*.mpeg=01;35:*.m2v=01;35:*.mkv=01;35:*.webm=01;35:*.ogm=01;35:*.mp4=01;35:*.m4v=01;35:*.mp4v=01;35:*.vob=01;35:*.qt=01;35:*.nuv=01;35:*.wmv=01;35:*.asf=01;35:*.rm=01;35:*.rmvb=01;35:*.flc=01;35:*.avi=01;35:*.fli=01;35:*.flv=01;35:*.gl=01;35:*.dl=01;35:*.xcf=01;35:*.xwd=01;35:*.yuv=01;35:*.cgm=01;35:*.emf=01;35:*.axv=01;35:*.anx=01;35:*.ogv=01;35:*.ogx=01;35:*.aac=00;36:*.au=00;36:*.flac=00;36:*.mid=00;36:*.midi=00;36:*.mka=00;36:*.mp3=00;36:*.mpc=00;36:*.ogg=00;36:*.ra=00;36:*.wav=00;36:*.axa=00;36:*.oga=00;36:*.spx=00;36:*.xspf=00;36:';
// process.env['LANG'] = 'en_US.utf8';
// process.env['LANGUAGE'] = 'en_US:';
var opts = {
  cwd: '/root',
  env: process.env,
  stdio: [ttyi,ttyo,ttye]
};

// Cleanup
fs.close(ttyi);
fs.close(ttyo);
fs.close(ttye);

// Handle Exits
var prog = cp.spawn(comm,args,opts);
prog.on('error',function(err){
  console.log('Error Spawning Shell %s: %s',shell,err);
});
prog.on('exit',function(code){
  console.log('Shell %s Exited with Code %d',shell,code);
  process.exit(code);
});

console.log('ngetty listening to',ttypath);
