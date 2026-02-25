import { diffWordsWithSpace, Change } from 'diff';

function mapDiffToLines(changes: Change[], forDeleted: boolean) {
  const lines: any[] = [[]];
  for (const change of changes) {
    if (!forDeleted && change.removed) continue;
    if (forDeleted && change.added) continue;

    const parts = change.value.split('\n');
    for (let i = 0; i < parts.length; i++) {
        if (i > 0) lines.push([]);
        if (parts[i]) {
            lines[lines.length - 1].push({ value: parts[i], added: change.added, removed: change.removed });
        }
    }
  }
  return lines;
}

const base = ['function calculate() {', '  const x = 10;', '  const y = 20;', '  return x + y;', '}'];
const left = ['function calculate() {', '  const x = 10;', '  // added comment in left', '  const y = 20;', '  const z = 30; // left added z', '  return x + y + z;', '}'];

const changes = diffWordsWithSpace(base.join('\n'), left.join('\n'));
const mapped = mapDiffToLines(changes, false);
console.log('original left len:', left.length, 'mapped len:', mapped.length);
console.log(JSON.stringify(mapped, null, 2));
