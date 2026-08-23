const {JSDOM}=require('jsdom'), fs=require('fs');
const SID='template--test__main';
const SHADES=['Bronze','Graphite','Chocolate','Black','Plum','Brown','Stone'];
const PACKS=[['1 Pencil',1],['2 Pencils (Save 11%)',2],['3 Pencils (Save 24%)',3]];

const radios=(name,vals,checkedIdx)=>vals.map((v,i)=>
  `<input type="radio" name="${name}" value="${v}" form="product-form-${SID}" ${i===checkedIdx?'checked':''}>`).join('');

const html=`<!doctype html><html><body>
<variant-selects id="variant-selects-${SID}">
  <fieldset class="js product-form__input product-form__input--pill" id="fs-shade">
    <legend>Shade</legend>${radios('Shade-1',SHADES,3)}
  </fieldset>
  <fieldset class="js product-form__input product-form__input--pill" id="fs-pack">
    <legend>Pack</legend>${radios('Pack-2',PACKS.map(p=>p[0]),0)}
  </fieldset>
</variant-selects>
<div id="price-${SID}">$21.95</div>
<form id="product-form-${SID}"><input type="hidden" name="id" value="1001"></form>
<div class="pp-stock" id="pp-stock-${SID}" hidden>
  <div class="pp-stock__bar"><span class="pp-stock__fill"></span></div><span class="pp-stock__label"></span></div>
<p id="Inventory-${SID}"><svg><circle fill="rgb(238,148,65)"/></svg>Low stock: 3 left</p>
<div class="pp-bundles" id="pp-bundles-${SID}" data-pack-name="Pack-2">
  ${PACKS.map(([v,q])=>`<button type="button" class="pp-bundle" data-value="${v}" data-qty="${q}" aria-pressed="false">
     <span class="pp-bundle__note"></span></button>`).join('')}
  <div class="pp-mix" id="pp-mix-${SID}" data-shade-name="Shade-1">
    ${[1,2,3].map(i=>`<label class="pp-mix__row" data-slot="${i}" hidden><span class="pp-mix__label">Pencil ${i}</span>
      <select class="pp-mix__select" data-slot="${i}">${SHADES.map(s=>`<option value="${s}">${s}</option>`).join('')}</select></label>`).join('')}
    <input type="hidden" data-prop="2" name="properties[Pencil 2 shade]" form="product-form-${SID}" disabled>
    <input type="hidden" data-prop="3" name="properties[Pencil 3 shade]" form="product-form-${SID}" disabled>
  </div>
  <p class="pp-delivery"><strong data-pp-deliver-by>—</strong></p>
</div>
<script id="pp-stock-data-${SID}" type="application/json">{"1001":3}</script>
</body></html>`;

const dom=new JSDOM(html,{runScripts:'outside-only',pretendToBeVisual:true});
const {window}=dom; global.window=window; global.document=window.document;
window.eval(fs.readFileSync('ui.test.js','utf8'));
// jsdom leaves readyState 'loading'; fire the event the script is waiting on
window.document.dispatchEvent(new window.Event('DOMContentLoaded',{bubbles:true}));

const d=window.document, q=s=>d.querySelector(s), qa=s=>[...d.querySelectorAll(s)];
let pass=0,fail=0;
const t=(name,cond,extra='')=>{cond?pass++:fail++;console.log(`  ${cond?'PASS':'FAIL'}  ${name}${cond?'':'  <- '+extra}`);};
const visibleRows=()=>qa('.pp-mix__row').filter(r=>!r.hidden).length;
const props=()=>qa('input[data-prop]').map(i=>({slot:i.dataset.prop,disabled:i.disabled,value:i.value}));
const checked=n=>{const r=qa(`input[name="${n}"]`).find(i=>i.checked);return r&&r.value;};
const click=el=>el.dispatchEvent(new window.MouseEvent('click',{bubbles:true}));

console.log('\n--- initial state (1 Pencil selected) ---');
t('native Shade picker hidden', q('#fs-shade').classList.contains('pp-opt-hidden'));
t('native Pack picker hidden',  q('#fs-pack').classList.contains('pp-opt-hidden'));
t('1 shade row visible', visibleRows()===1, 'got '+visibleRows());
t('pencil1 select mirrors checked shade', q('.pp-mix__select[data-slot="1"]').value===checked('Shade-1'),
  q('.pp-mix__select[data-slot="1"]').value+' vs '+checked('Shade-1'));
t('props 2 & 3 disabled', props().every(p=>p.disabled), JSON.stringify(props()));
t('card 1 active', qa('.pp-bundle')[0].classList.contains('is-active'));
t('delivery date filled', q('[data-pp-deliver-by]').textContent!=='—', q('[data-pp-deliver-by]').textContent);
t('stock meter shows', !q('.pp-stock').hidden && /Only 3 left/.test(q('.pp-stock__label').textContent),
  q('.pp-stock__label').textContent);
t('low-stock reworded', /Almost out of stock/.test(q(`#Inventory-${SID}`).textContent),
  q(`#Inventory-${SID}`).textContent.trim());

console.log('\n--- click the 3-pack card ---');
click(qa('.pp-bundle')[2]);
t('pack radio switched to 3', checked('Pack-2')==='3 Pencils (Save 24%)', checked('Pack-2'));
t('3 shade rows visible', visibleRows()===3, 'got '+visibleRows());
t('props 2 & 3 enabled', props().every(p=>!p.disabled), JSON.stringify(props()));
t('card 3 active, card 1 not',
  qa('.pp-bundle')[2].classList.contains('is-active') && !qa('.pp-bundle')[0].classList.contains('is-active'));

console.log('\n--- mix different shades per pencil ---');
const set=(slot,val)=>{const s=q(`.pp-mix__select[data-slot="${slot}"]`);s.value=val;
  s.dispatchEvent(new window.Event('change',{bubbles:true}));};
set(1,'Plum'); set(2,'Bronze'); set(3,'Stone');
t('pencil1 drives the real Shade variant', checked('Shade-1')==='Plum', checked('Shade-1'));
t('pencil2 -> property Bronze', props()[0].value==='Bronze', JSON.stringify(props()[0]));
t('pencil3 -> property Stone',  props()[1].value==='Stone',  JSON.stringify(props()[1]));
t('all three shades differ',
  new Set([checked('Shade-1'),props()[0].value,props()[1].value]).size===3);

console.log('\n--- drop back to 2-pack ---');
click(qa('.pp-bundle')[1]);
t('2 shade rows visible', visibleRows()===2, 'got '+visibleRows());
t('prop 2 still submitted', props()[0].disabled===false, JSON.stringify(props()[0]));
t('prop 3 disabled + cleared', props()[1].disabled===true && props()[1].value==='', JSON.stringify(props()[1]));

console.log('\n--- back to single ---');
click(qa('.pp-bundle')[0]);
t('1 row visible', visibleRows()===1, 'got '+visibleRows());
t('no properties submitted', props().every(p=>p.disabled&&p.value===''), JSON.stringify(props()));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail?1:0);
