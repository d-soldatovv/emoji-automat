'use strict';

const COLORS = {
  reset:  '\x1b[0m',
  cyan:   '\x1b[36m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  red:    '\x1b[31m',
  gray:   '\x1b[90m',
  bold:   '\x1b[1m',
};

const c = (color, text) => `${COLORS[color]}${text}${COLORS.reset}`;

const logger = {
  info:    (msg) => console.log(`${c('cyan',   '[INFO]')}  ${msg}`),
  ok:      (msg) => console.log(`${c('green',  '[OK]')}    ${msg}`),
  warn:    (msg) => console.log(`${c('yellow', '[WARN]')}  ${msg}`),
  error:   (msg) => console.log(`${c('red',    '[ERROR]')} ${msg}`),
  skip:    (msg) => console.log(`${c('gray',   '[SKIP]')}  ${msg}`),
  divider: ()    => console.log(c('cyan', '─'.repeat(52))),
  banner:  (title) => {
    const pad  = 50;
    const line = '═'.repeat(pad);
    console.log('');
    console.log(c('cyan', `╔${line}╗`));
    console.log(c('cyan', `║  `) + c('bold', title.padEnd(pad - 2)) + c('cyan', '║'));
    console.log(c('cyan', `╚${line}╝`));
    console.log('');
  },
};

module.exports = logger;