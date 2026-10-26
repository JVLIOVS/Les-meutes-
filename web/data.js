export const SIZE=19;
export const EDGE_MIN=-7,EDGE_MAX=25,SPAN=33;
export const DISTRICTS=[
  {id:0,name:'Les Lisières',subtitle:'Tenir les portes',category:'HABITATIONS',color:'#a9d8c2',waves:3,base:24,budget:1000,objective:'Un palais. Tout le reste est à bâtir : commandement, logements, commerces et protections.',types:['walker','runner'],entrances:[0,1],primary:'PALAIS D’AZUR',xp:100},
  {id:1,name:'Les Arcades',subtitle:'Protéger la vie locale',category:'COMMERCES',color:'#f3c48b',waves:4,base:30,budget:1110,objective:'Protégez les commerces. La foule arrive de trois artères.',types:['walker','runner','heavy'],entrances:[0,1,2],primary:'HALLES DES ARCADES',xp:140},
  {id:2,name:'Grand Marché',subtitle:'Une ville, plusieurs fronts',category:'GRANDS MAGASINS',color:'#eab2b8',waves:4,base:36,budget:1220,objective:'Les attroupements se divisent. Coupez les accès sans vous enfermer.',types:['walker','runner','heavy','builder'],entrances:[0,1,2,3],primary:'GALERIES DU CANAL',xp:180},
  {id:3,name:'Place Civique',subtitle:'La pression monte',category:'INSTITUTIONS',color:'#afbfef',waves:5,base:42,budget:1330,objective:'Défendez la maison civique et ses rues. Gardez la confiance de la ville.',types:['walker','runner','heavy','builder','slinger'],entrances:[0,1,2,3],primary:'MAISON CIVIQUE',xp:220},
  {id:4,name:'Le Bastion',subtitle:'Tenir sous pression',category:'COMMISSARIAT',color:'#a6cddd',waves:5,base:50,budget:1440,objective:'Vos renforts peuvent être isolés par des obstacles adverses.',types:['walker','runner','heavy','builder','slinger','saboteur'],entrances:[0,1,2,3],primary:'CENTRE DE SECOURS',xp:270},
  {id:5,name:'Palais d’Azur',subtitle:'Le dernier périmètre',category:'PRÉSIDENCE FICTIVE',color:'#ead89c',waves:6,base:60,budget:1550,objective:'Protégez le palais et les quartiers alentour. Plusieurs rassemblements convergent.',types:['walker','runner','heavy','builder','slinger','saboteur'],entrances:[0,1,2,3],primary:'PALAIS D’AZUR',xp:350},
];
export const EQUIPMENT={
  patrol:{name:'Patrouille',short:'Patrouille',cost:75,unlock:0,range:1.9,power:20,hp:150,color:'#75bdf1',icon:'squad',desc:'4 agents mobiles · disperse les groupes proches.',unit:true},
  shield:{name:'Ligne de boucliers',short:'Boucliers',cost:100,unlock:0,range:1.5,power:16,hp:300,color:'#a0c6e8',icon:'shield',desc:'5 agents résistants · ralentit la poussée de la foule.',unit:true},
  barrier:{name:'Barricade',short:'Barrage',cost:40,unlock:0,hp:180,color:'#efc279',icon:'barrier',desc:'Ferme une rue. La foule se détourne ou tente de la briser.'},
  net:{name:'Filet de contrôle',short:'Filet',cost:35,unlock:0,range:1.7,color:'#a0e7d2',icon:'net',desc:'Zone temporaire · ralentit et disperse pendant 28 secondes.'},
  water:{name:'Fourgon à eau',short:'Fourgon',cost:155,unlock:1,range:3.4,power:15,hp:240,color:'#7cdaed',icon:'water',desc:'Jet large · repousse et disperse plusieurs personnes.',unit:true},
  mediation:{name:'Équipe de médiation',short:'Médiation',cost:85,unlock:1,range:3,power:8,hp:130,color:'#a7d5af',icon:'voice',desc:'Apaise une zone · restaure de la confiance sans choc.',unit:true},
  drone:{name:'Drone à filet',short:'Drone',cost:130,unlock:2,range:3.2,power:11,hp:110,color:'#cebcf2',icon:'drone',desc:'Survole les obstacles · immobilise de petits groupes.',unit:true},
  impulse:{name:'Grenade à impulsion',short:'Impulsion',cost:40,unlock:0,range:2.3,color:'#f3bd97',icon:'pulse',desc:'Contrôle immédiat · recul et étourdissement, réserve 8 s.'},
  helicopter:{name:'Hélicoptère de soutien',short:'Hélico',cost:240,unlock:0,range:5,power:7,hp:210,color:'#e7d393',icon:'helicopter',desc:'Centre aérien niv. 2 · rejoint les fortes concentrations, projecteur et filets de zone.',unit:true},
};
export const CROWD={
  walker:{name:'Marcheurs agités',hp:48,speed:.92,color:'#ed9d80',damage:1.5},
  runner:{name:'Coureurs',hp:36,speed:1.55,color:'#f0c779',damage:1.1},
  heavy:{name:'Groupes déterminés',hp:110,speed:.72,color:'#bf7388',damage:2.8},
  builder:{name:'Barricadiers',hp:65,speed:.9,color:'#a4a2cc',damage:1.7},
  slinger:{name:'Lanceurs',hp:55,speed:.9,color:'#d5a477',damage:1.4},
  saboteur:{name:'Saboteurs',hp:75,speed:1,color:'#b883ba',damage:3.2},
};
export const GATES=[{x:3,y:-7,name:'Gare du nord'},{x:25,y:9,name:'Quai est'},{x:9,y:25,name:'Parvis sud'},{x:-7,y:15,name:'Place ouest'}];
export const road=(x,y)=>x>=EDGE_MIN&&y>=EDGE_MIN&&x<=EDGE_MAX&&y<=EDGE_MAX&&([3,9,15].includes(x)||[3,9,15].includes(y));
export const key=(x,y)=>`${Math.round(x)},${Math.round(y)}`;
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function buildings(level){return [{id:3,x:12,y:12,access:{x:15,y:12},name:'PALAIS PRÉSIDENTIEL',kind:'civic',color:'#d0ccbd',h:3.7,hp:720,maxHp:720,protection:0,armorHp:0,armorMax:0,primary:true}];}
export const FORTIFICATIONS=['Aucune protection','Volets renforcés','Grilles de façade','Périmètre sécurisé'];
export const ARMOR=[0,120,260,440];

