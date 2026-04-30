'use strict';
var BACKEND_URL=location.origin;
var sessionId='eq-'+Math.random().toString(36).slice(2,10)+'-'+Date.now().toString(36);
var profile=JSON.parse(sessionStorage.getItem('eq_profile')||'null');
var conversationHistory=[];
var isThinking=false;
var activeTab='home';
var timelineSteps=[];
var completedSteps=JSON.parse(sessionStorage.getItem('eq_steps')||'{}');
var checklistItems=[];
var checklistLoading=false;
var checklistProgress=JSON.parse(sessionStorage.getItem('eq_cl')||'{}');
var quizState={score:0,total:0,streak:0,difficulty:1,topics:[],currentQ:null,answered:false};
var currentLang=sessionStorage.getItem('eq_lang')||'English';
var STATE_LANGUAGES={'Andhra Pradesh':'Telugu','Arunachal Pradesh':'English','Assam':'Assamese','Bihar':'Hindi','Chhattisgarh':'Hindi','Goa':'Konkani','Gujarat':'Gujarati','Haryana':'Hindi','Himachal Pradesh':'Hindi','Jharkhand':'Hindi','Karnataka':'Kannada','Kerala':'Malayalam','Madhya Pradesh':'Hindi','Maharashtra':'Marathi','Manipur':'Manipuri','Meghalaya':'English','Mizoram':'Mizo','Nagaland':'English','Odisha':'Odia','Punjab':'Punjabi','Rajasthan':'Hindi','Sikkim':'Nepali','Tamil Nadu':'Tamil','Telangana':'Telugu','Tripura':'Bengali','Uttar Pradesh':'Hindi','Uttarakhand':'Hindi','West Bengal':'Bengali','Delhi':'Hindi','Jammu & Kashmir':'Urdu','Ladakh':'Hindi','Puducherry':'Tamil','Chandigarh':'Hindi'};

var INDIAN_STATES=['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Delhi','Jammu & Kashmir','Ladakh','Puducherry','Chandigarh'];

var TAB_TITLES={home:'Dashboard',journey:'Election Journey',chat:'Ask AI',checklist:'Preparation Checklist',quiz:'Civic Quiz'};

