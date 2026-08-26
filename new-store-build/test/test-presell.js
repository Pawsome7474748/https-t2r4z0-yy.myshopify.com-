const {chromium}=require('playwright'), fs=require('fs'), path=require('path');
const REPO=process.env.REPO||'/home/user/https-t2r4z0-yy.myshopify.com-';
const CSS=fs.readFileSync(path.join(REPO,'new-store-build/assets/pp-presell.css'),'utf8');
const PX=`data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="3" height="2"><rect width="3" height="2" fill="#c9a"/></svg>')}`;
const PRODUCT='/products/waterproof-matte-eyeliner-brow-pencil';
const PAGES=[
 ['presell-01','draft-01','Katie','It took me eleven eyeliners and about four years to stop believing the front of the tube'],
 ['presell-02','draft-02','Susie','You know that moment when someone sends you a photo from the night before?'],
 ['presell-03','draft-03','Angel','I stopped wearing eyeliner on important days because I already knew how the story would end'],
];
(async()=>{
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
  let pass=0,fail=0;
  const t=(n,c,x='')=>{c?pass++:fail++;console.log(`  ${c?'PASS':'FAIL'}  ${n}${c?'':'  <- '+x}`);};

  for (const [suffix,draft,name,headline] of PAGES) {
    console.log(`\n--- ${suffix} (${name}) ---`);
    const tpl=JSON.parse(fs.readFileSync(path.join(REPO,'new-store-build/templates',`page.${suffix}.json`),'utf8'));
    const s=tpl.sections.presell.settings;
    const src=fs.readFileSync(path.join(REPO,'new-store-build/copy/drafts',draft+'.txt'),'utf8')
      .split('\n').map(x=>x.trim()).filter(Boolean).filter(x=>x!=='[Shop Ligne →]');
    const html=`<!doctype html><html><head><style>html{font-size:62.5%}body{margin:0}${CSS}</style></head><body>
<article class="pp-ps">
  <p class="pp-ps__label">${s.label}</p>
  <header class="pp-ps__head">
    <h1 class="pp-ps__title">${s.headline}</h1>
    <p class="pp-ps__standfirst">${s.standfirst}</p>
    <p class="pp-ps__byline"><span>${s.byline}</span><span class="pp-ps__dot">·</span><span>${s.dateline}</span></p>
  </header>
  <img class="pp-ps__hero" src="${PX}" alt="" width="1400" height="933">
  <div class="pp-ps__body">${s.body}</div>
  <aside class="pp-ps__cta" id="${s.cta_anchor}">
    <img class="pp-ps__cta-img" src="${PX}" alt="" width="300" height="300">
    <div class="pp-ps__cta-text">
      <p class="pp-ps__cta-eyebrow">${s.cta_eyebrow}</p>
      <h2 class="pp-ps__cta-title">${s.cta_heading}</h2>
      <div class="pp-ps__cta-body">${s.cta_body}</div>
      <p class="pp-ps__cta-price"><strong>£21.95</strong></p>
      <a class="pp-ps__btn" href="${PRODUCT}">${s.cta_button}</a>
      <p class="pp-ps__cta-note">${s.cta_note}</p>
    </div>
  </aside>
</article></body></html>`;
    const f=path.resolve(`presell-${suffix}-fixture.html`); fs.writeFileSync(f,html);
    const p=await b.newPage({viewport:{width:1280,height:900}});
    const errs=[]; p.on('pageerror',e=>errs.push(e.message));
    await p.goto('file://'+f); await p.waitForTimeout(150);

    t('byline names the author', s.byline===`By ${name}`, s.byline);
    t('carries the Advertorial label', await p.$eval('.pp-ps__label',e=>e.textContent.trim())==='Advertorial');
    t('exactly one h1', await p.$$eval('h1',e=>e.length)===1);
    t('headline matches the draft', s.headline===headline);

    /* every source line must appear, none invented */
    const rendered=await p.$$eval('.pp-ps__body p',e=>e.map(x=>x.textContent.trim()));
    t(`all ${src.length} source lines rendered`, rendered.length===src.length, `${rendered.length} vs ${src.length}`);
    const norm=x=>x.replace(/\s+/g,' ').replace(/&/g,'&').trim();
    const missing=src.filter((l,i)=>norm(rendered[i]||'')!==norm(l));
    t('every line matches its source, in order', missing.length===0,
       missing.slice(0,2).map(m=>m.slice(0,60)).join(' || '));
    t('no empty paragraphs', rendered.every(x=>x.length>0));

    const heads=await p.$$eval('.pp-ps__body h2',e=>e.length);
    t('subheads break up the run', heads>=8, String(heads));
    t('pull quotes render', await p.$$eval('.pp-ps__quote',e=>e.length)===3);

    /* the brief: the link at the end, to the product page */
    t('CTA is the last element', await p.$eval('.pp-ps',e=>e.lastElementChild.classList.contains('pp-ps__cta')));
    t('CTA links to the product page',
       await p.$eval('.pp-ps__btn',(a,url)=>a.getAttribute('href')===url,PRODUCT));
    t('CTA sits below every paragraph', await p.evaluate(()=>{
        const last=[...document.querySelectorAll('.pp-ps__body p')].pop().getBoundingClientRect();
        return document.querySelector('.pp-ps__cta').getBoundingClientRect().top>=last.bottom-1;}));

    for (const w of [1280,700,375]) {
      await p.setViewportSize({width:w,height:900}); await p.waitForTimeout(90);
      t(`no sideways scroll at ${w}px`,
         await p.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1));
    }
    t('no page errors', errs.length===0, errs.join(' | '));
    await p.close();
  }
  console.log(`\n${pass} passed, ${fail} failed`);
  await b.close(); process.exit(fail?1:0);
})();
