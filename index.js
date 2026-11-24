require("dotenv").config();
const {default:makeWASocket, useMultiFileAuthState, DisconnectReason, downloadMediaMessage} = require("@whiskeysockets/baileys");
const pino = require("pino");
const fs = require("fs");
const axios = require("axios");
const readline = require("readline");
const CREATOR_NAME="Bawihpuia";
const CREATOR="919233092990@s.whatsapp.net";
const GEMINI_KEY=process.env.GEMINI_API_KEY;
let isPublic=true, startTime=Date.now();
let blackList=new Set(JSON.parse(fs.existsSync("black.json")?fs.readFileSync("black.json"):"[]"));
let quizState={}, ttcState={}, riddleState={}, pendingInvite={}, sentCache={};
global.statusCache=[];
const saveBlack=()=>fs.writeFileSync("black.json",JSON.stringify([...blackList]));
const pick=a=>a[Math.floor(Math.random()*a.length)];
const getText=m=>m.message?.conversation||m.message?.extendedTextMessage?.text||m.message?.imageMessage?.caption||m.message?.videoMessage?.caption||"";
const getMention=(text,msg)=>{let c=msg.message?.extendedTextMessage?.contextInfo; if(c?.mentionedJid?.length) return c.mentionedJid[0]; if(c?.participant) return c.participant; return null;};
const getName=async(sock,jid,gid)=>{try{if(gid){let m=await sock.groupMetadata(gid); let p=m.participants.find(x=>x.id===jid); return p?.name||jid.split("@")[0];} return jid.split("@")[0];}catch{return jid.split("@")[0];}};

