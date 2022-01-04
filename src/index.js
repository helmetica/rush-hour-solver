const HORI = 'H';
const VERT = 'V';
const SPACE = '.';
const TARGET = '+';
const CHAR_OFFSET = 65;

class Queue {
  /* add and remove are amortized O(1) */

  constructor(size) {
    this.head = 0;
    this.last = 0;
    this.q = new Array(size || 3);
  }

  resize(size) {
    const arr = new Array(size);
    let j = 0;
    for (let i = this.head; i < this.last; i++, j++) arr[j] = this.q[i];
    this.q = arr;
    this.last = j;
    this.head = 0;
  }

  shrink(){
    let j = 0;
    for (let i = this.head; i< this.last; i++, j++) this.q[j] = this.q[i];
    this.last = j;
    this.head = 0;
  }

  add(elem) {
    if (this.last === this.q.length){
      // grow q iff half of q is occupied
      if (this.length * 2 > this.q.length) this.resize(this.q.length * 2 + 1);
      else this.shrink();
    }

    this.q[this.last++] = elem;
  }

  peek() {
    return this.q[this.head];
  }

  remove() {
    if (this.head < this.last) return this.q[this.head++];
  }

  get length() {
    return this.last - this.head;
  }
}

class Game {
  constructor(options) {
    this.size = options.size;
    this.base = options.size - 1;
    this.blocks = options.blocks;
  }

  get matrix() {
    const matrix = Array.from(new Array(this.size), () => Array.from(new Array(this.size), () => SPACE));

    for (let i = 0; i < this.blocks.length; i++) {
      const block = this.blocks[i];

      const letter = block.isTarget ? TARGET : String.fromCharCode(i + CHAR_OFFSET);
      const [x, y] = block.position;

      for (let j = 0; j < block.length; j++) {
        if (block.direction === VERT) {
          matrix[x + j][y] = letter;
        } else {
          matrix[x][y + j] = letter;
        }
      }
    }

    return matrix;
  }

  get map() {
    return this.matrix.map(block => block.join('')).join('\n');
  }

  encode(pos) {
    let n = 0;
    for (let i = pos.length; i--;) n = this.base * n + pos[i];
    return n;
  }

  decode(width, n) {
    const arr = new Array(width);
    for (let i = 0; i < width; i++) {
      arr[i] = n % this.base;
      n = (n - arr[i]) / this.base;
    }
    return arr;
  }
}

function solve(options) {
  const game = new Game(options);

  // game board
  let targetIx;
  let nBlock = 0;
  let ixToCh = {};
  let type = [];  // block type
  let bpos = [];  // block position
  let blen = [];  // block length
  let curr = [];  // initial pos

  // for neighbors
  let tmpCanvas = new Array(game.size);
  for (let i = 0; i < game.size; i++) tmpCanvas[i] = new Array(game.size);

  // for bfs
  let visited = new Set();
  let parent = new Map();
  let q = new Queue();

  const parse = (mat) => {
    for (let i = 0; i < game.size; i++) {
      for (let j = 0; j < game.size; j++) {
        let c = mat[i][j];
        if (c === SPACE) continue;

        // mark target ix
        if (c === TARGET) targetIx = nBlock;

        // block found
        ixToCh[nBlock] = c;
        nBlock += 1;

        if (mat[i][j] === mat[i][j + 1]) {
          // horizontal block
          type.push(HORI);
          bpos.push(i);
          curr.push(j);
          let len = 0;
          while (mat[i][j + len] === c) {
            mat[i][j + len] = SPACE;
            len += 1;
          }
          blen.push(len);
        } else if (mat[i][j] === mat[i + 1][j]) {
          // vertical block
          type.push(VERT);
          bpos.push(j);
          curr.push(i);
          let len = 0;
          while (mat[i + len][j] === c) {
            mat[i + len][j] = SPACE;
            len += 1;
          }
          blen.push(len);
        } else throw new Error('invalid game');
      }
    }
  };

  const render = (pos) => {
    let canvas = new Array(game.size);
    for (let i = 0; i < game.size; i++) canvas[i] = new Array(game.size);
    for (let i = game.size; i--;) for (let j = game.size; j--;) canvas[i][j] = SPACE;

    for (let i = 0; i < nBlock; i++) {
      if (type[i] === HORI) {
        for (let j = 0; j < blen[i]; j++) canvas[bpos[i]][pos[i] + j] = ixToCh[i];
      } else if (type[i] === VERT) {
        for (let j = 0; j < blen[i]; j++) canvas[pos[i] + j][bpos[i]] = ixToCh[i];
      }
    }

    return canvas.map(row => row.join('')).join('\n');
  };

  // O(size*size)
  const neighbors = (n, pos) => {
    const nei = [];

    // O(size*size)
    for (let i = game.size; i--;) for (let j = game.size; j--;) tmpCanvas[i][j] = -1;

    // O(size*size)
    for (let i = 0; i < nBlock; i++) {
      if (type[i] === HORI) {
        for (let j = 0; j < blen[i]; j++) tmpCanvas[bpos[i]][pos[i] + j] = i;
      }
      else {
        for (let j = 0; j < blen[i]; j++) tmpCanvas[pos[i] + j][bpos[i]] = i;
      }
    }

    const read = function (i, j) {
      const pos = bpos[i];
      if (type[i] === HORI) return tmpCanvas[pos][j];
      return tmpCanvas[j][pos];
    };

    // O(nBlock)
    for (let i = 0, b = 1; i < nBlock; i++, b *= game.base) {
      let l = 1, t = n;

      while (pos[i] + blen[i] + l - 1 < game.size && read(i, pos[i] + blen[i] + l - 1) === -1) {
        t += b;
        nei.push(t);
        l++;
      }

      l = 1;
      t = n;

      while (pos[i] - l >= 0 && read(i, pos[i] - l) === -1) {
        t -= b;
        nei.push(t);
        l++;
      }
    }

    return nei;
  };

  const bfs = (init) => {
    visited.add(init);
    parent.set(init, null);
    q.add(init);

    while (q.length) {
      let n = q.remove();
      let pos = game.decode(nBlock, n);

      if (pos[targetIx] === game.size - blen[targetIx]) return n;

      for (let t of neighbors(n, pos)) {
        if (t === n) continue;
        if (!visited.has(t)) {
          visited.add(t);
          parent.set(t, n);
          q.add(t);
        }
      }
    }

    return -1;
  };

  // append '$' for convenient bound check
  parse((game.map.trim() + '\n' + '$'.repeat(game.size)).split('\n').map(x => (x.trim() + '$').split('')));

  let last = bfs(game.encode(curr));

  const getStep = (prevPos, currPos) => {
    for (let i = 0; i < prevPos.length; i++) {
      if (prevPos[i] !== currPos[i]) {
        const blockIndex = ixToCh[i] === TARGET ? game.blocks.findIndex(b => b.isTarget) : ixToCh[i].charCodeAt(0) - CHAR_OFFSET;
        const [x, y] = game.blocks[blockIndex].position;

        return {
          block: blockIndex,
          position: game.blocks[blockIndex].direction === HORI ? [x, currPos[i]] : [currPos[i], y],
          map: render(currPos)
        }
      }
    }
  };

  if (last < 0) return []; // no solution
  else {
    let positions = [];

    while (typeof last === 'number') {
      positions.push(last);
      last = parent.get(last);
    }

    const steps = [];

    for (let i = positions.length - 1; i > 0; i--) {
      steps.push(getStep(game.decode(nBlock, positions[i]), game.decode(nBlock, positions[i - 1])))
    }

    return steps
  }
}

export default { solve }
