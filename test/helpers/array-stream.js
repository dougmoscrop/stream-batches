'use strict';

const stream = require('stream');

module.exports = function(arr, delay = 0) {
  const items = [].concat(arr);

  return new stream.Readable({
    objectMode: true,
    read: function() {
      setTimeout(() => {
        if (items.length === 0) {
          this.push(null);
        } else {
          this.push(items.shift())
        }
      }, delay);
    }
  });
};
