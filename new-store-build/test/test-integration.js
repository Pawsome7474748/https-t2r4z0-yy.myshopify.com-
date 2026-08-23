const {chromium}=require('playwright'), fs=require('fs'), path=require('path');
const REPO=process.env.REPO;
const SID='template--test__main';
const SHADES=['Bronze','Graphite','Chocolate','Black','Plum','Brown','Stone'];
const PACKS=[['1 Pencil',1],['2 Pencils (Save 11%)',2],['3 Pencils (Save 24%)',3]];

// 21 variants exactly like the real product: Shade x Pack
const VARIANTS=[]; let vid=1000;
SHADES.forEach(s=>PACKS.forEach(([p,q])=>VARIANTS.push({id:++vid,s,p,q,st:q===1?10:q===2?5:3})));

const src=fs.readFileSync('liquid/ui.liquid','utf8');
const CSS=fs.readFileSync('assets/pp-ligne.css','utf8');
const JS_SRC=fs.readFileSync('assets/pp-ligne.js','utf8');
const VMAP=Object.fromEntries(VARIANTS.map(v=>[v.id,{q:v.q,s:v.s,st:v.st}]));

// Dawn's own variant-selects implementation
const DAWN=[ 'constants.js','pubsub.js' ].map(f=>fs.readFileSync(path.join(REPO,'assets',f),'utf8')).join('\n')
  + '\n' + fs.readFileSync(path.join(REPO,'assets','global.js'),'utf8')
      .match(/class VariantSelects extends HTMLElement \{[\s\S]*?customElements\.define\("variant-selects", VariantSelects\);/)[0];

// faithful stand-in for product-info's updateVariantInputs: resolve variant, set id, fire change
const PRODUCT_INFO=`
document.addEventListener('change',function(e){
  if(!e.target.matches('input[type=radio]')) return;
  var sel=[...document.querySelectorAll('#variant-selects-${SID} input[type=radio]:checked')].map(i=>i.value);
  var v=${JSON.stringify(VARIANTS)}.find(v=>sel.includes(v.s)&&sel.includes(v.p));
  setTimeout(function(){                       // Shopify does this after a fetch
    var inp=document.querySelector('#product-form-${SID} input[name="id"]');
    inp.value=v?v.id:''; inp.dispatchEvent(new Event('change',{bubbles:true}));
  },40);
});`;

const radios=(n,vals,ci)=>vals.map((x,i)=>
  `<input type="radio" id="${n}-${i}" name="${n}" value="${x}" form="product-form-${SID}" ${i===ci?'checked':''}>
   <label for="${n}-${i}">${x}</label>`).join('');

const html=`<!doctype html><html><head><style>${CSS}</style></head><body>
<div id="pp-ligne" data-section="${SID}" hidden></div>
<variant-selects id="variant-selects-${SID}" data-section="${SID}">
  <fieldset class="js product-form__input">${radios('Shade-1',SHADES,3)}</fieldset>
  <fieldset class="js product-form__input">${radios('Pack-2',PACKS.map(p=>p[0]),0)}</fieldset>
</variant-selects>
<div id="price-${SID}">$21.95</div>
<form id="product-form-${SID}"><input type="hidden" name="id" value="1004"></form>
<div class="pp-stock" id="pp-stock-${SID}" hidden><div class="pp-stock__bar"><span class="pp-stock__fill"></span></div><span class="pp-stock__label"></span></div>
<p class="product__inventory" id="Inventory-${SID}"></p>
<div class="pp-bundles" id="pp-bundles-${SID}" data-pack-name="Pack-2">
  ${PACKS.map(([v,q])=>`<button type="button" class="pp-bundle" data-value="${v}" data-qty="${q}"></button>`).join('')}
  <div class="pp-mix" id="pp-mix-${SID}" data-shade-name="Shade-1">
    ${[1,2,3].map(i=>`<label class="pp-mix__row" data-slot="${i}" hidden><select class="pp-mix__select" data-slot="${i}">${SHADES.map(s=>`<option value="${s}">${s}</option>`).join('')}</select></label>`).join('')}
    <input type="hidden" data-prop="2" name="properties[Pencil 2 shade]" form="product-form-${SID}" disabled>
    <input type="hidden" data-prop="3" name="properties[Pencil 3 shade]" form="product-form-${SID}" disabled>
  </div>
</div>
<script type="application/json" id="pp-variants-${SID}">${JSON.stringify(VMAP)}</script>
<script>${DAWN}</script>
<script>${PRODUCT_INFO}</script>
<script>${JS_SRC}</script>
</body></html>`;

(async()=>{
  const f=path.resolve('integration-fixture.html'); fs.writeFileSync(f,html);
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
  const p=await b.newPage();
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto('file://'+f); await p.waitForTimeout(200);
  let pass=0,fail=0;
  const t=(n,c,x='')=>{c?pass++:fail++;console.log(`  ${c?'PASS':'FAIL'}  ${n}${c?'':'  <- '+x}`);};
  const rows=()=>p.$$eval('.pp-mix__row',e=>e.filter(x=>x.offsetParent!==null).length);
  const props=()=>p.$$eval('input[data-prop]',e=>e.filter(x=>!x.disabled).map(x=>x.value));
  const vid=()=>p.$eval(`#product-form-${SID} input[name=id]`,e=>e.value);

  for(const [label,idx,q] of [['2-pack',1,2],['3-pack',2,3],['1-pack',0,1]]){
    await p.click(`.pp-bundle[data-value="${PACKS[idx][0]}"]`);
    await p.waitForTimeout(50);
    t(`${label}: rows update immediately on click`, await rows()===q, `saw ${await rows()}`);
    await p.waitForTimeout(250);                      // after Shopify's variant swap
    t(`${label}: still ${q} row(s) after variant settles`, await rows()===q, `saw ${await rows()}`);
    t(`${label}: variant id switched to a ${q}-pack`,
      VMAP[await vid()] && VMAP[await vid()].q===q, `variant ${await vid()}`);
    t(`${label}: ${q-1} shade propert${q-1===1?'y':'ies'} submitted`, (await props()).length===q-1,
      JSON.stringify(await props()));
  }

  console.log('\n  --- mixing shades on the 3-pack ---');
  await p.click(`.pp-bundle[data-value="${PACKS[2][0]}"]`); await p.waitForTimeout(250);
  await p.selectOption('.pp-mix__select[data-slot="2"]','Bronze');
  await p.selectOption('.pp-mix__select[data-slot="3"]','Stone');
  await p.selectOption('.pp-mix__select[data-slot="1"]','Plum');
  await p.waitForTimeout(300);
  t('pencil 1 changed the real variant to Plum', (VMAP[await vid()]||{}).s==='Plum', `variant ${await vid()}`);
  t('still on a 3-pack after changing shade', (VMAP[await vid()]||{}).q===3, `variant ${await vid()}`);
  t('3 rows still shown', await rows()===3, `saw ${await rows()}`);
  t('properties carry Bronze + Stone', JSON.stringify(await props())==='["Bronze","Stone"]',
     JSON.stringify(await props()));
  t('no page errors', errs.length===0, errs.join(' | '));

  console.log(`\n${pass} passed, ${fail} failed`);
  await b.close(); process.exit(fail?1:0);
})();
