'use strict';
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const yen = value => value.toLocaleString('ja-JP');
const buildPlans = [{name:'スタート',price:9800},{name:'スタンダード',price:19800},{name:'まるっと',price:29800}];
const supportPlans = [{name:'運用サポートなし',price:0},{name:'ライト運用',price:4980},{name:'スタンダード運用',price:7980},{name:'しっかり運用',price:14800}];
const media = matchMedia('(prefers-reduced-motion: reduce)');
let motionOff = media.matches;
let observer;
function setMotion(off) {
  motionOff = off;
  document.documentElement.classList.toggle('motion-off', off);
  document.documentElement.classList.toggle('js-motion', !off);
  $('.motion-toggle').textContent = off ? '動きを再開' : '動きを止める';
  $('.motion-toggle').setAttribute('aria-label', off ? '動きを再開' : '動きを止める');
  $('.motion-toggle').setAttribute('aria-pressed', String(off));
}
if ('IntersectionObserver' in window) {
  observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
  }), {threshold:.09});
  $$('.reveal').forEach(el => observer.observe(el));
  setMotion(motionOff);
}
$('.motion-toggle').addEventListener('click', () => setMotion(!motionOff));
media.addEventListener('change', event => setMotion(event.matches));
let scrollPending = false;
window.addEventListener('scroll', () => {
  if (scrollPending) return;
  scrollPending = true;
  requestAnimationFrame(() => {
    const range = document.documentElement.scrollHeight - innerHeight;
    $('.reading-progress').style.width = (range > 0 ? scrollY / range * 100 : 0) + '%';
    scrollPending = false;
  });
}, {passive:true});
const menuButton = $('.menu-toggle');
function closeMenu() { menuButton.setAttribute('aria-expanded','false'); menuButton.setAttribute('aria-label','メニューを開く'); $('#mobile-menu').hidden = true; }
menuButton.addEventListener('click', () => { const open = menuButton.getAttribute('aria-expanded') !== 'true'; menuButton.setAttribute('aria-expanded',String(open)); menuButton.setAttribute('aria-label',open?'メニューを閉じる':'メニューを開く'); $('#mobile-menu').hidden = !open; });
$$('#mobile-menu a').forEach(link=>link.addEventListener('click',closeMenu));
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!$('#mobile-menu').hidden){closeMenu();menuButton.focus();}});
matchMedia('(min-width: 1000px)').addEventListener('change',event=>{if(event.matches)closeMenu();});
const contactDialog = $('#contact-dialog');
function openContact(buildIndex = null, supportIndex = null) {
  let selection = '';
  if (buildIndex !== null) { const plan = buildPlans[buildIndex]; selection += `構築：${plan.name}（税込${yen(plan.price)}円）\n`; }
  if (supportIndex !== null) { const plan = supportPlans[supportIndex]; selection += plan.price ? `運用：${plan.name}（税込${yen(plan.price)}円/月）\n` : '運用：今回はつけない\n'; }
  $('#consultation-text').value = `ばってんLaboさん、LINE公式について相談したいです。\n${selection}業種・お店の名前：\nいま困っていること：\n希望の開始時期：`;
  $('#copy-status').textContent = '';
  $('#copy-message').textContent = '相談内容をコピー';
  contactDialog.showModal();
}
$$('[data-contact]').forEach(button=>button.addEventListener('click',()=>openContact()));
$$('[data-plan]').forEach(button=>button.addEventListener('click',()=>openContact(Number(button.dataset.plan),null)));
$$('[data-support]').forEach(button=>button.addEventListener('click',()=>openContact(null,Number(button.dataset.support))));
function estimate() {
  const build = buildPlans[Number($('#build-select').value)];
  const support = supportPlans[Number($('#support-select').value)];
  $('#estimate-total').textContent = yen(build.price + support.price);
  $('#estimate-recurring').textContent = support.price ? `その後の運用サポート：${yen(support.price)}円 / 月（税込）` : '運用サポートなし';
}
$('#build-select').addEventListener('change',estimate);
$('#support-select').addEventListener('change',estimate);
$('#estimate-contact').addEventListener('click',()=>openContact(Number($('#build-select').value),Number($('#support-select').value)));
$('#copy-message').addEventListener('click',async()=>{
  try {
    if(!navigator.clipboard)throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText($('#consultation-text').value);
    $('#copy-status').textContent='コピーしました。LINEで貼り付けてお送りください。';
    $('#copy-message').textContent='コピーしました';
  } catch {
    const text=$('#consultation-text');text.focus();text.select();
    $('#copy-status').textContent='文章を選択しました。コピーしてLINEに貼り付けてください。';
  }
});
$$('dialog').forEach(dialog=>{
  dialog.querySelector('.dialog-close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
});
$('.close-coupon').addEventListener('click',()=>$('#coupon-dialog').close());
const industries = {
 cafe:{name:'カフェ こもれび',icon:'coffee',brand:'komorebi',tagline:'COFFEE & LITTLE MOMENTS',intro:'季節のランチとコーヒーを。\nお店の便りをお届けします🌿',reserve:'予約の相談',question:'明日のランチ、ご希望の人数は？',options:['2名','3名'],timeQuestion:'ご希望の時間を教えてください。',times:['12:00','13:00'],coupon:'ドリンク1杯プレゼント'},
 salon:{name:'ヘアサロン hinata',icon:'scissors',brand:'hinata',tagline:'HAIR & YOUR OWN STYLE',intro:'あなたらしい髪と、癒しを。\nケア情報や空き状況をお届け🌿',reserve:'予約の相談',question:'どんなメニューをご希望ですか？',options:['カット','カット＋カラー'],timeQuestion:'ご希望の時間帯を教えてください。',times:['午前','午後'],coupon:'トリートメント体験特典'},
 shop:{name:'暮らしの雑貨 ひより',icon:'shopping-bag',brand:'hiyori',tagline:'SMALL THINGS, HAPPY DAYS',intro:'暮らしに、小さなお気に入り。\n新入荷のお知らせをお届け🌿',reserve:'商品を相談',question:'気になる商品を教えてください。',options:['マグカップ','トートバッグ'],timeQuestion:'どんなことを知りたいですか？',times:['在庫について','取り置きについて'],coupon:'お買い物 5% OFF'}
};
let industry='cafe';
function setStoreIcon(element) {
  const image=document.createElement('img');image.src='assets/icons/'+industries[industry].icon+'.svg';image.alt='';image.width=24;image.height=24;image.setAttribute('aria-hidden','true');element.replaceChildren(image);
}
function updateStoreIdentity() {
  const data=industries[industry];$('.phone').dataset.theme=industry;
  $('#store-name').textContent=data.name;setStoreIcon($('#store-avatar'));setStoreIcon($('#menu-store-icon'));
  $('#menu-brand').textContent=data.brand;$('#menu-tagline').textContent=data.tagline;
  $('#reserve-label').textContent=data.reserve;$('#reserve-en').textContent=industry==='shop'?'ASK US':'RESERVE';
}
function scrollChat() { $('#chat').scrollTo({top:$('#chat').scrollHeight,behavior:motionOff?'auto':'smooth'}); }
function message(who,text) {
  const row=document.createElement('div');row.className='message '+(who==='customer'?'customer':'');
  const avatar=document.createElement('span');avatar.className=who==='customer'?'read':'chat-avatar';if(who==='customer')avatar.textContent='既読\n12:00';else setStoreIcon(avatar);avatar.setAttribute('aria-hidden','true');
  const bubble=document.createElement('div');bubble.className='bubble';bubble.textContent=text;
  row.append(avatar,bubble);$('#chat').append(row);scrollChat();
}
function choices(items,focus=false) {
  $('#reply-options').replaceChildren();
  items.forEach(([label,action])=>{const button=document.createElement('button');button.textContent=label;button.addEventListener('click',()=>{$('#reply-options').replaceChildren();action();});$('#reply-options').append(button);});
  if(focus)$('#reply-options button')?.focus({preventScroll:true});
}
function showChat(scene='welcome',focus=false) {
  const data=industries[industry];
  $('#chat').innerHTML='<div class="chat-day"><span>今日 · DEMO</span></div>';
  $('#reply-options').replaceChildren();
  if(scene==='welcome'){
    message('shop',`友だち追加ありがとう！\n${data.name}です。`);
    message('shop',data.intro);
    choices([[data.reserve+'をしたい',()=>showChat('reserve',true)],['クーポンを見たい',()=>showChat('coupon',true)]],focus);
  } else if(scene==='reserve'){
    message('shop',data.question);
    choices(data.options.map(option=>[option,()=>{
      message('customer',option+'でお願いします。');message('shop',data.timeQuestion);
      choices(data.times.map(time=>[time,()=>{
        message('customer',time+'でお願いします。');
        message('shop',`${option}・${time}についてのご相談ですね。\nスタッフが確認してお返事します。\n\nここまでが体験です。実際の予約・取り置き・送信は行われていません。`);
        choices([['クーポンも見てみる',()=>showChat('coupon',true)],['最初から',()=>showChat('welcome',true)]],true);
      }]),true);
    }]),focus);
  } else {
    message('shop','次のご来店に、うれしい特典。\nタップして特典をチェック。');
    const row=document.createElement('div');row.className='message';
    const avatar=document.createElement('span');avatar.className='chat-avatar';setStoreIcon(avatar);
    const card=document.createElement('div');card.className='bubble chat-coupon';
    const label=document.createElement('small');label.textContent='FRIENDS ONLY / DEMO';
    const title=document.createElement('strong');title.textContent=data.coupon;
    const button=document.createElement('button');button.textContent='クーポンの詳細を見る';button.addEventListener('click',()=>{$('#coupon-benefit').textContent=data.coupon;$('#coupon-dialog').showModal();});
    card.append(label,title,button);row.append(avatar,card);$('#chat').append(row);
    choices([['最初から',()=>showChat('welcome',true)]],focus);
  }
  $('#chat').scrollTop=0;
}
$$('[data-industry]').forEach(button=>button.addEventListener('click',()=>{
  industry=button.dataset.industry;const data=industries[industry];
  $$('[data-industry]').forEach(el=>el.setAttribute('aria-pressed',String(el===button)));
  updateStoreIdentity();showChat();
}));
$$('[data-chat]').forEach(button=>button.addEventListener('click',()=>showChat(button.dataset.chat)));
updateStoreIdentity();showChat();estimate();