function escapeHtml(s){if(!s)return'';return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function formatBot(t){return t.replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>');}
function announce(msg){var el=document.getElementById('live-announce');if(el){el.textContent=msg;setTimeout(function(){el.textContent='';},3000);}}
function getTS(){var d=new Date();return d.getHours().toString().padStart(2,'0')+':'+d.getMinutes().toString().padStart(2,'0');}

window.gaLogEvent = function(name, params) {
  if (window.analytics) window.analytics.logEvent(name, params);
};

// IMAGE UPLOAD STATE
var selectedImageBase64 = null;
window.handleImageSelect = function(e) {
  var file = e.target.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function(evt) {
    selectedImageBase64 = evt.target.result.split(',')[1];
    var preview = document.getElementById('image-preview');
    var container = document.getElementById('image-preview-container');
    if (preview && container) {
      preview.src = evt.target.result;
      container.style.display = 'block';
    }
  };
  reader.readAsDataURL(file);
};
window.removeImage = function() {
  selectedImageBase64 = null;
  document.getElementById('image-upload').value = '';
  var container = document.getElementById('image-preview-container');
  if (container) container.style.display = 'none';
};

// CLOCK
function updateClock(){
  var now=new Date();
  var el=document.getElementById('topbar-time');
  if(el) el.textContent=now.toLocaleString('en-IN',{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:true,timeZone:'Asia/Kolkata'});
}
setInterval(updateClock,1000);updateClock();

// SPLASH
window.addEventListener('load',function(){setTimeout(function(){var sp=document.getElementById('splash');if(sp){sp.style.opacity='0';sp.style.visibility='hidden';setTimeout(function(){sp.remove();},600);}},1800);});

// SIDEBAR MOBILE TOGGLE
window.toggleSidebar=function(){
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebar-overlay').classList.toggle('open');
};

// TAB SWITCHING
window.switchTab=function(tab){
  activeTab=tab;
  document.querySelectorAll('.nav-item').forEach(function(t){
    var isA=t.dataset.tab===tab;
    t.classList.toggle('active',isA);
    t.setAttribute('aria-selected',isA?'true':'false');
  });
  var panels=document.querySelectorAll('.panel');
  var tabOrder=['home','journey','chat','checklist','quiz'];
  var idx=tabOrder.indexOf(tab);
  panels.forEach(function(p,i){p.classList.toggle('active',i===idx);});
  var tt=document.getElementById('topbar-title');
  var tb=document.getElementById('topbar-breadcrumb');
  if(tt)tt.textContent=TAB_TITLES[tab]||tab;
  if(tb)tb.textContent=tab==='home'?'Home':'Home / '+(TAB_TITLES[tab]||tab);
  if(tab==='home')renderHome();
  if(tab==='journey')renderJourney();
  if(tab==='checklist')renderChecklist();
  if(tab==='quiz'&&!quizState.currentQ)renderQuizStart();
  // close mobile sidebar
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('open');
  announce(tab+' tab selected');
  window.gaLogEvent('tab_viewed', { tab: tab });
};

// SIDEBAR KEYBOARD NAV
document.querySelector('.sidebar-nav').addEventListener('keydown',function(e){
  if(e.key==='ArrowDown'||e.key==='ArrowUp'){
    var items=Array.from(document.querySelectorAll('.nav-item'));
    var cur=items.findIndex(function(t){return t.classList.contains('active');});
    var next=e.key==='ArrowDown'?(cur+1)%items.length:(cur-1+items.length)%items.length;
    items[next].click();items[next].focus();e.preventDefault();
  }
});

function updateSidebarProfile(){
  var stateEl=document.getElementById('sidebar-state');
  var typeEl=document.getElementById('sidebar-type');
  var avatarEl=document.getElementById('profile-avatar');
  var badgeEl=document.getElementById('mobile-badge');
  if(profile){
    if(stateEl)stateEl.textContent=profile.state;
    if(typeEl)typeEl.textContent=profile.electionType;
    if(avatarEl)avatarEl.textContent=profile.state.charAt(0);
    if(badgeEl)badgeEl.textContent=profile.state;
  }else{
    if(stateEl)stateEl.textContent='Setup required';
    if(typeEl)typeEl.textContent='—';
    if(avatarEl)avatarEl.textContent='?';
    if(badgeEl)badgeEl.textContent='Setup';
  }
}

// HOME / DASHBOARD
function renderHome(){
  var el=document.getElementById('view-home');
  if(!profile){
    el.innerHTML='<div class="onboard"><div class="onboard-icon">🗳️</div><div class="onboard-title">Welcome to ElectIQ</div><div class="onboard-sub">Let\'s personalise your election journey. Answer 3 quick questions so I can guide you with the right information.</div><div class="onboard-form"><div><label class="field-label" for="ob-state">Your State</label><select class="field-select" id="ob-state"><option value="">Select your state...</option>'+INDIAN_STATES.map(function(s){return'<option value="'+s+'">'+s+'</option>';}).join('')+'</select></div><div><label class="field-label" for="ob-election">Election Type</label><select class="field-select" id="ob-election"><option value="Lok Sabha">Lok Sabha (General)</option><option value="Vidhan Sabha">Vidhan Sabha (State Assembly)</option><option value="Municipal">Municipal / Local Body</option><option value="Panchayat">Panchayat</option></select></div><div><label class="field-label">First-time voter?</label><div class="toggle-group"><button class="toggle-btn active" id="ob-ft-yes" onclick="document.getElementById(\'ob-ft-yes\').classList.add(\'active\');document.getElementById(\'ob-ft-no\').classList.remove(\'active\')">Yes, first time!</button><button class="toggle-btn" id="ob-ft-no" onclick="document.getElementById(\'ob-ft-no\').classList.add(\'active\');document.getElementById(\'ob-ft-yes\').classList.remove(\'active\')">Voted before</button></div></div><button class="btn-primary" onclick="saveProfile()">Start My Journey →</button></div></div>';
    return;
  }
  var done=Object.keys(completedSteps).filter(function(k){return completedSteps[k];}).length;
  var total=6;var pct=Math.round(done/total*100);
  var clDone=0;checklistItems.forEach(function(it){if(checklistProgress[it.id])clDone++;});
  var clTotal=checklistItems.length||8;var clPct=Math.round(clDone/clTotal*100);
  el.innerHTML='<div class="dashboard">'+
    '<div class="welcome-card"><div class="welcome-card-top"><div><div class="welcome-name">'+(profile.isFirstTime?'Welcome, first-time voter! 🎉':'Welcome back! 🗳️')+'</div><div class="welcome-detail">You\'re in <strong>'+escapeHtml(profile.state)+'</strong> for the <strong>'+escapeHtml(profile.electionType)+'</strong> election.</div></div><div class="lang-toggle-wrap" id="lang-toggle-home"></div></div><div class="progress-bar-wrap"><div class="progress-bar-top"><span class="progress-bar-label">Journey Progress</span><span class="progress-bar-pct">'+pct+'%</span></div><div class="progress-bar"><div class="progress-bar-fill" style="width:'+pct+'%"></div></div></div></div>'+
    '<div class="dash-grid"><div class="stat-card"><div class="stat-icon">📋</div><div class="stat-value">'+done+'/'+total+'</div><div class="stat-label">Journey Steps</div></div><div class="stat-card"><div class="stat-icon">✅</div><div class="stat-value">'+clDone+'/'+clTotal+'</div><div class="stat-label">Checklist Items</div></div><div class="stat-card"><div class="stat-icon">🧠</div><div class="stat-value">'+quizState.score+'/'+quizState.total+'</div><div class="stat-label">Quiz Score</div></div><div class="stat-card"><div class="stat-icon">🔥</div><div class="stat-value">'+quizState.streak+'</div><div class="stat-label">Quiz Streak</div></div></div>'+
    '<div class="section-title">Quick Actions</div><div class="quick-grid"><button class="quick-card" onclick="switchTab(\'chat\')"><span class="quick-card-icon">💬</span>Ask AI a question</button><button class="quick-card" onclick="switchTab(\'checklist\')"><span class="quick-card-icon">✅</span>My checklist</button><button class="quick-card" onclick="switchTab(\'journey\')"><span class="quick-card-icon">🗺️</span>View journey</button><button class="quick-card" onclick="openBoothMap()"><span class="quick-card-icon">📍</span>Find my booth</button></div>'+
    '<div id="booth-map-container" style="display:none; margin-top:16px;"><div class="section-title">Your Polling Area</div><div id="booth-map" style="width:100%;height:300px;border-radius:12px;margin-bottom:8px;"></div><button class="btn-primary" id="directions-btn" style="width:100%">Get Directions ↗</button></div>'+
    '<button class="btn-ghost" onclick="resetProfile()">🔄 Change Profile</button></div>';
  renderLangToggle('lang-toggle-home');
}

window.saveProfile=function(){
  var state=document.getElementById('ob-state').value;
  if(!state){announce('Please select your state');return;}
  var elType=document.getElementById('ob-election').value;
  var isFirst=document.getElementById('ob-ft-yes').classList.contains('active');
  profile={state:state,electionType:elType,isFirstTime:isFirst,age:null};
  sessionStorage.setItem('eq_profile',JSON.stringify(profile));
  updateSidebarProfile();
  announce('Profile saved! Welcome to ElectIQ.');
  window.gaLogEvent('profile_set', { state: state, electionType: elType, isFirstTime: isFirst });
  renderHome();loadTimeline();
};

window.resetProfile=function(){
  profile=null;sessionStorage.removeItem('eq_profile');
  updateSidebarProfile();renderHome();
};

// JOURNEY
function loadTimeline(){
  if(!profile)return;
  fetch(BACKEND_URL+'/api/timeline/'+encodeURIComponent(profile.state)).then(function(r){return r.json();}).then(function(d){
    timelineSteps=d.timeline||[];sessionStorage.setItem('eq_tl',JSON.stringify(timelineSteps));renderJourney();
  }).catch(function(){
    timelineSteps=[{id:1,title:'Check voter registration',description:'Verify your name on the electoral roll',deadline:'Before nomination period',icon:'📋',link:'https://voters.eci.gov.in',category:'Registration'},{id:2,title:'Register if not enrolled',description:'Submit Form 6 on NVSP portal',deadline:'30 days before polls',icon:'✍️',link:'https://voters.eci.gov.in/register-as-voter',category:'Registration'},{id:3,title:'Download voter ID',description:'Download e-EPIC from voterportal.eci.gov.in',deadline:'Anytime',icon:'🪪',link:'https://voterportal.eci.gov.in',category:'Identity'},{id:4,title:'Find your polling booth',description:'Search your booth address and serial number',deadline:'1 week before polling',icon:'📍',link:'https://voters.eci.gov.in',category:'Preparation'},{id:5,title:'Cast your vote',description:'Carry approved photo ID. Use EVM + VVPAT.',deadline:'Election day',icon:'🗳️',link:null,category:'Voting'},{id:6,title:'Track results',description:'Watch live results on results.eci.gov.in',deadline:'Results day',icon:'📊',link:'https://results.eci.gov.in',category:'Results'}];
    renderJourney();
  });
}

function renderJourney(){
  var el=document.getElementById('view-journey');
  if(!profile){el.innerHTML='<div class="empty-state">Set up your profile on the Dashboard first.</div>';return;}
  var steps=timelineSteps.length?timelineSteps:[{id:1,title:'Loading...',description:'',deadline:'',icon:'⏳'}];
  el.innerHTML='<div class="timeline-wrap">'+steps.map(function(s,i){
    var isDone=!!completedSteps[s.id];
    return'<div class="tl-step" style="animation-delay:'+(i*0.06)+'s"><div class="tl-line"><div class="tl-dot'+(isDone?' done':'')+'">'+s.icon+'</div>'+(i<steps.length-1?'<div class="tl-connector"></div>':'')+'</div><div class="tl-content"><div class="tl-title">'+escapeHtml(s.title)+'</div><div class="tl-desc">'+escapeHtml(s.description)+'</div><div class="tl-meta">'+(s.deadline?'<span class="tl-badge">'+escapeHtml(s.deadline)+'</span>':'')+(s.link?'<a class="tl-link" href="'+s.link+'" target="_blank" rel="noopener">Official ↗</a>':'')+'<button class="tl-done-btn'+(isDone?' checked':'')+'" onclick="toggleStep('+s.id+')">'+(isDone?'✓ Done':'Mark done')+'</button></div></div></div>';
  }).join('')+'</div>';
}

window.toggleStep=function(id){
  completedSteps[id]=!completedSteps[id];
  sessionStorage.setItem('eq_steps',JSON.stringify(completedSteps));
  renderJourney();renderHome();
  announce(completedSteps[id]?'Step marked done':'Step unmarked');
  if(completedSteps[id] && profile) window.gaLogEvent('timeline_step_completed', { step: id, state: profile.state });
};

// CHAT
function addMessage(text,role){
  var cm=document.getElementById('chat-messages');if(!cm)return;
  var ts=getTS();
  if(role==='user'){
    cm.innerHTML+='<div class="msg msg-user-wrap"><div class="msg-user">'+escapeHtml(text)+'</div><div class="msg-ts">'+ts+'</div></div>';
  }else{
    cm.innerHTML+='<div class="msg msg-bot-wrap"><div class="msg-bot">'+formatBot(text)+'</div><div class="msg-ts">'+ts+'</div></div>';
  }
  cm.scrollTop=cm.scrollHeight;
}
function showTyping(){var cm=document.getElementById('chat-messages');if(!cm)return;cm.innerHTML+='<div class="typing" id="typing-ind"><span></span><span></span><span></span></div>';cm.scrollTop=cm.scrollHeight;}
function hideTyping(){var t=document.getElementById('typing-ind');if(t)t.remove();}

window.handleSend=function(){
  if(isThinking)return;
  var input=document.getElementById('chat-input');
  var msg=input.value.trim();if(!msg)return;
  input.value='';
  addMessage(msg,'user');
  conversationHistory.push({role:'user',text:msg});
  isThinking=true;showTyping();
  window.gaLogEvent('chat_sent', { hasVoice: window.voiceTriggered || false, hasImage: !!selectedImageBase64, messageLength: msg.length });
  
  var payload = {message:msg, profile:profile||{}, history:conversationHistory.slice(-12), sessionId:sessionId, language:currentLang};
  if(selectedImageBase64) payload.image = selectedImageBase64;
  
  fetch(BACKEND_URL+'/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
  .then(function(r){return r.json();})
  .then(function(d){
    hideTyping();isThinking=false;
    var reply=d.reply||'Sorry, I could not process that.';
    addMessage(reply,'bot');
    conversationHistory.push({role:'model',text:reply});
    if(window.voiceTriggered&&synthesis){speakResponse(reply);window.voiceTriggered=false;}
    removeImage();
  })
  .catch(function(){hideTyping();isThinking=false;addMessage('Connection error. Please try again.','bot');removeImage();});
};

window.sendQuick=function(msg){
  document.getElementById('chat-input').value=msg;
  if(activeTab!=='chat')switchTab('chat');
  setTimeout(function(){handleSend();},100);
};

document.getElementById('chat-input').addEventListener('keydown',function(e){
  if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();handleSend();}
});

// CHECKLIST
function loadChecklist(){
  if(!profile||checklistLoading)return;
  checklistLoading=true;
  fetch(BACKEND_URL+'/api/checklist/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({profile:profile,language:currentLang})})
  .then(function(r){return r.json();})
  .then(function(d){checklistLoading=false;checklistItems=d.checklist||[];if(checklistItems.length)sessionStorage.setItem('eq_cli',JSON.stringify(checklistItems));renderChecklist();})
  .catch(function(){
    checklistLoading=false;
    checklistItems=[
      {id:'reg_check',category:'Registration',task:'Check your name on the electoral roll',detail:'Visit voters.eci.gov.in and search by name or EPIC number',isRequired:true,officialLink:'https://voters.eci.gov.in'},
      {id:'reg_form6',category:'Registration',task:'Submit Form 6 if not registered',detail:'Available online on NVSP portal or offline at Taluka office',isRequired:true,officialLink:'https://voters.eci.gov.in/register-as-voter'},
      {id:'id_epic',category:'Identity',task:'Obtain or download your EPIC card',detail:'Download e-EPIC from voterportal.eci.gov.in',isRequired:true,officialLink:'https://voterportal.eci.gov.in'},
      {id:'id_backup',category:'Identity',task:'Keep a backup photo ID ready',detail:'Aadhaar, Passport, or Driving Licence as alternatives',isRequired:false,officialLink:null},
      {id:'poll_booth',category:'Polling Day',task:'Find and visit your polling booth location',detail:'Know the address before election day to avoid delays',isRequired:true,officialLink:'https://voters.eci.gov.in'},
      {id:'poll_id',category:'Polling Day',task:'Carry your approved photo ID to the booth',detail:'EPIC is the most reliable; 12 IDs are accepted',isRequired:true,officialLink:null},
      {id:'poll_ink',category:'Polling Day',task:'Get your finger inked after voting',detail:'Indelible ink mark prevents duplicate voting',isRequired:true,officialLink:null},
      {id:'post_track',category:'Post-Voting',task:'Track results on results.eci.gov.in',detail:'Live results are published after counting begins',isRequired:false,officialLink:'https://results.eci.gov.in'}
    ];
    renderChecklist();
  });
}

function renderChecklist(){
  var el=document.getElementById('view-checklist');
  if(!profile){el.innerHTML='<div class="empty-state">Set up your profile on the Dashboard first.</div>';return;}
  if(!checklistItems.length&&!checklistLoading){el.innerHTML='<div class="empty-state">Loading checklist...</div>';loadChecklist();return;}
  if(!checklistItems.length){el.innerHTML='<div class="empty-state">Loading checklist...</div>';return;}
  var done=0;checklistItems.forEach(function(it){if(checklistProgress[it.id])done++;});
  var pct=Math.round(done/checklistItems.length*100);
  var cats={};checklistItems.forEach(function(it){if(!cats[it.category])cats[it.category]=[];cats[it.category].push(it);});
  var html='<div class="checklist-wrap"><div class="cl-progress"><div class="cl-progress-top"><span class="cl-progress-label">Your preparation</span><span class="cl-progress-pct">'+pct+'%</span></div><div class="cl-bar"><div class="cl-bar-fill" style="width:'+pct+'%"></div></div></div>';
  Object.keys(cats).forEach(function(cat){
    html+='<div class="cl-group-title">'+escapeHtml(cat)+'</div>';
    cats[cat].forEach(function(it,i){
      var isDone=!!checklistProgress[it.id];
      html+='<div class="cl-item'+(isDone?' done':'')+'" onclick="toggleCL(\''+it.id+'\')" style="animation-delay:'+(i*0.05)+'s"><div class="cl-check">'+(isDone?'✓':'')+'</div><div class="cl-info"><div class="cl-task">'+escapeHtml(it.task)+(it.isRequired?'<span class="cl-required">Required</span>':'')+'</div><div class="cl-detail">'+escapeHtml(it.detail)+'</div>'+(it.officialLink?'<a class="cl-link" href="'+it.officialLink+'" target="_blank" rel="noopener" onclick="event.stopPropagation()">Official source ↗</a>':'')+'</div></div>';
    });
  });
  html+='</div>';el.innerHTML=html;
}

window.toggleCL=function(id){
  checklistProgress[id]=!checklistProgress[id];
  sessionStorage.setItem('eq_cl',JSON.stringify(checklistProgress));
  renderChecklist();
  if(checklistProgress[id]) window.gaLogEvent('checklist_item_checked', { itemId: id });
  fetch(BACKEND_URL+'/api/checklist/progress',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:sessionId,itemId:id,completed:!!checklistProgress[id]})}).catch(function(){});
};

