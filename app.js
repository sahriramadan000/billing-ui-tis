/* ══════════════════════════════════════════════════
   SUPERCORRIDOR BILLING · APP LOGIC v2
   Features: QR modal + download, wallet deeplinks,
             app store banner, full mock payment flow
══════════════════════════════════════════════════ */

'use strict';

/* ── Mock Data ──────────────────────────────────── */
const ACCOUNTS = {
  '16105195': {
    no:'16105195', name:'Idham Hb Haman',
    address:'JL. Merpati No. 12, Jakarta Selatan',
    city:'Jakarta', province:'DKI Jakarta',
    serviceId:'idPLAY Retail 15 Mbps',
    phone:'0812-3456-7890', status:'ACTIVE', activation:'01 Mar 2023',
    invoices:[
      { no:'260440000343', date:'2026-04-09', dueDate:'2026-04-30', amount:220890, checked:true },
      { no:'260440000289', date:'2026-03-09', dueDate:'2026-03-31', amount:220890, checked:false },
    ]
  },
  '16101290': {
    no:'16101290', name:'Farida Afida Yanti',
    address:'JL Raya Luwung Sarirogo No 26, Sukodono, Sidoarjo',
    city:'Sidoarjo', province:'Jawa Timur',
    serviceId:'idPLAY Retail 15 Mbps',
    phone:'', status:'CANCELED', activation:'01 Jan 1970',
    invoices:[]
  },
  '16209001': {
    no:'16209001', name:'Budi Santoso',
    address:'Jl. Pahlawan No. 88, Surabaya',
    city:'Surabaya', province:'Jawa Timur',
    serviceId:'idPLAY Business 30 Mbps',
    phone:'0856-9912-3344', status:'ACTIVE', activation:'15 Jun 2024',
    invoices:[
      { no:'260440000412', date:'2026-04-09', dueDate:'2026-04-30', amount:450000, checked:true },
    ]
  }
};

const VA_BANKS = [
  { id:'bca',     name:'BCA',        sub:'Virtual Account', logo:'logo/BCA.svg', color:'#005baa', text:'#fff', prefix:'13715' },
  { id:'bri',     name:'BRI',        sub:'Virtual Account', logo:'logo/BRI.svg', color:'#1b4692', text:'#fff', prefix:'14947' },
  { id:'mandiri', name:'Mandiri',    sub:'Virtual Account', logo:'logo/Mandiri.svg', color:'#003087', text:'#fff', prefix:'861883002' },
  { id:'bni',     name:'BNI',        sub:'Virtual Account', logo:'logo/BNI.svg', color:'#f05a28', text:'#fff', prefix:'9882734050009' },
  { id:'permata', name:'Permata',    sub:'Virtual Account', logo:'logo/Permata.svg', color:'#e8001a', text:'#fff', prefix:'89655010' },
  { id:'cimb',    name:'CIMB Niaga', sub:'Virtual Account', logo:'logo/CIMB.jpg', color:'#c8002a', text:'#fff', prefix:'1899503' },
  { id:'btn',     name:'BTN',        sub:'Virtual Account', logo:'logo/BTN.png', color:'#007a40', text:'#fff', prefix:'959623005' },
  { id:'maybank', name:'Maybank',    sub:'Virtual Account', logo:'logo/maybank.png', color:'#f7b600', text:'#222', prefix:'78676508' },
];

const QRIS_OPTS = [
  { id:'qris_all', name:'QRIS',     sub:'Semua dompet digital', logo:'logo/QRIS.svg', color:'#2d2d2d', text:'#fff', type:'qris' },
];

const WALLETS = [
  { id:'dana',      name:'DANA',     sub:'Dompet Digital', logo:'logo/Dana.svg', color:'#108ee9', text:'#fff', type:'wallet',
    deeplink:'dana://checkout?amount={AMOUNT}&merchant_id=SUPERCORRIDOR&order_id={ORDER}',
    playstore:'https://play.google.com/store/apps/details?id=id.dana',
    appstore:'https://apps.apple.com/id/app/dana/id1455468967' },
  { id:'gopay',     name:'GoPay',    sub:'Dompet Digital', logo:'logo/Gopay.svg', color:'#00AED6', text:'#fff', type:'wallet',
    deeplink:'gojek://gopay?amount={AMOUNT}&order_id={ORDER}',
    playstore:'https://play.google.com/store/apps/details?id=com.gojek.app',
    appstore:'https://apps.apple.com/id/app/gojek/id944875099' },
  { id:'shopeepay', name:'ShopeePay',sub:'Dompet Digital', logo:'logo/Shopee.png', color:'#ee4d2d', text:'#fff', type:'wallet',
    deeplink:'shopeeid://wallet/pay?amount={AMOUNT}&order_id={ORDER}',
    playstore:'https://play.google.com/store/apps/details?id=com.shopee.id',
    appstore:'https://apps.apple.com/id/app/shopee/id959841879' },
  { id:'ovo',       name:'OVO',      sub:'Dompet Digital', logo:'logo/Ovo.svg', color:'#4c3494', text:'#fff', type:'wallet',
    deeplink:'ovo://pay?amount={AMOUNT}&merchant=SUPERCORRIDOR',
    playstore:'https://play.google.com/store/apps/details?id=ovo.id',
    appstore:'https://apps.apple.com/id/app/ovo/id1089791869' },
];

const RETAIL = [
  { id:'alfamart',  name:'Alfamart', sub:'Gerai Retail', logo:'logo/Alfamart.svg', color:'#e4032e', text:'#fff', type:'retail' },
  { id:'indomaret', name:'Indomaret',sub:'Gerai Retail', logo:'logo/Indomaret.png', color:'#e4032e', text:'#fff', type:'retail' },
  { id:'alfamidi',  name:'Alfamidi', sub:'Gerai Retail', logo:'logo/Alfamidi.svg', color:'#f7931d', text:'#fff', type:'retail' },
  { id:'cc',        name:'Kartu Kredit',sub:'Visa / Mastercard', logo:'logo/cc.jpg', color:'#1a1a2e', text:'#fff', type:'cc' },
];

