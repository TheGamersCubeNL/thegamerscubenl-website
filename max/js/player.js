(()=>{'use strict';
const $=id=>document.getElementById(id);
$('year').textContent=String(new Date().getFullYear());
const menu=$('menu'),nav=$('nav');menu.addEventListener('click',()=>{let open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Sluit navigatiemenu':'Open navigatiemenu');nav.classList.toggle('open',open)});nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Open navigatiemenu');nav.classList.remove('open')}));
const audio=$('audio'),btn=$('play'),status=$('status'),pct=$('pct'),volume=$('volume'),songEl=$('song'),artistEl=$('artist'),metaEl=$('metaStatus'),cover=$('cover'),root=$('player');let coverUrl='',coverRequest=0,lastWidgetSong='';audio.volume=.75;
function setStatus(msg,error=false){status.textContent=msg;status.classList.toggle('error',error)}
function ui(playing){root.classList.toggle('playing',playing);$('playText').textContent=playing?'PAUZEER RADIO':'LUISTER LIVE';$('playSymbol').textContent=playing?'Ⅱ':'▶';btn.setAttribute('aria-label',playing?'Pauzeer MAX HITRADIO':'Start MAX HITRADIO')}
btn.addEventListener('click',async()=>{
  const cs=castSession();
  if(cs){
    const media=cs.getMediaSession();
    if(media&&media.playerState===chrome.cast.media.PlayerState.PLAYING){media.pause(new chrome.cast.media.PauseRequest(),()=>ui(false),()=>{});return}
    if(media){media.play(new chrome.cast.media.PlayRequest(),()=>ui(true),()=>{});return}
    loadOnCast();return;
  }
  if(!audio.paused){audio.pause();return}btn.disabled=true;setStatus('Verbinden met MAX HITRADIO…');try{await audio.play()}catch{ui(false);setStatus('Afspelen is niet gelukt. Controleer je verbinding of open de stream rechtstreeks.',true)}finally{btn.disabled=false}});
