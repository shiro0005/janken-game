(() => {
  const cache = new Map();
  const norm = value => String(value || "").normalize("NFKC").toLowerCase().replace(/[\s　・･「」『』【】（）()\[\]、。,.!！?？_-]/g, "");
  const stripHtml = html => new DOMParser().parseFromString(html || "", "text/html").body.textContent || "";
  const toHiragana = value => value.normalize("NFKC").replace(/[ァ-ヶ]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0x60));
  const toKatakana = value => value.normalize("NFKC").replace(/[ぁ-ゖ]/g, ch => String.fromCharCode(ch.charCodeAt(0) + 0x60));
  const unique = values => [...new Map(values.map(v => [norm(v), String(v || "").trim()])).values()].filter(Boolean);
  const keywords = clue => unique(clue.replace(/[「」『』【】（）()、。・！？!?]/g," ").replace(/(を|に|で|と|が|は|の|へ|や|から|まで|より)/g," ").split(/\s+/).filter(v=>v.length>=2)).slice(0,5);
  const score = (title, body, query, clue) => {
    const t=norm(title), b=norm(body), q=norm(query); let s=0;
    if(t===q)s+=300;if(t===`${q}のイラスト`)s+=280;if(t.startsWith(q))s+=180;if(t.includes(q))s+=120;if(b.includes(q))s+=45;
    for(const k of keywords(clue).map(norm)){if(t.includes(k))s+=45;if(b.includes(k))s+=12}return s;
  };

  function jsonp(url, callbackParam="callback", timeout=7000){
    return new Promise((resolve,reject)=>{
      const name=`cb_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const script=document.createElement("script");let done=false;
      const clean=()=>{clearTimeout(timer);script.remove();try{delete window[name]}catch{window[name]=undefined}};
      const timer=setTimeout(()=>{if(done)return;done=true;clean();reject(new Error("timeout"))},timeout);
      window[name]=data=>{if(done)return;done=true;clean();resolve(data)};
      script.onerror=()=>{if(done)return;done=true;clean();reject(new Error("load"))};
      const u=new URL(url);u.searchParams.set(callbackParam,name);script.src=u;document.head.appendChild(script);
    });
  }

  async function kanjiCandidates(query, signal){
    if(signal?.aborted)throw new DOMException("Aborted","AbortError");
    const raw=String(query||"").normalize("NFKC").replace(/[\s　]/g,"");
    if(!raw)return[];if(/\p{Script=Han}/u.test(raw))return[raw];
    const hira=toHiragana(raw);if(!/^[ぁ-ゖー]+$/.test(hira))return[];
    const u=new URL("https://www.google.com/transliterate");u.searchParams.set("langpair","ja-Hira|ja");u.searchParams.set("text",hira);u.searchParams.set("jsonp","unused");
    const data=await jsonp(u,"jsonp");
    let list=[""];
    for(const segment of Array.isArray(data)?data:[]){
      const choices=(segment?.[1]||[]).slice(0,8);const next=[];
      for(const prefix of list)for(const choice of choices){next.push(prefix+choice);if(next.length>=40)break}
      if(next.length)list=next;
    }
    return unique(list).filter(v=>/\p{Script=Han}/u.test(v)).slice(0,12);
  }

  function irasutoyaImage(entry){
    const html=entry.content?.$t||entry.summary?.$t||"";
    const doc=new DOMParser().parseFromString(html,"text/html");let src=doc.querySelector("img[src]")?.getAttribute("src")||entry.media$thumbnail?.url||"";
    if(src.startsWith("//"))src=`https:${src}`;return src.replace(/\/s\d+(?:-c)?\//,"/s500/");
  }

  async function searchIrasutoya(query, clue, signal){
    const terms=unique([...(await kanjiCandidates(query,signal)),query,toHiragana(query),toKatakana(query)]);
    for(const term of terms){
      if(signal?.aborted)throw new DOMException("Aborted","AbortError");
      const u=new URL("https://www.irasutoya.com/feeds/posts/default");u.searchParams.set("max-results","20");u.searchParams.set("q",term);u.searchParams.set("by-date","false");u.searchParams.set("alt","json-in-script");
      let data;try{data=await jsonp(u)}catch{continue}
      const ranked=(data?.feed?.entry||[]).map((entry,index)=>({entry,index,score:Math.max(score(entry.title?.$t,stripHtml(entry.content?.$t||entry.summary?.$t),term,clue),score(entry.title?.$t,stripHtml(entry.content?.$t||entry.summary?.$t),query,clue))})).filter(v=>v.score>=45).sort((a,b)=>b.score-a.score||a.index-b.index);
      for(const item of ranked){const imageUrl=irasutoyaImage(item.entry);if(!imageUrl)continue;const pageUrl=(item.entry.link||[]).find(v=>v.rel==="alternate")?.href||"https://www.irasutoya.com/";return{imageUrl,pageUrl,sourceName:"いらすとや"}}
    }
    return null;
  }

  async function getJson(url,signal){const r=await fetch(url,{mode:"cors",credentials:"omit",signal});if(!r.ok)throw new Error(r.status);return r.json()}
  async function searchWikipedia(query,clue,signal){
    const u=new URL("https://ja.wikipedia.org/w/api.php");Object.entries({action:"query",generator:"search",gsrsearch:`${query} ${keywords(clue).join(" ")}`,gsrnamespace:"0",gsrlimit:"12",prop:"pageimages|info|extracts",piprop:"thumbnail",pithumbsize:"480",inprop:"url",exintro:"1",explaintext:"1",exchars:"500",format:"json",formatversion:"2",origin:"*"}).forEach(([k,v])=>u.searchParams.set(k,v));
    const data=await getJson(u,signal);const pages=(data.query?.pages||[]).filter(p=>p.thumbnail?.source).sort((a,b)=>score(b.title,b.extract,query,clue)-score(a.title,a.extract,query,clue));const p=pages[0];return p?{imageUrl:p.thumbnail.source,pageUrl:p.fullurl,sourceName:"Wikipedia"}:null;
  }
  async function searchCommons(query,clue,signal){
    const u=new URL("https://commons.wikimedia.org/w/api.php");Object.entries({action:"query",generator:"search",gsrsearch:`${query} ${keywords(clue).join(" ")}`,gsrnamespace:"6",gsrlimit:"20",prop:"imageinfo",iiprop:"url|mime|extmetadata",iiurlwidth:"480",format:"json",formatversion:"2",origin:"*"}).forEach(([k,v])=>u.searchParams.set(k,v));
    const data=await getJson(u,signal);const list=[];for(const p of data.query?.pages||[]){const i=p.imageinfo?.[0];if(!i?.mime?.startsWith("image/"))continue;const body=Object.values(i.extmetadata||{}).map(v=>stripHtml(v?.value)).join(" ");list.push({p,i,s:score(p.title,body,query,clue)})}list.sort((a,b)=>b.s-a.s);const x=list[0];return x?{imageUrl:x.i.thumburl||x.i.url,pageUrl:x.i.descriptionurl,sourceName:"Wikimedia Commons"}:null;
  }

  window.findWordImage=async(query,clue,signal)=>{
    const key=`${query}\n${clue}`;if(cache.has(key))return cache.get(key);
    let result=null;try{result=await searchIrasutoya(query,clue,signal)}catch(e){if(e.name==="AbortError")throw e}
    if(!result)try{result=await searchWikipedia(query,clue,signal)}catch(e){if(e.name==="AbortError")throw e}
    if(!result)try{result=await searchCommons(query,clue,signal)}catch(e){if(e.name==="AbortError")throw e}
    cache.set(key,result);return result;
  };
  window.clearWordImageCache=()=>cache.clear();
})();