// BOOTH MAP
var boothMapInstance = null;
window.openBoothMap = function() {
  var container = document.getElementById('booth-map-container');
  if(container) container.style.display = 'block';
  
  if(typeof L === 'undefined') {
    document.getElementById('booth-map').innerHTML = '<div style="padding:20px;text-align:center;color:var(--muted)">Map library not loaded.</div>';
    return;
  }
  
  window.gaLogEvent('booth_map_opened', { state: profile ? profile.state : 'Unknown' });
  
  // Default to a central coordinate
  var latLng = [20.5937, 78.9629];
  var boothName = 'Approximate Area';
  
  if(profile && profile.state === 'Maharashtra') { latLng = [18.9387, 72.8258]; boothName = 'Simulated Booth: Mumbai Central School'; }
  if(profile && profile.state === 'Delhi') { latLng = [28.6139, 77.2090]; boothName = 'Simulated Booth: Delhi Public School'; }
  if(profile && profile.state === 'Tamil Nadu') { latLng = [13.0489, 80.2332]; boothName = 'Simulated Booth: Chennai Public School (T. Nagar)'; }
  
  if(!boothMapInstance) {
    boothMapInstance = L.map('booth-map').setView(latLng, 15); // Zoomed in closer for realism
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(boothMapInstance);
    L.marker(latLng).addTo(boothMapInstance).bindPopup('<b>Assigned Polling Booth</b><br>' + boothName).openPopup();
  } else {
    boothMapInstance.setView(latLng, 15);
  }
  
  document.getElementById('directions-btn').onclick = function() {
    window.open('https://www.google.com/maps/dir/?api=1&destination='+latLng[0]+','+latLng[1]);
  };
};
// QUIZ
function renderQuizStart(){
  var el=document.getElementById('view-quiz');
  el.innerHTML='<div class="quiz-wrap"><div class="quiz-start"><div class="quiz-start-icon">🧠</div><div style="font-size:22px;font-weight:700;margin-bottom:8px">Civic Knowledge Quiz</div><div style="font-size:13px;color:var(--muted);margin-bottom:24px;line-height:1.6">Test your knowledge of the Indian election process.<br>Questions adapt to your level — powered by Gemini AI.</div><button class="btn-primary" onclick="fetchQuizQuestion()" style="max-width:260px;margin:0 auto">Start Quiz</button></div></div>';
}

