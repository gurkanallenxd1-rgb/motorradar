/* Conservative extraction: only explicit labels / units, never infer missing facts. */
(function(root){
  'use strict';
  function number(value){
    if(typeof value!=='string')return null;
    const s=value.trim().replace(/(?:TL|TRY|₺|km)/gi,'').trim().replace(/[\s\u00a0\u202f]/g,'');
    if(!/^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/.test(s))return null;
    const n=Number(s.replace(/\./g,'').replace(',','.'));
    return Number.isFinite(n)?n:null;
  }
  const fold=s=>s.toLocaleLowerCase('tr-TR').replace(/ı/g,'i').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const fields={brand:['marka'],model:['model'],year:['model yili','yil'],price:['fiyat','ilan fiyati'],km:['kilometre','km'],city:['sehir','il','il / ilce','il/ilce','konum'],title:['ilan basligi','baslik']};
  function label(line){const s=fold(line).trim();const labels=Object.entries(fields).flatMap(([key,names])=>names.map(name=>({key,name}))).sort((a,b)=>b.name.length-a.name.length);for(const {key,name} of labels){if(s===name)return {key,value:''};if(s.startsWith(name+':')||s.startsWith(name+' '))return {key,value:line.slice(name.length).replace(/^\s*:?\s*/,'').trim()};}return null;}
  function convert(key,value){
    if(!value)return null;
    if(['year','price','km'].includes(key)){
      const n=number(value);if(n===null)return null;
      if(key==='year')return /^\d{4}$/.test(value.trim())&&n>=1950&&n<=2035?n:null;
      if(key==='km')return Number.isInteger(n)&&n>=0&&n<=2000000?n:null;
      return n>0&&n<=1e9?n:null;
    }
    const max={brand:55,model:55,city:50,title:130}[key];
    return value.length<=max&&/[a-zA-ZÇĞİÖŞÜçğıöşü]/.test(value)&&!/[<>]/.test(value)?value:null;
  }
  function extract(pages){
    const candidates=Object.fromEntries(Object.keys(fields).map(k=>[k,new Set()]));
    for(const page of pages){
      // Use line confidence, not a page average: one blurry field must stay blank.
      const lines=page.lines||[];
      for(let i=0;i<lines.length;i++){
        const line=lines[i];if(!(line.confidence>=75))continue;
        const text=line.text.trim();const tag=label(text);
        if(tag){let value=tag.value;if(!value&&lines[i+1]?.confidence>=75&&!label(lines[i+1].text))value=lines[i+1].text.trim();const v=convert(tag.key,value);if(v!==null)candidates[tag.key].add(v);}
        else if(/^(?:₺\s*[\d.,\s]+|[\d.,\s]+\s*(?:TL|₺|TRY))$/i.test(text)){const v=convert('price',text);if(v!==null)candidates.price.add(v);}
        else if(/^[\d.\s]+\s*km$/i.test(text)){const v=convert('km',text);if(v!==null)candidates.km.add(v);}
      }
    }
    const values={},ambiguous=[];
    for(const [key,set] of Object.entries(candidates)){if(set.size===1)values[key]=[...set][0];else if(set.size>1)ambiguous.push(key);}
    return {values,ambiguous};
  }
  const api={number,extract};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.MotorOCR=api;
})(typeof globalThis!=='undefined'?globalThis:this);