/* ── State ──────────────────────────────────────── */
let state = {
  step: 1,
  account: null,
  selected: null,
  qrTimer: null,
  qrSeconds: 900,
};

/* ── DOM ────────────────────────────────────────── */
const $ = id => document.getElementById(id);

/* ── Init ───────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  adjustHeaderTop();
  buildPaymentGrid();
  bindAll();
  initNav();
  makeWaDraggable();
});

function adjustHeaderTop() {
  const banner = $('app-banner');
  const header = document.querySelector('.site-header');
  if (banner && header) {
    const h = banner.offsetHeight;
    header.style.top = h + 'px';
  }
}

/* ── Build Payment Grids ────────────────────────── */
function buildPaymentGrid() {
  VA_BANKS.forEach(b  => $('va-grid').appendChild(pmBtn(b)));
  QRIS_OPTS.forEach(q => $('qris-grid').appendChild(pmBtn(q)));
  WALLETS.forEach(w   => $('wallet-grid').appendChild(pmBtn(w)));
  RETAIL.forEach(r    => $('retail-grid').appendChild(pmBtn(r)));
}

function pmBtn(item) {
  const btn = document.createElement('button');
  btn.className = 'pm-btn';
  btn.dataset.id = item.id;

  btn.innerHTML = `
    <div class="pm-icon" style="background:#fff; border:1px solid var(--border); padding:4px;">
      <img src="${item.logo}" alt="${item.name}" loading="lazy" style="width:100%; height:100%; object-fit:contain;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
      <span style="display:none; color:${item.color}; width:100%; height:100%; align-items:center; justify-content:center; font-weight:800; font-size:9.5px;">${item.name.substring(0,3).toUpperCase()}</span>
    </div>
    <div class="pm-btn-text">
      <div class="pm-name">${item.name}</div>
      <div class="pm-sub">${item.sub}</div>
    </div>
    <div class="pm-sel-dot">
      <svg width="8" height="8" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </div>
  `;

  btn.addEventListener('click', () => onPaymentSelect(btn, item));
  return btn;
}

/* ── Bind All Events ────────────────────────────── */
function bindAll() {
  // Banner
  $('app-banner-close').addEventListener('click', () => {
    $('app-banner').style.display = 'none';
    document.querySelector('.site-header').style.top = '0';
  });

  // T&C
  $('tnc-toggle').addEventListener('click', () => {
    const open = $('tnc-body').classList.toggle('open');
    $('tnc-toggle').setAttribute('aria-expanded', String(open));
  });

  // Search
  $('btn-search').addEventListener('click', doSearch);
  $('account-input').addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });

  // Navigation
  $('btn-pay').addEventListener('click', onPay);
  $('btn-reset').addEventListener('click', reset);
  $('btn-to-history').addEventListener('click', () => switchTab('history'));

  // QR Modal
  $('qr-modal-close').addEventListener('click', closeQrModal);
  $('btn-download-qr').addEventListener('click', downloadQr);
  $('qr-confirm-btn').addEventListener('click', confirmPaymentDone);
  $('qr-modal').addEventListener('click', e => { if (e.target === $('qr-modal')) closeQrModal(); });

  // Wallet Modal
  $('wallet-modal-close').addEventListener('click', closeWalletModal);
  $('wallet-confirm-btn').addEventListener('click', confirmPaymentDone);
  $('wallet-modal').addEventListener('click', e => { if (e.target === $('wallet-modal')) closeWalletModal(); });

  // Invoice toggles (delegated)
  $('invoice-list').addEventListener('change', e => {
    if (e.target.matches('input[type=checkbox]')) {
      const idx = parseInt(e.target.dataset.idx);
      state.account.invoices[idx].checked = e.target.checked;
      const item = e.target.closest('.invoice-item');
      item && item.classList.toggle('checked', e.target.checked);
      recalcTotal();
    }
  });

  // Transaction Detail Modal
  $('hist-list').addEventListener('click', e => {
    const item = e.target.closest('.hist-item');
    if (item && item.dataset.id) {
      openTxDetail(item.dataset.id);
    }
  });
  $('tx-modal-close').addEventListener('click', () => $('tx-modal').hidden = true);
  $('tx-modal-close-btn').addEventListener('click', () => $('tx-modal').hidden = true);
  $('tx-modal').addEventListener('click', e => { if (e.target === $('tx-modal')) $('tx-modal').hidden = true; });
}