export const SERVICES={
 command:{name:'Poste de commandement',short:'Commandement',cost:100,color:'#91bdda',icon:'squad',requires:[],desc:'Débloque les patrouilles. Ses niveaux permettent de former de meilleures équipes.',unlock:['patrol']},
 academy:{name:'Académie de protection',short:'Académie',cost:120,color:'#9aabdb',icon:'shield',requires:['command'],desc:'Débloque les boucliers et les impulsions. Forme les escouades avancées.',unlock:['shield','impulse']},
 workshop:{name:'Chantier de reconstruction',short:'Chantier',cost:100,color:'#e0bc80',icon:'repair',requires:['command'],desc:'Des bâtisseurs réparent automatiquement la ville. Débloque la restauration et les barricades avancées.',unlock:[]},
 depot:{name:'Centre logistique',short:'Logistique',cost:170,color:'#82cbd5',icon:'water',requires:['command','workshop'],desc:'Débloque les fourgons à eau et les filets de contrôle.',unlock:['water','net']},
 lab:{name:'Centre aérien',short:'Centre aérien',cost:180,color:'#c4a8dc',icon:'drone',requires:['academy','depot'],desc:'Drones à filet au niveau 1. Hélicoptères de soutien au niveau 2.',unlock:['drone','helicopter']},
 civic:{name:'Maison de médiation',short:'Médiation',cost:100,color:'#a0cda6',icon:'voice',requires:['command'],desc:'Débloque les médiateurs, restaure la confiance et génère une prime à chaque accalmie.',unlock:['mediation']},
 housing:{name:'Quartier résidentiel',short:'Habitations',cost:90,color:'#d4aa95',icon:'city',requires:['command'],desc:'+35 crédits par niveau à chaque vague contenue. Reconstruit les habitations du pays.',unlock:[]},
 market:{name:'Halles commerciales',short:'Commerces',cost:130,color:'#c2bd8f',icon:'coin',requires:['command'],desc:'+65 crédits par niveau à chaque vague contenue. Finance vos nouveaux services.',unlock:[]},
 clinic:{name:'Centre de secours',short:'Secours',cost:120,color:'#a6cebb',icon:'heart',requires:['command'],desc:'Soigne les unités au sol à quatre cases : 4 PV/s par niveau, 2 PV/s pendant les vagues.',unlock:[]},
};
export const SERVICE_PLOTS=[{x:6,y:1},{x:1,y:6},{x:17,y:6},{x:1,y:12},{x:6,y:17},{x:17,y:12},{x:6,y:6,access:{x:6,y:3}},{x:12,y:6,access:{x:12,y:3}},{x:6,y:12,access:{x:6,y:9}}];
export function servicePlots(){return SERVICE_PLOTS.map((p,i)=>({...p,id:100+i,type:null,state:'empty',tier:0,hp:0,maxHp:240,progress:0,protection:0,armorHp:0,armorMax:0,access:p.access??{x:p.x<3?3:p.x>15?15:p.x,y:p.y<3?3:p.y>15?15:p.y}}));}
export const serviceFor=type=>Object.keys(SERVICES).find(k=>SERVICES[k].unlock.includes(type));
