'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var HORI = 'H';
var VERT = 'V';
var SPACE = '.';
var TARGET = '+';
var CHAR_OFFSET = 65;

var Queue = function () {
  /* add and remove are amortized O(1) */

  function Queue(size) {
    _classCallCheck(this, Queue);

    this.head = 0;
    this.last = 0;
    this.q = new Array(size || 3);
  }

  _createClass(Queue, [{
    key: 'resize',
    value: function resize(size) {
      var arr = new Array(size);
      var j = 0;
      for (var i = this.head; i < this.last; i++, j++) {
        arr[j] = this.q[i];
      }this.q = arr;
      this.last = j;
      this.head = 0;
    }
  }, {
    key: 'shrink',
    value: function shrink() {
      var j = 0;
      for (var i = this.head; i < this.last; i++, j++) {
        this.q[j] = this.q[i];
      }this.last = j;
      this.head = 0;
    }
  }, {
    key: 'add',
    value: function add(elem) {
      if (this.last === this.q.length) {
        // grow q iff half of q is occupied
        if (this.length * 2 > this.q.length) this.resize(this.q.length * 2 + 1);else this.shrink();
      }

      this.q[this.last++] = elem;
    }
  }, {
    key: 'peek',
    value: function peek() {
      return this.q[this.head];
    }
  }, {
    key: 'remove',
    value: function remove() {
      if (this.head < this.last) return this.q[this.head++];
    }
  }, {
    key: 'length',
    get: function get() {
      return this.last - this.head;
    }
  }]);

  return Queue;
}();

var Game = function () {
  function Game(options) {
    _classCallCheck(this, Game);

    this.size = options.size;
    this.base = options.size - 1;
    this.blocks = options.blocks;
  }

  _createClass(Game, [{
    key: 'encode',
    value: function encode(pos) {
      var n = 0;
      for (var i = pos.length; i--;) {
        n = this.base * n + pos[i];
      }return n;
    }
  }, {
    key: 'decode',
    value: function decode(width, n) {
      var arr = new Array(width);
      for (var i = 0; i < width; i++) {
        arr[i] = n % this.base;
        n = (n - arr[i]) / this.base;
      }
      return arr;
    }
  }, {
    key: 'matrix',
    get: function get() {
      var _this = this;

      var matrix = Array.from(new Array(this.size), function () {
        return Array.from(new Array(_this.size), function () {
          return SPACE;
        });
      });

      for (var i = 0; i < this.blocks.length; i++) {
        var block = this.blocks[i];

        var letter = block.isTarget ? TARGET : String.fromCharCode(i + CHAR_OFFSET);

        var _block$position = _slicedToArray(block.position, 2),
            x = _block$position[0],
            y = _block$position[1];

        for (var j = 0; j < block.length; j++) {
          if (block.direction === VERT) {
            matrix[x + j][y] = letter;
          } else {
            matrix[x][y + j] = letter;
          }
        }
      }

      return matrix;
    }
  }, {
    key: 'map',
    get: function get() {
      return this.matrix.map(function (block) {
        return block.join('');
      }).join('\n');
    }
  }]);

  return Game;
}();

