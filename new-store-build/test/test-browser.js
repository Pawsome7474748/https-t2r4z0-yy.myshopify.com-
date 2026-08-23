const {chromium}=require('playwright'), fs=require('fs'), path=require('path');
const SID='template--test__main';
const SHADES=['Bronze','Graphite','Chocolate','Black','Plum','Brown','Stone'];
const PACKS=[['1 Pencil',1],['2 Pencils (Save 11%)',2],['3 Pencils (Save 24%)',3]];

const src=fs.readFileSync('liquid/ui.liquid','utf8');
const CSS=src.match(/<style>([\s\S]*?)<\/style>/)[1].replace(/\{\{ section\.id \}\}/g,SID);
const JS_SRC=fs.readFileSync('ui.test.js','utf8');

const radios=(n,v,ci)=>v.map((x,i)=>
  `<input type="radio" name="${n}" value="${x}" form="product-form-${SID}" ${i===ci?'checked':''}>`).join('');

const page_html=`<!doctype html><html><head><style>${CSS}</style></head><body>
<variant-selects id="variant-selects-${SID}">
  <fieldset class="js product-form__input" id="fs-shade">${radios('Shade-1',SHADES,3)}</fieldset>
  <fieldset class="js product-form__input" id="fs-pack">${radios('Pack-2',PACKS.map(p=>p[0]),0)}</fieldset>
</variant-selects>
<div id="price-${SID}">$0</div>
<form id="product-form-${SID}"><input type="hidden" name="id" value="1001"></form>
<div class="pp-stock" id="pp-stock-${SID}" hidden><div class="pp-stock__bar"><span class="pp-stock__fill"></span></div><span class="pp-stock__label"></span></div>
<p id="Inventory-${SID}"></p>
<div class="pp-bundles" id="pp-bundles-${SID}" data-pack-name="Pack-2">
  ${PACKS.map(([v,q])=>`<button type="button" class="pp-bundle" data-value="${v}" data-qty="${q}"></button>`).join('')}
  <div class="pp-mix" id="pp-mix-${SID}" data-shade-name="Shade-1">
    ${[1,2,3].map(i=>`<label class="pp-mix__row" data-slot="${i}" hidden><select class="pp-mix__select" data-slot="${i}">${SHADES.map(s=>`<option value="${s}">${s}</option>`).join('')}</select></label>`).join('')}
    <input type="hidden" data-prop="2" name="properties[Pencil 2 shade]" form="product-form-${SID}" disabled>
    <input type="hidden" data-prop="3" name="properties[Pencil 3 shade]" form="product-form-${SID}" disabled>
  </div>
</div>
<script type="application/json" id="pp-stock-data-${SID}">{"1001":3}</script>
<script>${JS_SRC}</script>
</body></html>`;

(async()=>{
  const f=path.resolve('browser-fixture.html'); fs.writeFileSync(f,page_html);
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'}); const p=await b.newPage();
  await p.goto('file://'+f);
  let pass=0,fail=0;
  const t=(n,c,x='')=>{c?pass++:fail++;console.log(`  ${c?'PASS':'FAIL'}  ${n}${c?'':'  <- '+x}`);};
  // count rows the shopper can ACTUALLY see, per the browser's own layout
  const visible=()=>p.$$eval('.pp-mix__row',els=>els.filter(e=>e.offsetParent!==null).length);
  const enabledProps=()=>p.$$eval('input[data-prop]',els=>els.filter(e=>!e.disabled).length);

  for(const [label,idx,expect] of [['1 Pencil',0,1],['2 Pencils',1,2],['3 Pencils',2,3]]){
    await p.click(`.pp-bundle[data-value="${PACKS[idx][0]}"]`);
    await p.waitForTimeout(150);
    const v=await visible(), e=await enabledProps();
    t(`${label}: ${expect} shade dropdown(s) actually rendered`, v===expect, `browser shows ${v}`);
    t(`${label}: ${expect-1} shade propert${expect-1===1?'y':'ies'} submitted`, e===expect-1, `got ${e}`);
  }
  console.log(`\n${pass} passed, ${fail} failed`);
  await b.close(); process.exit(fail?1:0);
})();
