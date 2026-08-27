(function(){
  var root=document.getElementById('pp-ligne');
  if(!root) return;
  var SID=root.dataset.section;
  var DELIVERY_DAYS=7;
  var STOCK_SCALE=10, STOCK_SHOW_AT=10;
  var LOW_STOCK_AT=8;   /* matches the product page's inventory threshold */

  function $(s,r){return (r||document).querySelector(s);}
  function $$(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s));}
  function form(){return document.getElementById('product-form-'+SID);}
  function idInput(){var f=form();return f?f.querySelector('input[name="id"]'):null;}
  function bundles(){return document.getElementById('pp-bundles-'+SID);}
  function mix(){return document.getElementById('pp-mix-'+SID);}

  var VMAP={};
  try{ VMAP=JSON.parse(($('#pp-variants-'+SID)||{}).textContent||'{}'); }catch(e){}

  function variantSelects(){return document.getElementById('variant-selects-'+SID);}
  function allRadios(){
    var vs=variantSelects();
    return vs?$$('input[type="radio"]',vs):[];
  }
  /* the selected variant is the source of truth for pack size and shade */
  function current(){
    var i=idInput();
    return (i && VMAP[i.value]) ? VMAP[i.value] : null;
  }
  function currentQty(){ var v=current(); return v?v.q:1; }
  function currentShade(){ var v=current(); return v?v.s:null; }

  function pickByValue(value){
    var t=allRadios().filter(function(i){return i.value===value;})[0];
    if(t && !t.disabled && !t.checked){ t.click(); return true; }
    return false;
  }

  function setDelivery(){
    var el=$('[data-pp-deliver-by]'); if(!el) return;
    var d=new Date(Date.now()+DELIVERY_DAYS*864e5);
    el.textContent=d.toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'});
  }

  function hideNativeOptions(){
    var vs=variantSelects(); if(!vs) return;
    $$('fieldset,.product-form__input',vs).forEach(function(fs){
      fs.classList.add('pp-opt-hidden');
    });
  }

  function syncCards(qtyOverride){
    var b=bundles(); if(!b) return;
    var qty=qtyOverride||currentQty();
    $$('.pp-bundle',b).forEach(function(c){
      var on=+c.dataset.qty===qty;
      c.classList.toggle('is-active',on);
      c.setAttribute('aria-pressed',on?'true':'false');
    });
  }

  /* show one shade dropdown per pencil; slots 2-3 ride along as line item properties */
  function syncMix(qtyOverride){
    var m=mix(); if(!m) return;
    var qty=qtyOverride||currentQty(), shade=currentShade();
    m.hidden=false;
    $$('.pp-mix__row',m).forEach(function(row){
      var slot=+row.dataset.slot;
      row.hidden = slot>qty;
      if(slot===1 && shade){ $('select',row).value=shade; }
    });
    $$('input[data-prop]',m).forEach(function(inp){
      var slot=+inp.dataset.prop;
      if(slot<=qty){
        var sel=$('.pp-mix__select[data-slot="'+slot+'"]',m);
        inp.disabled=false;
        inp.value=sel?sel.value:'';
      } else {
        inp.disabled=true;
        inp.value='';
      }
    });
  }

  function wire(){
    var b=bundles(); if(b){
      $$('.pp-bundle',b).forEach(function(c){
        c.addEventListener('click',function(){
          var q=+c.dataset.qty||1;
          syncCards(q); syncMix(q);          /* instant, from the card itself */
          pickByValue(c.dataset.value);      /* Shopify swaps the variant async */
          setTimeout(update,80);
        });
      });
    }
    var m=mix(); if(m){
      $$('.pp-mix__select',m).forEach(function(sel){
        sel.addEventListener('change',function(){
          if(+sel.dataset.slot===1){ pickByValue(sel.value); }
          syncMix();
          setTimeout(syncMix,80);
        });
      });
    }
  }

  /* ---- TikTok carousel ---- */
  function wireUgc(){
    var root=document.getElementById('pp-ugc-'+SID); if(!root) return;
    var track=$('.pp-ugc__track',root);
    var arrows=$$('.pp-ugc__arrow',root);
    /* arrows are pointless when everything already fits */
    function syncArrows(){
      var scrollable=track.scrollWidth-track.clientWidth>4;
      var nav=$('.pp-ugc__nav',root);
      if(nav) nav.style.display=scrollable?'':'none';
      if(!scrollable) return;
      arrows.forEach(function(a){
        var atStart=track.scrollLeft<=2;
        var atEnd=track.scrollLeft>=track.scrollWidth-track.clientWidth-2;
        a.disabled=(+a.dataset.dir<0)?atStart:atEnd;
        a.style.opacity=a.disabled?'.35':'';
      });
    }
    arrows.forEach(function(a){
      a.addEventListener('click',function(){
        track.scrollBy({left:(+a.dataset.dir)*Math.max(140,track.clientWidth*0.8),behavior:'smooth'});
      });
    });
    track.addEventListener('scroll',syncArrows,{passive:true});
    window.addEventListener('resize',syncArrows);
    syncArrows();
    var cards=$$('.pp-ugc__card',root);
    cards.forEach(function(card){
      var vid=$('video',card);
      card.addEventListener('click',function(){
        if(vid.paused){
          cards.forEach(function(o){
            if(o!==card){ var ov=$('video',o); ov.pause(); ov.controls=false; o.classList.remove('is-playing'); }
          });
          vid.muted=false; vid.controls=true; card.classList.add('is-playing');
          var pr=vid.play();
          if(pr&&pr.catch) pr.catch(function(){
            vid.muted=true;                     /* browsers block unmuted autoplay in some contexts */
            var r=vid.play();
            if(r&&r.catch) r.catch(function(){
              vid.controls=false; card.classList.remove('is-playing');
            });
          });
        } else {
          vid.pause(); vid.controls=false; card.classList.remove('is-playing');
        }
      });
      vid.addEventListener('pause',function(){ card.classList.remove('is-playing'); });
      vid.addEventListener('play',function(){ card.classList.add('is-playing'); });
    });
  }

  /* ---- story reviews: clamp long bodies behind a Read more ---- */
  function wireReviews(){
    $$('.pp-rev__card').forEach(function(card){
      var body=$('[data-pp-clamp]',card), btn=$('.pp-rev__more',card);
      if(!body||!btn) return;
      body.classList.add('is-clamped');
      if(body.scrollHeight-body.clientHeight<8){   /* short enough to show whole */
        body.classList.remove('is-clamped');
        return;
      }
      btn.hidden=false;
      btn.addEventListener('click',function(){
        var clamped=body.classList.toggle('is-clamped');
        btn.textContent=clamped?'Read more':'Show less';
      });
    });
  }

  /* ---- flip cards ---- */
  function wireFlips(){
    $$('.pp-rb__card').forEach(function(card){
      $$('.pp-rb__btn',card).forEach(function(btn){
        btn.addEventListener('click',function(e){
          e.preventDefault();
          card.classList.toggle('is-flipped');
        });
      });
    });
  }

  /* ---- home page buy box ----
     featured-product renders a single hero image (product-media-gallery is
     called with limit:1), so the thumbnails are ours: build them from the
     variant map's images, then move the strip into the media column. */
  function wireHeroThumbs(){
    var strip=document.getElementById('pp-thumbs-'+SID); if(!strip) return;
    var media=$('.product__media-wrapper');
    if(media) media.appendChild(strip);
    strip.hidden=false;
    var hero=media?$('.product__media img',media):null;
    if(!hero){ strip.hidden=true; return; }
    var thumbs=$$('.pp-thumb',strip);
    function select(btn){
      thumbs.forEach(function(t){
        var on=t===btn;
        t.classList.toggle('is-active',on);
        t.setAttribute('aria-current',on?'true':'false');
      });
    }
    thumbs.forEach(function(btn){
      btn.addEventListener('click',function(){
        var full=btn.dataset.full; if(!full) return;
        hero.removeAttribute('srcset');   /* or the browser keeps the old candidate */
        hero.removeAttribute('sizes');
        hero.src=full;
        select(btn);
      });
    });
    if(thumbs[0]) select(thumbs[0]);
  }

  /* The home page has no Dawn inventory block, so mirror what it prints on
     the product page: green "N in stock", red and flashing once stock is low. */
  function setLowStock(){
    var el=document.getElementById('pp-lowstock-'+SID); if(!el) return;
    var v=current(); var q=v?v.st:undefined;
    if(typeof q!=='number'||q<=0){el.hidden=true;return;}
    el.hidden=false;
    var low=q<=LOW_STOCK_AT;
    el.classList.toggle('is-low',low);
    $('.pp-lowstock__txt',el).textContent = low ? 'Almost out of stock' : (q+' in stock');
  }

  function setStock(){
    var el=document.getElementById('pp-stock-'+SID); if(!el) return;
    var v=current(); var q=v?v.st:undefined;
    if(typeof q!=='number'||q<=0||q>STOCK_SHOW_AT){el.hidden=true;return;}
    el.hidden=false;
    var pct=Math.max(6,Math.min(100,Math.round(q/STOCK_SCALE*100)));
    $('.pp-stock__fill',el).style.width=pct+'%';
    $('.pp-stock__label',el).textContent='Only '+q+' left in stock';
  }

  function reword(){
    var el=document.getElementById('Inventory-'+SID); if(!el) return;
    (function walk(n){
      n.childNodes.forEach(function(c){
        if(c.nodeType===3){
          var t=c.nodeValue,v=t
            .replace(/Low stock:\s*(\d+)\s*left/i,'Almost out of stock')
            .replace(/^(\s*)Low stock(\s*)$/i,'$1Almost out of stock$2');
          if(v!==t) c.nodeValue=v;
        } else if(c.nodeType===1) walk(c);
      });
    })(el);
  }

  function update(){ syncCards(); syncMix(); setStock(); setLowStock(); reword(); }

  function init(){
    setDelivery(); hideNativeOptions(); wire(); wireUgc(); wireFlips(); wireReviews();
    wireHeroThumbs(); update();
    var ii=idInput();
    if(ii) ii.addEventListener('change',update);
    var price=document.getElementById('price-'+SID);
    if(price) new MutationObserver(update).observe(price,{childList:true,subtree:true});
    var inv=document.getElementById('Inventory-'+SID);
    if(inv) new MutationObserver(reword).observe(inv,{childList:true,subtree:true,characterData:true});
    document.addEventListener('change',function(e){
      if(e.target && e.target.name && e.target.name.indexOf('-')>-1) setTimeout(update,60);
    });
  }
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();