window.fetchQuizQuestion=function(){
  var el=document.getElementById('view-quiz');
  el.innerHTML='<div class="quiz-wrap"><div class="empty-state">Generating question...</div></div>';
  var st=profile?profile.state:'';var prev=quizState.topics.join(',');
  fetch(BACKEND_URL+'/api/quiz/question?difficulty='+quizState.difficulty+'&state='+encodeURIComponent(st)+'&previousTopics='+encodeURIComponent(prev)+'&language='+encodeURIComponent(currentLang))
  .then(function(r){return r.json();})
  .then(function(d){quizState.currentQ=d.question;quizState.answered=false;renderQuizQuestion();})
  .catch(function(){
    quizState.currentQ={question:'What does EPIC stand for?',options:['Elector Photo Identity Card','Electronic Polling ID Code','Election Process ID Certificate','Electoral Photo ID Coupon'],correctIndex:0,explanation:'EPIC stands for Elector Photo Identity Card, issued by the Election Commission of India.',topic:'voter_id'};
    quizState.answered=false;renderQuizQuestion();
  });
};

function renderQuizQuestion(){
  var el=document.getElementById('view-quiz');var q=quizState.currentQ;if(!q)return;
  var letters=['A','B','C','D'];var diffLabels=['','Basic','Intermediate','Advanced'];
  var html='<div class="quiz-wrap"><div class="quiz-score"><div><div class="quiz-score-num">'+quizState.score+'/'+quizState.total+'</div><div class="quiz-score-label">Score</div></div><div style="flex:1"></div>'+(quizState.streak>1?'<div class="quiz-streak">🔥 '+quizState.streak+' streak</div>':'')+'<div class="quiz-difficulty">'+diffLabels[quizState.difficulty]+'</div></div>';
  html+='<div class="quiz-card"><div class="quiz-q">'+escapeHtml(q.question)+'</div><div class="quiz-opts">';
  q.options.forEach(function(opt,i){html+='<button class="quiz-opt" id="qopt-'+i+'" onclick="answerQuiz('+i+')"><span class="quiz-opt-letter">'+letters[i]+'</span>'+escapeHtml(opt)+'</button>';});
  html+='</div><div id="quiz-feedback"></div></div>';
  if(quizState.topics.length){html+='<div class="quiz-topics">';quizState.topics.forEach(function(t){html+='<span class="quiz-topic-badge covered">'+escapeHtml(t)+'</span>';});html+='</div>';}
  html+='</div>';el.innerHTML=html;
}

