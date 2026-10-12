// In-memory stand-in for the Apps Script services Code.gs uses (SpreadsheetApp, LockService,
// PropertiesService, ContentService, HtmlService). Shared by the unit tests and the form check.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../integrations/google-sheets/Code.gs', import.meta.url), 'utf8');

/** Chainable no-op for formatting calls the tests don't inspect. */
const chain = new Proxy(function () {}, { get: () => chain, apply: () => chain });

function makeSheet(name) {
  const rows = []; // rows[0] is the header row once set up
  return {
    name,
    rows,
    getLastRow: () => rows.length,
    getMaxRows: () => 1000,
    appendRow: (r) => rows.push([...r]),
    clear: () => rows.splice(0),
    setFrozenRows: () => {},
    setColumnWidth: () => {},
    getRange(row, col, numRows = 1, numCols = 1) {
      let proxy;
      const range = {
        getValues: () =>
          Array.from({ length: numRows }, (_, i) => Array.from({ length: numCols }, (_, j) => rows[row - 1 + i]?.[col - 1 + j] ?? '')),
        setValues(values) {
          values.forEach((v, i) => {
            rows[row - 1 + i] ??= [];
            v.forEach((cell, j) => (rows[row - 1 + i][col - 1 + j] = cell));
          });
          return proxy;
        },
        setValue(v) {
          rows[row - 1] ??= [];
          rows[row - 1][col - 1] = v;
          return proxy;
        },
      };
      proxy = new Proxy(range, { get: (t, k) => (k in t ? t[k] : chain) });
      return proxy;
    },
  };
}

export function makeEnv({ failOnAppend = false } = {}) {
  const sheets = new Map();
  const dialogs = [];
  const ss = {
    getSheetByName: (n) => sheets.get(n) ?? null,
    insertSheet(n) {
      const s = makeSheet(n);
      if (failOnAppend) s.appendRow = () => { throw new Error('quota'); };
      sheets.set(n, s);
      return s;
    },
  };
  const ui = {
    ButtonSet: { YES_NO: 'YES_NO' },
    Button: { YES: 'YES', NO: 'NO' },
    alert: (msg) => (dialogs.push(msg), 'YES'),
    showModalDialog: (html) => dialogs.push(html.content),
    createMenu: () => chain,
  };
  const ctx = {
    console: { error: () => {} },
    SpreadsheetApp: { getActiveSpreadsheet: () => ss, getUi: () => ui, newDataValidation: () => chain },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => (k === 'SITE_URL' ? 'https://example.test' : null) }) },
    ContentService: {
      MimeType: { JSON: 'json' },
      createTextOutput: (content) => ({ content, setMimeType() { return this; } }),
    },
    HtmlService: {
      createHtmlOutput: (content) => ({ content, setTitle() { return this; }, setWidth() { return this; }, setHeight() { return this; } }),
    },
  };
  vm.createContext(ctx);
  vm.runInContext(source, ctx);
  return { ctx, sheets, dialogs, rows: () => sheets.get('Beta requests')?.rows ?? [] };
}

