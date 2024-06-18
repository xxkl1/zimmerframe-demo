import { walk } from 'zimmerframe';
import { parse } from 'acorn';
import { Node } from 'estree';

const program = parse(`
let message = 'hello';
console.log(message);

if (true) {
  let answer = 42;
  console.log(answer);
}
`, {ecmaVersion: 'latest'});

// You can pass in arbitrary state
const state = {
  declarations: [],
  depth: 0,
};

console.log('program:', program)

const transformed = walk(program as Node, state, {
  _(node, { state, next }) {
    // the `_` visitor is 'universal' — if provided,
    // it will run for every node, before deferring
    // to specialised visitors. you can pass a new
    // `state` object to `next`
    next({ ...state });
  },
  VariableDeclarator(node, { state, next }) {
    // `state` is passed into each visitor
    if (node.id.type === 'Identifier') {
      state.declarations.push({
        depth: state.depth,
        name: node.id.name
      });
    }
    next({ ...state });
  },
  BlockStatement(node, { state, next, stop }) {
    // you must call `next()` or `next(childState)`
    // to visit child nodes
    console.log('entering BlockStatement');
    next({ ...state, depth: state.depth + 1 });
    console.log('leaving BlockStatement');
  },
  Literal(node) {
    // if you return something, it will replace
    // the current node
    if (node.value === 'hello') {
      return {
        ...node,
        value: 'goodbye'
      };
    }
  },
  IfStatement(node, { visit }) {
    // normally, returning a value will halt
    // traversal into child nodes. you can
    // transform children with the current
    // visitors using `visit(node, state?)`
    if (node.test.type === 'Literal' && node.test.value === true) {
      return visit(node.consequent);
    }
  }
});

console.log('transformed:', transformed)
