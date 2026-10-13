/* Progressive, accessible investigation discovery. No external dependencies. */
(function(){
  'use strict';
  const root=document.querySelector('.card-grid');
  const search=document.getElementById('hub-search');
  const filterBox=document.getElementById('hub-filters');
  const counter=document.getElementById('hub-result-count');
  const empty=document.getElementById('hub-no-results');
  if(!root||!search||!filterBox||!counter||!empty)return;
  const cards=Array.from(root.querySelectorAll('a.card'));
  const categories=Array.from(new Set(cards.map(card=>card.querySelector('.card-tag')?.textContent.trim()).filter(Boolean))).sort();
  let active='All';
  for(const cat of ['All',...categories]){
    const button=document.createElement('button');
    button.type='button';button.className='hub-filter';
    button.textContent=cat;button.dataset.category=cat;
    button.setAttribute('aria-pressed',String(cat==='All'));
    filterBox.appendChild(button);
  }
  function update(){
    const term=search.value.trim().toLocaleLowerCase();
    let visible=0;
    for(const card of cards){
      const category=card.querySelector('.card-tag')?.textContent.trim()||'';
      const matched=(active==='All'||category===active)&&(!term||card.textContent.toLocaleLowerCase().includes(term));
      card.hidden=!matched;
      if(matched)visible++;
    }
    counter.textContent=visible+' of '+cards.length+' investigations';
    empty.hidden=visible!==0;
  }
  filterBox.addEventListener('click',event=>{
    const button=event.target.closest('button[data-category]');
    if(!button||!filterBox.contains(button))return;
    active=button.dataset.category;
    for(const item of filterBox.querySelectorAll('button'))item.setAttribute('aria-pressed',String(item===button));
    update();
  });
  search.addEventListener('input',update);
  update();
})();
