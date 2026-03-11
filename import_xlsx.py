import zipfile, xml.etree.ElementTree as ET, re, datetime, json

xlsx = 'C:/laragon/www/asset_miracle/Form Serah Terima IT.xlsx'

def get_shared_strings(z):
    ss = ET.fromstring(z.read('xl/sharedStrings.xml'))
    ns = {'w': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
    strings = []
    for si in ss.findall('.//w:si', ns):
        t_nodes = si.findall('.//w:t', ns)
        strings.append(''.join(t.text or '' for t in t_nodes))
    return strings

def col_to_num(col_str):
    num = 0
    for c in col_str:
        num = num * 26 + (ord(c.upper()) - ord('A') + 1)
    return num - 1

def excel_date(val):
    try:
        v = str(val).strip()
        if not v or v in ['#N/A', '', '0']:
            return None
        days = int(float(v))
        if days < 1:
            return None
        dt = datetime.date(1899, 12, 30) + datetime.timedelta(days=days)
        return dt.strftime('%Y-%m-%d')
    except:
        return None

def parse_sheet(z, sheet_file, shared):
    ns = {'w': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
    ws = ET.fromstring(z.read(sheet_file))
    rows = {}
    for row in ws.findall('.//w:row', ns):
        r = int(row.get('r', 0))
        rows[r] = {}
        for cell in row.findall('w:c', ns):
            ref = cell.get('r', '')
            m = re.match(r'([A-Z]+)(\d+)', ref)
            if not m:
                continue
            col = col_to_num(m.group(1))
            t = cell.get('t', '')
            v_el = cell.find('w:v', ns)
            if v_el is None:
                continue
            val = v_el.text or ''
            if t == 's':
                val = shared[int(val)] if int(val) < len(shared) else val
            rows[r][col] = str(val).strip()
    return rows

def fix_office(val):
    if val == '365.0':
        return 'MS. Office 365'
    return val

def fix_serial(val):
    try:
        if val and ('E' in val or 'e' in val) and '.' in val:
            return str(int(float(val)))
    except:
        pass
    return val

records = []
seq_laptop = {}
seq_addon  = {}

def next_seq(d, ym):
    d[ym] = d.get(ym, 0) + 1
    return d[ym]

SW_LAPTOP  = json.dumps(['Avast Free Antivirus','Google Chrome','Anydesk','Microsoft Edge','Office 365 Business','Tight VNC'], ensure_ascii=False)
SW_EMPTY   = json.dumps([], ensure_ascii=False)
ACC_LAPTOP = json.dumps(['Charger','Tas'], ensure_ascii=False)
ACC_EMPTY  = json.dumps([], ensure_ascii=False)

with zipfile.ZipFile(xlsx) as z:
    shared = get_shared_strings(z)

    # ============================================================
    # Sheet 1: Form Serah Terima (Laptop) - Titi Suparyanti
    # ============================================================
    s1 = parse_sheet(z, 'xl/worksheets/sheet1.xml', shared)
    dt1 = excel_date(s1.get(66, {}).get(4, '')) or '2026-02-20'
    ym1 = dt1[:7].replace('-', '/')
    records.append({
        'doc_number': f'ST-LP/{ym1}/{next_seq(seq_laptop, ym1):03d}',
        'type': 'laptop', 'handover_date': dt1,
        'from_name': 'Achmad Batul',
        'from_position': 'IT Hardware & Infrastructure Staff',
        'from_department': 'IT', 'dept_head': 'Afrizzal P. Pratama',
        'to_name': 'Titi Suparyanti', 'to_position': 'Finance Staff',
        'to_department': 'FAT',
        'to_address': 'Jl. M.H. Thamrin No.40, DR. Soetomo, Kec. Tegalsari, Surabaya, Jawa Timur 60264',
        'device_label': '1 (satu) Buah Laptop',
        'merek': 'Lenovo', 'type_device': 'Ideapad Slim 3 14IRH10',
        'serial_number': 'PF5SWFBJ', 'processor': 'CORE I5-1315H',
        'storage': 'SSD 512GB', 'ram': '16 GB', 'screen_size': '14 INC',
        'os': 'Win 11 Home SL', 'office_sw': 'MS. Office 365 Business',
        'software_list': SW_LAPTOP, 'accessories_list': ACC_LAPTOP,
    })

    # ============================================================
    # Sheet 3: Form Serah Terima Add On - Evia Diana Pertiwi
    # ============================================================
    s3 = parse_sheet(z, 'xl/worksheets/sheet3.xml', shared)
    dt3 = excel_date(s3.get(61, {}).get(4, '')) or '2026-03-02'
    ym3 = dt3[:7].replace('-', '/')
    records.append({
        'doc_number': f'ST-AO/{ym3}/{next_seq(seq_addon, ym3):03d}',
        'type': 'add_on', 'handover_date': dt3,
        'from_name': 'Muhammad Rizky Amin', 'from_position': 'IT Generalist',
        'from_department': 'IT', 'dept_head': '',
        'to_name': 'Evia Diana Pertiwi', 'to_position': 'Clinic Manager',
        'to_department': 'Miracle Citraland',
        'to_address': 'Jl. Emerald Mansion Citraland No.TN1 / 17, Lidah Kulon, Kec. Lakarsantri, Surabaya, Jawa Timur 60213',
        'device_label': '1 (satu) Buah Tablet PC',
        'merek': 'Samsung', 'type_device': 'Galaxy Tab S10 FE 5G SM-X526B',
        'serial_number': '350703930025346', 'processor': '-',
        'storage': '128GB', 'ram': '8GB', 'screen_size': '10 inch',
        'os': '', 'office_sw': '',
        'software_list': SW_EMPTY,
        'accessories_list': json.dumps(['Kabel Data','Charger','Flip Cover Keyboard','Pencil'], ensure_ascii=False),
    })

    # ============================================================
    # Sheet 5: Copy of Form Serah Terima - Ernie Ermaningsih
    # ============================================================
    s5 = parse_sheet(z, 'xl/worksheets/sheet5.xml', shared)
    dt5 = excel_date(s5.get(67, {}).get(4, '')) or '2025-07-18'
    ym5 = dt5[:7].replace('-', '/')
    records.append({
        'doc_number': f'ST-LP/{ym5}/{next_seq(seq_laptop, ym5):03d}',
        'type': 'laptop', 'handover_date': dt5,
        'from_name': 'Afrizzal P. Pratama', 'from_position': 'Departemen Head',
        'from_department': 'IT', 'dept_head': 'Afrizzal P. Pratama',
        'to_name': 'Ernie Ermaningsih', 'to_position': 'ACM',
        'to_department': 'Operational',
        'to_address': 'Jl. M.H. Thamrin No.40, DR. Soetomo, Kec. Tegalsari, Surabaya, Jawa Timur 60264',
        'device_label': '1 (satu) Buah Laptop',
        'merek': 'Lenovo', 'type_device': 'IdeaPad 5 14ALC05',
        'serial_number': 'MP27GVZW', 'processor': 'Ryzen 5 5500U',
        'storage': 'SSD 512GB', 'ram': '8GB', 'screen_size': '14 INC',
        'os': 'Win 11 Home SL', 'office_sw': 'MS. Office 365 Business',
        'software_list': SW_LAPTOP, 'accessories_list': ACC_LAPTOP,
    })

    # ============================================================
    # Sheet 2: Inventory History (Laptop)
    # Col: 0=dept, 1=tanggal, 2=pemegang lama, 3=pemegang baru,
    #      4=merk, 5=type, 6=sn, 7=cpu, 8=storage, 9=ram,
    #      10=screen, 11=os, 12=office, 13=catatan, 14=no_aset
    # ============================================================
    s2 = parse_sheet(z, 'xl/worksheets/sheet2.xml', shared)
    current_dept = ''
    skip_headers = {'niam', 'Tanggal', 'Master ->>', 'Master -->>'}
    for rnum in sorted(s2.keys()):
        if rnum == 1:
            continue
        row = s2[rnum]
        if not row:
            continue
        # track department from col 0
        col0 = row.get(0, '').strip()
        if col0 and col0 not in skip_headers and col0 != 'Master -->>':
            current_dept = col0
        to_name = row.get(3, '').strip()
        if not to_name or to_name == 'Pemegang sekarang':
            continue
        # must have at least merk or processor to be a real device row
        if not row.get(4, '').strip() and not row.get(7, '').strip():
            continue
        raw_date = row.get(1, '')
        dt = excel_date(raw_date) if raw_date not in ('#N/A', '', '0') else None
        if not dt:
            dt = '2024-01-01'
        ym = dt[:7].replace('-', '/')
        doc = f'ST-LP/{ym}/{next_seq(seq_laptop, ym):03d}'
        from_name  = row.get(2, '').strip() or 'Gudang IT'
        merek      = row.get(4, '').strip()
        type_dev   = row.get(5, '').strip()
        serial     = fix_serial(row.get(6, '').strip())
        processor  = row.get(7, '').strip()
        storage    = row.get(8, '').strip()
        ram        = row.get(9, '').strip()
        screen     = row.get(10, '').strip()
        os_val     = row.get(11, '').strip()
        office_val = fix_office(row.get(12, '').strip())
        dept       = current_dept or 'IT'
        # device label
        ml = (merek + ' ' + type_dev).lower()
        if 'aio' in ml:
            dev_lbl = '1 (satu) Buah PC AIO'
        elif 'nuc' in type_dev.lower():
            dev_lbl = '1 (satu) Buah Mini PC'
        elif 'rakitan' in ml or 'pc ' in ml:
            dev_lbl = '1 (satu) Buah PC'
        else:
            dev_lbl = '1 (satu) Buah Laptop'
        records.append({
            'doc_number': doc, 'type': 'laptop', 'handover_date': dt,
            'from_name': from_name, 'from_position': 'IT Staff',
            'from_department': 'IT', 'dept_head': '',
            'to_name': to_name, 'to_position': '',
            'to_department': dept, 'to_address': '',
            'device_label': dev_lbl,
            'merek': merek, 'type_device': type_dev,
            'serial_number': serial, 'processor': processor,
            'storage': storage, 'ram': ram, 'screen_size': screen,
            'os': os_val, 'office_sw': office_val,
            'software_list': SW_LAPTOP, 'accessories_list': ACC_LAPTOP,
        })

    # ============================================================
    # Sheet 4: Inventory History Add On
    # ============================================================
    s4 = parse_sheet(z, 'xl/worksheets/sheet4.xml', shared)
    current_dept4 = ''
    for rnum in sorted(s4.keys()):
        if rnum == 1:
            continue
        row = s4[rnum]
        if not row:
            continue
        col0 = row.get(0, '').strip()
        if col0 and col0 not in ('wh', 'Master -->>'):
            current_dept4 = col0
        to_name = row.get(3, '').strip()
        if not to_name or to_name == 'Pemegang sekarang':
            continue
        if not row.get(4, '').strip() and not row.get(5, '').strip():
            continue
        raw_date = row.get(1, '')
        dt = excel_date(raw_date) if raw_date not in ('#N/A', '', '0') else None
        if not dt:
            dt = '2024-01-01'
        ym = dt[:7].replace('-', '/')
        doc = f'ST-AO/{ym}/{next_seq(seq_addon, ym):03d}'
        from_name  = row.get(2, '').strip() or 'Gudang IT'
        merek      = row.get(4, '').strip()
        type_dev   = row.get(5, '').strip()
        if type_dev.startswith('#REF'):
            type_dev = ''
        serial     = fix_serial(row.get(6, '').strip())
        processor  = row.get(7, '').strip()
        storage    = row.get(8, '').strip()
        ram        = row.get(9, '').strip()
        screen     = row.get(10, '').strip()
        os_val     = row.get(11, '').strip()
        if os_val == '-':
            os_val = ''
        office_val = row.get(12, '').strip()
        if office_val in ('-', ''):
            office_val = ''
        dept = current_dept4 or 'IT'
        ml   = (merek + ' ' + type_dev).lower()
        if 'ipad' in ml or 'tab' in ml or 'tablet' in ml:
            dev_lbl = '1 (satu) Buah Tablet'
        elif any(x in ml for x in ['reno','oppo','samsung','infinix','phone','iphone']):
            dev_lbl = '1 (satu) Buah Handphone'
        elif any(x in ml for x in ['hdd','ssd','seagate','ugreen','expansion']):
            dev_lbl = '1 (satu) Buah External Storage'
        elif 'canon' in ml or 'kamera' in ml or 'camera' in ml:
            dev_lbl = '1 (satu) Buah Kamera'
        elif 'wln' in ml or 'printer' in ml or 'm200' in ml.replace(' ',''):
            dev_lbl = '1 (satu) Buah Printer'
        else:
            dev_lbl = '1 (satu) Buah Perangkat'
        records.append({
            'doc_number': doc, 'type': 'add_on', 'handover_date': dt,
            'from_name': from_name, 'from_position': 'IT Staff',
            'from_department': 'IT', 'dept_head': '',
            'to_name': to_name, 'to_position': '',
            'to_department': dept, 'to_address': '',
            'device_label': dev_lbl,
            'merek': merek, 'type_device': type_dev,
            'serial_number': serial, 'processor': processor,
            'storage': storage, 'ram': ram, 'screen_size': screen,
            'os': os_val, 'office_sw': office_val,
            'software_list': SW_EMPTY, 'accessories_list': ACC_EMPTY,
        })

# ============================================================
# Build SQL file
# ============================================================
def q(v):
    return "'" + str(v).replace("'", "''") + "'"

sql_lines = [
    'DELETE FROM handovers;',
    'ALTER TABLE handovers AUTO_INCREMENT = 1;',
]
for r in records:
    sql_lines.append(
        'INSERT INTO handovers (doc_number,type,handover_date,'
        'from_name,from_position,from_department,dept_head,'
        'to_name,to_position,to_department,to_address,'
        'device_label,merek,type_device,serial_number,'
        'processor,storage,ram,screen_size,os,office_sw,'
        'software_list,accessories_list) VALUES ('
        + ','.join([
            q(r['doc_number']), q(r['type']), q(r['handover_date']),
            q(r['from_name']), q(r['from_position']), q(r['from_department']), q(r['dept_head']),
            q(r['to_name']), q(r['to_position']), q(r['to_department']), q(r['to_address']),
            q(r['device_label']), q(r['merek']), q(r['type_device']), q(r['serial_number']),
            q(r['processor']), q(r['storage']), q(r['ram']), q(r['screen_size']),
            q(r['os']), q(r['office_sw']), q(r['software_list']), q(r['accessories_list']),
        ]) + ');'
    )
sql_lines.append('SELECT COUNT(*) AS total FROM handovers;')
sql_lines.append('SELECT COUNT(*) AS laptop FROM handovers WHERE type="laptop";')
sql_lines.append('SELECT COUNT(*) AS add_on FROM handovers WHERE type="add_on";')

sql = '\n'.join(sql_lines)
with open('C:/laragon/www/asset_miracle/import_handovers.sql', 'w', encoding='utf-8') as f:
    f.write(sql)

total_lp = sum(1 for r in records if r['type'] == 'laptop')
total_ao = sum(1 for r in records if r['type'] == 'add_on')
print(f'Total records: {len(records)}  |  Laptop: {total_lp}  |  Add On: {total_ao}')
print('SQL file generated: import_handovers.sql')
