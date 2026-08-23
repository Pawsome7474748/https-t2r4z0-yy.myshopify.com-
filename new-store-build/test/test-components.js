const {chromium}=require('playwright'), fs=require('fs'), path=require('path');
const SID='t';
const CSS=fs.readFileSync('assets/pp-ligne.css','utf8');
const JS_SRC=fs.readFileSync('assets/pp-ligne.js','utf8');
// render the Liquid by hand (no product/section context needed for structure)
const ugc=fs.readFileSync('liquid/ugc.liquid','utf8').replace(/\{\{ section\.id \}\}/g,SID);
const love=fs.readFileSync('liquid/loveit.liquid','utf8');
const rb=fs.readFileSync('liquid/realbenefits.liquid','utf8')
  .replace(/\{\{ product\.images\[\d\] \| image_url: width: 300 \}\}/g,
           'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==');

const html=`<!doctype html><html><head><style>${CSS}</style></head><body>
<div id="pp-ligne" data-section="${SID}" hidden></div>
<form id="product-form-${SID}"><input type="hidden" name="id" value="1"></form>
${ugc}
<div class="pp-stock" id="pp-stock-${SID}" hidden><div class="pp-stock__bar"><span class="pp-stock__fill"></span></div><span class="pp-stock__label"></span></div>
<p class="product__inventory" id="Inventory-${SID}"><svg><circle fill="rgb(238,148,65, 0.3)"/><circle fill="rgb(238,148,65)"/></svg>Low stock: 3 left</p>
${love}
${rb}
<script>
/* media cannot load over file://; stub playback so the wiring itself is testable */
HTMLMediaElement.prototype.play=function(){this.dispatchEvent(new Event('play'));return Promise.resolve();};
HTMLMediaElement.prototype.pause=function(){this.dispatchEvent(new Event('pause'));};
</script>
<script>${JS_SRC}</script></body></html>`;

(async()=>{
  const f=path.resolve('components-fixture.html'); fs.writeFileSync(f,html);
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
  const p=await b.newPage({viewport:{width:520,height:900}}); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto('file://'+f); await p.waitForTimeout(300);
  let pass=0,fail=0;
  const t=(n,c,x='')=>{c?pass++:fail++;console.log(`  ${c?'PASS':'FAIL'}  ${n}${c?'':'  <- '+x}`);};

  console.log('\n--- TikTok carousel ---');
  t('4 video cards rendered', await p.$$eval('.pp-ugc__card',e=>e.length)===4);
  t('all 4 have a real Shopify CDN source',
    await p.$$eval('.pp-ugc__video',e=>e.every(v=>/cdn\.shopify\.com\/videos/.test(v.src))));
  t('all 4 have a poster image',
    await p.$$eval('.pp-ugc__video',e=>e.every(v=>!!v.poster)));
  const ov=await p.$eval('.pp-ugc__track',e=>getComputedStyle(e).overflowX);
  t('track scrolls horizontally', ov==='auto'||ov==='scroll', ov);
  const before=await p.$eval('.pp-ugc__track',e=>e.scrollLeft);
  await p.click('.pp-ugc__arrow[data-dir="1"]'); await p.waitForTimeout(600);
  const after=await p.$eval('.pp-ugc__track',e=>e.scrollLeft);
  t('right arrow scrolls the track', after>before, `${before} -> ${after}`);
  await p.click('.pp-ugc__card'); await p.waitForTimeout(250);
  t('clicking a card marks it playing + shows controls',
    await p.$eval('.pp-ugc__card',e=>e.classList.contains('is-playing')&&e.querySelector('video').controls));

  console.log('\n--- why you\'ll love it ---');
  t('6 benefit items', await p.$$eval('.pp-love__item',e=>e.length)===6);
  t('each has an inline icon', await p.$$eval('.pp-love__item svg',e=>e.length)===6);
  t('grid collapses to 2 columns on a narrow column',
    (await p.$eval('.pp-love__grid',e=>getComputedStyle(e).gridTemplateColumns)).split(' ').length===2);

  console.log('\n--- made for real eyes ---');
  t('4 flip cards', await p.$$eval('.pp-rb__card',e=>e.length)===4);
  const backHidden=await p.$eval('.pp-rb__face--back',e=>{
    const r=e.getBoundingClientRect(); return getComputedStyle(e).backfaceVisibility;});
  t('backs are hidden until flipped', backHidden==='hidden', backHidden);
  await p.click('.pp-rb__card .pp-rb__btn');
  await p.waitForTimeout(700);
  t('plus button flips the card', await p.$eval('.pp-rb__card',e=>e.classList.contains('is-flipped')));
  t('flipped inner is rotated',
    (await p.$eval('.pp-rb__card .pp-rb__inner',e=>getComputedStyle(e).transform)).includes('matrix3d'));
  await p.click('.pp-rb__card .pp-rb__btn--close'); await p.waitForTimeout(700);
  t('close flips it back', await p.$eval('.pp-rb__card',e=>!e.classList.contains('is-flipped')));

  console.log('\n--- low stock pill ---');
  const inv=await p.$eval(`#Inventory-${SID}`,e=>{const c=getComputedStyle(e);
    return {bg:c.backgroundColor,color:c.color};});
  t('no black plate behind it', inv.bg==='rgba(0, 0, 0, 0)', inv.bg);
  t('text is red', inv.color==='rgb(220, 38, 38)', inv.color);
  const anim=await p.$eval(`#Inventory-${SID} circle[fill="rgb(238,148,65)"]`,
    e=>getComputedStyle(e).animationDuration);
  t('blink slowed to 2.4s', anim==='2.4s', anim);
  t('reworded to "Almost out of stock"',
    /Almost out of stock/.test(await p.$eval(`#Inventory-${SID}`,e=>e.textContent)));
  t('no page errors', errs.length===0, errs.join(' | '));

  console.log(`\n${pass} passed, ${fail} failed`);
  await b.close(); process.exit(fail?1:0);
})();
