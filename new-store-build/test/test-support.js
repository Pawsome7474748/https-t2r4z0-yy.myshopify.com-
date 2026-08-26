const {chromium}=require('playwright'), fs=require('fs'), path=require('path');
const CSS=fs.readFileSync('assets/pp-support.css','utf8');
const PX=`data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="6" height="4"><rect width="6" height="4" fill="#c9a"/></svg>')}`;
const pills=['Track Order','Contact Us','Product & Safety','Ingredients'];
const qa=(q,a)=>`<details class="pp-faqg__item"><summary>${q}</summary><div class="pp-faqg__a"><p>${a}</p></div></details>`;
const group=(id,cls,eyebrow,head,img,items)=>`
<div class="pp-band${cls}" id="${id}"><div class="page-width">
  <header class="pp-band__head"><p class="pp-band__eyebrow">${eyebrow}</p><h2 class="pp-band__title">${head}</h2></header>
  <div class="pp-faqg${img?' pp-faqg--split':''}">
    ${img?`<img class="pp-faqg__img" src="${PX}" alt="" width="450" height="300">`:''}
    <div class="pp-faqg__list">${items.map(i=>qa(i,'Answer text.')).join('')}</div>
  </div></div></div>`;
const html=`<!doctype html><html><head><style>html{font-size:62.5%}body{margin:0}
.page-width{max-width:120rem;margin:0 auto;padding:0 2rem}${CSS}</style></head><body>
<nav class="pp-sub"><ul class="pp-sub__list">${pills.map((p,i)=>
  `<li><a class="pp-sub__pill" href="#g${i}">${p}</a></li>`).join('')}</ul></nav>

<div class="pp-band" id="track-order"><div class="page-width">
  <header class="pp-band__head"><p class="pp-band__eyebrow">TRACK YOUR ORDER</p>
    <h2 class="pp-band__title">Waiting on your Ligne order?</h2>
    <p class="pp-band__sub">Here is exactly where your tracking lives.</p></header>
  <div class="pp-track"><h3 class="pp-track__title">Where is my tracking number?</h3>
    <div class="pp-track__body"><p>Tracking is emailed the moment your parcel leaves us.</p></div>
    <div class="pp-track__actions"><a class="pp-btn" href="/account">View my orders</a>
      <a class="pp-btn pp-btn--ghost" href="mailto:a@b.c">Email us instead</a></div>
  </div></div></div>

<div class="pp-band pp-band--tint" id="contact-us"><div class="page-width">
  <header class="pp-band__head"><p class="pp-band__eyebrow">WE ARE HERE TO HELP</p>
    <h2 class="pp-band__title">Reach out to our team</h2></header>
  <div class="pp-contact">
    <div class="pp-contact__form"><h3 class="pp-card__title">Send us a message</h3>
      <form class="pp-form">
        <div class="pp-form__row">
          <div class="pp-form__field"><label class="pp-form__label" for="a">First name</label><input id="a"></div>
          <div class="pp-form__field"><label class="pp-form__label" for="b">Last name</label><input id="b"></div>
        </div>
        <div class="pp-form__field"><label class="pp-form__label" for="c">Email address</label><input id="c" type="email" required></div>
        <div class="pp-form__field"><label class="pp-form__label" for="d">How can we help?</label><textarea id="d" rows="5" required></textarea></div>
        <button type="submit" class="pp-btn pp-btn--full">Send message</button>
      </form></div>
    <div class="pp-contact__aside">
      <div class="pp-card"><h3 class="pp-card__title">Email support</h3>
        <div class="pp-card__body"><p>Write to us directly.</p></div>
        <a class="pp-btn pp-btn--dark" href="mailto:a@b.c">someone@example.com</a></div>
      <div class="pp-card"><h3 class="pp-card__title">Support hours</h3>
        <div class="pp-card__body"><p>Monday to Friday.</p></div></div>
    </div></div></div></div>

${group('g0','','FAQS','Orders & Account',false,['Do I need an account?','Can I change my address?'])}
${group('g1',' pp-band--tint','FAQS','Order & Shipping',false,['When will it ship?','Do you ship worldwide?'])}
${group('g2',' pp-band--dark','FAQS','Product & Safety',false,['Is it safe for sensitive eyes?','Is it cruelty free?'])}
${group('g3','','FAQS','Quality & Ingredients',true,['What is in it?','Where is it made?'])}
</body></html>`;
(async()=>{
  const f=path.resolve('support-fixture.html'); fs.writeFileSync(f,html);
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
  const p=await b.newPage({viewport:{width:1280,height:900}});
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto('file://'+f); await p.waitForTimeout(200);
  let pass=0,fail=0;
  const t=(n,c,x='')=>{c?pass++:fail++;console.log(`  ${c?'PASS':'FAIL'}  ${n}${c?'':'  <- '+x}`);};
  const lum=c=>{const m=c.match(/\d+/g).map(Number);return .2126*m[0]+.7152*m[1]+.0722*m[2];};

  t('anchor pills render on one row', await p.$eval('.pp-sub__list',e=>{
      const tops=[...e.children].map(li=>Math.round(li.getBoundingClientRect().top));
      return new Set(tops).size===1;}));
  t('pills link to the bands', await p.$$eval('.pp-sub__pill',
      a=>a.every(x=>x.getAttribute('href').startsWith('#'))));
  t('every anchor target exists', await p.$$eval('.pp-sub__pill',
      a=>a.every(x=>!!document.querySelector(x.getAttribute('href')))));

  t('contact is two columns on desktop',
     (await p.$eval('.pp-contact',e=>getComputedStyle(e).gridTemplateColumns)).split(' ').length===2);
  t('name fields sit side by side',
     (await p.$eval('.pp-form__row',e=>getComputedStyle(e).gridTemplateColumns)).split(' ').length===2);
  t('every input has a real label', await p.$$eval('.pp-form input,.pp-form textarea',
      els=>els.every(e=>!!document.querySelector(`label[for="${e.id}"]`))));
  t('submit spans the form', await p.$eval('.pp-btn--full',
      e=>Math.abs(e.getBoundingClientRect().width-e.closest('form').getBoundingClientRect().width)<2));

  t('dark band is dark', lum(await p.$eval('#g2',e=>getComputedStyle(e).backgroundColor))<60);
  t('and its text is light', lum(await p.$eval('#g2 .pp-band__title',e=>getComputedStyle(e).color))>200);
  t('tint band is light', lum(await p.$eval('#g1',e=>getComputedStyle(e).backgroundColor))>200);

  t('split group is two columns',
     (await p.$eval('#g3 .pp-faqg',e=>getComputedStyle(e).gridTemplateColumns)).split(' ').length===2);
  t('side image keeps 3:2', await p.$eval('.pp-faqg__img',e=>{
      const r=e.getBoundingClientRect(); return Math.abs(r.width/r.height-1.5)<0.03;}),
     await p.$eval('.pp-faqg__img',e=>{const r=e.getBoundingClientRect();return (r.width/r.height).toFixed(3);}));

  t('accordions start closed', await p.$$eval('.pp-faqg__item',e=>e.every(x=>!x.open)));
  t('answer hidden until opened', !(await p.$eval('.pp-faqg__a',e=>e.checkVisibility())));
  await p.click('#g0 .pp-faqg__item summary'); await p.waitForTimeout(100);
  t('opens on click', await p.$eval('#g0 .pp-faqg__a',e=>e.checkVisibility()));
  t('marker flips to minus', (await p.$eval('#g0 .pp-faqg__item[open] summary',
      e=>getComputedStyle(e,'::after').content)).includes('–'));

  for (const w of [1280,860,600,375]) {
    await p.setViewportSize({width:w,height:900}); await p.waitForTimeout(120);
    t(`no sideways scroll at ${w}px`,
       await p.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),
       String(await p.evaluate(()=>document.documentElement.scrollWidth)));
  }
  await p.setViewportSize({width:600,height:900}); await p.waitForTimeout(120);
  t('contact stacks on mobile',
     (await p.$eval('.pp-contact',e=>getComputedStyle(e).gridTemplateColumns)).split(' ').length===1);

  t('no page errors', errs.length===0, errs.join(' | '));
  console.log(`\n${pass} passed, ${fail} failed`);
  await b.close(); process.exit(fail?1:0);
})();