function solve(game) {
  // game board
  var targetIx = void 0;
  var nBlock = 0;
  var ixToCh = {};
  var type = []; // block type
  var bpos = []; // block position
  var blen = []; // block length
  var curr = []; // initial pos

  // for neighbors
  var tmpCanvas = new Array(game.size);
  for (var i = 0; i < game.size; i++) {
    tmpCanvas[i] = new Array(game.size);
  } // for bfs
  var visited = new Set();
  var parent = new Map();
  var q = new Queue();

  var parse = function parse(mat) {
    for (var _i = 0; _i < game.size; _i++) {
      for (var j = 0; j < game.size; j++) {
        var c = mat[_i][j];
        if (c === SPACE) continue;

        // mark target ix
        if (c === TARGET) targetIx = nBlock;

        // block found
        ixToCh[nBlock] = c;
        nBlock += 1;

        if (mat[_i][j] === mat[_i][j + 1]) {
          // horizontal block
          type.push(HORI);
          bpos.push(_i);
          curr.push(j);
          var len = 0;
          while (mat[_i][j + len] === c) {
            mat[_i][j + len] = SPACE;
            len += 1;
          }
          blen.push(len);
        } else if (mat[_i][j] === mat[_i + 1][j]) {
          // vertical block
          type.push(VERT);
          bpos.push(j);
          curr.push(_i);
          var _len = 0;
          while (mat[_i + _len][j] === c) {
            mat[_i + _len][j] = SPACE;
            _len += 1;
          }
          blen.push(_len);
        } else throw new Error('invalid game');
      }
    }
  };

  var render = function render(pos) {
    var canvas = new Array(game.size);
    for (var _i2 = 0; _i2 < game.size; _i2++) {
      canvas[_i2] = new Array(game.size);
    }for (var _i3 = game.size; _i3--;) {
      for (var j = game.size; j--;) {
        canvas[_i3][j] = SPACE;
      }
    }for (var _i4 = 0; _i4 < nBlock; _i4++) {
      if (type[_i4] === HORI) {
        for (var _j = 0; _j < blen[_i4]; _j++) {
          canvas[bpos[_i4]][pos[_i4] + _j] = ixToCh[_i4];
        }
      } else if (type[_i4] === VERT) {
        for (var _j2 = 0; _j2 < blen[_i4]; _j2++) {
          canvas[pos[_i4] + _j2][bpos[_i4]] = ixToCh[_i4];
        }
      }
    }

    return canvas.map(function (row) {
      return row.join('');
    }).join('\n');
  };

  // O(size*size)
  var neighbors = function neighbors(n, pos) {
    var nei = [];

    // O(size*size)
    for (var _i5 = game.size; _i5--;) {
      for (var j = game.size; j--;) {
        tmpCanvas[_i5][j] = -1;
      }
    } // O(size*size)
    for (var _i6 = 0; _i6 < nBlock; _i6++) {
      if (type[_i6] === HORI) {
        for (var _j3 = 0; _j3 < blen[_i6]; _j3++) {
          tmpCanvas[bpos[_i6]][pos[_i6] + _j3] = _i6;
        }
      } else {
        for (var _j4 = 0; _j4 < blen[_i6]; _j4++) {
          tmpCanvas[pos[_i6] + _j4][bpos[_i6]] = _i6;
        }
      }
    }

    var read = function read(i, j) {
      var pos = bpos[i];
      if (type[i] === HORI) return tmpCanvas[pos][j];
      return tmpCanvas[j][pos];
    };

    // O(nBlock)
    for (var _i7 = 0, b = 1; _i7 < nBlock; _i7++, b *= game.base) {
      var l = 1,
          t = n;

      while (pos[_i7] + blen[_i7] + l - 1 < game.size && read(_i7, pos[_i7] + blen[_i7] + l - 1) === -1) {
        t += b;
        nei.push(t);
        l++;
      }

      l = 1;
      t = n;

      while (pos[_i7] - l >= 0 && read(_i7, pos[_i7] - l) === -1) {
        t -= b;
        nei.push(t);
        l++;
      }
    }

    return nei;
  };

  var bfs = function bfs(init) {
    visited.add(init);
    parent.set(init, null);
    q.add(init);

    while (q.length) {
      var n = q.remove();
      var pos = game.decode(nBlock, n);

      if (pos[targetIx] === game.size - blen[targetIx]) return n;

      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = neighbors(n, pos)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var t = _step.value;

          if (t === n) continue;
          if (!visited.has(t)) {
            visited.add(t);
            parent.set(t, n);
            q.add(t);
          }
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }
    }

    return -1;
  };

  // append '$' for convenient bound check
  parse((game.map.trim() + '\n' + '$'.repeat(game.size)).split('\n').map(function (x) {
    return (x.trim() + '$').split('');
  }));

  var last = bfs(game.encode(curr));

  var getStep = function getStep(prevPos, currPos) {
    for (var _i8 = 0; _i8 < prevPos.length; _i8++) {
      if (prevPos[_i8] !== currPos[_i8]) {
        var blockIndex = ixToCh[_i8] === TARGET ? game.blocks.findIndex(function (b) {
          return b.isTarget;
        }) : ixToCh[_i8].charCodeAt(0) - CHAR_OFFSET;

        var _game$blocks$blockInd = _slicedToArray(game.blocks[blockIndex].position, 2),
            x = _game$blocks$blockInd[0],
            y = _game$blocks$blockInd[1];

        return {
          block: blockIndex,
          position: game.blocks[blockIndex].direction === HORI ? [x, currPos[_i8]] : [currPos[_i8], y],
          map: render(currPos)
        };
      }
    }
  };

  if (last < 0) return []; // no solution
  else {
      var positions = [];

      while (typeof last === 'number') {
        positions.push(last);
        last = parent.get(last);
      }

      var steps = [];

      for (var _i9 = positions.length - 1; _i9 > 0; _i9--) {
        steps.push(getStep(game.decode(nBlock, positions[_i9]), game.decode(nBlock, positions[_i9 - 1])));
      }

      return steps;
    }
}

exports.default = { solve: solve, Game: Game };