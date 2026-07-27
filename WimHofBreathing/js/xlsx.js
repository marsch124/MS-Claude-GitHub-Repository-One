/* Minimal dependency-free .xlsx writer (single sheet, inline strings, stored ZIP).
   Usage: WHBXlsx.build('Sessions', rows) -> Blob   (rows = array of arrays of string|number) */
(function () {
  'use strict';

  const enc = new TextEncoder();

  // ---- CRC32 ----
  const CRC = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      t[n] = c >>> 0;
    }
    return t;
  })();
  function crc32(bytes) {
    let c = 0xFFFFFFFF;
    for (let i = 0; i < bytes.length; i++) c = CRC[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }

  function xmlEsc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
  }
  function colName(n) { // 1-based -> A, B, ... Z, AA...
    let s = '';
    while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); }
    return s;
  }

  function sheetXml(rows) {
    let body = '';
    rows.forEach((row, ri) => {
      const r = ri + 1;
      let cells = '';
      row.forEach((val, ci) => {
        const ref = colName(ci + 1) + r;
        if (val === null || val === undefined || val === '') return;
        if (typeof val === 'number' && isFinite(val)) {
          cells += `<c r="${ref}"><v>${val}</v></c>`;
        } else {
          cells += `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${xmlEsc(val)}</t></is></c>`;
        }
      });
      body += `<row r="${r}">${cells}</row>`;
    });
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
      `<sheetData>${body}</sheetData></worksheet>`;
  }

  function build(sheetName, rows) {
    const name = String(sheetName || 'Sheet1').replace(/[\\/?*[\]:]/g, ' ').slice(0, 31) || 'Sheet1';
    const files = [
      ['[Content_Types].xml',
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
        '<Default Extension="xml" ContentType="application/xml"/>' +
        '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
        '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
        '</Types>'],
      ['_rels/.rels',
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
        '</Relationships>'],
      ['xl/workbook.xml',
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
        `<sheets><sheet name="${xmlEsc(name)}" sheetId="1" r:id="rId1"/></sheets></workbook>`],
      ['xl/_rels/workbook.xml.rels',
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>' +
        '</Relationships>'],
      ['xl/worksheets/sheet1.xml', sheetXml(rows)],
    ];
    return zipStore(files.map(([n, s]) => ({ name: n, data: enc.encode(s) })));
  }

  // ---- Stored (uncompressed) ZIP ----
  function zipStore(entries) {
    const chunks = [];
    const central = [];
    let offset = 0;
    const u16 = (n) => new Uint8Array([n & 255, (n >>> 8) & 255]);
    const u32 = (n) => new Uint8Array([n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255]);

    entries.forEach((e) => {
      const nameBytes = enc.encode(e.name);
      const crc = crc32(e.data);
      const size = e.data.length;
      const local = concat([
        u32(0x04034b50), u16(20), u16(0), u16(0), u16(0), u16(0),
        u32(crc), u32(size), u32(size), u16(nameBytes.length), u16(0), nameBytes,
      ]);
      chunks.push(local, e.data);
      central.push(concat([
        u32(0x02014b50), u16(20), u16(20), u16(0), u16(0), u16(0), u16(0),
        u32(crc), u32(size), u32(size), u16(nameBytes.length), u16(0), u16(0), u16(0), u16(0),
        u32(0), u32(offset), nameBytes,
      ]));
      offset += local.length + size;
    });

    const cdStart = offset;
    let cdSize = 0;
    central.forEach((c) => { chunks.push(c); cdSize += c.length; });
    chunks.push(concat([
      u32(0x06054b50), u16(0), u16(0), u16(entries.length), u16(entries.length),
      u32(cdSize), u32(cdStart), u16(0),
    ]));
    return new Blob(chunks, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  function concat(arrs) {
    let len = 0; arrs.forEach((a) => { len += a.length; });
    const out = new Uint8Array(len);
    let p = 0; arrs.forEach((a) => { out.set(a, p); p += a.length; });
    return out;
  }

  window.WHBXlsx = { build };
})();
