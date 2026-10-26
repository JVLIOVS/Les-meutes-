import test from 'node:test';
import assert from 'node:assert/strict';
import {AudioFx} from '../web/audio.js';
test('the original score schedules drums and tonal layers and respects pause and music mute',()=>{
 const score=new AudioFx();const notes=[];score.tone=(...a)=>notes.push(['tone',...a]);score.hiss=(...a)=>notes.push(['noise',...a]);score.ctx={currentTime:0,state:'running'};score.mood='wave';score.schedule();assert.ok(notes.some(n=>n[0]==='tone'));assert.ok(notes.some(n=>n[0]==='noise'));
 notes.length=0;score.ctx.currentTime=1;score.mood='pause';score.schedule();assert.equal(notes.length,0);score.mood='wave';score.music=false;score.ctx.currentTime=2;score.schedule();assert.equal(notes.length,0);
});