/* ── Search ─────────────────────────────────────── */
async function doSearch() {
  const val   = $('account-input').value.trim();
  const errEl = $('search-error');
  errEl.hidden = true;

  // Validation: Terms & Conditions
  const tncCheck = $('tnc-check');
  if (!tncCheck.checked) {
    const tncBody = $('tnc-body');
    // Ensure T&C panel is open
    if (!tncBody.classList.contains('open')) {
      tncBody.classList.add('open');
      $('tnc-toggle').setAttribute('aria-expanded', 'true');
    }
    
    // Focus attention
    const lbl = tncCheck.closest('.checkbox-label');
    lbl.classList.remove('checkbox-error');
    void lbl.offsetWidth; // trigger reflow
    lbl.classList.add('checkbox-error');
    
    // Scroll into view
    lbl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  if (!val) { showErr(errEl, 'Masukkan nomor akun terlebih dahulu.'); return; }
  if (!/^\d{6,12}$/.test(val)) { showErr(errEl, 'Nomor akun harus berupa 6–12 digit angka.'); return; }

  setSearchLoading(true);
  await delay(900);
  setSearchLoading(false);

  const acc = ACCOUNTS[val];
  if (!acc) {
    showErr(errEl, `Akun "${val}" tidak ditemukan. Periksa kembali nomor Anda.`);
    $('billing-section').hidden = true;
    state.account = null;
    return;
  }

  state.account = JSON.parse(JSON.stringify(acc)); // deep clone
  populateBillingSection(state.account);
  $('billing-section').hidden = false;

  // Smooth scroll to billing section
  setTimeout(() => {
    $('billing-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 150);
}

function setSearchLoading(on) {
  const btn = $('btn-search');
  btn.querySelector('.btn-text').hidden = on;
  btn.querySelector('.btn-spinner').hidden = !on;
  btn.disabled = on;
}


/* ── Billing Section ────────────────────────────── */
function populateBillingSection(acc) {
  const initials   = acc.name.split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase();
  const isActive   = acc.status === 'ACTIVE';
  const maskedPhone = acc.phone ? maskPhone(acc.phone) : null;

  // ── Customer card ──
  $('cust-card').innerHTML = `
    <div class="cust-card">
      <div class="cust-card-top">
        <div class="cust-avatar">${initials}</div>
        <div class="cust-main">
          <div class="cust-name">${acc.name}</div>
          <div class="cust-acct-no">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" stroke-width="2"/><path d="M8 12h8M8 8h5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
            No. Akun: <strong>${acc.no}</strong>
          </div>
        </div>
        <div class="cust-status ${isActive ? 'cust-status-active' : 'cust-status-inactive'}">
          <span class="cust-status-dot"></span>
          ${isActive ? 'Aktif' : 'Tidak Aktif'}
        </div>
      </div>
      <div class="cust-meta-grid">
        <div class="cust-meta-item">
          <span class="cust-meta-lbl">Paket Layanan</span>
          <span class="cust-meta-val">${acc.serviceId}</span>
        </div>
        <div class="cust-meta-item">
          <span class="cust-meta-lbl">Lokasi</span>
          <span class="cust-meta-val">${acc.address}, ${acc.city}, ${acc.province}</span>
        </div>
        ${maskedPhone ? `
        <div class="cust-meta-item">
          <span class="cust-meta-lbl">Telepon</span>
          <span class="cust-meta-val cust-masked">${maskedPhone}</span>
        </div>` : ''}
        <div class="cust-meta-item">
          <span class="cust-meta-lbl">Pelanggan sejak</span>
          <span class="cust-meta-val">${acc.activation}</span>
        </div>
      </div>
    </div>
  `;

  // ── Invoice count badge ──
  const countBadge = $('inv-count-badge');
  if (countBadge) countBadge.textContent = acc.invoices.length + ' Tagihan';

  // ── Render invoice table ──
  const list = $('invoice-list');
  list.innerHTML = '';

  if (!acc.invoices.length) {
    list.innerHTML = `
      <div class="inv-empty">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke="var(--g-green)" stroke-width="1.8" stroke-linecap="round"/><polyline points="22 4 12 14.01 9 11.01" stroke="var(--g-green)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <div class="inv-empty-title">Tidak Ada Tagihan</div>
        <div class="inv-empty-sub">Semua tagihan Anda sudah lunas. Terima kasih!</div>
      </div>`;
    $('s-total').textContent = 'Rp 0';
    $('s-total-count').textContent = '0 tagihan dipilih';
    updateCheckAll();
    if ($('payment-methods-block')) $('payment-methods-block').style.display = 'none';
    if ($('payment-detail-block')) $('payment-detail-block').hidden = true;
    $('btn-pay').disabled = true;
    return;
  }

  const today = new Date(); today.setHours(0,0,0,0);

  // ── Table wrapper ──
  const table = document.createElement('div');
  table.className = 'inv-table';

  // ── Table header ──
  table.innerHTML = `
    <div class="inv-table-hdr">
      <div class="inv-th inv-th-cb"><input type="checkbox" id="check-all-cb"/></div>
      <div class="inv-th inv-th-no">No.</div>
      <div class="inv-th inv-th-period">Periode Tagihan</div>
      <div class="inv-th inv-th-due">Jatuh Tempo</div>
      <div class="inv-th inv-th-status">Status</div>
      <div class="inv-th inv-th-amount">Tagihan</div>
    </div>
  `;

  acc.invoices.forEach((inv, idx) => {
    const due      = new Date(inv.dueDate); due.setHours(0,0,0,0);
    const diffDays = Math.round((due - today) / 86400000);
    const isOverdue  = diffDays < 0;
    const isDueSoon  = !isOverdue && diffDays <= 3;

    let statusBadge = '';
    if (isOverdue) {
      statusBadge = `<span class="inv-badge inv-badge-overdue">⚠ Terlambat ${Math.abs(diffDays)} hari</span>`;
    } else if (isDueSoon) {
      statusBadge = `<span class="inv-badge inv-badge-soon">⏰ ${diffDays === 0 ? 'Hari ini' : diffDays + ' hari lagi'}</span>`;
    } else {
      statusBadge = `<span class="inv-badge inv-badge-ok">✓ Tepat waktu</span>`;
    }

    const row = document.createElement('label');
    row.className = 'inv-table-row' + (inv.checked ? ' checked' : '') + (isOverdue ? ' overdue' : '');
    row.setAttribute('for', `inv-cb-${idx}`);
    row.innerHTML = `
      <div class="inv-td inv-td-cb">
        <input type="checkbox" id="inv-cb-${idx}" data-idx="${idx}" ${inv.checked ? 'checked' : ''}/>
      </div>
      <div class="inv-td inv-td-no">${idx + 1}</div>
      <div class="inv-td inv-td-period" data-due="⏰ ${fmtDate(inv.dueDate)}">${fmtDate(inv.date)}${statusBadge}</div>
      <div class="inv-td inv-td-due ${isOverdue ? 'text-red' : isDueSoon ? 'text-amber' : ''}">${fmtDate(inv.dueDate)}</div>
      <div class="inv-td inv-td-status">${statusBadge}</div>
      <div class="inv-td inv-td-amount">${fmtRp(inv.amount)}</div>
    `;

    table.appendChild(row);
  });

  list.appendChild(table);
  recalcTotal();
  updateCheckAll();

  // Wire up check-all (inside table header)
  const checkAllCb = $('check-all-cb');
  if (checkAllCb) {
    checkAllCb.addEventListener('change', () => {
      state.account.invoices.forEach(i => { i.checked = checkAllCb.checked; });
      populateBillingSection(state.account);
    });
  }

  // Reset payment selection
  state.selected = null;
  document.querySelectorAll('.pm-btn').forEach(b => b.classList.remove('selected'));
  $('payment-detail-block').hidden = true;
  $('btn-pay').disabled = true;
}

function recalcTotal() {
  const checked = state.account.invoices.filter(i => i.checked);
  const total   = checked.reduce((s, i) => s + i.amount, 0);
  $('s-total').textContent       = fmtRp(total);
  $('s-total-count').textContent = checked.length + ' tagihan dipilih';
  updateCheckAll();

  if ($('payment-methods-block')) {
    $('payment-methods-block').style.display = checked.length > 0 ? '' : 'none';
  }
  
  if (checked.length === 0) {
    state.selected = null;
    document.querySelectorAll('.pm-btn').forEach(b => b.classList.remove('selected'));
    if ($('payment-detail-block')) $('payment-detail-block').hidden = true;
    $('btn-pay').disabled = true;
  } else {
    // Update active payment method detail to reflect new total automatically
    if (state.selected) {
      renderPaymentDetail(state.selected);
      $('btn-pay').disabled = false;
    }
  }
}

function updateCheckAll() {
  const cb = $('check-all-cb');
  if (!cb || !state.account) return;
  const all     = state.account.invoices.length;
  const chkd    = state.account.invoices.filter(i => i.checked).length;
  cb.checked       = all > 0 && chkd === all;
  cb.indeterminate = chkd > 0 && chkd < all;
}

/* ── Payment Selection ──────────────────────────── */
function onPaymentSelect(btn, item) {
  document.querySelectorAll('.pm-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  state.selected = item;

  renderPaymentDetail(item);
  $('btn-pay').disabled = false;

  setTimeout(() => {
    const detail = $('payment-detail-block');
    detail.scrollIntoView({ behavior:'smooth', block:'nearest' });
  }, 100);
}

function renderPaymentDetail(item) {
  const block = $('payment-detail-block');
  block.hidden = false;
  block.innerHTML = '';

  const acc   = state.account;
  const total = state.account.invoices.filter(i => i.checked).reduce((s, i) => s + i.amount, 0);

  if (item.type === 'wallet' || item.type === 'qris') {
    // Show QR preview card for QRIS; for wallets show app redirect card
    if (item.type === 'qris') {
      block.innerHTML = `
        <div class="va-detail">
          <div class="va-detail-label">Metode Terpilih</div>
          <div class="va-detail-bank">${item.name} – Scan QR Code</div>
          <div class="va-note" style="color:rgba(255,255,255,.55);margin-bottom:0">
            QR Code akan muncul saat Anda klik "Proses Pembayaran".<br/>
            Bisa digunakan oleh semua dompet digital (DANA, GoPay, OVO, ShopeePay, dll).
          </div>
        </div>
      `;
    } else {
      block.innerHTML = `
        <div class="va-detail" style="background:linear-gradient(135deg,${item.color} 0%,${darken(item.color)} 100%)">
          <div class="va-detail-label">Dompet Digital</div>
          <div class="va-detail-bank">${item.name}</div>
          <div class="va-note" style="color:rgba(255,255,255,.6);margin-bottom:0">
            Anda akan diarahkan ke aplikasi ${item.name} untuk menyelesaikan pembayaran sebesar <strong style="color:#fff">${fmtRp(total)}</strong>.
          </div>
        </div>
      `;
    }
    return;
  }

  if (item.type === 'retail' || item.type === 'cc') {
    block.innerHTML = `
      <div class="retail-detail">
        <div class="retail-detail-title">
          <div class="pm-icon" style="background:${item.color};color:${item.text};width:28px;height:28px;border-radius:8px;font-size:9px;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0">
            ${item.name.substring(0,3).toUpperCase()}
          </div>
          Kode Bayar ${item.name}
        </div>
        <div class="retail-cid-row">
          <div style="flex:1">
            <div class="cid-label">CID / Kode Pelanggan</div>
            <div class="cid-value">${acc.no}</div>
          </div>
          <button class="btn-copy" onclick="copyText('${acc.no}',this)">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" stroke-width="1.8"/></svg>
            Salin
          </button>
        </div>
        <div class="retail-note">
          ${item.type === 'cc'
            ? 'Masukkan nomor kartu kredit Anda untuk melanjutkan pembayaran.'
            : `Di kasir <strong>${item.name}</strong>: sebut <strong>"IDPLAY VIA DOKU"</strong> dan berikan CID di atas kepada kasir.`
          }
        </div>
      </div>
    `;
    return;
  }

  // VA Bank
  const bank = VA_BANKS.find(b => b.id === item.id);
  if (!bank) return;
  const code = formatVaCode(bank.prefix + acc.no);

  block.innerHTML = `
    <div class="va-detail">
      <div class="va-detail-label">Kode Virtual Account</div>
      <div class="va-detail-bank">${bank.name} – Virtual Account</div>
      <div class="va-code-row">
        <div class="va-code" id="va-code-val">${code}</div>
        <button class="btn-copy" onclick="copyText('${code.replace(/\s/g,'')}',this)">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" stroke-width="1.8"/></svg>
          Salin
        </button>
      </div>
      <div class="va-note">Gunakan kode ini untuk transfer via ATM, Mobile Banking, atau Internet Banking ${bank.name}. Berlaku 24 jam.</div>
    </div>
  `;
}

function formatVaCode(raw) {
  // Format to groups of 4
  return raw.replace(/\s/g,'').replace(/(\d{4})(?=\d)/g,'$1 ');
}

function darken(hex) {
  // simple darken for gradient
  try {
    let c = parseInt(hex.slice(1), 16);
    let r = Math.max(0, (c >> 16) - 30);
    let g = Math.max(0, ((c >> 8) & 0xff) - 30);
    let b = Math.max(0, (c & 0xff) - 30);
    return '#' + ((r<<16)|(g<<8)|b).toString(16).padStart(6,'0');
  } catch { return hex; }
}

/* ── Pay Button ─────────────────────────────────── */
async function onPay() {
  if (!state.selected) return;
  const item  = state.selected;
  const total = state.account.invoices.filter(i => i.checked).reduce((s, i) => s + i.amount, 0);

  if (total === 0) { alert('Pilih minimal satu tagihan yang akan dibayar.'); return; }

  const btn = $('btn-pay');
  btn.disabled = true;
  btn.innerHTML = `<svg class="spin" width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,.3)" stroke-width="2.5"/><path d="M12 2a10 10 0 0110 10" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/></svg> Memproses…`;

  await delay(800);

  btn.disabled = false;
  btn.innerHTML = `Proses Pembayaran <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" stroke-width="1.8"/></svg>`;

  if (item.type === 'qris') {
    openQrModal(item, total);
  } else if (item.type === 'wallet') {
    openWalletModal(item, total);
  } else {
    // VA / retail / CC → direct confirm
    await delay(400);
    showSuccess(item, total);
  }
}

/* ── QR Modal ───────────────────────────────────── */
function openQrModal(item, total) {
  $('qr-bank-icon').style.cssText = `background:${item.color};color:${item.text};width:44px;height:44px;border-radius:13px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:12px;font-family:var(--font)`;
  $('qr-bank-icon').textContent  = item.name.substring(0,3).toUpperCase();
  $('qr-amount-display').textContent = fmtRp(total);

  // Draw mock QR
  drawMockQr(total);

  // Timer
  state.qrSeconds = 900;
  updateQrTimer();
  clearInterval(state.qrTimer);
  state.qrTimer = setInterval(() => {
    state.qrSeconds--;
    updateQrTimer();
    if (state.qrSeconds <= 0) { clearInterval(state.qrTimer); }
  }, 1000);

  $('qr-modal').hidden = false;
  document.body.style.overflow = 'hidden';
}

function updateQrTimer() {
  const m = String(Math.floor(state.qrSeconds / 60)).padStart(2,'0');
  const s = String(state.qrSeconds % 60).padStart(2,'0');
  const el = $('qr-countdown');
  if (el) {
    el.textContent = `${m}:${s}`;
    el.style.color = state.qrSeconds < 60 ? 'var(--danger)' : 'var(--warn)';
  }
}

function closeQrModal() {
  $('qr-modal').hidden = true;
  document.body.style.overflow = '';
  clearInterval(state.qrTimer);
}

/* ── Draw Mock QR ───────────────────────────────── */
function drawMockQr(total) {
  const canvas = $('qr-canvas');
  const ctx    = canvas.getContext('2d');
  const size   = 220;
  const m      = 12; // margin
  const cells  = 25;
  const cellSz = (size - m * 2) / cells;

  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, size, size);

  // Generate deterministic pattern from account + total
  const seed = (state.account ? state.account.no : '') + String(total);
  const rng  = seededRng(seed);

  ctx.fillStyle = '#111';

  for (let r = 0; r < cells; r++) {
    for (let c = 0; c < cells; c++) {
      const x = m + c * cellSz;
      const y = m + r * cellSz;

      // Corner finder patterns (top-left, top-right, bottom-left)
      if (isFinderCell(r, c, cells)) {
        ctx.fillRect(x, y, cellSz - .5, cellSz - .5);
        continue;
      }
      // Timing patterns
      if ((r === 6 || c === 6) && !isFinderRegion(r, c)) {
        if ((r + c) % 2 === 0) ctx.fillRect(x, y, cellSz - .5, cellSz - .5);
        continue;
      }
      // Data cells
      if (!isFinderRegion(r, c) && rng() > 0.5) {
        ctx.fillRect(x, y, cellSz - .5, cellSz - .5);
      }
    }
  }

  // Draw finder pattern borders (white inner)
  ['tl','tr','bl'].forEach(pos => drawFinder(ctx, pos, m, cellSz, cells));

  // Center white area for logo
  const logoSize = 44;
  const lx = (size - logoSize) / 2;
  const ly = (size - logoSize) / 2;
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.roundRect(lx - 4, ly - 4, logoSize + 8, logoSize + 8, 6);
  ctx.fill();
}

function drawFinder(ctx, pos, m, cellSz, cells) {
  let r0 = 0, c0 = 0;
  if (pos === 'tr') c0 = cells - 7;
  if (pos === 'bl') r0 = cells - 7;

  const x = m + c0 * cellSz;
  const y = m + r0 * cellSz;
  const sz7 = cellSz * 7;
  const sz5 = cellSz * 5;
  const sz3 = cellSz * 3;

  // Outer square
  ctx.fillStyle = '#111';
  ctx.fillRect(x, y, sz7, sz7);
  // White
  ctx.fillStyle = '#fff';
  ctx.fillRect(x + cellSz, y + cellSz, sz5, sz5);
  // Inner dark
  ctx.fillStyle = '#111';
  ctx.fillRect(x + cellSz * 2, y + cellSz * 2, sz3, sz3);
}

function isFinderCell(r, c, n) {
  return (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7);
}
function isFinderRegion(r, c) {
  const n = 25;
  return (r <= 8 && c <= 8) || (r <= 8 && c >= n - 8) || (r >= n - 8 && c <= 8);
}
function seededRng(seed) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  }
  return function() {
    h ^= h << 13; h ^= h >> 17; h ^= h << 5;
    return ((h >>> 0) / 0xFFFFFFFF);
  };
}

/* ── Download QR ────────────────────────────────── */
function downloadQr() {
  const canvas  = $('qr-canvas');
  const offCanvas = document.createElement('canvas');
  offCanvas.width  = 400;
  offCanvas.height = 460;
  const ctx = offCanvas.getContext('2d');

  // Background
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, 400, 460);

  // Header gradient
  const grad = ctx.createLinearGradient(0, 0, 400, 80);
  grad.addColorStop(0, '#1ec98c');
  grad.addColorStop(1, '#0ea5e9');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 400, 80);

  // Title
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 18px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('SUPERCORRIDOR', 200, 32);
  ctx.font = '13px Arial';
  ctx.fillText('Scan QR untuk Pembayaran', 200, 55);

  // QR image
  ctx.drawImage(canvas, 0, 0, 220, 220, 90, 95, 220, 220);

  // Amount
  const acc   = state.account;
  const total = acc.invoices.filter(i => i.checked).reduce((s, i) => s + i.amount, 0);
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 22px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(fmtRp(total), 200, 348);

  ctx.fillStyle = '#64748b';
  ctx.font = '12px Arial';
  ctx.fillText(`No. Akun: ${acc.no} · ${acc.name}`, 200, 370);
  ctx.fillText(`Dicetak: ${new Date().toLocaleDateString('id-ID')}`, 200, 390);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '11px Arial';
  ctx.fillText('QR berlaku 15 menit setelah dicetak', 200, 420);
  ctx.fillText('supercorridor.co.id', 200, 440);

  const link    = document.createElement('a');
  link.download = `QRIS-Supercorridor-${acc.no}.png`;
  link.href     = offCanvas.toDataURL('image/png');
  link.click();
}

