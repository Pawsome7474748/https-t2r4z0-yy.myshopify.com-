const {chromium}=require('playwright'), fs=require('fs'), path=require('path');
const REPO=process.env.REPO||'/home/user/https-t2r4z0-yy.myshopify.com-';
const CSS=fs.readFileSync(path.join(REPO,'new-store-build/assets/pp-ligne.css'),'utf8');
const tpl=JSON.parse(fs.readFileSync(path.join(REPO,'new-store-build/templates/product.220.json'),'utf8'));
const src=tpl.sections.main.blocks.pp_rating.settings.custom_liquid;
const {Liquid}=require('liquidjs');
(async()=>{
  const e=new Liquid();
  const ctx={product:{metafields:{reviews:{rating:{value:{rating:'4.6',scale_max:'5.0'}},rating_count:{value:'4'}}}}};
  const body=await e.render(e.parse(src),ctx);
  const html=`<!doctype html><html><head><style>html{font-size:62.5%}body{margin:0;padding:2rem;max-width:520px}${CSS}</style></head><body>${body}</body></html>`;
  const f=path.resolve('rating2-fixture.html'); fs.writeFileSync(f,html);
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
  const p=await b.newPage({viewport:{width:520,height:300}});
  const errs=[]; p.on('pageerror',err=>errs.push(err.message));
  await p.goto('file://'+f); await p.waitForTimeout(300);
  let pass=0,fail=0;
  const t=(n,c,x='')=>{c?pass++:fail++;console.log(`  ${c?'PASS':'FAIL'}  ${n}${c?'':'  <- '+x}`);};

  t('stars render', (await p.$eval('.pp-rating2__stars',e=>e.textContent))==='★★★★★');
  t('stars are yellow, not the old orange/green',
     (await p.$eval('.pp-rating2__stars',e=>getComputedStyle(e).color))==='rgb(245, 197, 24)');
  t('text reads real rating and count',
     (await p.$eval('.pp-rating2__text',e=>e.textContent.replace(/\\s+/g,' ').trim()))==='Rated 4.6 · 4 Verified Reviews');
  t('4 avatars', await p.$$eval('.pp-rating2__avatars img',e=>e.length)===4);
  t('avatars are circles', await p.$eval('.pp-rating2__avatars li',e=>getComputedStyle(e).borderRadius)==='50%');
  t('avatars overlap (negative margin, not stacked flush)', await p.$eval('.pp-rating2__avatars',e=>{
      const li=[...e.children];
      const gaps=li.slice(1).map((x,i)=>x.getBoundingClientRect().left-li[i].getBoundingClientRect().left);
      return gaps.every(g=>g>0 && g<30);
  }));
  t('stars, text and avatars sit on one row at 520px, not wrapped', await p.evaluate(()=>{
      const wrap=document.querySelector('.pp-rating2').getBoundingClientRect();
      return wrap.height<40;   /* one line of this content; wrapping would push past 60px+ */
  }));
  t('no page errors', errs.length===0, errs.join(' | '));

  await p.setViewportSize({width:360,height:300}); await p.waitForTimeout(120);
  t('no sideways scroll at 360px', await p.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1));
  t('still fits on very narrow screens', await p.$eval('.pp-rating2',e=>e.getBoundingClientRect().height<80));

  console.log(`\n${pass} passed, ${fail} failed`);
  await b.close(); process.exit(fail?1:0);
})();