// --- QUIZ 90 MIX ---
const QUIZ_Q=[
{q:"Mizoram khawpui ber eng nge?",a:"Aizawl",hint:"Ai",cat:"GK",learn:"Mizoram khawpui chu Aizawl a ni."},
{q:"Mizoram a tlang sang ber?",a:"Phawngpui",hint:"Ph",cat:"Mizo History",learn:"Phawngpui hi 2157m, Blue Mountain an ti."},
{q:"Mizo hla phuahtu 'Zoram Khawvel' titu?",a:"Lalhlupuia",hint:"La",cat:"Mizo Hla Phuahtu",learn:"Lalhlupuia hi hla phuahtu ropui."},
{q:"Bible lehkhabu hmasa ber?",a:"Genesis",hint:"Ge",cat:"Bible",learn:"Genesis hi Thuthlung Hlui lehkhabu hmasa."},
{q:"Isua piangna khua?",a:"Bethlehem",hint:"Be",cat:"Bible",learn:"Bethlehem ah Isua a piang."},
{q:"Isua zirtir 12 zing a sum enkawltu?",a:"Judas",hint:"Ju",cat:"Bible",learn:"Judas in Isua a betray."},
{q:"Bible ah Sam ziaktu ropui?",a:"Davida",hint:"Da",cat:"Bible",learn:"Davida lal in Sam tam tak a ziak."},
{q:"2+2x3=?",a:"8",hint:"8",cat:"Math",learn:"2x3=6, 2+6=8."},
{q:"10x10=?",a:"100",hint:"10",cat:"Math",learn:"10x10=100."},
{q:"15-7=?",a:"8",hint:"8",cat:"Math",learn:"15-7=8."},
{q:"100/4=?",a:"25",hint:"25",cat:"Math",learn:"100/4=25."},
{q:"3x3x3=?",a:"27",hint:"27",cat:"Math",learn:"3 cube=27."},
{q:"Water formula?",a:"H2O",hint:"H2",cat:"Science",learn:"Hydrogen 2 + Oxygen 1."},
{q:"O2 chu eng gas?",a:"Oxygen",hint:"Ox",cat:"Science",learn:"Oxygen hi thaw nan pawimawh."},
{q:"Thlai in ei tur an siamna process?",a:"Photosynthesis",hint:"Ph",cat:"Science",learn:"Ni eng hmang in thlai in ei tur an siam."},
{q:"Mihring ruh zat?",a:"206",hint:"20",cat:"Science",learn:"Puitling ah ruh 206."},
{q:"Planet lian ber?",a:"Jupiter",hint:"Ju",cat:"Planet",learn:"Jupiter hi planet lian ber."},
{q:"Sun bul ber planet?",a:"Mercury",hint:"Me",cat:"Planet",learn:"Mercury hi ni bul ber."},
{q:"Khawvel hnaih ber planet?",a:"Venus",hint:"Ve",cat:"Planet",learn:"Venus hi Earth hnaih ber."},
{q:"Planet sen?",a:"Mars",hint:"Ma",cat:"Planet",learn:"Mars = Red Planet."},
{q:"Thla ah kal hmasa ber?",a:"Neil Armstrong",hint:"Ne",cat:"Khawvel Mi Ropui",learn:"1969 ah thla a rap hmasa."},
{q:"India zalenna pa?",a:"Gandhi",hint:"Ga",cat:"Khawvel Mi Ropui",learn:"Gandhi in India zalenna a hruai."},
{q:"India PM hmasa ber?",a:"Nehru",hint:"Ne",cat:"GK",learn:"Nehru hi PM hmasa ber."},
{q:"Mizoram University khawi ah?",a:"Aizawl",hint:"Ai",cat:"University",learn:"Tanhril, Aizawl ah a awm."},
{q:"Mizoram University din kum?",a:"2001",hint:"20",cat:"University",learn:"2001 ah din."},
{q:"School: A B C zawh a eng nge?",a:"D",hint:"D",cat:"School",learn:"Alphabet: A B C D."},
{q:"English ah 'Ka lawm e'?",a:"Thank you",hint:"Th",cat:"English-Mizo",learn:"Thank you = Ka lawm e."},
{q:"English ah 'Ka hmangaih che'?",a:"I love you",hint:"I ",cat:"English-Mizo",learn:"I love you = Ka hmangaih che."},
{q:"Mizo tawng ah 'Hello'?",a:"Chibai",hint:"Ch",cat:"English-Mizo",learn:"Chibai = Hello."},
{q:"Tawng upa: Sem sem dam dam, ei bil thi thi awmzia?",a:"Sem",hint:"Se",cat:"Tawng Upa",learn:"Sem in damna a thlen."},
{q:"Mizo hla 'Aw Zoram' phuahtu?",a:"Lalthanmawia",hint:"La",cat:"Mizo Hla Phuahtu",learn:"Lalthanmawia hi phuahtu ropui."},
{q:"Phone siamtu Apple founder?",a:"Steve Jobs",hint:"St",cat:"Phone",learn:"Steve Jobs in Apple a din."},
{q:"Samsung khawi ram company?",a:"Korea",hint:"Ko",cat:"Phone",learn:"Samsung = South Korea."},
{q:"WhatsApp siam kum?",a:"2009",hint:"20",cat:"Phone",learn:"2009 ah siam."},
{q:"Kum 1892 ah Mizo ah eng a thleng? Hint: 18",a:"1894",hint:"18",cat:"Mizo History",learn:"1894 ah missionary an lo thleng."},
{q:"Thomas-a hming bul hawrawp?",a:"T",hint:"T",cat:"Knowledge",learn:"Thomas hi T in a tan."},
{q:"Khawvel ram lian ber?",a:"Russia",hint:"Ru",cat:"GK",learn:"Russia hi area ah lian ber."},
{q:"Khawvel mi tam ber ram?",a:"India",hint:"In",cat:"GK",learn:"India hi mi tam ber."},
{q:"Mizoram district zat?",a:"11",hint:"11",cat:"GK",learn:"District 11."},
{q:"Bible: Davida fapa lal ropui?",a:"Solomona",hint:"So",cat:"Bible",learn:"Solomona = finna lal."},
{q:"Bible: Tuipui sen kaitu?",a:"Mosia",hint:"Mo",cat:"Bible",learn:"Mosia in Israel te a kai pui."},
{q:"Math: 7x8=?",a:"56",hint:"56",cat:"Math",learn:"7x8=56."},
{q:"Math: 9x9=?",a:"81",hint:"81",cat:"Math",learn:"9x9=81."},
{q:"Science: Ni eng in khawvel thleng hun?",a:"8 minute",hint:"8 ",cat:"Science",learn:"Minute 8 vel."},
{q:"Science: Mihring thisen rawng?",a:"Sen",hint:"Se",cat:"Science",learn:"Thisen a sen."},
{q:"Planet: Saturn a hriatna?",a:"Ring",hint:"Ri",cat:"Planet",learn:"Saturn ah ring ropui."},
{q:"Planet: Uranus rawng?",a:"Pawl",hint:"Pa",cat:"Planet",learn:"Uranus a pawl."},
{q:"Grammar: 'Ka kal' tense?",a:"Present",hint:"Pr",cat:"Grammar",learn:"Ka kal = present."},
{q:"Grammar: Noun entirnan?",a:"In",hint:"In",cat:"Grammar",learn:"Noun = thil hming."},
{q:"School: 1+2+3+4+5=?",a:"15",hint:"15",cat:"School",learn:"=15."},
{q:"School: English alphabet zat?",a:"26",hint:"26",cat:"School",learn:"Alphabet 26."},
{q:"English-Mizo: 'I duh em'?",a:"Do you want",hint:"Do",cat:"English-Mizo",learn:"Do you want = I duh em."},
{q:"English-Mizo: 'Ka ril a tam'?",a:"I am hungry",hint:"I ",cat:"English-Mizo",learn:"I am hungry = Ka ril a tam."},
{q:"Mizo History: Mizo hnam hmasa?",a:"Lusei",hint:"Lu",cat:"Mizo History",learn:"Lusei hi Mizo hnam bul."},
{q:"Mizo History: Chapchar Kut hun?",a:"March",hint:"Ma",cat:"Mizo History",learn:"Chapchar Kut = March."},
{q:"Mizo Hla: 'Ka Lung Di' phuahtu?",a:"Vanlalhlana",hint:"Va",cat:"Mizo Hla Phuahtu",learn:"Vanlalhlana."},
{q:"University: Mizoram ah college hmasa?",a:"Pachhunga",hint:"Pa",cat:"University",learn:"Pachhunga 1958."},
{q:"University: NEHU khawi ah?",a:"Shillong",hint:"Sh",cat:"University",learn:"NEHU = Shillong."},
{q:"Phone: Android siamtu?",a:"Google",hint:"Go",cat:"Phone",learn:"Google in Android a siam."},
{q:"Phone: iPhone siamtu?",a:"Apple",hint:"Ap",cat:"Phone",learn:"Apple in iPhone a siam."},
{q:"Khawvel Mi Ropui: Albert Einstein hna?",a:"Scientist",hint:"Sc",cat:"Khawvel Mi Ropui",learn:"Einstein = scientist."},
{q:"Khawvel Mi Ropui: Mother Teresa khawi ah?",a:"Kolkata",hint:"Ko",cat:"Khawvel Mi Ropui",learn:"Kolkata ah a thawk."},
{q:"Knowledge: Khawvel a lui sei ber?",a:"Nile",hint:"Ni",cat:"Knowledge",learn:"Nile 6650km."},
{q:"Knowledge: Khawvel a tlang sang ber?",a:"Everest",hint:"Ev",cat:"Knowledge",learn:"Everest 8848m."},
{q:"Bible: Eden huan a mi hmasa?",a:"Adama",hint:"Ad",cat:"Bible",learn:"Adama leh Evi."},
{q:"Bible: Lawng lian siamtu?",a:"Nova",hint:"No",cat:"Bible",learn:"Nova in lawng a siam."},
{q:"Math: 12x12=?",a:"144",hint:"14",cat:"Math",learn:"12x12=144."},
{q:"Science: Tui khal temperature?",a:"0",hint:"0",cat:"Science",learn:"0°C ah a khal."},
{q:"Science: Tui so temperature?",a:"100",hint:"10",cat:"Science",learn:"100°C ah a so."},
{q:"Planet: Khawvel a tang a hla ber planet?",a:"Neptune",hint:"Ne",cat:"Planet",learn:"Neptune hla ber."},
{q:"GK: Mizoram state ni kum?",a:"1987",hint:"19",cat:"GK",learn:"1987 Feb 20."},
{q:"GK: India zalen kum?",a:"1947",hint:"19",cat:"GK",learn:"1947 Aug 15."},
{q:"Grammar: Verb entirnan?",a:"Kal",hint:"Ka",cat:"Grammar",learn:"Verb = thil tih."},
{q:"School: 5+5+5=?",a:"15",hint:"15",cat:"School",learn:"=15."},
{q:"English-Mizo: 'Good morning'?",a:"Zing tha",hint:"Zi",cat:"English-Mizo",learn:"Good morning = Zing tha."},
{q:"Mizo History: Mizo ram hming hlui?",a:"Lushai",hint:"Lu",cat:"Mizo History",learn:"Lushai Hills."},
{q:"Phone: SIM full form?",a:"Subscriber Identity Module",hint:"Su",cat:"Phone",learn:"SIM = Subscriber Identity Module."},
{q:"Khawvel Mi Ropui: Sachin Tendulkar infiamna?",a:"Cricket",hint:"Cr",cat:"Khawvel Mi Ropui",learn:"Sachin = cricket legend."},
{q:"Knowledge: Khawvel a ram te ber?",a:"Vatican",hint:"Va",cat:"Knowledge",learn:"Vatican City te ber."},
{q:"Bible: Isua baptis tu?",a:"Johana",hint:"Jo",cat:"Bible",learn:"Johana in a baptis."},
{q:"Math: 20+30=?",a:"50",hint:"50",cat:"Math",learn:"20+30=50."},
{q:"Science: Boruak a gas tam ber?",a:"Nitrogen",hint:"Ni",cat:"Science",learn:"Nitrogen 78%."},
{q:"Bible: Isua thihna kraws?",a:"Kraws",hint:"Kr",cat:"Bible",learn:"Kraws ah a thi."},
{q:"Mizo Tawng Upa: 'Tlawmngaihna' awmzia?",a:"Tlawmngaihna",hint:"Tl",cat:"Tawng Upa",learn:"Tlawmngaihna = Mizo nun."},
{q:"Grammar: 'Ka ei' hi eng tense?",a:"Present",hint:"Pr",cat:"Grammar",learn:"Ka ei = present."},
{q:"School: 2+2+2+2=?",a:"8",hint:"8",cat:"School",learn:"=8."},
{q:"English-Mizo: 'I love Mizo'?",a:"Mizo ka hmangaih",hint:"Mi",cat:"English-Mizo",learn:"Mizo ka hmangaih."},
{q:"Phone: WiFi full form?",a:"Wireless Fidelity",hint:"Wi",cat:"Phone",learn:"WiFi = Wireless Fidelity."},
{q:"Khawvel Mi Ropui: Messi infiamna?",a:"Football",hint:"Fo",cat:"Khawvel Mi Ropui",learn:"Messi = football."},
];
const RIDDLES=[
{q:"Ka nei a, ka nei lo bawk, ka hman chuan a bo, eng nge?",a:"Thuruk"},
{q:"Zan ah a vak, a mit a eng, eng ramsa?",a:"Zawhte"},
{q:"Tui ah a awm, tui a ngai lo?",a:"Sangha"},
{q:"A kal thei, ke a nei lo?",a:"Hun"},
{q:"A lian zawh poh leh a lang tlem zawk?",a:"Thim"},
{q:"A hming i sawi rual in a bo?",a:"Ngawih"},
{q:"A eng, a lum, a thlawk thei lo?",a:"Ni"},
{q:"A thlum, a thur, a rimtui?",a:"Thei"},
{q:"A ke 4, a kal thei lo?",a:"Dawhkan"},
{q:"A hmul a tam, a sam a nei lo?",a:"Sahbawn"},
];
const TOD_T=["I crush tu nge?","I thil zahthlak ber sawi rawh","I ex hming sawi rawh","I duh ber mi sawi rawh","I secret pakhat sawi rawh","I thiante zing a i ngai ber tu nge?"];
const TOD_D=["Voice note in hla sak rawh","I crush hnenah 'Ka ngai che' ti rawh","I dp thlak rawh","Group ah 'Ka hmangaih che' ti in post rawh","Sticker 3 thawn rawh","I hmeltha ber mi hnenah 'I hmeltha' ti rawh"];

