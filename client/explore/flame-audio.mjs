// Original procedural sound: low fire noise with sparse, soft crackles.
// It shares the user-unlocked audio context and Sound preference with music.
export function flameMix(sites,player,yaw){
 return sites.map(site=>{
  const dx=site.x-player.x,dz=site.z-player.z,distance=Math.hypot(dx,dz,site.y-1.65);
  const proximity=Math.max(0,Math.min(1,(4.8-distance)/3.5));
  return {site,distance,level:.20*proximity*proximity,pan:Math.max(-.85,Math.min(.85,(dx*Math.cos(yaw)+dz*Math.sin(yaw))/Math.max(1,distance)))};
 }).sort((a,b)=>a.distance-b.distance).slice(0,2);
}
export function fireSamples(sampleRate,seconds=9){
 const data=new Float32Array(Math.round(sampleRate*seconds));let seed=19173,brown=0;
 const random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
 for(let i=0;i<data.length;i++){brown=(brown+(random()*2-1)*.025)/1.023;data[i]=brown*.42;}
 for(let n=0;n<seconds*6;n++){
  const start=Math.floor(random()*(data.length-sampleRate*.09)),length=Math.floor(sampleRate*(.009+random()*.045)),amplitude=.035+random()*.09;
  for(let j=0;j<length;j++)data[start+j]+=(random()*2-1)*Math.exp(-j/(length*.18))*amplitude;
 }
 const fade=Math.round(sampleRate*.06);for(let i=0;i<fade;i++){data[i]*=i/fade;data[data.length-1-i]*=i/fade;}
 return data;
}
export class FlameAudio{
 constructor(music,sites){this.music=music;this.sites=sites;this.voices=[];this.levels=[0,0];this.last=-Infinity;this.stopped=false;}
 prepare(){
  const context=this.music.context;if(!context||this.voices.length||this.stopped)return;
  const data=fireSamples(context.sampleRate),buffer=context.createBuffer(1,data.length,context.sampleRate);buffer.copyToChannel(data,0);
  for(let i=0;i<2;i++){
   const source=context.createBufferSource(),filter=context.createBiquadFilter(),gain=context.createGain(),pan=context.createStereoPanner?.();
   source.buffer=buffer;source.loop=true;filter.type='lowpass';filter.frequency.value=3600;gain.gain.value=0;source.connect(filter).connect(gain);if(pan)gain.connect(pan).connect(context.destination);else gain.connect(context.destination);source.start(0,i*3.71);this.voices.push({source,gain,pan});
  }
 }
 update(player,yaw,inHall,visible,now){
  if(this.stopped||now-this.last<.08)return;this.last=now;
  if(this.music.started&&this.music.enabled)this.prepare();
  const mix=flameMix(this.sites,player,yaw),context=this.music.context;
  this.levels=[0,1].map(i=>this.music.enabled&&inHall&&visible&&this.voices.length>0?(mix[i]?.level||0):0);
  for(let i=0;i<this.voices.length;i++){this.voices[i].gain.gain.setTargetAtTime(this.levels[i],context.currentTime,.15);this.voices[i].pan?.pan.setTargetAtTime(mix[i]?.pan||0,context.currentTime,.15);}
 }
 silence(){for(const voice of this.voices)voice.gain.gain.setTargetAtTime(0,this.music.context.currentTime,.03);this.levels=[0,0];}
 stop(){this.silence();for(const voice of this.voices){voice.source.stop();voice.source.disconnect();voice.gain.disconnect();voice.pan?.disconnect();}this.voices=[];this.stopped=true;}
}