/* ── Wallet Modal ───────────────────────────────── */
function openWalletModal(item, total) {
  const iconEl = $('wallet-icon-wrap');
  iconEl.style.cssText = `background:${item.color};color:${item.text};width:44px;height:44px;border-radius:13px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:12px;font-family:var(--font)`;
  iconEl.textContent = item.name.substring(0,3).toUpperCase();

  const wrfEl = $('wrf-icon');
  wrfEl.style.cssText = `background:${item.color};color:${item.text};width:56px;height:56px;border-radius:16px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:14px;font-family:var(--font);animation:pulse 1.5s ease-in-out infinite`;
  wrfEl.textContent = item.name.substring(0,3).toUpperCase();

  $('wallet-modal-title').textContent     = `Bayar via ${item.name}`;
  $('wallet-modal-sub').textContent       = `Anda akan diarahkan ke aplikasi ${item.name}`;
  $('wallet-amount-display').textContent  = fmtRp(total);
  $('wallet-cta-text').textContent        = `Ketuk "Buka Aplikasi" untuk membayar ${fmtRp(total)} via ${item.name}`;

  // Build deeplink
  const orderId = 'SC' + Date.now();
  const deeplink = item.deeplink
    .replace('{AMOUNT}', total)
    .replace('{ORDER}', orderId);

  const openBtn = $('wallet-open-btn');
  openBtn.href = deeplink;

  // On mobile: try deeplink, fallback to play store
  openBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile) {
      window.location.href = deeplink;
      setTimeout(() => {
        const isAndroid = /Android/i.test(navigator.userAgent);
        window.location.href = isAndroid ? item.playstore : item.appstore;
      }, 1500);
    } else {
      window.open(item.playstore, '_blank');
    }
  }, { once: true });

  $('wallet-modal').hidden = false;
  document.body.style.overflow = 'hidden';
}

