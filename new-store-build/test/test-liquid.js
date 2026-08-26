/* Shopify does not validate Liquid inside a JSON template's custom_liquid
   setting on upload, so a bad expression only shows up on the rendered page.
   This parses every section and the rating block, and renders the rating with
   the metafield values as the strings Shopify actually returns. */
const {Liquid}=require('liquidjs'), fs=require('fs'), path=require('path');
const REPO=process.env.REPO||path.resolve(__dirname,'../..');
const B=path.join(REPO,'new-store-build');
let pass=0,fail=0;
const t=(n,c,x='')=>{c?pass++:fail++;console.log(`  ${c?'PASS':'FAIL'}  ${n}${c?'':'  <- '+x}`);};

for (const f of fs.readdirSync(path.join(B,'sections')).filter(f=>f.endsWith('.liquid'))) {
  const s=fs.readFileSync(path.join(B,'sections',f),'utf8')
    .replace(/\{%-?\s*schema\s*-?%\}[\s\S]*?\{%-?\s*endschema\s*-?%\}/,'')
    .replace(/\{%-?\s*style\s*-?%\}[\s\S]*?\{%-?\s*endstyle\s*-?%\}/,'')
    .replace(/\{%-?\s*form\b[\s\S]*?\{%-?\s*endform\s*-?%\}/,'');
  try { new Liquid().parse(s); t(`section parses: ${f}`, true); }
  catch(e){ t(`section parses: ${f}`, false, e.message); }
}

const STRINGS={product:{metafields:{reviews:{
  rating:{value:{rating:'4.6',scale_min:'1.0',scale_max:'5.0'}},
  rating_count:{value:'4'}}}}};
const BLANK={product:{metafields:{reviews:{}}}};

(async()=>{
  for (const tpl of ['product.220','index']) {
    const j=JSON.parse(fs.readFileSync(path.join(B,'templates',`${tpl}.json`),'utf8'));
    const src=j.sections.main.blocks.pp_rating.settings.custom_liquid;
    const e=new Liquid();
    try {
      const out=(await e.render(e.parse(src),STRINGS)).replace(/\s+/g,' ').trim();
      t(`${tpl}: rating renders from string metafields`, out.includes('Rated 4.6 out of 5') && out.includes('4 reviews'), out);
      const empty=(await e.render(e.parse(src),BLANK)).trim();
      t(`${tpl}: renders nothing when unrated`, empty==='', JSON.stringify(empty));
    } catch(err) { t(`${tpl}: rating block`, false, err.message); }
  }
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail?1:0);
})();
