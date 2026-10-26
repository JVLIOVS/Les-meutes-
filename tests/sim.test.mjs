import test from 'node:test';
import assert from 'node:assert/strict';
import {CityGame,route} from '../web/sim.js';
import {GATES,SERVICES,ARMOR} from '../web/data.js';
const step=(g,s)=>{for(let i=0;i<Math.ceil(s*30);i++)g.update(1/30);};
function build(g,type,plot){const p=plot??g.services.find(s=>s.state==='empty'||s.state==='ruin');assert.notEqual(g.buildService(type,p.x,p.y),null,type);step(g,4.1);return g.service(type);}
function base(g){build(g,'command');build(g,'academy');build(g,'workshop');}
test('a new game contains exactly one building: the presidential palace, plus nine empty plots',()=>{
 for(let level=0;level<6;level++){const g=new CityGame(level);assert.equal(g.buildings.length,1);assert.equal(g.buildings[0].id,3);assert.equal(g.builtCount,1);assert.equal(g.primary.name,'PALAIS PRÉSIDENTIEL');assert.equal(g.services.length,9);assert.ok(g.services.every(s=>s.state==='empty'&&!s.type));assert.equal(g.units.length,0);assert.equal(g.integrity,100);}
});
test('construction pays once, needs a real empty plot and unlocks troops after four seconds',()=>{
 const g=new CityGame();assert.equal(g.startWave(),false);assert.equal(g.place('patrol',6,3),null);assert.equal(g.buildService('command',9,9),null);const p=g.services[0];assert.equal(g.buildService('command',p.x,p.y),p.id);assert.equal(g.money,900);assert.equal(g.buildService('command',p.x,p.y),null);step(g,3);assert.equal(g.service('command'),undefined);step(g,1.1);assert.ok(g.place('patrol',6,3));assert.equal(g.builtCount,2);
});
test('all nine constructible types have a purpose, and housing, trade and mediation pay their income',()=>{
 const g=new CityGame(5);for(const type of Object.keys(SERVICES))build(g,type);assert.equal(g.services.filter(s=>s.state==='built').length,9);g.wave=1;assert.equal(g.waveReward(),175+35+65+45);for(const s of g.services)assert.ok(SERVICES[s.type].desc.length>20);
});
test('the clinic heals ground units within its radius',()=>{
 const g=new CityGame();build(g,'command');const clinic=build(g,'clinic');const id=g.place('patrol',clinic.access.x,clinic.access.y);const u=g.units.find(u=>u.id===id);u.hp=50;step(g,2);assert.ok(u.hp>57.99);assert.ok(u.healUntil>g.time-.1);
});
test('helicopters require aerial centre tier two and apply actual pressure and slowing to a dense crowd',()=>{
 const g=new CityGame(5);for(const type of ['command','academy','workshop','depot','lab'])build(g,type);assert.equal(g.place('helicopter',9,9),null);const lab=g.service('lab');assert.ok(g.upgradeService(lab.id));step(g,6.1);const id=g.place('helicopter',9,9);assert.ok(id);g.wave=1;for(let i=0;i<24;i++){g.spawn({gate:0,release:0,group:1});Object.assign(g.crowd.at(-1),{state:'march',x:9+(i%5)*.1,y:9+Math.floor(i/5)*.1});}const hp=g.crowd.reduce((n,p)=>n+p.hp,0);g.updateUnits(.05);assert.ok(g.crowd.reduce((n,p)=>n+p.hp,0)<hp);assert.equal(g.crowd.filter(p=>p.slow>0).length,18);assert.ok(g.effects.some(e=>e.kind==='airnet'));assert.ok(g.moveUnit(id,15,15));assert.deepEqual(g.units.at(-1).path,[{x:15,y:15}]);
});
test('facade armor absorbs damage before the structure and has separate repair and workshop gates',()=>{
 const g=new CityGame(5),p=g.primary;assert.ok(g.reinforce(3));assert.equal(p.armorHp,120);const hp=p.hp;g.damageBuilding(p,80);assert.equal(p.hp,hp);assert.equal(p.armorHp,40);assert.ok(g.repairArmor(3));assert.equal(p.armorHp,120);assert.equal(g.reinforce(3),false);base(g);assert.ok(g.reinforce(3));assert.equal(p.armorMax,260);assert.equal(g.reinforce(3),false);assert.ok(g.upgradeService(g.service('workshop').id));step(g,6.1);assert.ok(g.reinforce(3));assert.equal(p.armorMax,440);g.damageBuilding(p,450);assert.equal(p.armorHp,0);assert.equal(p.hp,hp-10);assert.ok(g.repairArmor(3));assert.ok(p.armorHp>0);assert.equal(g.reinforce(3),false);
});
test('player-constructed services also receive destructible facade protections',()=>{
 const g=new CityGame();const c=build(g,'command');assert.ok(g.reinforce(c.id));g.damageBuilding(c,50);assert.equal(c.hp,c.maxHp);assert.equal(c.armorHp,70);g.damageBuilding(c,310);assert.equal(c.hp,0);assert.equal(c.state,'ruin');assert.equal(g.place('patrol',9,3),null);assert.equal(g.buildService('command',c.x,c.y),c.id);step(g,4.1);assert.ok(g.service('command'));
});
test('building repair pauses under attack and never regenerates facade armor for free',()=>{
 const g=new CityGame();build(g,'command');build(g,'workshop');const p=g.primary;g.reinforce(3);g.damageBuilding(p,200);const hp=p.hp;assert.ok(g.queueRepair(3));const remaining=g.repairJobs[0].remaining;g.updateConstruction(.05);assert.equal(p.hp,hp);assert.equal(g.repairJobs[0].remaining,remaining);p.flash=0;g.updateConstruction(.05);assert.ok(p.hp>hp);assert.equal(p.armorHp,0);
});
test('crowd impacts have real damage, facing targets, strike poses, particles and building shake',()=>{
 const g=new CityGame();g.spawn({gate:0,release:0,group:1});const p=g.crowd[0];Object.assign(p,{state:'march',x:15,y:12,target:3});const hp=g.primary.hp;g.updateCrowd(.05);assert.ok(g.primary.hp<hp);assert.ok(p.attackUntil>g.time);assert.deepEqual(p.attackTarget,{x:14,y:12});assert.ok(g.primary.shakeUntil>g.time);assert.ok(g.effects.some(e=>e.kind==='smash'));
});
test('police intervention and crowd movement carry animation state without changing their combat rules',()=>{
 const g=new CityGame();base(g);const id=g.place('shield',15,12);g.spawn({gate:0,release:0,group:1});const p=g.crowd[0];Object.assign(p,{state:'march',x:15,y:11.4,target:3});g.updateUnits(.05);assert.ok(g.units.find(u=>u.id===id).actionUntil>g.time);assert.ok(g.effects.some(e=>e.kind==='shield'));p.x=3;p.y=-6.3;p.stun=0;p.pathVersion=-1;g.time=10;g.updateCrowd(.05);assert.ok(p.moving);
});
test('approaches remain seven tiles longer, and roads recalculate around barricades',()=>{
 const old=[{x:3,y:0},{x:18,y:9},{x:9,y:18},{x:0,y:15}];for(let i=0;i<4;i++)assert.equal(route(GATES[i],{x:15,y:12}).length-route(old[i],{x:15,y:12}).length,7);
 const path=route({x:3,y:3},{x:9,y:3},[{x:6,y:3,hp:100}]);assert.ok(path.length>6);assert.ok(!path.some(p=>p.x===6&&p.y===3));
});
test('the palace can survive below 25 percent; loss begins at zero and the crowd then actually crosses the door',()=>{
 const g=new CityGame();build(g,'command');g.startWave();g.primary.hp=10;g.update(1/30);assert.equal(g.phase,'wave');g.primary.hp=0;g.trust=0;g.update(1/30);assert.equal(g.phase,'breach');assert.equal(g.breach.enteredCount,0);step(g,2.5);assert.equal(g.breach.enteredCount,48);assert.ok(g.breach.actors.every(p=>p.inside&&p.y<13.85));assert.equal(g.breach.leader.captured,false);step(g,.4);assert.equal(g.breach.leader.captured,true);assert.ok(g.breach.leader.y<14.05);step(g,1.6);assert.equal(g.phase,'breach');assert.ok(g.breach.leader.y>14.05);step(g,.4);assert.equal(g.phase,'lost');assert.match(g.reason,/pénétré dans le palais/);
});
test('save and reload preserve construction, armor, helicopters and the exact interior sequence state',()=>{
 const g=new CityGame(5);base(g);g.reinforce(3);const snap=JSON.parse(JSON.stringify(g.snapshot())),h=CityGame.restore(snap);step(g,2);step(h,2);assert.deepEqual(g.snapshot(),h.snapshot());g.primary.hp=0;g.beginBreach();step(g,2);const resumed=CityGame.restore(JSON.parse(JSON.stringify(g.snapshot())));step(g,.5);step(resumed,.5);assert.deepEqual(g.breach,resumed.breach);snap.buildings[0].x=900;assert.throws(()=>CityGame.restore(snap));
});
test('prototype two saves lose the three imposed buildings, keep player services and retarget old crowds',()=>{
 const g=new CityGame();build(g,'command');const old=g.snapshot();old.schema=2;old.services=old.services.slice(0,6);old.buildings.unshift(...[0,1,2].map(id=>({id,x:6,y:6,hp:100,maxHp:220,protection:0,access:{x:6,y:3}})));g.spawn({gate:0,release:0,group:1});old.crowd=structuredClone(g.crowd);old.crowd[0].target=0;const h=CityGame.restore(old);assert.equal(h.buildings.length,1);assert.equal(h.services.length,9);assert.ok(h.service('command'));assert.equal(h.crowd[0].target,3);assert.equal(h.snapshot().schema,3);
});
test('one ordinary construction and deployment strategy completes all three opening waves',()=>{
 const g=new CityGame();base(g);g.place('shield',15,12);g.place('patrol',15,11);g.place('shield',6,3);g.place('patrol',5,3);g.setOrder('intercept');let prepared=-1;
 for(let i=0;i<30*600&&!['won','lost'].includes(g.phase);i++){if(['prepare','interval'].includes(g.phase)){if(prepared!==g.wave){prepared=g.wave;g.reinforce(3);for(const u of g.units)g.repair('unit',u.id);if(g.wave>0){const a=g.service('academy');g.upgradeService(a.id);}}if(g.phase==='prepare')g.startWave();}g.update(1/30);}
 assert.equal(g.phase,'won',g.reason);assert.equal(g.wave,3);assert.equal(g.stats.dispersed,108);
});
