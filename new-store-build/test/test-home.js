const {chromium}=require('playwright'), fs=require('fs'), path=require('path');
const CSS=fs.readFileSync('assets/pp-ligne.css','utf8');
const JS_SRC=fs.readFileSync('assets/pp-ligne.js','utf8');
const SID='t';
const px=c=>`data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8" fill="${c}"/></svg>`)}`;
const SHOTS=['#a11','#1a1','#11a','#aa1'];
/* mirrors what the featured-product section emits, plus our blocks */
const html=`<!doctype html><html><head><style>html{font-size:62.5%}body{margin:0}${CSS}</style></head><body>
<div id="pp-ligne" data-section="${SID}" hidden></div>
<script type="application/json" id="pp-variants-${SID}">
{"11":{"q":1,"s":"Black","st":10},"21":{"q":2,"s":"Black","st":5},"31":{"q":3,"s":"Black","st":3},
 "12":{"q":1,"s":"Plum","st":40}}
</script>
<div class="product__media-wrapper"><div class="product__media">
  <img id="hero" src="${px(SHOTS[0])}" srcset="${px(SHOTS[0])} 100w" sizes="100vw" width="400" height="400">
</div></div>
<div class="product__info-container">
  <div class="pp-thumbs" id="pp-thumbs-${SID}" hidden>
    ${SHOTS.map((c,i)=>`<button type="button" class="pp-thumb" data-full="${px(c)}" aria-current="false">
      <img src="${px(c)}" alt="" width="68" height="68"></button>`).join('')}
  </div>
  <p class="pp-lede">Lede</p>
  <div class="pp-stock" id="pp-stock-${SID}" role="status" hidden>
    <div class="pp-stock__bar"><span class="pp-stock__fill" style="width:0%"></span></div>
    <span class="pp-stock__label"></span></div>
  <form id="product-form-${SID}"><input type="hidden" name="id" value="11"></form>
  <p class="pp-lowstock" id="pp-lowstock-${SID}" role="status" hidden>
    <span class="pp-lowstock__dot" aria-hidden="true"></span><span class="pp-lowstock__txt"></span></p>
  <div class="pp-acc">
    <details><summary>Shipping</summary><div class="pp-acc__body"><p>Body</p></div></details>
  </div>
</div>
<script>${JS_SRC}</script></body></html>`;
(async()=>{
  const f=path.resolve('home-fixture.html'); fs.writeFileSync(f,html);
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
  const p=await b.newPage({viewport:{width:1280,height:900}});
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto('file://'+f); await p.waitForTimeout(250);
  let pass=0,fail=0;
  const t=(n,c,x='')=>{c?pass++:fail++;console.log(`  ${c?'PASS':'FAIL'}  ${n}${c?'':'  <- '+x}`);};
  const vis=s=>p.$eval(s,e=>e.offsetParent!==null);

  t('thumb strip moved into the media column', await p.$eval('#pp-thumbs-'+SID,
      e=>!!e.closest('.product__media-wrapper')));
  t('thumb strip is visible', await vis('#pp-thumbs-'+SID));
  t('4 thumbnails', await p.$$eval('.pp-thumb',e=>e.length)===4);
  t('first thumb starts active', await p.$eval('.pp-thumb',e=>e.classList.contains('is-active')));

  const heroSrc=()=>p.$eval('#hero',e=>e.currentSrc||e.src);
  const before=await heroSrc();
  await p.click('.pp-thumb:nth-of-type(3)'); await p.waitForTimeout(120);
  const after=await heroSrc();
  t('clicking a thumb swaps the hero image', after!==before && after.includes('%2311a'), after.slice(-30));
  t('stale srcset is cleared', await p.$eval('#hero',e=>!e.hasAttribute('srcset')));
  t('active state follows the click', await p.$$eval('.pp-thumb',
      e=>e.filter(x=>x.classList.contains('is-active')).length===1 && e[2].classList.contains('is-active')));

  /* the home stock line must read like the product page's: green "N in stock"
     until stock is actually low, then red and flashing */
  t('stock line shows', await vis('#pp-lowstock-'+SID));
  t('at 10 left it reads "10 in stock"',
     (await p.$eval('.pp-lowstock__txt',e=>e.textContent))==='10 in stock',
     await p.$eval('.pp-lowstock__txt',e=>e.textContent));
  t('and is green, not flashing', await p.$eval('.pp-lowstock',e=>{
      const cs=getComputedStyle(e), dot=getComputedStyle(e.querySelector('.pp-lowstock__dot'));
      const [r,g,b]=cs.color.match(/\d+/g).map(Number);
      return g>r && g>b && dot.animationName==='none';}));
  t('stock meter shows Only 10 left', (await p.$eval('.pp-stock__label',e=>e.textContent))==='Only 10 left in stock');

  /* switch to a well-stocked variant */
  await p.evaluate(()=>{const i=document.querySelector('input[name="id"]');
    i.value='12'; i.dispatchEvent(new Event('change',{bubbles:true}));});
  await p.waitForTimeout(150);
  t('healthy variant still shows a green count', await vis('#pp-lowstock-'+SID) &&
     (await p.$eval('.pp-lowstock__txt',e=>e.textContent))==='40 in stock');
  t('meter hides once stock is healthy', !(await vis('#pp-stock-'+SID)));

  await p.evaluate(()=>{const i=document.querySelector('input[name="id"]');
    i.value='31'; i.dispatchEvent(new Event('change',{bubbles:true}));});
  await p.waitForTimeout(150);
  t('3-pack at 3 left turns it red and flashing', await p.$eval('.pp-lowstock',e=>{
      const cs=getComputedStyle(e), dot=getComputedStyle(e.querySelector('.pp-lowstock__dot'));
      const [r,g,b]=cs.color.match(/\d+/g).map(Number);
      return e.classList.contains('is-low') && r>g && r>b && dot.animationName==='ppFlash';}));
  t('and reads Almost out of stock',
     (await p.$eval('.pp-lowstock__txt',e=>e.textContent))==='Almost out of stock');
  t('meter follows the variant', (await p.$eval('.pp-stock__label',e=>e.textContent))==='Only 3 left in stock');

  /* the accordion is native <details>, but the +/- marker must be ours */
  t('accordion marker replaced', (await p.$eval('.pp-acc summary',
      e=>getComputedStyle(e,'::after').content)).includes('+'));
  await p.click('.pp-acc summary'); await p.waitForTimeout(100);
  t('accordion opens', await vis('.pp-acc__body'));

  t('no page errors', errs.length===0, errs.join(' | '));
  console.log(`\n${pass} passed, ${fail} failed`);
  await b.close(); process.exit(fail?1:0);
})();