window.answerQuiz=function(idx){
  if(quizState.answered)return;
  quizState.answered=true;quizState.total++;
  var q=quizState.currentQ;var correct=idx===q.correctIndex;
  if(correct){quizState.score++;quizState.streak++;}else{quizState.streak=0;}
  if(q.topic&&quizState.topics.indexOf(q.topic)===-1)quizState.topics.push(q.topic);
  document.querySelectorAll('.quiz-opt').forEach(function(btn,i){btn.classList.add('disabled');if(i===q.correctIndex)btn.classList.add('correct');if(i===idx&&!correct)btn.classList.add('wrong');});
  var fb=document.getElementById('quiz-feedback');
  fb.innerHTML='<div class="quiz-explain">'+(correct?'✅ Correct! ':'❌ Incorrect. ')+escapeHtml(q.explanation)+'</div><button class="btn-primary quiz-next" onclick="fetchQuizQuestion()">Next Question →</button>';
  
  window.gaLogEvent('quiz_answer', { correct: correct, difficulty: quizState.difficulty, topic: q.topic });
  
  fetch(BACKEND_URL+'/api/quiz/answer',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:sessionId,topic:q.topic,correct:correct,difficulty:quizState.difficulty})})
  .then(function(r){return r.json();}).then(function(d){quizState.difficulty=d.nextDifficulty||quizState.difficulty;}).catch(function(){});
  announce(correct?'Correct answer!':'Incorrect. The right answer was '+q.options[q.correctIndex]);
};