function closeWalletModal() {
  $('wallet-modal').hidden = true;
  document.body.style.overflow = '';
}

/* ── Confirm & Success ──────────────────────────── */
function confirmPaymentDone() {
  closeQrModal();
  closeWalletModal();
  const item  = state.selected;
  const total = state.account.invoices.filter(i => i.checked).reduce((s, i) => s + i.amount, 0);
  showSuccess(item, total);
}

function showSuccess(item, total) {
  const acc     = state.account;
  const invList = acc.invoices.filter(i => i.checked);
  const orderId = 'SC' + Date.now().toString().slice(-8);

  $('success-sub').textContent = `Terima kasih, ${acc.name}!`;

  $('success-receipt').innerHTML = `
    <div style="display:flex;flex-direction:column;gap:5px">
      <div style="display:flex;justify-content:space-between"><span style="color:var(--tx-m)">No. Pesanan</span><strong>${orderId}</strong></div>
      <div style="display:flex;justify-content:space-between"><span style="color:var(--tx-m)">Metode</span><strong>${item.name}</strong></div>
      <div style="display:flex;justify-content:space-between"><span style="color:var(--tx-m)">Invoice</span><strong>${invList.map(i => i.no).join(', ')}</strong></div>
      <div style="height:1px;background:var(--border);margin:4px 0"></div>
      <div style="display:flex;justify-content:space-between"><span style="color:var(--tx-m)">Total Dibayar</span><strong style="color:var(--g-green);font-size:16px">${fmtRp(total)}</strong></div>
      <div style="display:flex;justify-content:space-between"><span style="color:var(--tx-m)">Waktu</span><span>${new Date().toLocaleString('id-ID')}</span></div>
    </div>
  `;

  // Bersihkan form tagihan di background untuk mencegah double payment
  // jika user pindah tab lalu kembali ke tab Tagihan.
  state.account = null;
  state.selected = null;
  $('account-input').value = '';
  $('billing-section').hidden = true;
  $('payment-detail-block').hidden = true;
  $('btn-pay').disabled = true;
  document.querySelectorAll('.pm-btn').forEach(b => b.classList.remove('selected'));

  // Show success
  document.querySelectorAll('.step-panel').forEach(p => p.classList.remove('active'));
  $('panel-success').classList.add('active');
  scrollTop();
}