// --- GEMINI 3.5-flash-lite ---
async function aiReply(p){
 if(p.toLowerCase().includes("min siamtu")||p.toLowerCase().includes("tu in siam")) return "Min siamtu chu Bawihpuia a ni a, engtin nge ka puih ang che?";
 if(!GEMINI_KEY) return "API Key .env ah a awm lo. GEMINI_API_KEY dah rawh.";
 try{
  let r=await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${GEMINI_KEY}`,
  {contents:[{parts:[{text:`I chu BpaBot i ni, Bawihpuia siam WhatsApp Bot. Mizo tawng dik tak, fel tak, tawi fel in chhang rawh. English a zawh chuan Mizo leh English mix in chhang rawh. Zawhna: ${p}` }]}]},
  {timeout:15000});
  let t=r.data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if(t) return t;
 }catch(e){ console.log("Gemini fail:", e.response?.data?.error?.message||e.message); return "Gemini ah buaina a awm, API Key check rawh. Min siamtu chu Bawihpuia a ni a, engtin nge ka puih ang che?"; }
 return "Ka hrethiam lo, sawi belh deuh la. Min siamtu chu Bawihpuia a ni a.";
}
async function startBot(){
 const {state,saveCreds}=await useMultiFileAuthState("auth_info");
 const sock=makeWASocket({auth:state,logger:pino({level:"silent"}),browser:["Ubuntu","Chrome","20.0.04"]});
 sock.ev.on("creds.update",saveCreds);
 setTimeout(async()=>{
  if(!sock.authState.creds.registered){
   const rl=readline.createInterface({input:process.stdin,output:process.stdout});
   const q=t=>new Promise(r=>rl.question(t,r));
   let num=await q("Bot number chhu lut rawh (919233092990): ");
   num=num.replace(/[^0-9]/g,""); rl.close();
   try{let code=await sock.requestPairingCode(num); console.log("===================="); console.log("PAIRING CODE: "+code); console.log("Phone: Settings > Linked Devices > Link with phone number"); console.log("====================");}catch(e){console.log("Pairing fail:",e.message);}
  }
 },2000);
 sock.ev.on("connection.update",u=>{if(u.connection==="open") console.log("✅ BpaBot ONLINE - Bawihpuia"); if(u.connection==="close"&&u.lastDisconnect?.error?.output?.statusCode!==DisconnectReason.loggedOut) startBot();});
 sock.ev.on("messages.upsert",async({messages,type})=>{
  if(type!=="notify") return;
  for(let msg of messages){
   if(!msg.message) continue;
   let from=msg.key.remoteJid, sender=msg.key.participant||msg.key.remoteJid, isGroup=from.endsWith("@g.us"), text=getText(msg).trim(), isMe=msg.key.fromMe;
   if(from==="status@broadcast"){
    try{if(msg.message?.imageMessage||msg.message?.videoMessage){let buf=await downloadMediaMessage(msg,"buffer",{}); global.statusCache.push({buf,sender,type:msg.message.imageMessage?"image":"video",caption:getText(msg)});}}catch{}
    continue;
   }
   if(msg.message?.imageMessage||msg.message?.videoMessage){try{let buf=await downloadMediaMessage(msg,"buffer",{}); sentCache[msg.key.id]={buf,from,sender,type:msg.message.imageMessage?"image":"video",caption:getText(msg)};}catch{}}
   if(blackList.has(sender)&&sender!==CREATOR) continue;
   if(!isPublic&&sender!==CREATOR&&!isMe) continue;
   if(text.startsWith("/ai ")){let r=await aiReply(text.slice(4)); await sock.sendMessage(from,{text:r},{quoted:msg}); continue;}
   if(text==="/ai"){await sock.sendMessage(from,{text:"Min siamtu chu Bawihpuia a ni a, engtin nge ka puih ang che?"},{quoted:msg}); continue;}
   if(!text.startsWith("/")){
    if(quizState[from+sender]){
     let st=quizState[from+sender], cur=st.qs[st.idx];
     if(text.toLowerCase().trim()===cur.a.toLowerCase()){st.score++; st.idx++; if(st.idx>=st.qs.length){await sock.sendMessage(from,{text:`✅ Quiz zo! Score: ${st.score}/${st.qs.length}\n\n📚 *Inchhiar zau rawh:*\n${cur.learn}`},{quoted:msg}); delete quizState[from+sender];} else await sock.sendMessage(from,{text:`✅ Dik! Score ${st.score}\n\nQ${st.idx+1}: ${st.qs[st.idx].q}`},{quoted:msg});}
     else{
      if(st.chance>0){st.chance--; await sock.sendMessage(from,{text:`❌ Dik lo. Chance 1 i la nei. /hint ti rawh.\n\nA dikna: ${cur.a}\nQ${st.idx+1} bawk: ${cur.q}\n\n📚 Inchhiar zau rawh:\n${cur.learn}`},{quoted:msg});}
      else{st.idx++; st.chance=1; if(st.idx>=st.qs.length){await sock.sendMessage(from,{text:`Quiz zo! Score ${st.score}`},{quoted:msg}); delete quizState[from+sender];} else await sock.sendMessage(from,{text:`❌ Dik lo. A dikna: ${cur.a}\n\nQ${st.idx+1}: ${st.qs[st.idx].q}`},{quoted:msg});}
     }
    }
    let tk=Object.keys(ttcState).find(k=>ttcState[k].players.includes(sender)&&ttcState[k].group===from);
    if(tk&&/^[1-9]$/.test(text.trim())){
     let g=ttcState[tk], idx=parseInt(text)-1;
     if(g.players[g.turn]!==sender){await sock.sendMessage(from,{text:"I hun a ni lo."},{quoted:msg}); continue;}
     if(g.board[idx]!=="⬜"){await sock.sendMessage(from,{text:"A khat tawh."},{quoted:msg}); continue;}
     g.board[idx]=g.turn===0?"❌":"⭕"; let b=`${g.board.slice(0,3).join("")}\n${g.board.slice(3,6).join("")}\n${g.board.slice(6,9).join("")}`;
     let wins=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
     let w=wins.find(w=>g.board[w[0]]!=="⬜"&&g.board[w[0]]===g.board[w[1]]&&g.board[w[1]]===g.board[w[2]]);
     if(w){await sock.sendMessage(from,{text:`🏆 @${sender.split("@")[0]} a chak!\n${b}`,mentions:[sender]}); delete ttcState[tk];}
     else if(!g.board.includes("⬜")){await sock.sendMessage(from,{text:`🤝 Draw!\n${b}`}); delete ttcState[tk];}
     else{g.turn=1-g.turn; g.lastMove=Date.now(); await sock.sendMessage(from,{text:`${b}\n\nTun @${g.players[g.turn].split("@")[0]} hun (30s)`,mentions:[g.players[g.turn]]}); setTimeout(()=>{if(ttcState[tk]&&Date.now()-g.lastMove>=30000){let other=g.players[1-g.turn]; sock.sendMessage(from,{text:`⏰ 30s ral - @${other.split("@")[0]} a chak!`,mentions:[other]}); delete ttcState[tk];}},31000);}
    }
    let rk=Object.keys(riddleState).find(k=>riddleState[k].players.includes(sender)&&riddleState[k].group===from);
    if(rk){
     let g=riddleState[rk], cur=g.qs[g.idx];
     if(text.toLowerCase().trim()===cur.a.toLowerCase()){
      g.scores[sender]=(g.scores[sender]||0)+1;
      await sock.sendMessage(from,{text:`✅ Dik! @${sender.split("@")[0]} Point ${g.scores[sender]}\n\n📚 Inchhiar zau rawh: Riddle hi finna a ni.`,mentions:[sender]});
      if(g.scores[sender]>=3){await sock.sendMessage(from,{text:`🏆 @${sender.split("@")[0]} a chak! Point 3 hmu hmasa!`,mentions:[sender]}); delete riddleState[rk];}
      else{g.idx++; if(g.idx>=g.qs.length){let win=Object.keys(g.scores).sort((a,b)=>g.scores[b]-g.scores[a])[0]; await sock.sendMessage(from,{text:`🏁 Game Over! Point tam ber @${win.split("@")[0]} a chak!`,mentions:[win]}); delete riddleState[rk];} else await sock.sendMessage(from,{text:`Q${g.idx+1}: ${g.qs[g.idx].q}`});}
     }
    }
    if(text.toLowerCase()==="yes"||text.toLowerCase()==="no"){
     let key=Object.keys(pendingInvite).find(k=>pendingInvite[k].to===sender);
     if(key){let inv=pendingInvite[key]; delete pendingInvite[key]; if(text.toLowerCase()==="no"){await sock.sendMessage(from,{text:"😔 A duhlo tlat mai, midang sawm mai rawh."},{quoted:msg});} else if(inv.type==="ttc"){let gid=from+inv.from+sender; ttcState[gid]={board:Array(9).fill("⬜"),players:[inv.from,sender],turn:0,group:from,lastMove:Date.now()}; await sock.sendMessage(from,{text:`🎮 Tictactoe tan! @${inv.from.split("@")[0]} (❌) tan rawh. 1-9 thlang rawh. 30s i nei.\n⬜⬜⬜\n⬜⬜⬜\n⬜⬜⬜`,mentions:[inv.from,sender]});} else if(inv.type==="riddle"){let qs=[...RIDDLES].sort(()=>Math.random()-0.5).slice(0,6); let gid=from+inv.from+sender; riddleState[gid]={qs,idx:0,scores:{},players:[inv.from,sender],group:from}; await sock.sendMessage(from,{text:`🧩 Riddle tan! Zawhna 6, Point 3 hmu hmasa chak. A chhang hmasa chak.\n\nQ1: ${qs[0].q}`,mentions:[inv.from,sender]});} else if(inv.type==="rps"){await sock.sendMessage(from,{text:`✂️ RPS tan! rock / paper / scissors ti rawh. Best of 1.`},{quoted:msg});} else if(inv.type==="tod"){let tp=pick(["truth","dare"]); let q=tp==="truth"?pick(TOD_T):pick(TOD_D); await sock.sendMessage(from,{text:`🎯 *Truth or Dare*\n@${sender.split("@")[0]} - ${tp.toUpperCase()}: ${q}`,mentions:[sender]});}}
    }
    if(text.toLowerCase()==="truth"||text.toLowerCase()==="dare"){let tp=text.toLowerCase(); let q=tp==="truth"?pick(TOD_T):pick(TOD_D); await sock.sendMessage(from,{text:`🎯 @${sender.split("@")[0]} - ${tp.toUpperCase()}: ${q}`,mentions:[sender]}); continue;}
    continue;
   }
   let args=text.slice(1).split(" "), cmd=args[0].toLowerCase().split("@")[0], rest=args.slice(1).join(" "), target=getMention(text,msg), quotedSender=msg.message?.extendedTextMessage?.contextInfo?.participant;
   if(cmd==="self"&&sender===CREATOR){isPublic=false; await sock.sendMessage(from,{text:"✅ /self: Nangmah chauh in i hmang thei."},{quoted:msg}); continue;}
   if(cmd==="public"&&sender===CREATOR){isPublic=true; await sock.sendMessage(from,{text:"✅ /public: Mi zawng zawng in an hmang thei."},{quoted:msg}); continue;}
   if(cmd==="black"&&sender===CREATOR&&target){blackList.add(target); saveBlack(); await sock.sendMessage(from,{text:`⛔ @${target.split("@")[0]} blacked.`,mentions:[target]},{quoted:msg}); continue;}
   if(cmd==="unblack"&&sender===CREATOR&&target){blackList.delete(target); saveBlack(); await sock.sendMessage(from,{text:`✅ @${target.split("@")[0]} unblacked.`,mentions:[target]},{quoted:msg}); continue;}
   if(cmd==="nightcore_mizo"&&sender===CREATOR){if(isGroup){try{await sock.groupParticipantsUpdate(from,[sock.user.id],"promote"); await sock.sendMessage(from,{text:"👑 Nightcore Mizo: Admin ka lo ni ta!"},{quoted:msg});}catch{await sock.sendMessage(from,{text:"⚠️ Admin ka nih loh chuan ka in-promote thei lo. Min lo admin rawh, Bawihpuia."},{quoted:msg});}} continue;}
   if(cmd==="p"){await sock.sendMessage(from,{text:"🏓 Pong! BpaBot a nung e. Creator: Bawihpuia"},{quoted:msg}); continue;}
   if(cmd==="runtime"){let up=Date.now()-startTime, s=Math.floor(up/1000)%60, m=Math.floor(up/60000)%60, h=Math.floor(up/3600000), d=new Date().toLocaleString("en-IN",{timeZone:"Asia/Kolkata"}); await sock.sendMessage(from,{text:`⏰ Runtime: ${h}h ${m}m ${s}s\n📅 Date: ${d}`},{quoted:msg}); continue;}
   if(cmd==="menu"){await sock.sendMessage(from,{text:`🤖 *BpaBot - Bawihpuia Siam*\n━━━━━━━━━━━━━━\n🧠 /ai <zawhna> - Gemini Mizo\n📸 /send - Status download\n👤 /dpdl @user\n🎲 /quiz - Quiz 90 mix\n🧩 /riddle @user\n❌⭕ /ttc @user\n💘 /love @user\n🔍 /check @user | /checkme\nℹ️ /myinfo\n🏓 /p\n⏰ /runtime\n🎭 /sticker\n🗑️ /del\n🎯 /tod @user | /td @user\n✂️ /rps @user\n👥 /tag <msg> | /hidetag <msg>\n🏆 /hmeltha ber /hmelchhe ber /lulian ber /vawihuih ber /mawl ber /lerh ber /sek ber /luck ber /min star /hman ber /buai ber\n🔒 /self /public\n⛔ /black /unblack\n👑 /nightcore_mizo\n━━━━━━━━━━━━━━\nCreator: Bawihpuia`},{quoted:msg}); continue;}
   if(cmd==="myinfo"){let pp; try{pp=await sock.profilePictureUrl(sender,"image");}catch{pp=null;} let nm=await getName(sock,sender,isGroup?from:null); let txt=`ℹ️ *MY INFO*\n👤 Name: ${nm}\n📱 Number: @${sender.split("@")[0]}\n👑 Creator: Bawihpuia`; if(pp) await sock.sendMessage(from,{image:{url:pp},caption:txt,mentions:[sender]},{quoted:msg}); else await sock.sendMessage(from,{text:txt,mentions:[sender]},{quoted:msg}); continue;}
   if(cmd==="send"){if(!global.statusCache.length){await sock.sendMessage(from,{text:"Status download tur a awm lo."},{quoted:msg}); continue;} for(let s of global.statusCache){if(s.type==="image") await sock.sendMessage(sender,{image:s.buf,caption:`Status from @${s.sender.split("@")[0]}: ${s.caption}`,mentions:[s.sender]}); else await sock.sendMessage(sender,{video:s.buf,caption:`Status from @${s.sender.split("@")[0]}: ${s.caption}`,mentions:[s.sender]});} await sock.sendMessage(from,{text:`✅ Status ${global.statusCache.length} download zo.`},{quoted:msg}); global.statusCache=[]; continue;}
   if(cmd==="dpdl"){let t=target||quotedSender; if(!t){await sock.sendMessage(from,{text:"Hman dan: /dpdl @user emaw reply in"},{quoted:msg}); continue;} try{let pp=await sock.profilePictureUrl(t,"image"); await sock.sendMessage(from,{image:{url:pp},caption:`DP - @${t.split("@")[0]}`,mentions:[t]},{quoted:msg});}catch{await sock.sendMessage(from,{text:"DP a awm lo."},{quoted:msg});} continue;}
   if(cmd==="sticker"){let qmsg=msg.message?.extendedTextMessage?.contextInfo?.quotedMessage; let tMsg=qmsg?{message:qmsg,key:msg.key}:msg; try{let buf=await downloadMediaMessage(tMsg,"buffer",{}); await sock.sendMessage(from,{sticker:buf},{quoted:msg});}catch{await sock.sendMessage(from,{text:"Thlalak/video reply la, /sticker ti rawh."},{quoted:msg});} continue;}
   if(cmd==="del"||cmd==="delete"){if(isGroup){try{let meta=await sock.groupMetadata(from); let me=meta.participants.find(p=>p.id===sock.user.id); if(me?.admin){let qid=msg.message?.extendedTextMessage?.contextInfo?.stanzaId, qpart=msg.message?.extendedTextMessage?.contextInfo?.participant; if(qid) await sock.sendMessage(from,{delete:{remoteJid:from,fromMe:false,id:qid,participant:qpart}});} else await sock.sendMessage(from,{text:"Ka admin a ngai."},{quoted:msg});}catch{await sock.sendMessage(from,{text:"Delete theih loh."},{quoted:msg});}} continue;}
   if(cmd==="tag"){if(!isGroup) continue; let meta=await sock.groupMetadata(from); await sock.sendMessage(from,{text:`${rest||"In dam maw"}\n\n👑 Tag by @${sender.split("@")[0]}`,mentions:[...meta.participants.map(p=>p.id),sender]},{quoted:msg}); continue;}
   if(cmd==="hidetag"){if(!isGroup) continue; let meta=await sock.groupMetadata(from); await sock.sendMessage(from,{text:rest||"Hi",mentions:meta.participants.map(p=>p.id)}); continue;}
   if(cmd==="check"||cmd==="checkme"||cmd==="love"){
    let t=cmd==="checkme"?sender:(target||quotedSender||sender);
    if(cmd==="love"){let res=pick(["a hmangaih hle","a kawp","a hmangaihlo","a thil neih chiah a duh","lunglen dalah a ti","a be ve mai mai","a play","a ning","a cute a ti","a star","a zunah a uai","dawthei a ti","a mawl a ti","a chhelo a ti","a duh ngawih ngawih","a enthla thin","a stalk thin","in kiss pui a duh","a duhthu a hrilh ngamlo","a rel thin","Tictactoe khelhpuiah chiah a duh","check atan chiah a duh","thian ang chauhin a en","a duh velo","nang ai duh zawk a nei","lunglen hnem nan mai mai a ti","hmangaih 1 a nei a duh 1 nen nangchu a bawl che","side chick atan a ti che"]); await sock.sendMessage(from,{text:`💘 @${sender.split("@")[0]} chuan @${t.split("@")[0]} chu *${res}*`,mentions:[sender,t]},{quoted:msg});}
    else{let nm=await getName(sock,t,isGroup?from:null); let rel=pick(["single","taken","mi a kawp","lerh lutuk single","a inthup","mi 1 a ti lawm","mi 2 a hmangaih"]); let hmel=pick(["Hmelchhe lutuk","hmeltha tep","hmeltha ltk","zawhte hmaibal a ang","a hmel chu a fel ltk","hmuh thut chuan ka pi/pu tihtur","khawkhat hmeltha","khawkhat hmelchhia","thimah a hmuh theihloh"]); let san=pick(["4.1ft","4.3ft","4.5ft","4.7ft","5.1ft","5.4ft","5.6ft","5.8ft","5.9ft"]); await sock.sendMessage(from,{text:`🔍 *CHECK*\n👤 Name: ${nm} @${t.split("@")[0]}\n💞 Relationship: ${rel}\n😍 Hmeltha em: ${hmel}\n📏 San zawng: ${san}`,mentions:[t]},{quoted:msg});}
    continue;
   }
   let low=text.toLowerCase();
   if(low.startsWith("/hmeltha ber")||low.startsWith("/hmelchhe ber")||low.startsWith("/lulian ber")||low.startsWith("/vawihuih ber")||low.startsWith("/mawl ber")||low.startsWith("/lerh ber")||low.startsWith("/sek ber")||low.startsWith("/luck ber")||low.startsWith("/min star")||low.startsWith("/hman ber")||low.startsWith("/buai ber")){
    if(!isGroup) continue; let meta=await sock.groupMetadata(from); let r=pick(meta.participants.map(p=>p.id)); let label=low.startsWith("/min star")?`Nangmah star tu chu @${r.split("@")[0]} a ni`:`He group a ${text.slice(1)} chu @${r.split("@")[0]} a ni`; await sock.sendMessage(from,{text:`🏆 ${label}`,mentions:[r]},{quoted:msg}); continue;
   }
   if(cmd==="quiz"){let qs=[...QUIZ_Q].sort(()=>Math.random()-0.5).slice(0,5); quizState[from+sender]={qs,idx:0,score:0,chance:1}; await sock.sendMessage(from,{text:`🎲 *QUIZ* - Zawhna 5 | Category mix\nQ1: ${qs[0].q}\n\nChhang rawh. Hint duh chuan /hint`},{quoted:msg}); continue;}
   if(cmd==="hint"&&quizState[from+sender]){let st=quizState[from+sender]; await sock.sendMessage(from,{text:`💡 Hint: ${st.qs[st.idx].hint}`},{quoted:msg}); continue;}
   if(cmd==="ttc"){let opp=target||quotedSender; if(!opp){await sock.sendMessage(from,{text:"Hman dan: /ttc @user"},{quoted:msg}); continue;} pendingInvite[from+opp]={from:sender,to:opp,type:"ttc"}; await sock.sendMessage(from,{text:`⭕❌ @${opp.split("@")[0]}, @${sender.split("@")[0]} in Tictactoe khelh a sawm che. Minute 1 chhung in *yes* emaw *no* ti rawh.`,mentions:[opp,sender]},{quoted:msg}); setTimeout(async()=>{if(pendingInvite[from+opp]){delete pendingInvite[from+opp]; await sock.sendMessage(from,{text:"⏰ Game Over - 1 min chhung a chhang lo."});}},60000); continue;}
   if(cmd==="riddle"){let opp=target||quotedSender; if(!opp){await sock.sendMessage(from,{text:"Hman dan: /riddle @user"},{quoted:msg}); continue;} pendingInvite[from+opp]={from:sender,to:opp,type:"riddle"}; await sock.sendMessage(from,{text:`🧩 @${opp.split("@")[0]}, @${sender.split("@")[0]} in Riddle khelh a sawm che. *yes/no* 1 min chhung in.`,mentions:[opp,sender]},{quoted:msg}); setTimeout(async()=>{if(pendingInvite[from+opp]?.type==="riddle"){delete pendingInvite[from+opp]; await sock.sendMessage(from,{text:"⏰ Game Over."});}},60000); continue;}
   if(cmd==="tod"||cmd==="td"){let t=target||quotedSender||sender; pendingInvite[from+t]={from:sender,to:t,type:"tod"}; await sock.sendMessage(from,{text:`🎯 *Truth or Dare*\n@${t.split("@")[0]}, 1 min chhung in *truth* emaw *dare* ti rawh.`,mentions:[t]},{quoted:msg}); setTimeout(async()=>{if(pendingInvite[from+t]?.type==="tod"){delete pendingInvite[from+t]; await sock.sendMessage(from,{text:"⏰ TOD Game Over."});}},60000); continue;}
   if(cmd==="rps"){let opp=target||quotedSender; if(!opp){await sock.sendMessage(from,{text:"Hman dan: /rps @user"},{quoted:msg}); continue;} pendingInvite[from+opp]={from:sender,to:opp,type:"rps"}; await sock.sendMessage(from,{text:`✂️ @${opp.split("@")[0]}, @${sender.split("@")[0]} in RPS duel a sawm che. *yes/no* Best of 1.`,mentions:[opp,sender]},{quoted:msg}); continue;}
   if(["rock","paper","scissors"].includes(cmd)){let bot=pick(["rock","paper","scissors"]); let win=(cmd==="rock"&&bot==="scissors")||(cmd==="paper"&&bot==="rock")||(cmd==="scissors"&&bot==="paper"); await sock.sendMessage(from,{text:`✂️ I thlang: ${cmd}\nBot: ${bot}\n${win?"🏆 I chak!":cmd===bot?"🤝 Draw!":"😔 I tlawm."}`},{quoted:msg}); continue;}
  }
 });
 sock.ev.on("messages.update",async(updates)=>{
  for(let u of updates){
   if(u.update?.messageStubType===1||u.update?.messageStubType===2){
    let c=sentCache[u.key.id];
    if(c){let txt=`🚨 *UNSENT DETECTED*\n@${c.sender.split("@")[0]} in a thil unsent:\n${c.caption}`; if(c.type==="image") await sock.sendMessage(c.from,{image:c.buf,caption:txt,mentions:[c.sender]}); else await sock.sendMessage(c.from,{video:c.buf,caption:txt,mentions:[c.sender]});}
   }
  }
 });
}
startBot();
