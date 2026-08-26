const {chromium}=require('playwright'), fs=require('fs'), path=require('path');
const CSS=fs.readFileSync('assets/pp-ligne.css','utf8');
const JS_SRC=fs.readFileSync('assets/pp-ligne.js','utf8');
const sec=JSON.parse(fs.readFileSync('section-reviews.json','utf8'));
const SID='t';
/* 1x1 transparent gif stands in for the CDN photo: the network is sandboxed */
const PX='data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
const stars=v=>`<span class="pp-rev__stars" role="img" aria-label="${v} out of 5 stars">
  <span class="pp-rev__stars-fill" style="width:${v*20}%">★★★★★</span></span>`;
const chip=`<a class="pp-rev__chip" href="/products/waterproof-matte-eyeliner-brow-pencil">
    <img src="${PX}" alt="" width="48" height="48">
    <span class="pp-rev__chip-txt">
      <span class="pp-rev__chip-name">Waterproof Matte Eyeliner &amp; Brow Pencil</span>
      <span class="pp-rev__chip-price">£21.95</span>
    </span></a>`;
const cards=sec.block_order.map(id=>{const b=sec.blocks[id].settings;return `
  <article class="pp-rev__card">
    <img class="pp-rev__photo" src="${PX}" alt="${b.name}" width="896" height="1200">
    ${stars(b.stars)}
    <p class="pp-rev__who">
      <span class="pp-rev__name">${b.name}</span>
      ${b.verified?'<span class="pp-rev__badge">✓ Verified Buyer</span>':''}
    </p>
    <div class="pp-rev__body" data-pp-clamp>${b.body}</div>
    <button type="button" class="pp-rev__more" hidden>Read more</button>
    ${chip}
  </article>`}).join('');
const html=`<!doctype html><html><head><style>${CSS}</style></head><body>
<div id="pp-ligne" data-section="${SID}" hidden></div>
<form id="product-form-${SID}"><input type="hidden" name="id" value="1"></form>
<div class="pp-revwrap"><div class="page-width">
  <header class="pp-rev__head">
    <p class="pp-rev__eyebrow">Real customers</p>
    <h2 class="pp-rev__title">In Their Words</h2>
    <p class="pp-rev__agg">${stars(4.6)}<span class="pp-rev__aggtxt"><strong>4.6</strong> out of 5 · 4 verified reviews</span></p>
  </header>
  <div class="pp-rev__grid">${cards}</div>
</div></div>
<script>${JS_SRC}</script></body></html>`;
(async()=>{
  const f=path.resolve('reviews-fixture.html'); fs.writeFileSync(f,html);
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
  const p=await b.newPage({viewport:{width:1400,height:1000}});
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto('file://'+f); await p.waitForTimeout(300);
  let pass=0,fail=0;
  const t=(n,c,x='')=>{c?pass++:fail++;console.log(`  ${c?'PASS':'FAIL'}  ${n}${c?'':'  <- '+x}`);};

  t('4 review cards', await p.$$eval('.pp-rev__card',e=>e.length)===4);
  const cols=(await p.$eval('.pp-rev__grid',e=>getComputedStyle(e).gridTemplateColumns)).split(' ').length;
  t('4 columns at 1400px', cols===4, 'got '+cols);
  t('every card has a photo', await p.$$eval('.pp-rev__photo',e=>e.length)===4);
  t('photos are 3:4 portrait', await p.$eval('.pp-rev__photo',e=>{
      const r=e.getBoundingClientRect(); return Math.abs(r.height/r.width-4/3)<0.03;}));
  t('4 Verified Buyer badges', await p.$$eval('.pp-rev__badge',e=>e.length)===4);
  t('4 product chips linking to the product', await p.$$eval('.pp-rev__chip',
      e=>e.length===4 && e.every(a=>a.getAttribute('href').includes('/products/'))));

  /* the section reads as a dark band, so text has to be light on it */
  const bg=await p.$eval('.pp-revwrap',e=>getComputedStyle(e).backgroundColor);
  const fg=await p.$eval('.pp-rev__name',e=>getComputedStyle(e).color);
  const lum=c=>{const[r,g,bl]=c.match(/\d+/g).map(Number);return .2126*r+.7152*g+.0722*bl;};
  t('dark background', lum(bg)<60, bg);
  t('light name text on it', lum(fg)>200, fg);

  const widths=await p.$$eval('.pp-rev__card .pp-rev__stars',els=>els.map(e=>{
    const f=e.querySelector('.pp-rev__stars-fill');
    return Math.round(f.getBoundingClientRect().width/e.getBoundingClientRect().width*100);}));
  t('Jennifer renders 4/5 stars', widths[0]===80, widths[0]+'%');
  t('Holly renders a half star (4.5/5)', widths[1]===90, widths[1]+'%');
  t('Chloe renders 5/5', widths[2]===100, widths[2]+'%');
  t('Emma renders 5/5', widths[3]===100, widths[3]+'%');

  t('long bodies are clamped', await p.$$eval('.pp-rev__body',e=>e.filter(x=>x.classList.contains('is-clamped')).length)===4);
  t('Read more button shown for each', await p.$$eval('.pp-rev__more',e=>e.filter(x=>!x.hidden).length)===4);
  const h1=await p.$eval('.pp-rev__card .pp-rev__body',e=>e.clientHeight);
  await p.click('.pp-rev__card .pp-rev__more'); await p.waitForTimeout(150);
  const h2=await p.$eval('.pp-rev__card .pp-rev__body',e=>e.clientHeight);
  t('Read more expands the body', h2>h1, `${h1} -> ${h2}`);
  t('button becomes Show less', (await p.$eval('.pp-rev__card .pp-rev__more',e=>e.textContent))==='Show less');
  await p.click('.pp-rev__card .pp-rev__more'); await p.waitForTimeout(150);
  t('collapses again', await p.$eval('.pp-rev__card .pp-rev__body',e=>e.clientHeight)===h1);

  t('paragraph breaks preserved', await p.$$eval('.pp-rev__card:first-child .pp-rev__body p',e=>e.length)===15);
  /* the chip must sit below the review, not float into it */
  t('chip sits under the body', await p.$eval('.pp-rev__card',e=>{
      const body=e.querySelector('.pp-rev__body').getBoundingClientRect();
      const c=e.querySelector('.pp-rev__chip').getBoundingClientRect();
      return c.top>=body.bottom-1;}));

  await p.setViewportSize({width:1000,height:1000}); await p.waitForTimeout(120);
  t('2 columns at 1000px', (await p.$eval('.pp-rev__grid',e=>getComputedStyle(e).gridTemplateColumns)).split(' ').length===2);
  await p.setViewportSize({width:520,height:1000}); await p.waitForTimeout(120);
  t('1 column at 520px', (await p.$eval('.pp-rev__grid',e=>getComputedStyle(e).gridTemplateColumns)).split(' ').length===1);

  t('no page errors', errs.length===0, errs.join(' | '));
  console.log(`\n${pass} passed, ${fail} failed`);
  await b.close(); process.exit(fail?1:0);
})();