/* ── Reset ──────────────────────────────────────── */
function reset() {
  state.account  = null;
  state.selected = null;
  state.step     = 1;
  clearInterval(state.qrTimer);

  $('account-input').value = '';
  $('billing-section').hidden = true;
  $('search-error').hidden = true;
  $('payment-detail-block').hidden = true;
  $('btn-pay').disabled    = true;
  document.querySelectorAll('.pm-btn').forEach(b => b.classList.remove('selected'));

  document.querySelectorAll('.step-panel').forEach(p => p.classList.remove('active'));
  $('panel-1').classList.add('active');
  scrollTop();
}

/* ── Global copy helper (called inline from HTML) ─ */
window.copyText = function(text, btnEl) {
  navigator.clipboard.writeText(text).then(() => {
    const orig = btnEl.innerHTML;
    btnEl.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg> Tersalin!`;
    setTimeout(() => { btnEl.innerHTML = orig; }, 2000);
  }).catch(() => {
    alert('Kode: ' + text);
  });
};

/* ── Helpers ─────────────────────────────────────── */
function showErr(el, msg) {
  el.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.8"/><path d="M12 8v4M12 16h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg> ${msg}`;
  el.hidden = false;
}
function delay(ms) { return new Promise(r => setTimeout(r, ms)); }
function fmtRp(n)  { return 'Rp ' + Number(n).toLocaleString('id-ID'); }
function maskPhone(phone) {
  // e.g. 0812-3456-7890 → 0812-••••-7890
  return phone.replace(/(\d{4})[\d-]{4,6}(\d{4})/, '$1-••••-$2');
}
function fmtDate(s) {
  try { return new Date(s).toLocaleDateString('id-ID',{day:'2-digit',month:'long',year:'numeric'}); }
  catch { return s; }
}
function scrollTop() { window.scrollTo({ top:0, behavior:'smooth' }); }

/* ── Tab Nav ─────────────────────────────────────── */
const HISTORY_DATA = [
  { id:'HX-202503-001', acct:'138204', name:'Budi Santoso',   period:'Maret 2025',   amount:285000, paid_at:'2025-03-05', method:'BCA Virtual Account' },
  { id:'HX-202502-001', acct:'138204', name:'Budi Santoso',   period:'Februari 2025',amount:285000, paid_at:'2025-02-07', method:'GoPay' },
  { id:'HX-202501-001', acct:'138204', name:'Budi Santoso',   period:'Januari 2025', amount:285000, paid_at:'2025-01-06', method:'QRIS' },
  { id:'HX-202412-002', acct:'220510', name:'Siti Rahayu',    period:'Desember 2024',amount:190000, paid_at:'2024-12-10', method:'BNI Virtual Account' },
  { id:'HX-202411-002', acct:'220510', name:'Siti Rahayu',    period:'November 2024',amount:190000, paid_at:'2024-11-08', method:'Alfamart' },
  { id:'HX-202410-002', acct:'220510', name:'Siti Rahayu',    period:'Oktober 2024', amount:190000, paid_at:'2024-10-05', method:'DANA' },
  { id:'HX-202409-003', acct:'305671', name:'Ahmad Fauzi',    period:'September 2024',amount:350000, paid_at:'2024-09-12', method:'Mandiri Virtual Account' },
  { id:'HX-202408-003', acct:'305671', name:'Ahmad Fauzi',    period:'Agustus 2024', amount:350000, paid_at:'2024-08-09', method:'Indomaret' },
];

let histFiltered = [...HISTORY_DATA];
let currentPage = 1;
const itemsPerPage = 5;

function initNav() {
  document.querySelectorAll('.pn-tab').forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.panel));
  });
  renderHistory();

  $('hist-filter-year').addEventListener('change', filterHistory);
  const pagiContainer = $('hist-pagination');
  if (pagiContainer) {
    pagiContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('.pagi-btn');
      if (!btn || btn.hasAttribute('disabled') || btn.classList.contains('active')) return;
      const targetPage = parseInt(btn.dataset.page, 10);
      if (!isNaN(targetPage)) {
        currentPage = targetPage;
        renderHistoryList();
        $('panel-history').scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }
}

