/* ============================================================
   SCRIPT.JS — Voltify Electronics Dashboard
   Features:
   1.  Multi-page SPA routing (sidebar nav switches pages)
   2.  Scroll-triggered animations (IntersectionObserver)
   3.  KPI counter animation
   4.  KPI bar fill animation
   5.  Bar chart (Canvas)
   6.  Line chart (Canvas)
   7.  Pie/donut chart (Canvas)
   8.  Overview mini-charts
   9.  Orders table generation
   10. Analytics table generation
   11. Product category filter
   12. Mobile sidebar toggle
============================================================ */

/* ============================================================
   DATA
============================================================ */
const PRODUCTS = [
  { name: 'BT Speaker',     label: 'Bluetooth Speaker',        price: 45,  units: 320, profit: 18, cat: 'Audio'    },
  { name: 'Elec. Trimmer',  label: 'Electric Trimmer',         price: 25,  units: 410, profit: 22, cat: 'Grooming' },
  { name: 'LED Flashlight', label: 'LED Flashlight',           price: 15,  units: 580, profit: 30, cat: 'Tools'    },
  { name: 'Headphones',     label: 'Wireless Headphones',      price: 60,  units: 260, profit: 25, cat: 'Audio'    },
  { name: 'Smartwatch',     label: 'Smartwatch',               price: 80,  units: 190, profit: 20, cat: 'Wearables'},
  { name: 'Port. Charger',  label: 'Portable Charger',         price: 35,  units: 370, profit: 28, cat: 'Power'    },
  { name: 'Gaming Mouse',   label: 'Gaming Mouse',             price: 40,  units: 440, profit: 24, cat: 'Gaming'   },
  { name: 'Earbuds',        label: 'Noise Cancelling Earbuds', price: 50,  units: 300, profit: 26, cat: 'Audio'    },
  { name: 'Action Cam',     label: 'Action Camera',            price: 90,  units: 150, profit: 16, cat: 'Camera'   },
  { name: 'Mini Projector', label: 'Mini Projector',           price: 120, units: 100, profit: 14, cat: 'Display'  },
];

const MONTHS    = ['Jul','Aug','Sep','Oct','Nov','Dec'];
const REV_TREND = [18400, 22100, 19800, 26500, 31200, 38700];

const COLORS = [
  '#22D3EE','#10B981','#A78BFA','#F97316',
  '#F43F5E','#FBBF24','#34D399','#60A5FA','#FB7185','#FCD34D'
];

const CUSTOMERS = ['Alice M.','Bob K.','Priya L.','James R.','Sara T.','Omar N.','Chen W.','Leila F.','Marcus V.','Zara P.'];
const STATUSES  = ['Delivered','Processing','Delivered','Delivered','Cancelled','Processing','Delivered','Delivered','Delivered','Processing'];

/* Derived totals */
const totalSales  = PRODUCTS.reduce((s,p)=>s+p.price*p.units, 0);
const totalOrders = PRODUCTS.reduce((s,p)=>s+p.units, 0);
const avgProfit   = Math.round(PRODUCTS.reduce((s,p)=>s+p.profit,0)/PRODUCTS.length);
const maxRevenue  = Math.max(...PRODUCTS.map(p=>p.price*p.units));