// VOICE
var recognition=null;var synthesis=window.speechSynthesis;var voiceActive=false;
function initVoice(){
  var SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR)return;
  recognition=new SR();recognition.continuous=false;recognition.interimResults=true;recognition.lang='en-IN';
  recognition.onstart=function(){document.getElementById('voice-btn').classList.add('listening');announce('Listening...');};
  recognition.onresult=function(e){var t=Array.from(e.results).map(function(r){return r[0].transcript;}).join('');if(e.results[e.results.length-1].isFinal)document.getElementById('chat-input').value=t;};
  recognition.onend=function(){document.getElementById('voice-btn').classList.remove('listening');voiceActive=false;var input=document.getElementById('chat-input');if(input.value.trim()){window.voiceTriggered=true;handleSend();}};
  recognition.onerror=function(){document.getElementById('voice-btn').classList.remove('listening');voiceActive=false;};
}
window.startVoice=function(){if(!recognition)return;if(synthesis)synthesis.cancel();try{recognition.start();voiceActive=true;}catch(e){}};
window.stopVoice=function(){if(!recognition||!voiceActive)return;try{recognition.stop();voiceActive=false;}catch(e){}};
function speakResponse(text){if(!synthesis)return;synthesis.cancel();var c=text.replace(/\*\*(.*?)\*\*/g,'$1').replace(/[*_`]/g,'');var u=new SpeechSynthesisUtterance(c);u.rate=1.05;u.pitch=1.0;u.volume=0.9;u.lang='en-IN';synthesis.speak(u);}

// LANGUAGE TOGGLE
function getRegionalLang(){
  if(!profile||!profile.state)return null;
  var lang=STATE_LANGUAGES[profile.state];
  return (lang&&lang!=='English')?lang:null;
}

function renderLangToggle(containerId){
  var container=document.getElementById(containerId);if(!container)return;
  var regional=getRegionalLang();
  if(!regional){container.innerHTML='';return;}
  var isRegional=currentLang!=='English';
  container.innerHTML='<div class="lang-toggle" role="group" aria-label="Language selection">'+
    '<button class="lang-btn'+(isRegional?'':' active')+'" onclick="setLang(\'English\')" aria-label="English" aria-pressed="'+(isRegional?'false':'true')+'" lang="en">EN</button>'+
    '<button class="lang-btn'+(isRegional?' active':'')+'" onclick="setLang(\''+regional+'\')" aria-label="'+regional+'" aria-pressed="'+(isRegional?'true':'false')+'">'+regional.substring(0,3).toUpperCase()+'</button>'+
  '</div>';
}

window.setLang=function(lang){
  currentLang=lang;
  sessionStorage.setItem('eq_lang',lang);
  // Re-render active tab
  if(activeTab==='home')renderHome();
  // Clear cached checklist so it reloads in new language
  checklistItems=[];checklistLoading=false;sessionStorage.removeItem('eq_cli');
  announce('Language set to '+lang);
};

// BOOT
(function boot(){
  updateSidebarProfile();
  if(profile){loadTimeline();var cached=sessionStorage.getItem('eq_cli');if(cached){try{checklistItems=JSON.parse(cached);}catch(e){}}}
  renderHome();initVoice();
})();