audio.addEventListener('playing',()=>{if(casting)return;ui(true);setStatus('Je luistert naar MAX HITRADIO.')});audio.addEventListener('pause',()=>{if(casting)return;ui(false);setStatus('De uitzending is gepauzeerd.')});audio.addEventListener('waiting',()=>setStatus('Even bufferen…'));audio.addEventListener('stalled',()=>setStatus('De stream reageert traag…'));audio.addEventListener('error',()=>{ui(false);setStatus('De stream is tijdelijk niet bereikbaar. Probeer het opnieuw.',true)});volume.addEventListener('input',()=>{audio.volume=Number(volume.value)/100;pct.textContent=volume.value+'%';const media=castSession()&&castSession().getMediaSession();if(media){try{media.setVolume(new chrome.cast.media.VolumeRequest(new chrome.cast.Volume(audio.volume)),()=>{},()=>{})}catch{}}});
const STREAM=audio.getAttribute('src');
let castCtx=null,casting=false,nowTrack={title:'MAX HITRADIO',artist:'De grootste hits, altijd aan'};
const castBtn=$('castBtn'),airBtn=$('airBtn'),castNote=$('castNote');
function castSession(){try{return castCtx&&castCtx.getCurrentSession()}catch{return null}}
function loadOnCast(){
  const cs=castSession();
  if(!cs)return;
  audio.pause();
  casting=true;
  const info=new chrome.cast.media.MediaInfo(STREAM,'audio/mpeg');
  info.streamType=chrome.cast.media.StreamType.LIVE;
  const md=new chrome.cast.media.MusicTrackMediaMetadata();
  md.title=nowTrack.title;md.artist=nowTrack.artist;md.albumName='MAX HITRADIO';
  info.metadata=md;
  const request=new chrome.cast.media.LoadRequest(info);
  request.autoplay=true;
  const name=cs.getCastDevice&&cs.getCastDevice()&&cs.getCastDevice().friendlyName;
  cs.loadMedia(request).then(()=>{
    ui(true);
    setStatus(name?'Je luistert via '+name+'.':'Je luistert via Cast.');
    if(castNote)castNote.textContent=name?'Verbonden met '+name:'Verbonden';
    castBtn.classList.add('on');castBtn.textContent='Stop cast';
  }).catch(()=>{casting=false;setStatus('Casten is niet gelukt. De stream speelt lokaal.',true)});
}
window.__onGCastApiAvailable=function(ok){
  if(!ok||!window.cast||!cast.framework)return;
  castCtx=cast.framework.CastContext.getInstance();
  castCtx.setOptions({receiverApplicationId:chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID,autoJoinPolicy:chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED});
  castCtx.addEventListener(cast.framework.CastContextEventType.SESSION_STATE_CHANGED,ev=>{
    const started=ev.sessionState===cast.framework.SessionState.SESSION_STARTED;
    const on=started||ev.sessionState===cast.framework.SessionState.SESSION_RESUMED;
    castBtn.classList.toggle('on',on);
    if(started)loadOnCast();
    if(ev.sessionState===cast.framework.SessionState.SESSION_ENDED){casting=false;castBtn.textContent='Cast';if(castNote)castNote.textContent='';ui(!audio.paused);setStatus('Cast gestopt.');}
  });
};
castBtn.addEventListener('click',()=>{
  if(!castCtx){setStatus('Cast werkt in Chrome als er een Chromecast of speaker in de buurt is.',true);return}
  const cs=castSession();
  if(cs){cs.endSession(true);return}
  castCtx.requestSession().catch(()=>setStatus('Geen Cast-apparaat gekozen.',true));
});
if(audio.remote&&audio.remote.watchAvailability){
  audio.disableRemotePlayback=false;
  audio.remote.watchAvailability(av=>{airBtn.hidden=!av}).catch(()=>{});
  airBtn.addEventListener('click',()=>audio.remote.prompt().catch(()=>setStatus('AirPlay is nu niet beschikbaar.',true)));
}else if(typeof audio.webkitShowPlaybackTargetPicker==='function'){
  airBtn.hidden=false;
  airBtn.addEventListener('click',()=>audio.webkitShowPlaybackTargetPicker());
}
function updateMedia(track){if(!('mediaSession' in navigator)||!('MediaMetadata' in window))return;try{navigator.mediaSession.metadata=new MediaMetadata({title:track?.title||'MAX HITRADIO',artist:track?.artist||'De grootste hits, altijd aan',album:'MAX HITRADIO LIVE'});}catch{}}
updateMedia();if('mediaSession' in navigator){try{navigator.mediaSession.setActionHandler('play',()=>audio.play().catch(()=>{}));navigator.mediaSession.setActionHandler('pause',()=>audio.pause())}catch{}}
const source=$('stream_info_song'),statusSource=$('stream_info_status'),listenerSource=$('stream_info_listeners');
function parseSong(raw){const text=raw.trim();if(!text||/^(loading|laden|unknown|onbekend|[-–—])([.\s]*$)/i.test(text))return null;const sep=text.indexOf(' - ');return sep>0?{artist:text.slice(0,sep).trim(),title:text.slice(sep+3).trim()}:{artist:'',title:text}}
function setCover(url){let safe='';try{const u=new URL(url);if(u.protocol==='https:')safe=u.href}catch{}if(safe===coverUrl)return;coverUrl=safe;cover.hidden=true;cover.removeAttribute('src');if(safe){cover.onload=()=>{cover.hidden=false};cover.onerror=()=>{cover.hidden=true};cover.src=safe}}
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\([^)]*\)|\[[^\]]*\]/g,' ').replace(/[^a-z0-9]+/g,' ').trim();
async function loadArtwork(track){const request=++coverRequest;setCover('');if(!track.artist||!track.title)return;try{const url=new URL('https://itunes.apple.com/search');url.searchParams.set('term',track.artist+' '+track.title);url.searchParams.set('entity','song');url.searchParams.set('limit','8');const res=await fetch(url.href,{cache:'no-store'});if(!res.ok)throw Error('Unavailable');const json=await res.json();if(request!==coverRequest)return;const a=norm(track.artist),t=norm(track.title);const match=(json.results||[]).find(r=>{const ra=norm(r.artistName),rt=norm(r.trackName);return ra&&rt&&(ra===a||ra.includes(a)||a.includes(ra))&&(rt===t||rt.includes(t)||t.includes(rt))});if(match?.artworkUrl100)setCover(match.artworkUrl100.replace(/100x100bb(?=\.)/,'600x600bb'))}catch{if(request===coverRequest)setCover('')}}
function updateFromWidget(){const raw=source.textContent||'',track=parseSong(raw),state=(statusSource.dataset.state||'').toLowerCase(),listeners=(listenerSource.textContent||'').trim();if(track){nowTrack=track;songEl.textContent=track.title;artistEl.textContent=track.artist||'MAX HITRADIO';if(raw!==lastWidgetSong){lastWidgetSong=raw;loadArtwork(track);updateMedia(track)}}if(state==='off')metaEl.textContent='CloudRadio meldt momenteel OFF AIR.';else if(track)metaEl.textContent='Nummerinformatie via CloudRadio'+(/^\d+$/.test(listeners)?` · ${listeners} luisteraars`:'');else metaEl.textContent='Wachten op nummerinformatie van CloudRadio…'}
const mo=new MutationObserver(updateFromWidget);for(const node of [source,statusSource,listenerSource])mo.observe(node,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['data-state']});updateFromWidget();
})();