/* ============================================================
   UTILITY: KPI counter animation
============================================================ */
function countUp(el, target, prefix='', suffix='', dur=1600) {
  if (!el) return;
  const t0 = performance.now();
  const tick = now => {
    const p = Math.min((now-t0)/dur, 1);
    const e = p===1 ? 1 : 1-Math.pow(2,-10*p);
    el.textContent = prefix + Math.round(e*target).toLocaleString() + suffix;
    if (p<1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

/* ============================================================
   UTILITY: KPI bar fill
============================================================ */
function fillBars() {
  document.querySelectorAll('.kpi-fill[data-w]').forEach(bar => {
    setTimeout(() => { bar.style.width = bar.dataset.w + '%'; }, 500);
  });
}

/* ============================================================
   CANVAS HELPERS
============================================================ */
function prepCanvas(id, h=260) {
  const c = document.getElementById(id);
  if (!c) return null;
  const dpr = window.devicePixelRatio || 1;
  c.style.width  = '100%';
  c.style.height = h + 'px';
  const w = c.parentElement.clientWidth - 48 || 400;
  c.width  = w * dpr;
  c.height = h * dpr;
  const ctx = c.getContext('2d');
  ctx.scale(dpr, dpr);
  return { ctx, W: w, H: h };
}

/* ============================================================
   BAR CHART
============================================================ */
function drawBar(id, products, h=260) {
  const r = prepCanvas(id, h);
  if (!r) return;
  const {ctx, W, H} = r;
  const pL=52, pR=16, pT=16, pB=52;
  const cW=W-pL-pR, cH=H-pT-pB;
  const revenues = products.map(p=>p.price*p.units);
  const maxV = Math.max(...revenues);
  const gap  = cW / revenues.length;
  const bW   = gap * 0.58;

  // Grid lines
  ctx.strokeStyle='rgba(255,255,255,0.05)'; ctx.lineWidth=1;
  ctx.font='10px Outfit,sans-serif'; ctx.fillStyle='rgba(255,255,255,0.3)'; ctx.textAlign='right';
  for(let i=0;i<=5;i++){
    const y=pT+cH-(i/5)*cH;
    ctx.beginPath(); ctx.moveTo(pL,y); ctx.lineTo(pL+cW,y); ctx.stroke();
    ctx.fillText('$'+Math.round((i/5)*maxV/1000)+'k', pL-6, y+4);
  }

  let prog=0;
  const anim=()=>{
    ctx.clearRect(pL,pT,cW,cH+2);
    revenues.forEach((v,i)=>{
      const bH = (v/maxV)*cH*prog;
      const x  = pL + i*gap + (gap-bW)/2;
      const y  = pT+cH-bH;
      const g  = ctx.createLinearGradient(0,y,0,pT+cH);
      g.addColorStop(0, COLORS[i]);
      g.addColorStop(1, COLORS[i]+'33');
      ctx.fillStyle=g;
      const rad=Math.min(4,bH/2);
      ctx.beginPath();
      ctx.moveTo(x+rad,y);
      ctx.lineTo(x+bW-rad,y);
      ctx.quadraticCurveTo(x+bW,y,x+bW,y+rad);
      ctx.lineTo(x+bW,pT+cH);
      ctx.lineTo(x,pT+cH);
      ctx.lineTo(x,y+rad);
      ctx.quadraticCurveTo(x,y,x+rad,y);
      ctx.closePath(); ctx.fill();
    });
    if(prog>0.95){
      ctx.fillStyle='rgba(255,255,255,0.32)'; ctx.font='9px Outfit,sans-serif'; ctx.textAlign='center';
      revenues.forEach((_,i)=>{ ctx.fillText(products[i].name.slice(0,7), pL+i*gap+gap/2, pT+cH+16); });
    }
    if(prog<1){ prog=Math.min(1,prog+0.026); requestAnimationFrame(anim); }
  };
  anim();
}

/* ============================================================
   LINE CHART
============================================================ */
function drawLine(id, h=260) {
  const r = prepCanvas(id, h);
  if (!r) return;
  const {ctx, W, H} = r;
  const pL=52,pR=20,pT=16,pB=36;
  const cW=W-pL-pR, cH=H-pT-pB;
  const maxV=Math.max(...REV_TREND)*1.12;
  const pts=REV_TREND.map((v,i)=>({
    x: pL+(i/(REV_TREND.length-1))*cW,
    y: pT+cH-(v/maxV)*cH
  }));

  ctx.strokeStyle='rgba(255,255,255,0.05)'; ctx.lineWidth=1;
  ctx.font='10px Outfit,sans-serif'; ctx.fillStyle='rgba(255,255,255,0.3)'; ctx.textAlign='right';
  for(let i=0;i<=4;i++){
    const y=pT+(i/4)*cH;
    ctx.beginPath(); ctx.moveTo(pL,y); ctx.lineTo(pL+cW,y); ctx.stroke();
    ctx.fillText('$'+Math.round(((4-i)/4)*maxV/1000)+'k',pL-6,y+4);
  }
  ctx.fillStyle='rgba(255,255,255,0.32)'; ctx.textAlign='center';
  MONTHS.forEach((m,i)=>{ ctx.fillText(m, pL+(i/(MONTHS.length-1))*cW, pT+cH+20); });

  let prog=0;
  const amber='#F5A623';
  const anim=()=>{
    ctx.clearRect(pL-4,pT-4,cW+24,cH+24);
    const lx=pL+prog*cW;
    ctx.save();
    ctx.beginPath(); ctx.rect(pL,pT-4,lx-pL,cH+8); ctx.clip();
    const grad=ctx.createLinearGradient(0,pT,0,pT+cH);
    grad.addColorStop(0,'rgba(245,166,35,0.25)'); grad.addColorStop(1,'rgba(245,166,35,0)');
    ctx.beginPath(); ctx.moveTo(pts[0].x,pT+cH); ctx.lineTo(pts[0].x,pts[0].y);
    for(let i=1;i<pts.length;i++){
      const cpx=(pts[i-1].x+pts[i].x)/2;
      ctx.bezierCurveTo(cpx,pts[i-1].y,cpx,pts[i].y,pts[i].x,pts[i].y);
    }
    ctx.lineTo(pts[pts.length-1].x,pT+cH); ctx.closePath();
    ctx.fillStyle=grad; ctx.fill();
    ctx.beginPath(); ctx.moveTo(pts[0].x,pts[0].y);
    for(let i=1;i<pts.length;i++){
      const cpx=(pts[i-1].x+pts[i].x)/2;
      ctx.bezierCurveTo(cpx,pts[i-1].y,cpx,pts[i].y,pts[i].x,pts[i].y);
    }
    ctx.strokeStyle=amber; ctx.lineWidth=2.5; ctx.lineJoin='round'; ctx.stroke();
    ctx.restore();
    pts.forEach(pt=>{
      if(pt.x>lx+2) return;
      ctx.beginPath(); ctx.arc(pt.x,pt.y,4,0,Math.PI*2); ctx.fillStyle=amber; ctx.fill();
      ctx.beginPath(); ctx.arc(pt.x,pt.y,2,0,Math.PI*2); ctx.fillStyle='#09090F'; ctx.fill();
    });
    if(prog<1){ prog=Math.min(1,prog+0.022); requestAnimationFrame(anim); }
  };
  anim();
}

/* ============================================================
   PIE / DONUT CHART
============================================================ */
function drawPie(canvasId, legendId) {
  const canvas=document.getElementById(canvasId);
  const legend=document.getElementById(legendId);
  if(!canvas||!legend) return;

  const SIZE=220;
  canvas.width=SIZE; canvas.height=SIZE;
  canvas.style.width=SIZE+'px'; canvas.style.height=SIZE+'px';
  const ctx=canvas.getContext('2d');
  const cx=SIZE/2, cy=SIZE/2, R=90, HOLE=52;

  const total=PRODUCTS.reduce((s,p)=>s+p.profit*p.units*p.price/100,0);
  const slices=PRODUCTS.map((p,i)=>({
    value:p.profit*p.units*p.price/100,
    label:p.name,
    color:COLORS[i],
    pct:0
  }));
  slices.forEach(s=>s.pct=s.value/total);

  legend.innerHTML='';
  slices.forEach(s=>{
    const li=document.createElement('li');
    const dot=document.createElement('span');
    dot.className='dot'; dot.style.background=s.color;
    li.appendChild(dot);
    li.appendChild(document.createTextNode(`${s.label} · ${Math.round(s.pct*100)}%`));
    legend.appendChild(li);
  });

  let prog=0;
  const anim=()=>{
    ctx.clearRect(0,0,SIZE,SIZE);
    let ang=-Math.PI/2;
    slices.forEach(s=>{
      const sw=s.pct*Math.PI*2*prog;
      ctx.beginPath(); ctx.moveTo(cx,cy); ctx.arc(cx,cy,R,ang,ang+sw); ctx.closePath();
      ctx.fillStyle=s.color; ctx.fill(); ang+=sw;
    });
    ctx.beginPath(); ctx.arc(cx,cy,HOLE,0,Math.PI*2); ctx.fillStyle='#14151F'; ctx.fill();
    if(prog>0.9){
      ctx.fillStyle='rgba(255,255,255,0.8)'; ctx.font='bold 13px Rajdhani,sans-serif'; ctx.textAlign='center';
      ctx.fillText('Profit',cx,cy-5);
      ctx.font='11px Outfit,sans-serif'; ctx.fillStyle='rgba(255,255,255,0.4)';
      ctx.fillText('Distribution',cx,cy+10);
    }
    if(prog<1){ prog=Math.min(1,prog+0.022); requestAnimationFrame(anim); }
  };
  anim();
}

/* ============================================================
   GENERATE ORDERS TABLE ROWS
============================================================ */
function buildOrders(count=20) {
  const rows=[];
  const dateBase=new Date(2024,11,1);
  for(let i=0;i<count;i++){
    const p=PRODUCTS[i%PRODUCTS.length];
    const d=new Date(dateBase.getTime()-(i*8.64e7));
    rows.push({
      id: 'ORD-'+String(4200+i).padStart(5,'0'),
      product: p.label,
      customer: CUSTOMERS[i%CUSTOMERS.length],
      qty: Math.ceil(Math.random()*3+1),
      amount: '$'+(p.price*(Math.ceil(Math.random()*3+1))).toFixed(2),
      status: STATUSES[i%STATUSES.length],
      date: d.toLocaleDateString('en-US',{month:'short',day:'2-digit',year:'numeric'})
    });
  }
  return rows;
}

function renderOrders(tbodyId, rows) {
  const tbody=document.getElementById(tbodyId);
  if(!tbody) return;
  tbody.innerHTML=rows.map(o=>`
    <tr>
      <td style="font-family:var(--font-h);color:var(--amber)">${o.id}</td>
      <td>${o.product}</td>
      <td>${o.customer}</td>
      <td>${o.qty}</td>
      <td style="font-weight:600">${o.amount}</td>
      <td><span class="status-badge ${o.status.toLowerCase()}">${o.status}</span></td>
      <td style="color:var(--muted)">${o.date}</td>
    </tr>`).join('');
}

/* ============================================================
   GENERATE ANALYTICS TABLE ROWS
============================================================ */
function renderAnalyticsTable(tbodyId) {
  const tbody=document.getElementById(tbodyId);
  if(!tbody) return;
  tbody.innerHTML=PRODUCTS.map((p,i)=>{
    const rev=p.price*p.units;
    const pct=Math.round((rev/maxRevenue)*100);
    return `<tr>
      <td style="color:var(--muted)">${i+1}</td>
      <td style="font-weight:600">${p.label}</td>
      <td>$${p.price}</td>
      <td>${p.units.toLocaleString()}</td>
      <td style="color:var(--amber);font-family:var(--font-h);font-weight:700">$${rev.toLocaleString()}</td>
      <td><span style="color:var(--green)">${p.profit}%</span></td>
      <td>
        <div class="tbl-bar-wrap">
          <div class="tbl-bar" style="width:${pct}%;background:${COLORS[i]}"></div>
        </div>
      </td>
    </tr>`;
  }).join('');
}

/* ============================================================
   PAGE ROUTER
   Shows the page matching data-page, hides others,
   updates sidebar active state, and re-triggers animations.
============================================================ */
function navigateTo(pageName) {
  // Update pages
  document.querySelectorAll('.page').forEach(p=>{
    p.classList.remove('active');
    p.style.display='none';
  });
  const target=document.getElementById('page-'+pageName);
  if(target){ target.classList.add('active'); target.style.display='flex'; }

  // Update sidebar items
  document.querySelectorAll('.nav-item').forEach(item=>{
    item.classList.toggle('active', item.dataset.page===pageName);
  });

  // Update content topbar title/crumb
  const titles={overview:'Overview',products:'Products',analytics:'Analytics',orders:'Orders',settings:'Settings'};
  const el=document.getElementById('page-title');
  const crumb=document.getElementById('page-crumb');
  if(el) el.textContent=titles[pageName]||pageName;
  if(crumb) crumb.textContent='Dashboard / '+(titles[pageName]||pageName);

  // Scroll main back to top
  document.getElementById('main').scrollTo?.(0,0);
  window.scrollTo(0,0);

  // Re-observe animations on the newly visible page
  reObserve();

  // Draw charts if needed
  if(pageName==='analytics'){
    setTimeout(()=>{
      drawBar('barChart', PRODUCTS);
      drawLine('lineChart');
      drawPie('pieChart','pieLegend');
      renderAnalyticsTable('analyticsBody');
      // Analytics KPI counters
      countUp(document.getElementById('anSales'), totalSales,'$');
      countUp(document.getElementById('anOrders'), totalOrders);
    }, 200);
  }
  if(pageName==='overview'){
    setTimeout(()=>{
      drawBar('ovBar', PRODUCTS.slice(0,6), 200);
      drawLine('ovLine', 200);
      renderOrders('ovOrdersBody', buildOrders(7));
      countUp(document.getElementById('kpiSales'), totalSales,'$');
      countUp(document.getElementById('kpiProfit'), avgProfit,'','%');
      countUp(document.getElementById('kpiOrders'), totalOrders);
      fillBars();
    }, 200);
  }
  if(pageName==='orders'){
    setTimeout(()=>{ renderOrders('ordersBody', buildOrders(30)); }, 100);
  }

  // Close mobile sidebar if open
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('mob-overlay').classList.remove('show');
}

/* ============================================================
   INTERSECTION OBSERVER for animations
============================================================ */
let observer;
function reObserve() {
  if(observer) observer.disconnect();
  observer = new IntersectionObserver(entries=>{
    entries.forEach(e=>{
      if(e.isIntersecting){
        e.target.classList.add('animate');
        observer.unobserve(e.target);
      }
    });
  },{threshold:0.1,rootMargin:'0px 0px -20px 0px'});
  document.querySelectorAll('.page.active .slide-left, .page.active .slide-right, .page.active .pop-in')
    .forEach(el=>{ el.classList.remove('animate'); observer.observe(el); });
}

/* ============================================================
   PRODUCT FILTER
============================================================ */
function initProductFilter() {
  document.querySelectorAll('[data-filter]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      document.querySelectorAll('[data-filter]').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      const f=btn.dataset.filter;
      document.querySelectorAll('.prod-card[data-cat]').forEach(card=>{
        if(f==='all'||card.dataset.cat===f){
          card.classList.remove('hidden');
        } else {
          card.classList.add('hidden');
        }
      });
    });
  });
}