function switchTab(panel) {
  // Update tab UI
  document.querySelectorAll('.pn-tab').forEach(t => t.classList.toggle('active', t.dataset.panel === panel));

  // Hide all panels, including success panel
  document.querySelectorAll('.step-panel').forEach(p => p.classList.remove('active'));

  const isBilling = panel === 'billing';
  $('panel-1').classList.toggle('active', isBilling);
  $('panel-history').classList.toggle('active', !isBilling);

  // Reset billing-section visibility when switching back
  if (isBilling) {
    scrollTop();
  } else {
    currentPage = 1;
    filterHistory();
    scrollTop();
  }
}

function filterHistory() {
  const year = $('hist-filter-year').value;
  histFiltered = HISTORY_DATA.filter(h => {
    return !year || h.paid_at.startsWith(year);
  });
  currentPage = 1;
  renderHistoryList();
}

function renderHistory() {
  renderHistoryList();
}

function renderHistoryList() {
  const list = $('hist-list');
  const footer = $('hist-footer');

  if (!histFiltered.length) {
    list.innerHTML = `
      <div class="hist-empty">
        <div class="hist-empty-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.8"/><path d="M8 15s1.5-2 4-2 4 2 4 2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M9 9h.01M15 9h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        </div>
        <div class="hist-empty-title">Tidak Ada Riwayat</div>
        <div class="hist-empty-sub">Belum ada transaksi yang sesuai dengan pencarian Anda.</div>
      </div>`;
    footer.hidden = true;
    return;
  }

  const total = histFiltered.length;
  const totalPages = Math.ceil(total / itemsPerPage);
  
  if (currentPage > totalPages) {
    currentPage = totalPages;
  }

  const startIdx = (currentPage - 1) * itemsPerPage;
  const endIdx = startIdx + itemsPerPage;
  const slice = histFiltered.slice(startIdx, endIdx);

  list.innerHTML = slice.map(h => `
    <div class="hist-item" data-id="${h.id}">
      <div class="hist-item-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><polyline points="14 2 14 8 20 8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
      </div>
      <div class="hist-item-body">
        <div class="hist-item-acct">Akun #${h.acct} · ${h.name}</div>
        <div class="hist-item-period">${h.period} · ${h.method}</div>
      </div>
      <div class="hist-item-right">
        <div class="hist-item-amount">${fmtRp(h.amount)}</div>
        <div class="hist-item-paid-badge">
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Lunas
        </div>
        <div class="hist-item-date">${fmtDate(h.paid_at)}</div>
      </div>
    </div>
  `).join('');

  const showingStart = startIdx + 1;
  const showingEnd = Math.min(endIdx, total);
  $('hist-count').textContent = `Menampilkan ${showingStart}-${showingEnd} dari ${total} transaksi`;
  
  const pagiContainer = $('hist-pagination');
  if (pagiContainer) {
    if (totalPages > 1) {
      let pagiHTML = '';
      
      const prevDis = currentPage === 1 ? 'disabled' : '';
      pagiHTML += `<button class="pagi-btn pagi-nav" data-page="${currentPage - 1}" ${prevDis} aria-label="Previous">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>`;
      
      function getPageList(c, m) {
        if (m <= 7) return Array.from({length: m}, (_, i) => i + 1);
        if (c <= 3) return [1, 2, 3, '...', m];
        if (c >= m - 2) return [1, '...', m - 2, m - 1, m];
        return [1, '...', c - 1, c, c + 1, '...', m];
      }
      
      const pages = getPageList(currentPage, totalPages);
      for (const p of pages) {
        if (p === '...') {
          pagiHTML += `<span class="pagi-dots">...</span>`;
        } else {
          const active = p === currentPage ? 'active' : '';
          pagiHTML += `<button class="pagi-btn pagi-num ${active}" data-page="${p}">${p}</button>`;
        }
      }
      
      const nextDis = currentPage === totalPages ? 'disabled' : '';
      pagiHTML += `<button class="pagi-btn pagi-nav" data-page="${currentPage + 1}" ${nextDis} aria-label="Next">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>`;
      
      pagiContainer.innerHTML = pagiHTML;
      pagiContainer.style.display = 'flex';
    } else {
      pagiContainer.innerHTML = '';
      pagiContainer.style.display = 'none';
    }
  }

  footer.hidden = false;
}

