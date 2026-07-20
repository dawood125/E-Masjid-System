const fs = require('fs');
const path = 'src/components/Admin/Pages/Marketing.jsx';
let s = fs.readFileSync(path, 'utf8');

// For each "  const load = () => {" convert to "  const load = useCallback(() => {"
// and the matching closing "  }" (just before "  useEffect(() => { load() }, [load])")
// becomes "  }, [showToast]);"
const lines = s.split('\n');
const out = [];
for (let i = 0; i < lines.length; i++) {
  out.push(lines[i]);
  if (lines[i] === '  const load = () => {') {
    out[out.length - 1] = '  const load = useCallback(() => {';
    // find the matching closing brace and useEffect
    for (let j = i + 1; j < lines.length; j++) {
      if (lines[j] === '  useEffect(() => { load() }, [load])') {
        // the line just before is the closing "  }"
        if (out[out.length - 1] === '  }') {
          out[out.length - 1] = '  }, [showToast]);';
        }
        break;
      }
      out.push(lines[j]);
    }
    i = j; // skip to after useEffect
  }
}
fs.writeFileSync(path, out.join('\n'));
console.log('done');
