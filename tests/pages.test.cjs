const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const entry = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

function runtimeFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(item => {
    const itemPath = path.join(directory, item.name);
    return item.isDirectory() ? runtimeFiles(itemPath) : [itemPath];
  });
}

test('GitHub Pages: entry resources are relative, local and present', () => {
  const references = [...entry.matchAll(/\b(?:href|src)="([^"]+)"/g)].map(match => match[1]);
  assert.ok(references.length > 0);

  for (const reference of references) {
    assert.doesNotMatch(reference, /^(?:https?:)?\/\//, `${reference} must not require the network`);
    assert.ok(!reference.startsWith('/'), `${reference} must work below the repository subpath`);
    const localPath = path.resolve(root, reference.split(/[?#]/, 1)[0]);
    assert.ok(localPath.startsWith(`${root}${path.sep}`), `${reference} must stay inside the site root`);
    assert.ok(fs.existsSync(localPath), `${reference} must exist`);
  }
});

test('GitHub Pages: runtime files contain no HTTP(S) dependencies', () => {
  const files = [path.join(root, 'index.html'), ...['data', 'src', 'styles'].flatMap(name => runtimeFiles(path.join(root, name)))];
  for (const file of files) {
    assert.doesNotMatch(fs.readFileSync(file, 'utf8'), /https?:\/\//i, path.relative(root, file));
  }
});