function openTxDetail(txId) {
  const tx = HISTORY_DATA.find(h => h.id === txId);
  if(!tx) return;
  
  $('tx-val-id').textContent = tx.id;
  $('tx-val-name').textContent = tx.name;
  $('tx-val-acct').textContent = 'Akun #' + tx.acct;
  $('tx-val-period').textContent = tx.period;
  $('tx-val-method').textContent = tx.method;
  $('tx-val-amount').textContent = fmtRp(tx.amount);
  
  // Create a more readable date if needed, though tx.paid_at is already mapped
  $('tx-date').textContent = fmtDate(tx.paid_at);
  
  $('tx-modal').hidden = false;
}

/* ── WA Float Drag Logic ───────────────────────────────── */
function makeWaDraggable() {
  const wa = $('wa-float');
  const handle = $('wa-drag-handle');
  if (!wa || !handle) return;
  
  let isDragging = false;
  let startX, startY, initialX, initialY;
  let hasDragged = false;

  const onDown = (e) => {
    if (e.type === 'mousedown' && e.button !== 0) return;
    
    // Stop propagation so we don't trigger the anchor immediately
    e.preventDefault();
    e.stopPropagation();
    
    isDragging = true;
    hasDragged = false;
    
    if (e.type === 'touchstart') {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    } else {
      startX = e.clientX;
      startY = e.clientY;
    }
    
    const rect = wa.getBoundingClientRect();
    initialX = rect.left;
    initialY = rect.top;
    
    wa.style.transition = 'none';
    wa.style.animation = 'none';
    wa.style.bottom = 'auto';
    wa.style.right = 'auto';
    wa.style.left = initialX + 'px';
    wa.style.top = initialY + 'px';
    
    document.addEventListener('mousemove', onMove, { passive: false });
    document.addEventListener('mouseup', onUp);
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onUp);
  };
  
  const onMove = (e) => {
    if (!isDragging) return;
    
    let currentX, currentY;
    if (e.type === 'touchmove') {
      currentX = e.touches[0].clientX;
      currentY = e.touches[0].clientY;
    } else {
      currentX = e.clientX;
      currentY = e.clientY;
    }
    
    const dx = currentX - startX;
    const dy = currentY - startY;
    
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      hasDragged = true;
      e.preventDefault();
    }
    
    let newX = initialX + dx;
    let newY = initialY + dy;
    
    const maxX = window.innerWidth - wa.offsetWidth;
    const maxY = window.innerHeight - wa.offsetHeight;
    
    newX = Math.max(0, Math.min(newX, maxX));
    newY = Math.max(0, Math.min(newY, maxY));
    
    wa.style.left = newX + 'px';
    wa.style.top = newY + 'px';
  };
  
  const onUp = (e) => {
    if (!isDragging) return;
    isDragging = false;
    wa.style.transition = '';
    
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
    document.removeEventListener('touchmove', onMove);
    document.removeEventListener('touchend', onUp);
    
    // Reset hasDragged after a short delay so subsequent clicks can work
    setTimeout(() => {
      hasDragged = false;
    }, 50);
  };
  
  // Attach down to HANDLE
  handle.addEventListener('mousedown', onDown);
  handle.addEventListener('touchstart', onDown, { passive: false });
  handle.addEventListener('click', (e) => {
     e.preventDefault();
     e.stopPropagation();
  });
  
  // Prevent native dragging of the anchor itself
  wa.addEventListener('dragstart', (e) => e.preventDefault());
  
  // Normal anchor click is handled by the browser naturally for the rest of the button.
  // We only intercept if it bubbled from handle (which we stopped above anyway)
  // but to be absolutely safe, let's keep click listener on WA too just for dragged state
  wa.addEventListener('click', (e) => {
    if (hasDragged) {
      e.preventDefault();
      e.stopPropagation();
    }
  });
}
