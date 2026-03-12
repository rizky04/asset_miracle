
NEW_CODE = r"""    const LOGO_URL = 'http://localhost/asset_miracle/logo.png';

    const PRINT_CSS = `
      * { margin:0; padding:0; box-sizing:border-box; }
      body { font-family:'Arial',sans-serif; font-size:10.5pt; color:#111; background:#fff; }
      .page { padding:14mm 18mm 12mm; max-width:210mm; margin:0 auto; }

      .doc-header { display:flex; align-items:center; justify-content:space-between; padding-bottom:8px; border-bottom:2.5pt solid #111; margin-bottom:4px; }
      .logo-box img { height:56px; width:auto; }
      .company-box { text-align:right; }
      .company-name { font-size:11pt; font-weight:bold; letter-spacing:.3px; }
      .company-sub  { font-size:8.5pt; color:#555; margin-top:3px; line-height:1.4; }

      .doc-title-row { text-align:center; padding:7px 0 5px; border-bottom:1.5pt solid #111; margin-bottom:14px; }
      .doc-title { font-size:13pt; font-weight:bold; text-transform:uppercase; letter-spacing:.8px; }
      .doc-nomor { font-size:9pt; color:#555; margin-top:3px; }

      .intro { font-size:10.5pt; margin-bottom:6px; font-style:italic; }
      .fields { margin:0 0 8px 18px; }
      .f-row { display:flex; margin-bottom:3px; font-size:10.5pt; line-height:1.45; }
      .f-lbl { min-width:108px; }
      .f-sep { min-width:12px; }
      .f-val { flex:1; }

      .body-text { font-size:10.5pt; line-height:1.6; text-align:justify; margin-bottom:9px; }

      .section-label { font-size:10.5pt; font-weight:bold; margin:10px 0 4px 18px; }
      .spec-tbl { margin:3px 0 10px 36px; font-size:10.5pt; border-collapse:collapse; }
      .spec-tbl td { padding:2px 4px 2px 0; vertical-align:top; line-height:1.45; }
      .spec-tbl td:nth-child(1) { min-width:22px; }
      .spec-tbl td:nth-child(2) { min-width:130px; }
      .spec-tbl td:nth-child(3) { min-width:12px; }

      .legal-block { margin-bottom:12px; }
      .legal-item  { display:flex; gap:8px; margin-bottom:6px; font-size:10pt; line-height:1.6; text-align:justify; padding-left:6px; }
      .legal-item .lnum { min-width:16px; font-weight:bold; flex-shrink:0; }

      .closing   { font-size:10.5pt; line-height:1.6; text-align:justify; margin-bottom:12px; }
      .date-line { font-size:10.5pt; text-align:right; margin-bottom:20px; padding-right:10px; }

      .sig-wrap  { display:flex; justify-content:space-between; margin-top:6px; }
      .sig-group { display:flex; flex-direction:column; }
      .sig-group-title { font-size:10pt; font-weight:bold; margin-bottom:10px; }
      .sig-row   { display:flex; gap:24px; }
      .sig-box   { text-align:center; min-width:120px; }
      .sig-space { height:64px; }
      .sig-line  { border-bottom:1px solid #333; margin:0 8px 5px; }
      .sig-name  { font-size:9.5pt; font-weight:bold; }
      .sig-role  { font-size:9pt; color:#444; }

      @media print {
        @page { margin:8mm 12mm; size:A4 portrait; }
        body  { font-size:10pt; }
        .page { padding:0; }
      }
    `;

    // ── shared header builder ──────────────────────────────────────────────
    function printHeader(d, titleSuffix) {
        return `
  <div class="doc-header">
    <div class="logo-box">
      <img src="${LOGO_URL}" alt="Miracle Logo" onerror="this.style.display='none'">
    </div>
    <div class="company-box">
      <div class="company-name">PT. Grahadhika Sarana Purnajati</div>
      <div class="company-sub">
        Jl. M.H. Thamrin No.40, DR. Soetomo, Kec. Tegalsari<br>
        Surabaya, Jawa Timur 60264
      </div>
    </div>
  </div>
  <div class="doc-title-row">
    <div class="doc-title">Serah Terima Fasilitas Perusahaan</div>
    <div class="doc-nomor">No. Dokumen : ${d.doc_number}</div>
  </div>`;
    }

    // ── shared body builder ────────────────────────────────────────────────
    function printBody(d, specsHTML) {
        const letters = 'abcdefghijklmnopqrstuvwxyz';
        const swRows  = (d.software_list    || []).map((s, i) =>
            `<tr><td>${letters[i]}.</td><td colspan="3">${s}</td></tr>`).join('');
        const accRows = (d.accessories_list || []).map((a, i) =>
            `<tr><td>${letters[i]}.</td><td colspan="3">${a}</td></tr>`).join('');
        const tanggal = formatDateLong(d.handover_date);

        return `
  <p class="intro">Yang bertandatangan dibawah ini :</p>
  <div class="fields">
    <div class="f-row"><span class="f-lbl">Nama</span><span class="f-sep">:</span><span class="f-val">${d.from_name}</span></div>
    <div class="f-row"><span class="f-lbl">Jabatan</span><span class="f-sep">:</span><span class="f-val">${d.from_position || '-'}</span></div>
    <div class="f-row"><span class="f-lbl">Departemen</span><span class="f-sep">:</span><span class="f-val">${d.from_department || 'IT'}</span></div>
  </div>
  <p class="body-text">Dalam hal ini bertindak untuk dan atas nama PT. Grahadhika Sarana Purnajati sesuai dengan kewenangan jabatannya yang selanjutnya disebut sebagai <strong>Pihak Pertama</strong> atau Yang Menyerahkan</p>

  <div class="fields">
    <div class="f-row"><span class="f-lbl">Nama</span><span class="f-sep">:</span><span class="f-val">${d.to_name}</span></div>
    <div class="f-row"><span class="f-lbl">Jabatan</span><span class="f-sep">:</span><span class="f-val">${d.to_position || '-'}</span></div>
    <div class="f-row"><span class="f-lbl">Departemen</span><span class="f-sep">:</span><span class="f-val">${d.to_department}</span></div>
    ${d.to_address ? `<div class="f-row"><span class="f-lbl">Alamat</span><span class="f-sep">:</span><span class="f-val">${d.to_address}</span></div>` : ''}
  </div>
  <p class="body-text">Dalam hal ini bertindak untuk dan atas nama dirinya sendiri sesuai dengan jabatan, yang selanjutnya disebut sebagai <strong>Pihak Kedua</strong> atau Yang Menerima.</p>

  <p class="body-text">Bahwa untuk menunjang kinerja dari Pihak Kedua, maka dengan ini Pihak Pertama telah menyerahkan fasilitas perusahaan untuk digunakan oleh Pihak Kedua sesuai dengan data dibawah ini, antara lain :</p>

  <p class="section-label">1. &nbsp;${d.device_label || '1 (satu) Buah Perangkat'}, dengan data spesifikasi sebagai berikut :</p>
  <table class="spec-tbl">${specsHTML}</table>

  <p class="section-label">2. &nbsp;Software Terinstall, antara lain :</p>
  ${swRows ? `<table class="spec-tbl">${swRows}</table>` : '<p style="margin-left:36px;font-size:10.5pt;">-</p>'}

  <p class="section-label">3. &nbsp;Kelengkapan tambahan, antara lain :</p>
  ${accRows ? `<table class="spec-tbl">${accRows}</table>` : '<p style="margin-left:36px;font-size:10.5pt;">-</p>'}

  <p class="body-text">Fasilitas tersebut diserahkan oleh Pihak Pertama kepada Pihak Kedua berkaitan dengan jabatannya sebagai <strong>${d.to_position || d.to_department}</strong>, dengan dilakukannya serah terima ini maka berlaku beberapa hal yang harus diperhatikan, antara lain:</p>

  <div class="legal-block">
    <div class="legal-item"><span class="lnum">1.</span><span>Bahwa Fasilitas perusahaan yang diterima oleh Pihak Kedua tidak diperbolehkan untuk dipindah tangankan dan atau dilakukan pengalihan fasilitas kepada orang lain selain dan tanpa adanya persetujuan atasan dan Persetujuan Pihak Pertama.</span></div>
    <div class="legal-item"><span class="lnum">2.</span><span>Bahwa Pihak Kedua bertanggung jawab secara penuh atas segala resiko yang terjadi dikarenakan timbulnya kerusakan dan atau kehilangan yang diakibatkan dari kelalaian Pihak Kedua yang dilakukan secara sengaja dan atau tidak sengaja selama penggunaan fasilitas tersebut. Serta Pihak Kedua berkewajiban menanggung segala kerusakan secara pribadi seusai adanya pengecekan dari Pihak Pertama.</span></div>
    <div class="legal-item"><span class="lnum">3.</span><span>Bahwa Pihak Kedua bersedia dalam berjalannya waktu penggunaan fasilitas perusahaan tersebut, untuk dapat diperiksa dan atau dilakukannya audit terkait dengan isi dan dokumen yang ada dalam fasilitas tersebut.</span></div>
    <div class="legal-item"><span class="lnum">4.</span><span>Bahwa Pihak Kedua bertanggung Jawab secara penuh atas data, isi, konten dan dokumen yang berada didalam fasilitas perusahaan tersebut. Serta Pihak Kedua dilarang keras untuk menggunakan fasilitas perusahaan tersebut diluar kepentingan dan tujuan perusahaan yang dilakukan di dalam jam kerja maupun diluar jam kerja.</span></div>
    <div class="legal-item"><span class="lnum">5.</span><span>Apabila Pihak Kedua sudah tidak bekerja kembali dan atau mengundurkan diri, maka Pihak Kedua berkewajiban mengembalikan fasilitas perusahaan tersebut dalam keadaan baik sebagaimana mestinya.</span></div>
  </div>

  <p class="closing">Demikian serah terima fasilitas perusahaan ini dibuat dan disetujui oleh PARA PIHAK dan menjadi hukum yang dapat dipertanggung jawabkan dikemudian hari.</p>

  <p class="date-line">Surabaya, ${tanggal}</p>

  <div class="sig-wrap">
    <div class="sig-group">
      <div class="sig-group-title">Mengetahui,</div>
      <div class="sig-row">
        <div class="sig-box">
          <div class="sig-space"></div>
          <div class="sig-line"></div>
          <div class="sig-name">${d.from_name}</div>
          <div class="sig-role">Departemen IT</div>
        </div>
        <div class="sig-box">
          <div class="sig-space"></div>
          <div class="sig-line"></div>
          <div class="sig-name">${d.dept_head || '(________________)'}</div>
          <div class="sig-role">Departemen Head</div>
        </div>
      </div>
    </div>
    <div class="sig-group">
      <div class="sig-group-title">Menyetujui,</div>
      <div class="sig-row">
        <div class="sig-box">
          <div class="sig-space"></div>
          <div class="sig-line"></div>
          <div class="sig-name">(________________)</div>
          <div class="sig-role">HRD - Personalia</div>
        </div>
        <div class="sig-box">
          <div class="sig-space"></div>
          <div class="sig-line"></div>
          <div class="sig-name">(________________)</div>
          <div class="sig-role">Penerima</div>
        </div>
      </div>
    </div>
  </div>`;
    }

    function buildLaptopPrintHTML(d) {
        const specs = `
      <tr><td>a.</td><td>Merek</td><td>:</td><td>${d.merek || '-'}</td></tr>
      <tr><td>b.</td><td>Type</td><td>:</td><td>${d.type_device || '-'}</td></tr>
      <tr><td>c.</td><td>Serial Number</td><td>:</td><td>${d.serial_number || '-'}</td></tr>
      <tr><td>d.</td><td>Processor</td><td>:</td><td>${d.processor || '-'}</td></tr>
      <tr><td>e.</td><td>Storage</td><td>:</td><td>${d.storage || '-'}</td></tr>
      <tr><td>f.</td><td>RAM</td><td>:</td><td>${d.ram || '-'}</td></tr>
      <tr><td>g.</td><td>Ukuran Layar</td><td>:</td><td>${d.screen_size || '-'}</td></tr>
      ${d.os      ? `<tr><td>h.</td><td>Sistem Operasi</td><td>:</td><td>${d.os}</td></tr>` : ''}
      ${d.office_sw ? `<tr><td>i.</td><td>Office</td><td>:</td><td>${d.office_sw}</td></tr>` : ''}`;
        return `<!DOCTYPE html>
<html lang="id"><head><meta charset="UTF-8">
<title>Serah Terima Laptop - ${d.doc_number}</title>
<style>${PRINT_CSS}</style></head>
<body><div class="page">
  ${printHeader(d)}
  ${printBody(d, specs)}
</div></body></html>`;
    }

    function buildAddOnPrintHTML(d) {
        let letter = 97; // 'a'
        const rows = [
            ['Merek',       d.merek       || '-'],
            ['Type',        d.type_device || '-'],
            ['Serial Number', d.serial_number || '-'],
        ];
        if (d.processor && d.processor !== '-') rows.push(['Processor', d.processor]);
        rows.push(['Storage',     d.storage    || '-']);
        rows.push(['RAM',         d.ram        || '-']);
        rows.push(['Ukuran Layar',d.screen_size|| '-']);
        const specs = rows.map(([lbl, val]) =>
            `<tr><td>${String.fromCharCode(letter++)}.</td><td>${lbl}</td><td>:</td><td>${val}</td></tr>`
        ).join('');
        return `<!DOCTYPE html>
<html lang="id"><head><meta charset="UTF-8">
<title>Serah Terima Add On - ${d.doc_number}</title>
<style>${PRINT_CSS}</style></head>
<body><div class="page">
  ${printHeader(d)}
  ${printBody(d, specs)}
</div></body></html>`;
    }"""

with open('C:/laragon/www/asset_miracle/js/app.js', 'r', encoding='utf-8') as f:
    content = f.read()

start_marker = "    const PRINT_CSS = `"
end_search   = "</div></body></html>`;\n    }"

start_pos = content.find(start_marker)
# find LAST occurrence (buildAddOnPrintHTML end)
end_pos   = content.rfind(end_search) + len(end_search)

if start_pos == -1 or end_pos == -1:
    print("ERROR: markers not found")
else:
    new_content = content[:start_pos] + NEW_CODE + content[end_pos:]
    with open('C:/laragon/www/asset_miracle/js/app.js', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f"Done! Replaced {end_pos - start_pos} chars with {len(NEW_CODE)} chars")