/* ============================================================
   DATE in content topbar
============================================================ */
function setDate() {
  const el=document.getElementById('ctb-date');
  if(el) el.textContent=new Date().toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric',year:'numeric'});
}

/* ============================================================
   MOBILE SIDEBAR TOGGLE
============================================================ */
function initMobile() {
  const btn=document.getElementById('mob-btn');
  const sidebar=document.getElementById('sidebar');
  const overlay=document.getElementById('mob-overlay');
  if(!btn) return;
  btn.addEventListener('click',()=>{
    sidebar.classList.toggle('open');
    overlay.classList.toggle('show');
  });
  overlay.addEventListener('click',()=>{
    sidebar.classList.remove('open');
    overlay.classList.remove('show');
  });
}

/* ============================================================
   INITIALISE
============================================================ */
document.addEventListener('DOMContentLoaded',()=>{

  setDate();
  initMobile();
  initProductFilter();

  // Wire sidebar nav clicks
  document.querySelectorAll('.nav-item[data-page]').forEach(item=>{
    item.addEventListener('click', e=>{
      e.preventDefault();
      navigateTo(item.dataset.page);
    });
  });

  // Wire hero CTA buttons (Overview page buttons that switch pages)
  document.querySelectorAll('.nav-trigger[data-page]').forEach(btn=>{
    btn.addEventListener('click',()=>navigateTo(btn.dataset.page));
  });

  // Block all purchase buttons
  document.querySelectorAll('.btn-buy').forEach(btn=>btn.addEventListener('click',e=>e.preventDefault()));

  // Block all filter buttons from page jumping (just UI state)
  document.querySelectorAll('.filter-btn:not([data-filter]):not([data-ostatus])').forEach(btn=>{
    btn.addEventListener('click',()=>{
      btn.closest('.filter-bar').querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Show the overview page on first load
  navigateTo('overview');
});
