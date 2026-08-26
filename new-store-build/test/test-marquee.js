const {chromium}=require('playwright'), fs=require('fs'), path=require('path');
/* renders the section's own markup with the Liquid resolved by hand */
const ITEMS=[
 ['⚡','Only 24 left in stock — selling fast',true],
 ['💧','Waterproof, sweat-proof, tear-proof',false],
 ['⏱','Holds its line for up to 24 hours',false],
 ['✏️','Liner and brow definition in one pencil',false],
 ['🎨','Seven wearable shades to mix and match',false],
 ['💄','Save 24% on the 3-pencil bundle',false],
 ['🚚','Dispatched in 1–3 business days',false],
 ['↩️','30-day money-back guarantee',false],
];
const set=hidden=>`<div class="pp-mq__set" aria-hidden="${hidden}">`+ITEMS.map(([i,t,hot])=>
 `<span class="pp-mq__item${hot?' pp-mq__item--hot':''}"><span class="pp-mq__icon" aria-hidden="true">${i}</span>${t}</span>`).join('')+`</div>`;
const CSS=`
  .pp-mq{--pp-mq-gap:44px;overflow:hidden;position:relative;
    background:linear-gradient(57deg, #5e2a3b, #7a4257 98%);color:#ffffff}
  .pp-mq__track{display:flex;width:max-content;animation:ppMarquee 45s linear infinite}
  .pp-mq:hover .pp-mq__track{animation-play-state:paused}
  .pp-mq__set{display:flex;align-items:center;flex:0 0 auto;gap:var(--pp-mq-gap);padding-right:var(--pp-mq-gap)}
  .pp-mq__item{display:flex;align-items:center;gap:.6rem;flex:0 0 auto;font-size:1.3rem;
    line-height:1;padding:11px 0;letter-spacing:.02em;white-space:nowrap}
  .pp-mq__icon{font-size:1.15em;line-height:1}
  .pp-mq__item--hot{color:#ffd479;font-weight:700}
  @keyframes ppMarquee{from{transform:translate3d(0,0,0)}to{transform:translate3d(-50%,0,0)}}
  @media (prefers-reduced-motion:reduce){.pp-mq__track{animation:none}.pp-mq{overflow-x:auto}}`;
const html=`<!doctype html><html><head><style>html{font-size:62.5%}body{margin:0}${CSS}</style></head>
<body><div class="pp-mq"><div class="pp-mq__track">${set('false')}${set('true')}</div></div></body></html>`;
(async()=>{
  const f=path.resolve('marquee-fixture.html'); fs.writeFileSync(f,html);
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
  let pass=0,fail=0;
  const t=(n,c,x='')=>{c?pass++:fail++;console.log(`  ${c?'PASS':'FAIL'}  ${n}${c?'':'  <- '+x}`);};
  const p=await b.newPage({viewport:{width:1280,height:400}});
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto('file://'+f);

  t('two identical sets for a seamless loop', await p.$$eval('.pp-mq__set',e=>
      e.length===2 && Math.abs(e[0].getBoundingClientRect().width-e[1].getBoundingClientRect().width)<0.5));
  t('duplicate set hidden from screen readers', await p.$$eval('.pp-mq__set',
      e=>e[0].getAttribute('aria-hidden')==='false'&&e[1].getAttribute('aria-hidden')==='true'));
  t('track is wider than the viewport', await p.$eval('.pp-mq__track',e=>e.getBoundingClientRect().width>1280));
  t('page does not scroll sideways', await p.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));
  t('items never wrap to a second line', await p.$eval('.pp-mq',e=>e.getBoundingClientRect().height<60),
     String(await p.$eval('.pp-mq',e=>e.getBoundingClientRect().height)));

  /* it has to actually move, and keep moving */
  const x=()=>p.$eval('.pp-mq__set',e=>e.getBoundingClientRect().x);
  const x0=await x(); await p.waitForTimeout(700); const x1=await x();
  t('banner scrolls on its own', x1<x0-1, `${x0.toFixed(1)} -> ${x1.toFixed(1)}`);
  await p.waitForTimeout(700);
  t('and keeps scrolling', (await x())<x1-1);

  /* the loop point: after one full period set 1 must be exactly where set 0 started */
  const period=await p.$eval('.pp-mq__track',e=>{
    const half=e.getBoundingClientRect().width/2;
    const set=e.querySelector('.pp-mq__set').getBoundingClientRect().width;
    return Math.abs(half-set);});
  t('translate(-50%) lands exactly one set along', period<0.5, 'off by '+period.toFixed(2)+'px');

  const rm=await b.newPage({viewport:{width:1280,height:400},reducedMotion:'reduce'});
  await rm.goto('file://'+f);
  t('animation off under prefers-reduced-motion',
     (await rm.$eval('.pp-mq__track',e=>getComputedStyle(e).animationName))==='none');
  const rx0=await rm.$eval('.pp-mq__set',e=>e.getBoundingClientRect().x);
  await rm.waitForTimeout(600);
  t('and it stays put', Math.abs((await rm.$eval('.pp-mq__set',e=>e.getBoundingClientRect().x))-rx0)<0.5);

  t('no page errors', errs.length===0, errs.join(' | '));
  console.log(`\n${pass} passed, ${fail} failed`);
  await b.close(); process.exit(fail?1:0);
})();
