const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function connect() {
  const listeners = {};
  const elements = {};
  const element = () => ({
    children: [],
    textContent: '',
    append(...children) { this.children.push(...children); },
    replaceChildren(...children) { this.children = children; },
    addEventListener() {},
    set innerHTML(_) { throw new Error('Socket data must not be parsed as HTML'); },
  });
  const socket = { on(event, callback) { listeners[event] = callback; } };
  const source = ts.transpileModule(
    fs.readFileSync(require.resolve('../src/socket-client.ts'), 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS } },
  ).outputText;
  const context = {
    exports: {},
    require: () => ({ Manager: class { socket() { return socket; } } }),
    document: {
      querySelector: selector => elements[selector] ??= element(),
      createElement: element,
    },
  };
  vm.runInNewContext(source, context);
  context.exports.connectToServer('test-token');
  return { listeners, elements };
}

test('server names and messages render literally without parsing markup', () => {
  const { listeners, elements } = connect();
  const payload = { fullName: '<img src=x onerror=alert(1)>', message: '<script>alert(1)</script>' };
  listeners['message-from-server'](payload);
  const row = elements['#messages-ul'].children[0];
  assert.equal(row.children[0].textContent, payload.fullName);
  assert.equal(row.children[2].textContent, payload.message);
});

test('client IDs render as text and replace the previous list', () => {
  const { listeners, elements } = connect();
  listeners['clients-updated'](['old']);
  listeners['clients-updated'](['<img src=x onerror=alert(1)>']);
  assert.equal(elements['#clients-ul'].children.length, 1);
  assert.equal(elements['#clients-ul'].children[0].textContent, '<img src=x onerror=alert(1)>');
});
