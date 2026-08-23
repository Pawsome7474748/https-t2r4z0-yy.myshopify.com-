const {JSDOM}=require('jsdom'), fs=require('fs');
const SID='template--test__main';
const SHADES=['Bronze','Graphite','Chocolate','Black','Plum','Brown','Stone'];
const PACKS=[['1 Pencil',1],['2 Pencils (Save 11%)',2],['3 Pencils (Save 24%)',3]];
const JS_SRC=fs.readFileSync('ui.test.js','utf8');

function build(packIdx){                       // which pack is checked on page load
  const radios=(n,v,ci)=>v.map((x,i)=>
    `<input type="radio" name="${n}" value="${x}" form="product-form-${SID}" ${i===ci?'checked':''}>`).join('');
  const html=`<!doctype html><html><body>
  <variant-selects id="variant-selects-${SID}">
    <fieldset class="js product-form__input" id="fs-shade">${radios('Shade-1',SHADES,3)}</fieldset>
    <fieldset class="js product-form__input" id="fs-pack">${radios('Pack-2',PACKS.map(p=>p[0]),packIdx)}</fieldset>
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
  <script id="pp-stock-data-${SID}" type="application/json">{"1001":3}</script>
  </body></html>`;
  const dom=new JSDOM(html,{runScripts:'outside-only',pretendToBeVisual:true});
  dom.window.eval(JS_SRC);
  dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded',{bubbles:true}));
  return dom.window.document;
}

let pass=0,fail=0;
const t=(n,c,x='')=>{c?pass++:fail++;console.log(`  ${c?'PASS':'FAIL'}  ${n}${c?'':'  <- '+x}`);};

console.log('\n--- page loads directly on each pack (e.g. an ad deep-link ?variant=) ---');
[[0,1],[1,2],[2,3]].forEach(([idx,expect])=>{
  const d=build(idx);
  const rows=[...d.querySelectorAll('.pp-mix__row')].filter(r=>!r.hidden).length;
  const props=[...d.querySelectorAll('input[data-prop]')];
  const enabled=props.filter(p=>!p.disabled).length;
  t(`pack ${expect}: exactly ${expect} shade dropdown(s)`, rows===expect, 'got '+rows);
  t(`pack ${expect}: ${expect-1} extra shade propert${expect-1===1?'y':'ies'} submitted`,
    enabled===expect-1, 'got '+enabled);
  t(`pack ${expect}: slots beyond ${expect} are disabled and empty`,
    props.filter(p=>+p.dataset.prop>expect).every(p=>p.disabled&&p.value===''), JSON.stringify(props.map(p=>({s:p.dataset.prop,d:p.disabled,v:p.value}))));
});
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail?1:0);
