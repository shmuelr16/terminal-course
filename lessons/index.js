// lessons/index.js
// כל השיעורים לפי הסדר. המספור נקבע כאן אוטומטית.

'use strict';

const LEVELS = ['בסיס', 'בינוני', 'מתקדם'];

const lessons = [
  ...require('./basics'),
  ...require('./intermediate'),
  ...require('./advanced'),
];

lessons.forEach((l, i) => {
  l.num = i + 1;
});

module.exports = lessons;
module.exports.LEVELS = LEVELS;
