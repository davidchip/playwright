"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var throttledFile_exports = {};
__export(throttledFile_exports, {
  ThrottledFile: () => ThrottledFile
});
module.exports = __toCommonJS(throttledFile_exports);
var import_fs = __toESM(require("fs"));
// ANIMAKE: transformation utilities injected directly into throttledFile so we reliably
// post-process recorder output just before it is written to disk.
const ANIMAKE_HELPER_HEADER = '// <animake-helpers>';
function __animakeTransform_old(text) {
  try {
    if (!text || text.includes(ANIMAKE_HELPER_HEADER)) return text; // idempotent
    let source = text.toString();
    const randomTextPattern = /(await\s+[^;]*?\.fill\(\s*['"])(_random_text_(\d+)_)(['"]\s*\))/g;
    const randomIntPattern  = /(await\s+[^;]*?\.fill\(\s*['"])(_random_int_(\d+)_)(['"]\s*\))/g;
    const decls = [];
    const declared = new Set();
    function varName(base, num) { return base + num; }
    // Support pre-existing variable fills: page.*.fill(randomTextN)
    source = source.replace(/fill\(\s*(randomText(\d+))\s*\)/g, (m, v, num) => {
      if (!declared.has(v)) { declared.add(v); decls.push(`let ${v} = randomText();`); }
      return m;
    });
    source = source.replace(randomTextPattern, (m, p1, placeholder, num, p4) => {
      const v = varName('randomText', num);
      if (!declared.has(v)) { declared.add(v); decls.push(`let ${v} = randomText();`); }
      return m.replace(p1 + placeholder + p4, p1.replace(/['"]$/, '') + v + p4.replace(/^['"]/,'') );
    });
    source = source.replace(randomIntPattern, (m, p1, placeholder, num, p4) => {
      const v = varName('randomIntVar', num);
      if (!declared.has(v)) { declared.add(v); decls.push(`let ${v} = randomInt();`); }
      return m.replace(p1 + placeholder + p4, p1.replace(/['"]$/, '') + v + p4.replace(/^['"]/,'') );
    });
  // LABEL: placeholder -> getByLabel
  source = source.replace(/page\.locator\(['"]LABEL:([^'"\\]+?)['"]\)/g, (m, lbl) => `page.getByLabel(${JSON.stringify(lbl.trim())})`);
    // Transform expect assertions with random text variables
    source = source.replace(/await\s+expect\(page\.locator\(([^)]+)\)\.first\(\)\)\.toHaveValue\(['"](_random_text_(\d+)_)['"]\)/g, (match, selector, placeholder, num) => {
      const varName = `randomText${num}`;
      return `await expect(page.locator('input').filter({hasText: ${varName}}).first()).toHaveValue(${varName})`;
    });
    source = source.replace(/await\s+expect\(page\.locator\(([^)]+)\)\)\.toHaveValue\(['"](_random_text_(\d+)_)['"]\)/g, (match, selector, placeholder, num) => {
      const varName = `randomText${num}`;
      return `await expect(page.locator('input').filter({hasText: ${varName}}).first()).toHaveValue(${varName})`;
    });
    const expectLines = [];
    // Replace assertions expecting placeholder with variable name if variable was declared
    source = source.replace(/toHaveValue\(['"](_random_text_(\d+)_)['"]\)/g, (m, placeholder, num) => {
      const v = 'randomText' + num;
      if (declared.has(v)) return `toHaveValue(${v})`;
      return m;
    });
    // Normalize existing expects that still use a raw locator with the variable (avoid double-transform if already normalized)
    source = source.replace(/await\s+expect\(\s*page\.locator\([^)]*\)\s*\)\.toHaveValue\(\s*(randomText\d+)\s*\);?/g, (m, v) => {
      if (/hasText\s*:/.test(m)) return m; // already transformed
      return `await expect(page.locator('input').filter({ hasText: ${v} })).toHaveValue(${v});`;
    });
    source = source.replace(/await\s+expect\(\s*page\.getByRole\([^)]*\)\s*\)\.toHaveValue\(\s*(randomText\d+)\s*\);?/g, (m, v) => {
      if (/hasText\s*:/.test(m)) return m;
      return `await expect(page.locator('input').filter({ hasText: ${v} })).toHaveValue(${v});`;
    });
  source = source.replace(/page\.locator\(['"]EXPECT_EXISTS:([^'"\\]+?)['"]\)(\.\w+\([^)]*\))?;?/g, (m, target) => {
      const locator = target.startsWith('css=') ? target.replace(/^css=/,'') : target;
      expectLines.push(`await expect(page.locator(${JSON.stringify(locator)})).toBeVisible();`);
      return '';
    });
  source = source.replace(/['"]EXPECT_EXISTS:([^'"\\]+?)['"];?/g, (m, target) => {
      const locator = target.startsWith('css=') ? target.replace(/^css=/,'') : target;
      expectLines.push(`await expect(page.locator(${JSON.stringify(locator)})).toBeVisible();`);
      return '';
    });
    if (expectLines.length) source += `\n// Animake injected assertions\n${expectLines.join("\n")}\n`;
    // Fallback: scan for undeclared randomTextN/randomIntVarN usages
    const rtUsage = [...new Set((source.match(/randomText(\d+)/g) || []))];
    for (const v of rtUsage) {
      if (!declared.has(v)) { declared.add(v); decls.push(`let ${v} = randomText();`); }
    }
    const riUsage = [...new Set((source.match(/randomIntVar(\d+)/g) || []))];
    for (const v of riUsage) {
      if (!declared.has(v)) { declared.add(v); decls.push(`let ${v} = randomInt();`); }
    }
    if (decls.length) {
      const helperBlock = ANIMAKE_HELPER_HEADER + "\n" +
        "function randomText(){return 'T_'+Math.random().toString(36).slice(2,10);}\n" +
        "function randomInt(){return Math.floor(Math.random()*100000);}\n" +
        decls.join("\n") + "\n// </animake-helpers>\n";
      source = helperBlock + source;
    }
    if (decls.length) {
      console.log('[Animake Transform] Injected declarations:', decls.map(d=>d.split(' ')[1]).join(', '));
    } else {
      console.log('[Animake Transform] No declarations injected');
    }
    // Final normalization pass: any expect(...).toHaveValue(randomTextN) -> standardized input filter
    source = source.replace(/await\s+expect\(\s*([^)]*?)\s*\)\.toHaveValue\(\s*(randomText\d+)\s*\);?/g, (m, inner, v) => {
      if (/page\.locator\('input'\)\.filter\(\{\s*hasText:/.test(m)) return m; // already normalized
      return `await expect(page.locator('input').filter({ hasText: ${v} })).toHaveValue(${v});`;
    });
    // Debug step requested: replace selector with HELLO_WORLD for any randomText assertion
    source = source.replace(/await\s+expect\(.*?\)\.toHaveValue\(\s*(randomText\d+)\s*\);?/g, (m, v) => {
      return `let selector = "input[value=\'" + ${v} + "\']";\n  await expect(page.locator(selector)).toHaveValue(${v});`;
    });
    return source;
  } catch (e) {
    console.error('Animake transform failed:', e);
    return text;
  }
}
class ThrottledFile {
  constructor(file) {
    this._file = file;
  }
  setContent(text) {
    this._text = text;
    if (!this._timer)
      this._timer = setTimeout(() => this.flush(), 250);
  }
  flush() {
    if (this._timer) {
      clearTimeout(this._timer);
      this._timer = void 0;
    }
    if (this._text) {
      let out = this._text;
      if (process && process.env && process.env.ANIMAKE_CODEGEN_PATCH !== '0') {
        out = __animakeTransform_old(out);
      }
      import_fs.default.writeFileSync(this._file, out);
    }
    this._text = void 0;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ThrottledFile
});
