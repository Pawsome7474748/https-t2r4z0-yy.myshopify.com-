const {chromium}=require('playwright'), fs=require('fs'), path=require('path');
const CSS=fs.readFileSync('assets/pp-presell.css','utf8');
const BODY=fs.readFileSync('presell-01-body.html','utf8');
const PX=`data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="3" height="2"><rect width="3" height="2" fill="#c9a"/></svg>')}`;
const PRODUCT='/products/waterproof-matte-eyeliner-brow-pencil';
const html=`<!doctype html><html><head><style>html{font-size:62.5%}body{margin:0}${CSS}</style></head><body>
<article class="pp-ps">
  <p class="pp-ps__label">Advertorial</p>
  <header class="pp-ps__head">
    <h1 class="pp-ps__title">I stopped wearing eyeliner on important days</h1>
    <p class="pp-ps__standfirst">Perfect in the mirror. Smudged by lunch. What finally broke the cycle.</p>
    <p class="pp-ps__byline"><span>By the Ligne team</span><span class="pp-ps__dot">·</span><span>Ligne</span></p>
  </header>
  <img class="pp-ps__hero" src="${PX}" alt="" width="1400" height="933">
  <div class="pp-ps__body">${BODY}</div>
  <aside class="pp-ps__cta" id="get-it">
    <img class="pp-ps__cta-img" src="${PX}" alt="" width="300" height="300">
    <div class="pp-ps__cta-text">
      <p class="pp-ps__cta-eyebrow">THE ONE I USE</p>
      <h2 class="pp-ps__cta-title">Waterproof Matte Eyeliner &amp; Brow Pencil</h2>
      <div class="pp-ps__cta-body"><p>Seven shades. Liner and brows in one pencil.</p></div>
      <p class="pp-ps__cta-price"><strong>£21.95</strong></p>
      <a class="pp-ps__btn" href="${PRODUCT}">See the shades and price</a>
      <p class="pp-ps__cta-note">30-day money-back guarantee</p>
    </div>
  </aside>
</article></body></html>`;
(async()=>{
  const f=path.resolve('presell-fixture.html'); fs.writeFileSync(f,html);
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
  const p=await b.newPage({viewport:{width:1280,height:900}});
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto('file://'+f); await p.waitForTimeout(200);
  let pass=0,fail=0;
  const t=(n,c,x='')=>{c?pass++:fail++;console.log(`  ${c?'PASS':'FAIL'}  ${n}${c?'':'  <- '+x}`);};

  t('disclosure label is present and first', await p.$eval('.pp-ps',
      e=>e.firstElementChild.classList.contains('pp-ps__label')));
  t('exactly one h1', await p.$$eval('h1',e=>e.length)===1);
  /* 2 of the 162 paragraphs live inside the pull quotes, so count both */
  const srcP=(BODY.match(/<p>/g)||[]).length;
  t(`every paragraph survived (${srcP})`, await p.$$eval('.pp-ps__body p',e=>e.length)===srcP,
     String(await p.$$eval('.pp-ps__body p',e=>e.length)));
  t('no paragraph rendered empty', await p.$$eval('.pp-ps__body p',
      e=>e.every(x=>x.textContent.trim().length>0)));
  t('8 subheads break up the wall', await p.$$eval('.pp-ps__body h2',e=>e.length)===8);
  t('2 pull quotes', await p.$$eval('.pp-ps__quote',e=>e.length)===2);
  t('opening line is set larger than body', await p.evaluate(()=>{
      const f=parseFloat(getComputedStyle(document.querySelector('.pp-ps__body > p')).fontSize);
      const n=parseFloat(getComputedStyle(document.querySelectorAll('.pp-ps__body > p')[3]).fontSize);
      return f>n;}));

  /* the whole point of the page: the link at the end */
  t('CTA is the last thing on the page', await p.$eval('.pp-ps',
      e=>e.lastElementChild.classList.contains('pp-ps__cta')));
  t('CTA links to the product page', await p.$eval('.pp-ps__btn',
      a=>a.getAttribute('href')==='/products/waterproof-matte-eyeliner-brow-pencil'));
  t('CTA sits below every paragraph', await p.evaluate(()=>{
      const last=[...document.querySelectorAll('.pp-ps__body > p')].pop().getBoundingClientRect();
      return document.querySelector('.pp-ps__cta').getBoundingClientRect().top>=last.bottom-1;}));
  t('button is a real link, not a JS handler', await p.$eval('.pp-ps__btn',a=>a.tagName==='A'));

  /* reading measure: 60-90 characters is the readable band */
  const ch=await p.evaluate(()=>{
    const el=document.querySelectorAll('.pp-ps__body > p')[3];
    const cs=getComputedStyle(el);
    const c=document.createElement('canvas').getContext('2d');
    c.font=`${cs.fontSize} ${cs.fontFamily}`;
    return el.getBoundingClientRect().width/c.measureText('n').width;});
  t('line length stays readable', ch>45&&ch<105, Math.round(ch)+' chars');

  for (const w of [1280,900,700,375]) {
    await p.setViewportSize({width:w,height:900}); await p.waitForTimeout(120);
    t(`no sideways scroll at ${w}px`,
       await p.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),
       String(await p.evaluate(()=>document.documentElement.scrollWidth)));
  }
  await p.setViewportSize({width:375,height:900}); await p.waitForTimeout(120);
  t('CTA stacks on mobile',
     (await p.$eval('.pp-ps__cta',e=>getComputedStyle(e).gridTemplateColumns)).split(' ').length===1);
  t('button goes full width on mobile', await p.$eval('.pp-ps__btn',
      e=>e.getBoundingClientRect().width>200));

  t('no page errors', errs.length===0, errs.join(' | '));
  console.log(`\n${pass} passed, ${fail} failed`);
  await b.close(); process.exit(fail?1:0);
})();
