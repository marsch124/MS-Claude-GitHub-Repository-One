import pathlib, sys, base64

root = pathlib.Path("/home/user/MS-Claude-GitHub-Repository-One")
out  = pathlib.Path("/tmp/claude-0/-home-user-MS-Claude-GitHub-Repository-One/3c40d1b8-f64d-57fc-9e48-4f4e287b227f/scratchpad")

terms_js = (root/"js"/"terms.js").read_text()

VERSION = "3.4"
BUILD = sys.argv[1] if len(sys.argv) > 1 else "2026-07-25"

# ---------------- Logo (AMS + triathlon) ----------------
LOGO_SVG = """<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'>
<defs><linearGradient id='g' x1='0' y1='0' x2='0' y2='1'>
<stop offset='0' stop-color='#0b7285'/><stop offset='1' stop-color='#053640'/></linearGradient></defs>
<rect width='512' height='512' rx='104' fill='url(#g)'/>
<text x='256' y='210' font-family='Helvetica,Arial,sans-serif' font-size='150' font-weight='800' fill='#fff' text-anchor='middle' letter-spacing='6'>AMS</text>
<!-- triathlon: three waves (swim · bike · run) -->
<g fill='none' stroke='#7fe1ef' stroke-width='22' stroke-linecap='round'>
<path d='M92 306 q42 -34 84 0 t84 0 t84 0 t84 0'/>
<path d='M92 366 q42 -34 84 0 t84 0 t84 0 t84 0'/>
<path d='M92 426 q42 -34 84 0 t84 0 t84 0 t84 0'/>
</g>
</svg>"""
LOGO_B64 = base64.b64encode(LOGO_SVG.encode()).decode()

CSS = r"""
:root{
  --bg:#f4f6f8;--surface:#fff;--text:#14202b;--muted:#5b6b78;--border:#e1e6ea;
  --accent:#0b7285;--accent-ink:#fff;--chip-bg:#e6f4f6;--chip-ink:#0b7285;
  --badge-bg:#fff3bf;--badge-ink:#7a5a00;--mark:#ffe08a;--star:#f2b705;--disc:#e6f4f6;--edited:#b4690a;
  --shadow:0 1px 3px rgba(10,30,40,.08),0 4px 12px rgba(10,30,40,.05);
}
:root[data-theme="dark"]{
  --bg:#0e1418;--surface:#171f26;--text:#e7edf1;--muted:#93a2ad;--border:#26313a;
  --accent:#3bc9db;--accent-ink:#04222a;--chip-bg:#123038;--chip-ink:#7fe1ef;
  --badge-bg:#3a2f00;--badge-ink:#ffe08a;--mark:#8a6d00;--star:#ffd43b;--disc:#123038;--edited:#ffc861;
  --shadow:0 1px 3px rgba(0,0,0,.4),0 4px 14px rgba(0,0,0,.3);
}
@media (prefers-color-scheme:dark){:root:not([data-theme]){
  --bg:#0e1418;--surface:#171f26;--text:#e7edf1;--muted:#93a2ad;--border:#26313a;
  --accent:#3bc9db;--accent-ink:#04222a;--chip-bg:#123038;--chip-ink:#7fe1ef;
  --badge-bg:#3a2f00;--badge-ink:#ffe08a;--mark:#8a6d00;--star:#ffd43b;--disc:#123038;--edited:#ffc861;
  --shadow:0 1px 3px rgba(0,0,0,.4),0 4px 14px rgba(0,0,0,.3);
}}
*{box-sizing:border-box}
html,body{margin:0;padding:0}
body{background:var(--bg);color:var(--text);line-height:1.5;padding-bottom:5rem;
  font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased}
.topbar{position:sticky;top:0;z-index:10;background:var(--surface);border-bottom:1px solid var(--border);padding:env(safe-area-inset-top) 0 .5rem;box-shadow:var(--shadow)}
.topbar-inner{display:flex;align-items:center;gap:.4rem;padding:.55rem 1rem .4rem;max-width:760px;margin:0 auto}
.logo{width:2rem;height:2rem;border-radius:.5rem;flex:none}
.topbar h1{font-size:1.08rem;margin:0;flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;letter-spacing:-.01em}
.icon-btn{background:transparent;border:1px solid var(--border);color:var(--text);border-radius:50%;width:2.15rem;height:2.15rem;font-size:1.02rem;cursor:pointer;flex:none;display:flex;align-items:center;justify-content:center}
.icon-btn:active{transform:scale(.94)}
.search-wrap{padding:0 1rem;max-width:760px;margin:0 auto}
#search{width:100%;padding:.7rem .9rem;font-size:1rem;border:1px solid var(--border);border-radius:.7rem;background:var(--bg);color:var(--text)}
#search:focus{outline:none;border-color:var(--accent);box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 25%,transparent)}
.filters{display:flex;gap:.4rem;overflow-x:auto;padding:.6rem 1rem .2rem;max-width:760px;margin:0 auto;-webkit-overflow-scrolling:touch;scrollbar-width:none}
.filters::-webkit-scrollbar{display:none}
.filter{flex:none;border:1px solid var(--border);background:var(--surface);color:var(--muted);padding:.35rem .75rem;border-radius:999px;font-size:.85rem;cursor:pointer;white-space:nowrap}
.filter .n{opacity:.6;font-size:.78rem;margin-left:.15rem}
.chip-ams{height:.9rem;width:.9rem;border-radius:.2rem;vertical-align:-2px;margin-right:.2rem}
.filter .chip-edited{color:var(--edited)}
.filter.active .chip-edited{color:inherit}
.filter.active{background:var(--accent);color:var(--accent-ink);border-color:var(--accent);font-weight:600}
.filter.active .n{opacity:.85}
main{max-width:760px;margin:0 auto;padding:.75rem 1rem 0}
.count{color:var(--muted);font-size:.85rem;margin:.25rem 0 .75rem}
.list{display:grid;gap:.7rem}
.card{position:relative;background:var(--surface);border:1px solid var(--border);border-radius:.85rem;padding:.85rem .95rem;box-shadow:var(--shadow);cursor:pointer}
.card:hover{border-color:var(--accent)}
.card-top{display:flex;gap:.7rem;align-items:flex-start}
.avatar{flex:none;width:2.6rem;height:2.6rem;border-radius:.6rem;background:var(--disc);display:flex;align-items:center;justify-content:center;font-size:1.4rem;overflow:hidden}
.avatar img{width:100%;height:100%;object-fit:cover}
.card-main{flex:1;min-width:0}
.card-head{display:flex;align-items:baseline;flex-wrap:wrap;gap:.35rem .5rem;padding-right:1.8rem}
.term-name{font-size:1.06rem;font-weight:700}
.term-full{font-size:.88rem;color:var(--muted);font-style:italic}
.badge{font-size:.66rem;text-transform:uppercase;letter-spacing:.03em;font-weight:700;background:var(--badge-bg);color:var(--badge-ink);padding:.1rem .4rem;border-radius:.4rem}
.edited-tag{font-size:.62rem;text-transform:uppercase;letter-spacing:.03em;font-weight:700;color:var(--edited);border:1px solid var(--edited);padding:.03rem .35rem;border-radius:.4rem}
.ams-badge{height:1.15rem;width:1.15rem;border-radius:.3rem;vertical-align:-3px}
.card.edited .term-name,.dterm.edited{color:var(--edited)}
.chip{display:inline-block;font-size:.72rem;font-weight:600;background:var(--chip-bg);color:var(--chip-ink);padding:.15rem .5rem;border-radius:.4rem}
.card-main>.chip{margin-top:.4rem}
.def{margin:.5rem 0 0;font-size:.95rem}
.example{margin:.4rem 0 0;font-size:.9rem;color:var(--muted);border-left:3px solid var(--border);padding-left:.6rem}
mark{background:var(--mark);color:inherit;border-radius:.2rem;padding:0 .1rem}
.card-foot{display:flex;align-items:center;gap:.6rem;margin-top:.6rem;flex-wrap:wrap}
.reflink,.detail-link{font-size:.82rem;color:var(--accent);text-decoration:none;font-weight:600;background:none;border:none;cursor:pointer;padding:0}
.reflink:hover,.detail-link:hover{text-decoration:underline}
.act{margin-left:auto;display:flex;gap:.35rem}
.act button{border:1px solid var(--border);background:var(--bg);color:var(--muted);border-radius:.5rem;padding:.25rem .5rem;font-size:.8rem;cursor:pointer;line-height:1}
.act button:active{transform:scale(.93)}
.star{position:absolute;top:.5rem;right:.5rem;border:none;background:transparent;cursor:pointer;font-size:1.2rem;line-height:1;color:var(--muted);padding:.1rem}
.star.on{color:var(--star)}
.star:active{transform:scale(.9)}
.empty{color:var(--muted);text-align:center;padding:2rem 1rem}
.fab{position:fixed;right:max(1rem,env(safe-area-inset-right));bottom:max(1.1rem,env(safe-area-inset-bottom));width:3.4rem;height:3.4rem;border-radius:50%;border:none;background:var(--accent);color:var(--accent-ink);font-size:2rem;line-height:1;box-shadow:0 6px 18px rgba(11,114,133,.4);cursor:pointer;z-index:20}
.fab:active{transform:scale(.93)}
.dialog{border:none;border-radius:1rem;padding:0;width:min(94vw,520px);background:var(--surface);color:var(--text);box-shadow:0 20px 50px rgba(0,0,0,.35)}
.dialog::backdrop{background:rgba(6,14,20,.55)}
.dialog .body{padding:1.2rem 1.2rem 1.1rem;max-height:84vh;overflow:auto}
.dialog h2{margin:0 0 .75rem;font-size:1.2rem}
.dialog label{display:block;margin:.7rem 0 .25rem;font-size:.85rem;font-weight:600;color:var(--muted)}
.req{color:#e03131}.opt{color:var(--muted);font-weight:400}
.dialog input,.dialog textarea,.dialog select{width:100%;padding:.6rem .7rem;font-size:1rem;border:1px solid var(--border);border-radius:.6rem;background:var(--bg);color:var(--text);font-family:inherit}
.dialog input:focus,.dialog textarea:focus,.dialog select:focus{outline:none;border-color:var(--accent);box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 25%,transparent)}
.dialog textarea{resize:vertical}
.form-error{color:#e03131;font-size:.85rem;min-height:1.1rem;margin:.5rem 0 0}
.dialog-actions{display:flex;justify-content:flex-end;gap:.5rem;margin-top:.75rem}
.btn{padding:.55rem 1.1rem;font-size:.95rem;border-radius:.6rem;border:1px solid var(--border);cursor:pointer;font-weight:600;background:var(--bg);color:var(--text)}
.btn.primary{background:var(--accent);color:var(--accent-ink);border-color:var(--accent)}
.btn.ghost{background:transparent}
.btn:active{transform:scale(.97)}
.settings-sec{border-top:1px solid var(--border);margin-top:1rem;padding-top:.9rem}
.settings-sec h3{margin:0 0 .5rem;font-size:.95rem}
.muted{color:var(--muted);font-size:.85rem}
.theme-opts{display:flex;gap:.4rem;flex-wrap:wrap}
.theme-opts label{display:inline-flex;align-items:center;gap:.35rem;margin:0;padding:.4rem .7rem;border:1px solid var(--border);border-radius:.6rem;cursor:pointer;font-weight:500;color:var(--text)}
.theme-opts input{width:auto;margin:0}
.row-btns{display:flex;gap:.5rem;flex-wrap:wrap;margin-top:.3rem}
details{margin-top:.5rem;border:1px solid var(--border);border-radius:.6rem;padding:.2rem .7rem}
details summary{cursor:pointer;font-weight:600;padding:.5rem 0;list-style:none}
details summary::-webkit-details-marker{display:none}
details summary::before{content:"▸ ";color:var(--accent)}
details[open] summary::before{content:"▾ "}
details .content{padding:.2rem 0 .7rem;font-size:.9rem}
details .content p{margin:.4rem 0}
.changelog{margin:.3rem 0 0;padding:0;list-style:none}
.changelog li{margin-bottom:.7rem}
.changelog .v{font-weight:700}
.changelog ul{margin:.3rem 0 0;padding-left:1.1rem}
.changelog ul li{margin:.15rem 0;font-size:.88rem;color:var(--muted)}
.build{margin-top:1rem;font-size:.8rem;color:var(--muted);text-align:center}
/* detail dialog */
.detail-banner{margin:-1.2rem -1.2rem 0;height:96px;display:flex;align-items:center;justify-content:center;border-radius:0}
.detail-banner svg{height:96px;width:100%}
.detail-head{display:flex;align-items:center;gap:.7rem;margin-top:.8rem}
.detail-emoji{width:2.8rem;height:2.8rem;border-radius:.6rem;background:var(--disc);display:flex;align-items:center;justify-content:center;font-size:1.6rem;flex:none;overflow:hidden}
.detail-emoji img{width:100%;height:100%;object-fit:cover}
.dterm{font-size:1.35rem;font-weight:800;line-height:1.1}
.dfull{color:var(--muted);font-style:italic;font-size:.95rem}
.detail-img{width:100%;max-height:220px;object-fit:cover;border-radius:.7rem;margin-top:.8rem;border:1px solid var(--border)}
.detail h4{margin:1rem 0 .3rem;font-size:.95rem}
.detail p{margin:.45rem 0;font-size:.95rem}
.detail .example{font-size:.92rem}
.scale{width:100%;border-collapse:collapse;margin:.5rem 0;font-size:.86rem}
.scale caption{text-align:left;font-weight:700;margin-bottom:.3rem;font-size:.9rem}
.scale th,.scale td{border:1px solid var(--border);padding:.35rem .5rem;text-align:left;vertical-align:top}
.scale th{background:var(--chip-bg);color:var(--chip-ink)}
.scale td:first-child{font-weight:700;white-space:nowrap;width:1%}
.diagram{margin:.7rem 0;border:1px solid var(--border);border-radius:.7rem;padding:.6rem;background:var(--bg)}
.diagram svg{width:100%;height:auto;display:block}
.diagram .cap{font-size:.8rem;color:var(--muted);margin-top:.35rem;text-align:center}
.rel-wrap{display:flex;flex-wrap:wrap;gap:.4rem;margin:.3rem 0 .2rem}
.rel-chip{border:1px solid var(--border);background:var(--bg);color:var(--accent);border-radius:999px;padding:.3rem .6rem;font-size:.82rem;font-weight:600;cursor:pointer}
.rel-chip:hover{border-color:var(--accent)}
.quiz-scope{color:var(--muted);font-size:.85rem;margin:.2rem 0 .8rem}
.quiz-progress{display:flex;justify-content:space-between;color:var(--muted);font-size:.82rem;margin-bottom:.6rem;font-weight:600}
.quiz-q{font-size:1.35rem;font-weight:800;margin:.2rem 0}
.quiz-full{color:var(--muted);font-style:italic;font-size:.95rem}
.quiz-opt{display:block;width:100%;text-align:left;margin:.4rem 0;padding:.6rem .7rem;border:1px solid var(--border);border-radius:.6rem;background:var(--bg);color:var(--text);cursor:pointer;font-size:.94rem}
.quiz-opt:hover{border-color:var(--accent)}
.quiz-opt.correct{border-color:var(--accent);background:color-mix(in srgb,var(--accent) 16%,transparent)}
.quiz-opt.wrong{border-color:#e03131;background:color-mix(in srgb,#e03131 14%,transparent)}
.quiz-opt:disabled{cursor:default}
.quiz-reveal{margin:.4rem 0;padding:.7rem;border-radius:.6rem;background:var(--bg);border:1px solid var(--border)}
.quiz-result{text-align:center;padding:1.2rem 0 .5rem}
.quiz-score{font-size:2.2rem;font-weight:800;color:var(--accent)}
#rand .rterm{font-size:1.3rem;font-weight:700}
#rand .rfull{color:var(--muted);font-style:italic;margin-left:.4rem;font-size:.95rem}
#toast{position:fixed;left:50%;bottom:5.5rem;transform:translateX(-50%) translateY(1rem);background:#111a20;color:#fff;padding:.6rem 1rem;border-radius:.6rem;font-size:.9rem;opacity:0;pointer-events:none;transition:opacity .2s,transform .2s;z-index:60}
#toast.show{opacity:.96;transform:translateX(-50%) translateY(0)}
@media (min-width:620px){.list{grid-template-columns:1fr 1fr}.topbar h1{font-size:1.2rem}}
"""

APP = r"""
(function(){
  'use strict';
  var KEY_CUSTOM='triGlossary.customTerms.v1',KEY_FAV='triGlossary.favourites.v1',KEY_THEME='triGlossary.theme.v1';
  var VERSION='__VERSION__',BUILD='__BUILD__';
  var AMS_ICON='data:image/svg+xml;base64,__ICON__';
  var CATEGORIES=window.TRIATHLON_CATEGORIES||[];
  var BASE=window.TRIATHLON_TERMS||[];

  var EXTRA=[
    {term:'A / B / C Race',def:'How you rank races in a season: A = your big goal race (fully tapered for), B = important but not peaked, C = training/practice races.',category:'Training'},
    {term:'Taper Madness',def:'The restlessness, phantom niggles and mood swings that hit many athletes during the taper, when training drops but nervous energy rises.',category:'Training',example:'Used like: "Ignore me, it\'s just taper madness."'},
    {term:'Kit',def:'Your clothing and gear for training or racing (trisuit, shoes, helmet, etc.).',category:'Gear'},
    {term:'DFL',full:'Dead Last',def:'Finishing last in the field. Often worn as a badge of honour — you still beat everyone who stayed home.',category:'Racing'},
    {term:'Chicked',def:'Slang for being overtaken by a female athlete — used good-naturedly across the sport.',category:'Racing'},
    {term:'Gantry',def:'The finish arch you run under at the end of the race — the backdrop of every finish-line photo.',category:'Racing'},
    {term:'Podium',def:'A top-three finish in your category (or overall).',category:'Racing'},
    {term:'Out-and-Back',def:'A course that goes out to a turnaround point and returns the same way.',category:'Racing'},
    {term:'Loop Course',def:'A course made of one or more repeated laps.',category:'Racing'},
    {term:'Point-to-Point',def:'A course that finishes somewhere different from where it started.',category:'Racing'},
    {term:'Wetsuit Strippers',def:'Volunteers in T1 who yank your wetsuit off your legs as you lie down — a fast, welcome help.',category:'Swim'},
    {term:'Hand-up',def:'Grabbing a bottle, gel or food handed to you without stopping.',category:'Racing'},
    {term:'Type 2 Fun',def:'Activity that is miserable while you do it but deeply satisfying afterwards — much of endurance sport.',category:'General'},
    {term:'Sufferfest',def:'A brutally hard session or race.',category:'Training'},
    {term:'Neutral Support',def:'Race-provided mechanical help on the bike course, not tied to any team.',category:'Racing'},
    {term:'Sandbagging',def:'Deliberately underselling your fitness or racing below your ability.',category:'Racing'},
    {term:'Zone 1 / Recovery',def:'The easiest training zone — very light, active-recovery effort.',category:'Training'},
    {term:'Aero Helmet',def:'A smooth, elongated helmet designed to cut drag on the bike.',category:'Gear'}
  ];

  var CAT_EMOJI={General:'🔺',Racing:'🏁',Swim:'🏊',Bike:'🚴',Run:'🏃',Training:'📈',Physiology:'🫀',Gear:'⚙️',Nutrition:'🥤',Strength:'🏋️',Workout:'⏱️',Ultra:'🏔️',Longevity:'🧬'};
  var EMOJI={'im':'🏆','70.3':'🥈','140.6':'🎯','olympic / standard':'🥇','kona':'🌺','dnf':'🛑','dns':'⛔','dq':'🚩',
    'pb / pr':'⏱️','wetsuit':'🤿','bonk':'💥','gel':'🧃','hydration':'💧','electrolytes':'🧂','fuelling':'⛽',
    'podium':'🏆','gantry':'🏁','brick':'🧱','the wall':'🧱','taper madness':'😵','chicked':'💪','sufferfest':'😤',
    'transition':'🔁','t1':'🔁','t2':'🔁','aero':'💨','ftp':'⚡','watts':'⚡','power meter':'⚡','vo2max':'🫁','rpe':'🗣️',
    'cramp':'🦵','sighting':'👀','buoy':'🟠','turn buoy':'🟠','goggles':'🥽','swim cap':'🧢','disc wheel':'🛞',
    'trainer / turbo':'🚲','zwift':'🎮','garmin / wahoo':'⌚','gps watch':'⌚','bib':'🔢','race belt':'🎽',
    'sherpa':'🧳','aid station':'🥤','kit':'👕','duathlon':'🏃','aquathlon':'🏊','aquabike':'🚴','type 2 fun':'😅','dfl':'🐢'};

  // deep detail: history / more paragraphs / tables / diagram key
  var D={};
  D['rpe']={history:'The perceived-exertion scale was created by Swedish psychologist Gunnar Borg in the 1960s. His original 6–20 scale was deliberately numbered so that multiplying the rating by 10 roughly estimates heart rate — 6 ≈ 60 bpm at rest, 20 ≈ 200 bpm near maximum. Borg later added a category-ratio 1–10 version (the "CR10"), which is what most triathlon coaches use today.',
    more:['Triathletes love RPE because it needs no device, costs nothing, and unifies effort across swim, bike and run. It also self-corrects for the day: heat, fatigue, altitude, caffeine and a racing heart at the start line all skew heart rate, but your perceived effort still tells the truth.','A good habit: pair RPE with the "talk test" — at RPE 3–4 you can hold a conversation; by RPE 7 you manage short sentences; at RPE 9–10 you can barely speak.'],
    tables:[
      {caption:'Borg scale (6–20)',head:['Rating','Feels like'],rows:[['6','No exertion — complete rest'],['7–8','Extremely light'],['9–10','Very light (easy warm-up)'],['11–12','Light — comfortable, Zone 2'],['13–14','Somewhat hard — steady aerobic'],['15–16','Hard — around threshold'],['17–18','Very hard — only sustainable briefly'],['19','Extremely hard — near maximum'],['20','Maximal effort']]},
      {caption:'Common 1–10 scale',head:['Rating','Effort'],rows:[['1','Very easy — recovery'],['2–3','Easy — conversational (Zone 2)'],['4','Moderate — steady'],['5–6','Somewhat hard → tempo'],['7','Hard — threshold, short sentences'],['8','Very hard — VO₂, few words'],['9','Severe — near-max intervals'],['10','All-out — sprint / maximal']]}
    ]};
  D['im']={history:'The first Ironman was held on Oahu, Hawaii, in 1978. Naval officer John Collins proposed settling a bar-room argument about who were the fittest athletes — swimmers, cyclists or runners — by stitching together three existing races: the 2.4-mile Waikiki Roughwater Swim, a 112-mile bike around the island, and the 26.2-mile Honolulu Marathon. Fifteen men started; twelve finished, and Gordon Haller won in 11:46.',
    more:['Whoever finished, Collins said, "we\'ll call an Ironman." The distance — 2.4 / 112 / 26.2, totalling 140.6 miles — has been the full-distance benchmark ever since, and IRONMAN is now a global race brand owned by the World Triathlon Corporation.']};
  D['kona']={history:'Kailua-Kona, on the Big Island of Hawaii, has hosted the IRONMAN World Championship since 1981 (it moved from Oahu as the field outgrew the island). It is the sport\'s most storied race.',
    more:['Kona is infamous for its conditions: searing lava-field heat, high humidity, and the swirling "Mumuku" crosswinds along the Queen K Highway that can bring strong riders to a crawl. Earning a "Kona slot" — a qualifying place from another IRONMAN race — is a lifelong goal for many age-group triathletes.']};
  D['fartlek']={history:'"Fartlek" is Swedish for "speed play". It was devised in the 1930s by coach Gösta Holmér for the Swedish cross-country team.',
    more:['Unlike rigid intervals, fartlek is unstructured: you surge to a tree, a lamppost or the top of a hill, then float and recover by feel before the next burst. It blends continuous and interval training in one run and keeps sessions playful.']};
  D['brick']={history:'A brick is a session that stacks two disciplines back-to-back — almost always a bike immediately followed by a run.',
    more:['The point is to teach your body the ugly transition: for the first 5–15 minutes off the bike your legs feel heavy and wooden ("brick legs") as blood flow and stride re-adjust. Practise it and race day feels normal. The name is often explained as the "Bike-Run-ICK" feeling, or simply that your legs feel like bricks.'],diagram:'brick'};
  D['t1']={history:'Transitions are sometimes called the "fourth discipline" — the only place you can gain time without being fitter.',
    more:['T1 (swim-to-bike) rewards a rehearsed routine: wetsuit peeled to the waist while running, helmet on and buckled before you touch the bike, sunglasses and shoes sorted, then out to the mount line. Seconds fumbling here can cost more than minutes of hard riding.']};
  D['t2']={more:['T2 (bike-to-run) is shorter but just as costly if messy: rack the bike, helmet off (only after the bike is racked — never before), slip into running shoes with elastic laces, grab race belt and go. Practising T2 also eases the jarring "brick legs" of the early run.']};
  D['drafting (bike)']={history:'Riding in another cyclist\'s slipstream can save 20–30% of your energy — which is exactly why it is banned in most age-group triathlon.',
    more:['In non-drafting racing you must keep a set distance behind the rider ahead (the "draft zone" — for example 12 metres in IRONMAN events) and complete any pass within a time limit, or drop back. Marshals on motorbikes hand out time penalties. Draft-legal ITU/Olympic racing is the exception, where packs work together like road cycling.'],diagram:'draft'};
  D['draft zone']={more:['The draft zone is the protected space behind and beside each bike. In IRONMAN age-group racing it is commonly 12 m (about six bike lengths); you may enter it only to overtake, and must complete the pass (usually within 25 seconds) or drop back. Sit in it too long and you earn a drafting penalty.'],diagram:'draft'};
  D['wetsuit']={history:'A triathlon wetsuit does three things: keeps you warm, adds buoyancy that lifts your legs into a faster position, and reduces drag — most swimmers are noticeably quicker in one.',
    more:['Whether wetsuits are allowed depends on water temperature. Under governing-body rules they are typically permitted below about 24.5 °C for age-groupers and banned above roughly 28–30 °C (pros have a lower cutoff). Maximum thickness is capped (often 5 mm) for fairness.']};
  D['vo2max']={history:'VO₂max is the maximum rate at which your body can take in, transport and use oxygen, measured in millilitres per kilogram of body weight per minute (ml/kg/min).',
    more:['It sets a ceiling on aerobic performance. It is partly genetic but very trainable through hard aerobic work. For reference, an untrained adult might sit around 35–45, a keen age-grouper 55–65, and elite triathletes 70–85+.']};
  D['ftp']={history:'Functional Threshold Power is the highest power (in watts) you can sustain for about an hour on the bike. It anchors your cycling training zones.',
    more:['Because an all-out hour is brutal to test, FTP is often estimated from a 20-minute maximal effort multiplied by 0.95. Ride below it and you can go for hours; push above it and fatigue climbs fast. Divided by body weight it becomes W/kg, the number that matters on climbs.']};
  D['bonk']={history:'"Bonking" (also "hitting the wall") is what happens when your muscles and liver run out of stored carbohydrate (glycogen).',
    more:['Glycogen powers hard endurance efforts but lasts only around 90–120 minutes at race pace. When it empties, pace collapses and everything feels impossibly hard. The defence is fuelling — taking in roughly 60–90 g of carbohydrate per hour (sometimes more) and training your gut to handle it.']};
  D['negative split']={history:'A negative split means covering the second half of a leg — or the whole race — faster than the first.',
    more:['It is the signature of disciplined pacing: hold back early when adrenaline urges you to fly, and you\'ll have the reserves to accelerate late while others fade. On the run especially, the athletes who look strongest in the final miles almost always started conservatively.'],diagram:'split'};
  D['sighting']={history:'Open water has no black line to follow, so you navigate by "sighting" — briefly lifting your eyes forward to check you\'re heading toward the next buoy.',
    more:['The efficient technique is "alligator eyes": lift just enough for your eyes to clear the surface as you breathe, glance forward, then roll to the side for air. Sight every 4–8 strokes; without it, even strong swimmers drift and swim far extra distance.']};
  D['taper']={history:'The taper is the deliberate reduction in training volume in the final one to three weeks before a race.',
    more:['You cut how much you do while keeping some intensity, letting accumulated fatigue drain away so fitness surfaces — a rebound sometimes called supercompensation. It commonly triggers "taper madness": restlessness, phantom aches and doubt. Trust it; the work is already done.']};

  var DIAGRAMS={
    brick:{cap:'A brick: ride, then run straight off the bike.',svg:"<svg viewBox='0 0 300 90'><g fill='none' stroke='#0b7285' stroke-width='4'><circle cx='60' cy='60' r='18'/><circle cx='110' cy='60' r='18'/><path d='M60 60 l18 -28 h22 l10 28'/></g><text x='85' y='20' font-size='13' fill='#5b6b78'>bike</text><path d='M150 55 h34' stroke='#94a3ad' stroke-width='3' marker-end='url(#a)'/><defs><marker id='a' markerWidth='8' markerHeight='8' refX='6' refY='3' orient='auto'><path d='M0 0 L6 3 L0 6 z' fill='#94a3ad'/></marker></defs><g fill='none' stroke='#e8590c' stroke-width='4' stroke-linecap='round'><circle cx='225' cy='30' r='9' fill='#e8590c' stroke='none'/><path d='M225 40 l0 22 M225 48 l-16 6 M225 48 l15 8 M225 62 l-12 18 M225 62 l14 16'/></g><text x='205' y='20' font-size='13' fill='#5b6b78'>run</text></svg>"},
    draft:{cap:'Non-drafting: keep the set gap (e.g. 12 m) behind the rider ahead.',svg:"<svg viewBox='0 0 300 80'><g fill='none' stroke='#0b7285' stroke-width='4'><circle cx='45' cy='52' r='15'/><circle cx='85' cy='52' r='15'/><path d='M45 52 l15 -22 h18 l7 22'/></g><g fill='none' stroke='#0b7285' stroke-width='4'><circle cx='210' cy='52' r='15'/><circle cx='250' cy='52' r='15'/><path d='M210 52 l15 -22 h18 l7 22'/></g><path d='M100 52 h95' stroke='#e8590c' stroke-width='2' stroke-dasharray='5 5'/><text x='118' y='26' font-size='13' fill='#e8590c'>draft zone</text></svg>"},
    split:{cap:'Negative split: second half faster than the first.',svg:"<svg viewBox='0 0 300 90'><rect x='40' y='30' width='90' height='40' fill='#7fb2bd'/><rect x='170' y='18' width='90' height='52' fill='#0b7285'/><text x='60' y='84' font-size='12' fill='#5b6b78'>1st half</text><text x='188' y='84' font-size='12' fill='#5b6b78'>2nd half (faster)</text></svg>"}
  };

  var ENRICH={
    'im':{link:'https://www.ironman.com',example:'Used like: "Her first IM was Ironman Austria."'},
    '70.3':{link:'https://www.ironman.com',example:'Used like: "I\'m building up to a 70.3 this summer."'},
    'olympic / standard':{link:'https://en.wikipedia.org/wiki/Triathlon_at_the_Summer_Olympics'},
    'kona':{link:'https://www.ironman.com',example:'Used like: "He finally qualified for Kona."'},
    'itu / world triathlon':{link:'https://www.triathlon.org'},
    'usat':{link:'https://www.usatriathlon.org'},'btf':{link:'https://www.britishtriathlon.org'},
    'vo2max':{link:'https://en.wikipedia.org/wiki/VO2_max'},'fartlek':{link:'https://en.wikipedia.org/wiki/Fartlek'},
    'glycogen':{link:'https://en.wikipedia.org/wiki/Glycogen'},'hyponatremia':{link:'https://en.wikipedia.org/wiki/Hyponatremia'},
    'doms':{link:'https://en.wikipedia.org/wiki/Delayed_onset_muscle_soreness'},
    'bonk':{link:'https://en.wikipedia.org/wiki/Hitting_the_wall',example:'Used like: "I bonked at mile 20 and had to walk."'},
    'zwift':{link:'https://www.zwift.com'},'tss':{link:'https://www.trainingpeaks.com'},
    'garmin / wahoo':{link:'https://www.garmin.com'},'di2 / etap':{link:'https://bike.shimano.com'},
    'rpe':{example:'Keep the long run at RPE 3–4 — you should be able to chat.'},
    'brick':{example:'Used like: "I did a 60/20 brick — hour bike, 20-min run."'},
    'negative split':{example:'Used like: "Perfect negative split — second lap was faster."'},
    'aero':{example:'Used like: "Staying aero for 90 km saves you minutes."'}
  };

  var CAT_ART={};
  (function(){
    function art(inner){return "<svg viewBox='0 0 320 96' preserveAspectRatio='xMidYMid slice'><rect width='320' height='96' fill='"+"'/>"+inner+"</svg>";}
    var g="<defs><linearGradient id='cg' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#0b7285'/><stop offset='1' stop-color='#0a5c6b'/></linearGradient></defs><rect width='320' height='96' fill='url(#cg)'/>";
    function w(inner){return "<svg viewBox='0 0 320 96' preserveAspectRatio='xMidYMid slice'>"+g+inner+"</svg>";}
    var s="#bfeef5";
    CAT_ART['Swim']=w("<g fill='none' stroke='"+s+"' stroke-width='4' stroke-linecap='round'><path d='M0 54 q26 -18 52 0 t52 0 t52 0 t52 0 t52 0 t52 0'/><path d='M0 74 q26 -18 52 0 t52 0 t52 0 t52 0 t52 0 t52 0'/></g><circle cx='250' cy='34' r='13' fill='"+s+"'/>");
    CAT_ART['Bike']=w("<g fill='none' stroke='"+s+"' stroke-width='5'><circle cx='96' cy='60' r='24'/><circle cx='224' cy='60' r='24'/><path d='M96 60 l40 -34 h34 l20 34'/><path d='M136 26 l-16 34'/></g>");
    CAT_ART['Run']=w("<g fill='"+s+"'><circle cx='150' cy='24' r='11'/></g><g fill='none' stroke='"+s+"' stroke-width='6' stroke-linecap='round'><path d='M150 36 l0 26 M150 44 l-22 8 M150 44 l20 12 M150 62 l-16 24 M150 62 l20 22'/></g>");
    CAT_ART['Racing']=w("<g><rect x='150' y='16' width='6' height='64' fill='"+s+"'/><g fill='"+s+"'><rect x='156' y='16' width='14' height='14'/><rect x='184' y='16' width='14' height='14'/><rect x='170' y='30' width='14' height='14'/><rect x='198' y='30' width='14' height='14'/><rect x='156' y='44' width='14' height='14'/><rect x='184' y='44' width='14' height='14'/></g></g>");
    CAT_ART['Training']=w("<g fill='"+s+"'><rect x='96' y='58' width='22' height='26'/><rect x='128' y='42' width='22' height='42'/><rect x='160' y='28' width='22' height='56'/></g><path d='M92 40 l104 -20' stroke='"+s+"' stroke-width='4' fill='none'/><path d='M196 20 l-16 2 l6 14 z' fill='"+s+"'/>");
    CAT_ART['Physiology']=w("<path d='M160 78 C120 48 128 24 150 24 C164 24 160 38 160 38 C160 38 156 24 170 24 C192 24 200 48 160 78 Z' fill='"+s+"'/><path d='M96 58 h34 l8 -14 l10 26 l8 -12 h58' fill='none' stroke='#0b7285' stroke-width='3'/>");
    CAT_ART['Gear']=w("<g fill='"+s+"'><path d='M160 34 a26 26 0 1 0 0.1 0 Z M160 44 a16 16 0 1 1 -0.1 0 Z'/><g>"+([0,45,90,135].map(function(a){return "<rect x='156' y='6' width='8' height='16' transform='rotate("+a+" 160 48)'/>";}).join(''))+"</g></g>");
    CAT_ART['Nutrition']=w("<g fill='"+s+"'><rect x='142' y='30' width='36' height='52' rx='8'/><rect x='150' y='18' width='20' height='14' rx='4'/></g><rect x='150' y='44' width='20' height='6' fill='#0b7285'/>");
    CAT_ART['General']=w("<g fill='none' stroke='"+s+"' stroke-width='5'><circle cx='134' cy='48' r='24'/><circle cx='160' cy='48' r='24'/><circle cx='186' cy='48' r='24'/></g>");
    CAT_ART['Strength']=w("<g fill='"+s+"'><rect x='120' y='40' width='12' height='16' rx='2'/><rect x='104' y='34' width='12' height='28' rx='3'/><rect x='188' y='40' width='12' height='16' rx='2'/><rect x='204' y='34' width='12' height='28' rx='3'/><rect x='132' y='45' width='56' height='7' rx='3'/></g>");
    CAT_ART['Workout']=w("<g fill='none' stroke='"+s+"' stroke-width='7'><circle cx='160' cy='50' r='28'/></g><rect x='150' y='12' width='20' height='9' rx='2' fill='"+s+"'/><rect x='157' y='19' width='6' height='9' fill='"+s+"'/><path d='M160 50 V32 M160 50 l15 9' stroke='"+s+"' stroke-width='6' stroke-linecap='round' fill='none'/>");
    CAT_ART['Ultra']=w("<path d='M30 82 L96 34 L138 62 L186 22 L250 60 L292 82 Z' fill='"+s+"'/><circle cx='210' cy='28' r='11' fill='"+s+"'/>");
    CAT_ART['Longevity']=w("<path d='M160 80 C116 48 126 22 150 22 C166 22 160 38 160 38 C160 38 154 22 170 22 C194 22 204 48 160 80 Z' fill='"+s+"'/><path d='M96 54 h30 l7 -13 l10 24 l7 -11 h58' fill='none' stroke='#0b7285' stroke-width='3'/>");
  })();

  var CHANGELOG=[
    {v:'3.4',date:'__BUILD__',notes:['Works fully offline once loaded — open it at a pool or race with no signal','Always shows your latest version when you are online']},
    {v:'3.3',date:'__BUILD__',notes:['~240 more terms — over 440 in total','New categories: Strength, Workout, Ultra-running and Longevity','More pure swimming, running and cycling terms']},
    {v:'3.2',date:'__BUILD__',notes:['Quiz mode (🎓) — flashcards and multiple-choice, scored, over any filter or your Favourites','Related terms in each detail view — tap to jump between connected terms']},
    {v:'3.1',date:'__BUILD__',notes:['Edit ANY term now — built-ins too — no duplicating; the editor opens pre-filled','Edited built-in terms are shown in an accent colour with an “edited” tag','“Reset to original” restores a built-in term you changed','Your own new terms are marked with the AMS badge','New quick filters: “AMS” (your created terms) and “Edited” (built-ins you’ve changed)']},
    {v:'3.0',date:'__BUILD__',notes:['Tap any term for a full detail view — deeper explanation, history, examples & tables (e.g. RPE shows the Borg 6–20 and the 1–10 scales)','New AMS logo & home-screen icon (Anna · Martin Schabbauer)','Emoji + category illustration on every term','Hand-drawn diagrams for key terms (draft zone, brick, negative split…)','Attach your own image and deeper-detail text when adding/editing a term','18 more terms & many examples']},
    {v:'2.0',date:'__BUILD__',notes:['Favourites (★) & filter','Edit your own terms','Backup: export / import','Search highlighting + chip counts','Copy / share','Random term','Reference links','Settings page & changelog','System / Light / Dark themes']},
    {v:'1.0',date:'__BUILD__',notes:['First release: 180+ terms, search, categories, add-your-own, light & dark']}
  ];

  // curated related terms (keys must exist in the glossary)
  var RELATED={
    'ftp':['watts','w/kg','np','tss','threshold'],
    'rpe':['zone 2 / z2','threshold','lthr','hr / hrm'],
    't1':['t2','transition','brick','flying mount'],
    't2':['t1','transition','brick','flying dismount'],
    'brick':['brick legs','off the bike','t2'],
    'drafting (bike)':['draft zone','blocking','non-drafting','draft-legal'],
    'draft zone':['drafting (bike)','non-drafting','overtaking zone'],
    'wetsuit':['wetsuit-legal','ows','speedsuit / swimskin','deadlift wetsuit / batman'],
    'bonk':['glycogen','the wall','carbs/hr','fuelling'],
    'vo2max':['aerobic','threshold','economy'],
    'kona':['im','kq','slot / roll-down','m-dot'],
    'im':['70.3','140.6','kona','olympic / standard'],
    '70.3':['im','140.6','middle distance'],
    'sighting':['ows','buoy','turn buoy','bilateral breathing'],
    'negative split':['pacing','the wall'],
    'taper':['taper madness','peak','periodization'],
    'aero':['aero bars / aerobars','aero position','cda','tt bike'],
    'cadence':['watts','power meter','run cadence'],
    'glycogen':['bonk','carb loading','carbs/hr'],
    'threshold':['ftp','css','lthr','rpe']
  };

  // ---------- storage ----------
  function loadJSON(k){try{var r=localStorage.getItem(k);return r?JSON.parse(r):null;}catch(e){return null;}}
  function loadCustom(){var a=loadJSON(KEY_CUSTOM);return Array.isArray(a)?a:[];}
  function saveCustom(l){try{localStorage.setItem(KEY_CUSTOM,JSON.stringify(l));}catch(e){toast('Could not save (storage full?)');}}
  function loadFav(){var a=loadJSON(KEY_FAV);return new Set(Array.isArray(a)?a:[]);}
  function saveFav(s){try{localStorage.setItem(KEY_FAV,JSON.stringify(Array.from(s)));}catch(e){}}

  // ---------- helpers ----------
  function key(t){return String(t||'').trim().toLowerCase();}
  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function highlight(text,q){var e=esc(text);q=(q||'').trim();if(!q)return e;var rx=new RegExp('('+q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')','ig');return e.replace(rx,'<mark>$1</mark>');}
  function safeUrl(u){try{var x=new URL(u);return (x.protocol==='http:'||x.protocol==='https:')?x.href:null;}catch(e){return null;}}
  function emojiFor(t){return t.emoji||EMOJI[key(t.term)]||CAT_EMOJI[t.category]||'🔺';}

  function mergeTerms(builtin,custom){
    var byKey={},order=[];
    function add(t,isCustom){var k=key(t.term);if(!k)return;if(!(k in byKey))order.push(k);
      byKey[k]={term:t.term,full:t.full||'',def:t.def||'',category:t.category||'General',example:t.example||'',
        link:t.link||'',emoji:t.emoji||'',image:t.image||'',detail:t.detail||'',custom:!!isCustom};}
    builtin.forEach(function(t){add(t,false);});custom.forEach(function(t){add(t,true);});
    return order.map(function(k){return byKey[k];});
  }

  var state={query:'',category:'All',custom:loadCustom()};
  var favSet=loadFav(),allByKey={};

  function baseTerms(){
    return BASE.concat(EXTRA).map(function(t){var en=ENRICH[key(t.term)];if(!en)return t;
      var c={};for(var p in t)c[p]=t[p];if(en.link&&!c.link)c.link=en.link;if(en.example&&!c.example)c.example=en.example;return c;});
  }
  function allTerms(){
    var base=baseTerms(),bk={};base.forEach(function(t){bk[key(t.term)]=1;});
    var merged=mergeTerms(base,state.custom);
    merged.forEach(function(t){var k=key(t.term);t.isBuiltin=!!bk[k];t.edited=t.custom&&t.isBuiltin;t.isNew=t.custom&&!t.isBuiltin;});
    return merged;
  }

  // ---------- rendering ----------
  var els={};
  function refHtml(t){var url=t.link&&safeUrl(t.link),label,href;
    if(url){label='Learn more';href=url;}else{label='Look it up';href='https://www.google.com/search?q='+encodeURIComponent(t.term+' '+(t.full||'')+' triathlon');}
    return "<a class='reflink' href='"+esc(href)+"' target='_blank' rel='noopener noreferrer'>"+label+" ↗</a>";}
  function avatarHtml(t){var img=t.image&&safeUrl(t.image);
    return "<div class='avatar'>"+(img?"<img src='"+esc(img)+"' alt='' loading='lazy'/>":esc(emojiFor(t)))+"</div>";}

  function inCategory(t){
    if(state.category==='Favourites')return favSet.has(key(t.term));
    if(state.category==='AMS')return !!t.isNew;
    if(state.category==='Edited')return !!t.edited;
    return state.category==='All'||t.category===state.category;
  }
  function buildFilters(){
    var terms=allTerms(),counts={All:terms.length,Favourites:0,AMS:0,Edited:0};
    CATEGORIES.forEach(function(c){counts[c]=0;});
    terms.forEach(function(t){if(counts[t.category]!=null)counts[t.category]++;if(favSet.has(key(t.term)))counts.Favourites++;if(t.isNew)counts.AMS++;if(t.edited)counts.Edited++;});
    var opts=['All','★ Favourites','AMS','Edited'].concat(CATEGORIES);els.filters.innerHTML='';
    opts.forEach(function(label){var cat=label==='★ Favourites'?'Favourites':label;var b=document.createElement('button');
      b.className='filter'+(cat===state.category?' active':'');b.setAttribute('data-cat',cat);
      var inner=label==='AMS'?"<img class='chip-ams' src='"+AMS_ICON+"' alt=''/>AMS":(label==='Edited'?"<span class='chip-edited'>Edited</span>":esc(label));
      b.innerHTML=inner+" <span class='n'>"+(counts[cat]||0)+"</span>";
      b.addEventListener('click',function(){state.category=cat;render();});els.filters.appendChild(b);});
  }

  function render(){
    buildFilters();
    var q=state.query,terms=allTerms();allByKey={};terms.forEach(function(t){allByKey[key(t.term)]=t;});
    var qq=(q||'').trim().toLowerCase();
    var filtered=terms.filter(function(t){
      if(!inCategory(t))return false;
      if(!qq)return true;return (t.term+' '+t.full+' '+t.def+' '+(t.example||'')).toLowerCase().indexOf(qq)!==-1;})
      .sort(function(a,b){return a.term.toLowerCase().localeCompare(b.term.toLowerCase());});
    els.count.textContent=filtered.length+(filtered.length===1?' term':' terms')+((qq||state.category!=='All')?' shown':'');
    if(!filtered.length){els.list.innerHTML="<p class='empty'>Nothing here yet. Try a different search or category — or tap + to add your own term.</p>";return;}
    var html='';
    filtered.forEach(function(t){var k=key(t.term),fav=favSet.has(k);
      var head="<span class='term-name'>"+highlight(t.term,q)+"</span>";
      if(t.full)head+="<span class='term-full'>"+highlight(t.full,q)+"</span>";
      if(t.isNew)head+="<img class='ams-badge' src='"+AMS_ICON+"' alt='AMS' title='Your AMS term'/>";
      else if(t.edited)head+="<span class='edited-tag'>edited</span>";
      var acts="<button data-action='copy' data-key='"+esc(k)+"' title='Copy / share'>⧉ Copy</button><button data-action='edit' data-key='"+esc(k)+"' title='Edit'>✎ Edit</button>";
      if(t.isNew)acts+="<button data-action='del' data-key='"+esc(k)+"' title='Delete'>× Delete</button>";
      else if(t.edited)acts+="<button data-action='reset' data-key='"+esc(k)+"' title='Reset to original'>↺ Reset</button>";
      html+="<article class='card"+(t.edited?' edited':'')+"' data-key='"+esc(k)+"'>"
        +"<button class='star"+(fav?' on':'')+"' data-action='fav' data-key='"+esc(k)+"' aria-label='Toggle favourite'>"+(fav?'★':'☆')+"</button>"
        +"<div class='card-top'>"+avatarHtml(t)+"<div class='card-main'>"
        +"<div class='card-head'>"+head+"</div>"
        +"<span class='chip'>"+esc(t.category)+"</span>"
        +"<p class='def'>"+highlight(t.def,q)+"</p>"
        +(t.example?"<p class='example'>"+highlight(t.example,q)+"</p>":"")
        +"<div class='card-foot'><button class='detail-link' data-action='detail' data-key='"+esc(k)+"'>ⓘ More</button>"+refHtml(t)+"<span class='act'>"+acts+"</span></div>"
        +"</div></div></article>";
    });
    els.list.innerHTML=html;
  }

  // ---------- detail view ----------
  function tableHtml(tb){var h="<table class='scale'><caption>"+esc(tb.caption)+"</caption><thead><tr>";
    tb.head.forEach(function(c){h+="<th>"+esc(c)+"</th>";});h+="</tr></thead><tbody>";
    tb.rows.forEach(function(r){h+="<tr>";r.forEach(function(c){h+="<td>"+esc(c)+"</td>";});h+="</tr>";});return h+"</tbody></table>";}
  function openDetail(k){var t=allByKey[k];if(!t)return;
    var d=D[k]||{},img=t.image&&safeUrl(t.image);
    var h="<div class='detail-banner'>"+(CAT_ART[t.category]||'')+"</div>"
      +"<div class='detail-head'><div class='detail-emoji'>"+(img?"<img src='"+esc(img)+"' alt=''/>":esc(emojiFor(t)))+"</div>"
      +"<div><div class='dterm"+(t.edited?' edited':'')+"'>"+esc(t.term)+"</div>"+(t.full?"<div class='dfull'>"+esc(t.full)+"</div>":"")+"</div></div>"
      +"<div style='margin-top:.5rem'><span class='chip'>"+esc(t.category)+"</span>"
      +(t.isNew?" <img class='ams-badge' src='"+AMS_ICON+"' alt='AMS' title='Your AMS term'/>":"")
      +(t.edited?" <span class='edited-tag'>edited</span>":"")+"</div>";
    if(img&&!t.emoji)h+="<img class='detail-img' src='"+esc(img)+"' alt=''/>";
    h+="<div class='detail'><p>"+esc(t.def)+"</p>";
    if(t.example)h+="<p class='example'>"+esc(t.example)+"</p>";
    if(t.detail)h+="<h4>More</h4><p>"+esc(t.detail).replace(/\n+/g,'</p><p>')+"</p>";
    if(d.history)h+="<h4>History</h4><p>"+esc(d.history)+"</p>";
    if(d.more){h+=(d.history||t.detail?"":"<h4>More</h4>");d.more.forEach(function(p){h+="<p>"+esc(p)+"</p>";});}
    if(d.tables)d.tables.forEach(function(tb){h+=tableHtml(tb);});
    if(d.diagram&&DIAGRAMS[d.diagram])h+="<div class='diagram'>"+DIAGRAMS[d.diagram].svg+"<div class='cap'>"+esc(DIAGRAMS[d.diagram].cap)+"</div></div>";
    if(!d.history&&!d.more&&!t.detail)h+="<p class='muted' style='margin-top:.8rem'>Want more depth here? Tap ✎ Edit to add history, examples or a link.</p>";
    var rel=relatedFor(t);
    if(rel.length){h+="<h4>Related</h4><div class='rel-wrap'>";rel.forEach(function(r){h+="<button class='rel-chip' data-action='detail' data-key='"+esc(key(r.term))+"'>"+esc(emojiFor(r))+" "+esc(r.term)+"</button>";});h+="</div>";}
    h+="<div class='card-foot' style='margin-top:1rem'>"+refHtml(t)+"<span class='act'>"
      +"<button data-action='copy' data-key='"+esc(k)+"'>⧉ Copy</button>"
      +"<button data-action='editfromdetail' data-key='"+esc(k)+"'>✎ Edit</button>"
      +(t.isNew?"<button data-action='delfromdetail' data-key='"+esc(k)+"'>× Delete</button>":"")
      +(t.edited?"<button data-action='resetfromdetail' data-key='"+esc(k)+"'>↺ Reset</button>":"")+"</span></div></div>";
    els.detailBody.innerHTML=h;if(!els.detail.open)els.detail.showModal();els.detailBody.parentNode.scrollTop=0;
  }
  function shuffle(a){for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t;}return a;}
  function relatedFor(t){
    var k=key(t.term),out=[],seen={};seen[k]=1;
    var ks=RELATED[k];
    if(ks)ks.forEach(function(rk){var r=allByKey[rk];if(r&&!seen[rk]){seen[rk]=1;out.push(r);}});
    if(out.length<3){var pool=allTerms().filter(function(x){return x.category===t.category&&!seen[key(x.term)];});shuffle(pool);
      for(var i=0;i<pool.length&&out.length<4;i++){out.push(pool[i]);seen[key(pool[i].term)]=1;}}
    return out.slice(0,6);
  }

  // ---------- actions ----------
  function toggleFav(k){if(favSet.has(k))favSet.delete(k);else favSet.add(k);saveFav(favSet);render();}
  function deleteCustom(k){var t=allByKey[k];if(!t)return;if(!window.confirm('Delete "'+t.term+'"? This removes your own term for good.'))return;
    state.custom=state.custom.filter(function(x){return key(x.term)!==k;});saveCustom(state.custom);render();toast('Deleted');}
  function resetOriginal(k){var t=allByKey[k];if(!t)return;if(!window.confirm('Reset "'+t.term+'" to the built-in version? Your changes to it will be removed.'))return;
    state.custom=state.custom.filter(function(x){return key(x.term)!==k;});saveCustom(state.custom);render();toast('Reset to original');}
  function copyTerm(k){var t=allByKey[k];if(!t)return;var text=t.term+(t.full?' ('+t.full+')':'')+' — '+t.def+(t.example?'  '+t.example:'');
    if(navigator.share){navigator.share({title:t.term,text:text}).catch(function(){});return;}
    if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text).then(function(){toast('Copied');},function(){toast('Copy failed');});}else toast('Copy not supported here');}

  // ---------- add / edit ----------
  var editingKey=null;
  function openAdd(){editingKey=null;els.form.reset();els.dlgTitle.textContent='Add a term';els.formError.textContent='';els.dialog.showModal();els.fTerm.focus();}
  function openEdit(k){var t=allByKey[k];if(!t)return;editingKey=k;els.dlgTitle.textContent='Edit term';els.formError.textContent='';
    els.fTerm.value=t.term;els.fFull.value=t.full||'';els.fDef.value=t.def||'';els.fCat.value=t.category||'General';
    els.fEx.value=t.example||'';els.fLink.value=t.link||'';els.fEmoji.value=t.emoji||'';els.fImg.value=t.image||'';els.fDetail.value=t.detail||'';
    els.dialog.showModal();els.fTerm.focus();}
  function submitForm(e){e.preventDefault();var term=els.fTerm.value.trim(),def=els.fDef.value.trim();
    if(!term||!def){els.formError.textContent='Please fill in at least the term and its explanation.';return;}
    var link=els.fLink.value.trim();if(link&&!safeUrl(link)){els.formError.textContent='That link doesn’t look like a valid http(s) web address.';return;}
    var img=els.fImg.value.trim();if(img&&!safeUrl(img)){els.formError.textContent='That image link doesn’t look like a valid http(s) address.';return;}
    var nk=key(term);
    if(editingKey&&editingKey!==nk)state.custom=state.custom.filter(function(x){return key(x.term)!==editingKey;});
    state.custom=state.custom.filter(function(x){return key(x.term)!==nk;});
    state.custom.push({term:term,full:els.fFull.value.trim(),def:def,category:els.fCat.value||'General',
      example:els.fEx.value.trim(),link:link,emoji:els.fEmoji.value.trim(),image:img,detail:els.fDetail.value.trim()});
    saveCustom(state.custom);els.dialog.close();
    if(!editingKey){state.query='';els.search.value='';state.category='All';}editingKey=null;render();toast('Saved');}

  // ---------- random ----------
  function showRandom(){pickRandom();els.rand.showModal();}
  function pickRandom(){var all=allTerms();if(!all.length)return;var t=all[Math.floor(Math.random()*all.length)];
    els.randBody.innerHTML="<div class='card-top'>"+avatarHtml(t)+"<div><span class='rterm'>"+esc(t.term)+"</span>"+(t.full?"<span class='rfull'>"+esc(t.full)+"</span>":"")+"</div></div>"
      +"<div style='margin-top:.5rem'><span class='chip'>"+esc(t.category)+"</span></div><p class='def'>"+esc(t.def)+"</p>"
      +(t.example?"<p class='example'>"+esc(t.example)+"</p>":"")+"<div class='card-foot' style='margin-top:.6rem'><button class='detail-link' data-action='detail' data-key='"+esc(key(t.term))+"'>ⓘ More</button>"+refHtml(t)+"</div>";}

  // ---------- quiz ----------
  var quiz={mode:'flash',pool:[],i:0,score:0,answered:false,_opts:null};
  function quizScope(){return allTerms().filter(inCategory).filter(function(t){return t.def;});}
  function scopeLabel(){return state.category==='All'?'All terms':(state.category==='Favourites'?'★ Favourites':(state.category==='AMS'?'Your AMS terms':(state.category==='Edited'?'Edited terms':state.category)));}
  function openQuiz(){renderQuizStart();els.quiz.showModal();}
  function renderQuizStart(){
    var n=quizScope().length;
    var h="<h2>🎓 Quiz</h2><p class='quiz-scope'>Scope: "+esc(scopeLabel())+" — "+n+" term"+(n===1?'':'s')+". Tip: pick a category or ★ Favourites filter first to quiz just those.</p>";
    if(n<1){h+="<p class='muted'>No terms in this scope.</p><div class='dialog-actions'><button class='btn primary' data-q='close'>Close</button></div>";els.quizBody.innerHTML=h;return;}
    h+="<div class='row-btns'><button class='btn primary' data-q='mode' data-mode='flash'>🃏 Flashcards</button><button class='btn' data-q='mode' data-mode='choice'"+(n<4?" disabled":"")+">✅ Multiple choice</button></div>"
      +"<div class='dialog-actions'><button class='btn ghost' data-q='close'>Close</button></div>";
    els.quizBody.innerHTML=h;
  }
  function startRound(mode){var pool=quizScope();shuffle(pool);quiz.pool=pool.slice(0,Math.min(10,pool.length));quiz.mode=mode;quiz.i=0;quiz.score=0;renderQuestion();}
  function quizProgress(){return "<div class='quiz-progress'><span>"+(quiz.i+1)+" / "+quiz.pool.length+"</span><span class='qscore'>Score "+quiz.score+"</span></div>";}
  function distractors(correct,n){var all=allTerms().filter(function(x){return x.def&&key(x.term)!==key(correct.term)&&x.def!==correct.def;});shuffle(all);return all.slice(0,n);}
  function renderQuestion(){
    var t=quiz.pool[quiz.i];quiz.answered=false;var h=quizProgress();
    if(quiz.mode==='flash'){
      h+="<div class='card-top'>"+avatarHtml(t)+"<div><div class='quiz-q'>"+esc(t.term)+"</div>"+(t.full?"<div class='quiz-full'>"+esc(t.full)+"</div>":"")+"</div></div>"
        +"<div style='margin-top:.4rem'><span class='chip'>"+esc(t.category)+"</span></div><div id='qreveal' style='margin-top:.7rem'></div>"
        +"<div class='dialog-actions'><button class='btn ghost' data-q='close'>Quit</button><button class='btn primary' data-q='reveal'>Show answer</button></div>";
    } else {
      var opts=[t].concat(distractors(t,3));shuffle(opts);quiz._opts=opts;
      h+="<div class='quiz-q'>"+esc(t.term)+"</div>"+(t.full?"<div class='quiz-full'>"+esc(t.full)+"</div>":"")+"<p class='muted' style='margin:.5rem 0'>Which is the right meaning?</p>";
      opts.forEach(function(o,ix){h+="<button class='quiz-opt' data-q='choose' data-idx='"+ix+"'>"+esc(o.def)+"</button>";});
      h+="<div class='dialog-actions'><button class='btn ghost' data-q='close'>Quit</button></div>";
    }
    els.quizBody.innerHTML=h;els.quizBody.parentNode.scrollTop=0;
  }
  function revealFlash(){var t=quiz.pool[quiz.i];
    var r=document.getElementById('qreveal');if(r)r.innerHTML="<div class='quiz-reveal'><p class='def'>"+esc(t.def)+"</p>"+(t.example?"<p class='example'>"+esc(t.example)+"</p>":"")+"</div>";
    var acts=els.quizBody.querySelector('.dialog-actions');if(acts)acts.innerHTML="<button class='btn' data-q='score' data-correct='0'>✗ Missed</button><button class='btn primary' data-q='score' data-correct='1'>✓ Got it</button>";}
  function chooseAnswer(ix){if(quiz.answered)return;quiz.answered=true;var t=quiz.pool[quiz.i],opts=quiz._opts;if(opts[ix].def===t.def)quiz.score++;
    var btns=els.quizBody.querySelectorAll('.quiz-opt');Array.prototype.forEach.call(btns,function(b,j){b.disabled=true;if(opts[j].def===t.def)b.classList.add('correct');else if(j===ix)b.classList.add('wrong');});
    var sc=els.quizBody.querySelector('.qscore');if(sc)sc.textContent='Score '+quiz.score;
    var acts=els.quizBody.querySelector('.dialog-actions');if(acts)acts.innerHTML="<button class='btn ghost' data-q='close'>Quit</button><button class='btn primary' data-q='next'>Next →</button>";}
  function scoreFlash(correct){if(!quiz.answered){quiz.answered=true;if(correct)quiz.score++;}nextQuestion();}
  function nextQuestion(){quiz.i++;if(quiz.i>=quiz.pool.length)renderResult();else renderQuestion();}
  function renderResult(){var n=quiz.pool.length,pct=n?Math.round(quiz.score/n*100):0;
    els.quizBody.innerHTML="<div class='quiz-result'><div class='quiz-score'>"+quiz.score+" / "+n+"</div><p class='muted'>"+pct+"% — "+(pct>=80?'Excellent! 🏆':(pct>=50?'Nice work! 💪':'Keep going! 🔁'))+"</p></div>"
      +"<div class='dialog-actions'><button class='btn ghost' data-q='again'>New round</button><button class='btn primary' data-q='close'>Done</button></div>";}
  function handleQuiz(e){var b=e.target.closest('[data-q]');if(!b)return true;var a=b.getAttribute('data-q');
    if(a==='close')els.quiz.close();else if(a==='mode')startRound(b.getAttribute('data-mode'));else if(a==='reveal')revealFlash();
    else if(a==='score')scoreFlash(b.getAttribute('data-correct')==='1');else if(a==='choose')chooseAnswer(parseInt(b.getAttribute('data-idx'),10));
    else if(a==='next')nextQuestion();else if(a==='again')renderQuizStart();return true;}

  // ---------- backup ----------
  function exportTerms(){if(!state.custom.length){toast('You have no added terms to export yet');return;}
    var text=JSON.stringify(state.custom,null,2),blob=new Blob([text],{type:'application/json'}),url=URL.createObjectURL(blob);
    var a=document.createElement('a');a.href=url;a.download='triathlon-glossary-terms.json';document.body.appendChild(a);a.click();a.remove();
    setTimeout(function(){URL.revokeObjectURL(url);},1000);toast('Exported '+state.custom.length+' term'+(state.custom.length===1?'':'s'));}
  function importTerms(file){var r=new FileReader();r.onload=function(){try{var arr=JSON.parse(r.result);if(!Array.isArray(arr))throw 0;var added=0;
    arr.forEach(function(t){if(!t||!t.term||!t.def)return;var nk=key(t.term);state.custom=state.custom.filter(function(x){return key(x.term)!==nk;});
      state.custom.push({term:String(t.term),full:t.full?String(t.full):'',def:String(t.def),category:t.category?String(t.category):'General',
        example:t.example?String(t.example):'',link:t.link?String(t.link):'',emoji:t.emoji?String(t.emoji):'',image:t.image?String(t.image):'',detail:t.detail?String(t.detail):''});added++;});
    saveCustom(state.custom);render();toast('Imported '+added+' term'+(added===1?'':'s'));}catch(e){toast('Could not read that file');}};r.readAsText(file);}

  // ---------- theme ----------
  function applyTheme(mode){if(mode==='light'||mode==='dark')document.documentElement.setAttribute('data-theme',mode);else document.documentElement.removeAttribute('data-theme');
    try{localStorage.setItem(KEY_THEME,mode);}catch(e){}var r=document.querySelector('input[name="theme"][value="'+mode+'"]');if(r)r.checked=true;}
  function currentTheme(){var s=null;try{s=localStorage.getItem(KEY_THEME);}catch(e){}return s||'system';}
  function initTheme(){var m=currentTheme();if(m==='light'||m==='dark')document.documentElement.setAttribute('data-theme',m);}
  function quickToggleTheme(){var cur=document.documentElement.getAttribute('data-theme');if(!cur)cur=(window.matchMedia&&window.matchMedia('(prefers-color-scheme:dark)').matches)?'dark':'light';applyTheme(cur==='dark'?'light':'dark');}

  // ---------- settings ----------
  function openSettings(){applyTheme(currentTheme());els.settings.showModal();}
  function fillChangelog(){var h='';CHANGELOG.forEach(function(c){h+="<li><span class='v'>v"+esc(c.v)+"</span> <span class='muted'>("+esc(c.date)+")</span><ul>";
    c.notes.forEach(function(n){h+="<li>"+esc(n)+"</li>";});h+="</ul></li>";});els.changelog.innerHTML=h;
    els.build.textContent='AMS Triathlon Glossary — version '+VERSION+' • built '+BUILD;}

  var toastTimer=null;
  function toast(msg){var t=els.toast||document.getElementById('toast');if(!t)return;t.textContent=msg;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(function(){t.classList.remove('show');},1800);}

  function $(s){return document.querySelector(s);}
  function init(){
    els.list=$('#list');els.count=$('#count');els.search=$('#search');els.filters=$('#filters');
    els.dialog=$('#addDialog');els.form=$('#addForm');els.dlgTitle=$('#dlgTitle');els.formError=$('#formError');
    els.fTerm=$('#f-term');els.fFull=$('#f-full');els.fDef=$('#f-def');els.fCat=$('#f-cat');els.fEx=$('#f-ex');els.fLink=$('#f-link');
    els.fEmoji=$('#f-emoji');els.fImg=$('#f-img');els.fDetail=$('#f-detail');
    els.rand=$('#rand');els.randBody=$('#randBody');els.detail=$('#detail');els.detailBody=$('#detailBody');
    els.quiz=$('#quiz');els.quizBody=$('#quizBody');
    els.settings=$('#settings');els.changelog=$('#changelog');els.build=$('#build');els.toast=$('#toast');

    CATEGORIES.forEach(function(c){var o=document.createElement('option');o.value=c;o.textContent=c;els.fCat.appendChild(o);});

    els.search.addEventListener('input',function(){state.query=els.search.value;render();});
    function handleAction(e){var b=e.target.closest('[data-action]');if(b){var k=b.getAttribute('data-key'),a=b.getAttribute('data-action');
        if(a==='fav')toggleFav(k);else if(a==='copy')copyTerm(k);else if(a==='edit')openEdit(k);else if(a==='del')deleteCustom(k);
        else if(a==='reset')resetOriginal(k);
        else if(a==='detail'){els.rand.open&&els.rand.close();openDetail(k);}
        else if(a==='editfromdetail'){els.detail.close();openEdit(k);}
        else if(a==='delfromdetail'){els.detail.close();deleteCustom(k);}
        else if(a==='resetfromdetail'){els.detail.close();resetOriginal(k);}
        return true;}return false;}
    els.list.addEventListener('click',function(e){if(handleAction(e))return;if(e.target.closest('a'))return;var card=e.target.closest('.card');if(card)openDetail(card.getAttribute('data-key'));});

    $('#addBtn').addEventListener('click',openAdd);
    $('#cancelBtn').addEventListener('click',function(e){e.preventDefault();els.dialog.close();});
    els.form.addEventListener('submit',submitForm);
    els.dialog.addEventListener('click',function(e){if(e.target===els.dialog)els.dialog.close();});

    $('#quizBtn').addEventListener('click',openQuiz);
    els.quiz.addEventListener('click',function(e){if(e.target.closest('[data-q]')){handleQuiz(e);return;}if(e.target===els.quiz)els.quiz.close();});
    $('#randomBtn').addEventListener('click',showRandom);
    $('#randAnother').addEventListener('click',pickRandom);
    $('#randClose').addEventListener('click',function(){els.rand.close();});
    els.rand.addEventListener('click',function(e){if(handleAction(e))return;if(e.target===els.rand)els.rand.close();});
    els.detail.addEventListener('click',function(e){if(handleAction(e))return;if(e.target===els.detail)els.detail.close();});
    $('#detailClose').addEventListener('click',function(){els.detail.close();});

    $('#themeBtn').addEventListener('click',quickToggleTheme);
    $('#settingsBtn').addEventListener('click',openSettings);
    $('#settingsClose').addEventListener('click',function(){els.settings.close();});
    els.settings.addEventListener('click',function(e){if(e.target===els.settings)els.settings.close();});
    Array.prototype.forEach.call(document.querySelectorAll('input[name="theme"]'),function(r){r.addEventListener('change',function(){applyTheme(r.value);});});
    $('#exportBtn').addEventListener('click',exportTerms);
    $('#importFile').addEventListener('change',function(){if(this.files&&this.files[0])importTerms(this.files[0]);this.value='';});

    fillChangelog();render();
  }
  initTheme();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
"""

APP = APP.replace("__VERSION__", VERSION).replace("__BUILD__", BUILD).replace("__ICON__", LOGO_B64)

HTML = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<meta name="theme-color" content="#0b7285" />
<title>AMS Triathlon Glossary</title>
<meta name="description" content="Triathlon acronyms, abbreviations and terms — with deep dives, history, diagrams, favourites and your own additions." />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-title" content="Tri Glossary" />
<link rel="icon" href="data:image/svg+xml;base64,__ICON__" type="image/svg+xml" />
<link rel="apple-touch-icon" href="data:image/svg+xml;base64,__ICON__" />
<style>
__CSS__
</style>
</head>
<body>
<header class="topbar">
  <div class="topbar-inner">
    <img class="logo" src="data:image/svg+xml;base64,__ICON__" alt="AMS logo" />
    <h1>Triathlon Glossary</h1>
    <button id="quizBtn" class="icon-btn" title="Quiz" aria-label="Open quiz">🎓</button>
    <button id="randomBtn" class="icon-btn" title="Random term" aria-label="Show a random term">🎲</button>
    <button id="themeBtn" class="icon-btn" title="Light / dark" aria-label="Toggle light or dark theme">◐</button>
    <button id="settingsBtn" class="icon-btn" title="Settings" aria-label="Open settings">⚙︎</button>
  </div>
  <div class="search-wrap">
    <input id="search" type="search" inputmode="search" autocomplete="off" placeholder="Search terms, acronyms or meanings…" aria-label="Search terms" />
  </div>
  <div id="filters" class="filters" role="group" aria-label="Filter by category"></div>
</header>

<main>
  <p id="count" class="count" aria-live="polite"></p>
  <div id="list" class="list"></div>
</main>

<button id="addBtn" class="fab" title="Add a term" aria-label="Add a new term">+</button>

<dialog id="addDialog" class="dialog" aria-label="Add or edit a term">
  <form id="addForm" method="dialog"><div class="body">
    <h2 id="dlgTitle">Add a term</h2>
    <label for="f-term">Term / acronym <span class="req">*</span></label>
    <input id="f-term" type="text" required autocomplete="off" placeholder="e.g. BTA" />
    <label for="f-full">Stands for / full name <span class="opt">(optional)</span></label>
    <input id="f-full" type="text" autocomplete="off" placeholder="e.g. Between The Arms" />
    <label for="f-def">Explanation <span class="req">*</span></label>
    <textarea id="f-def" rows="3" required placeholder="What does it mean?"></textarea>
    <label for="f-detail">Deeper detail / history <span class="opt">(optional)</span></label>
    <textarea id="f-detail" rows="3" placeholder="Longer explanation, background, extra examples…"></textarea>
    <label for="f-ex">Example <span class="opt">(optional)</span></label>
    <input id="f-ex" type="text" autocomplete="off" placeholder="How it's used in a sentence" />
    <label for="f-emoji">Emoji <span class="opt">(optional)</span></label>
    <input id="f-emoji" type="text" autocomplete="off" maxlength="4" placeholder="e.g. 🏊" />
    <label for="f-img">Image link <span class="opt">(optional)</span></label>
    <input id="f-img" type="url" autocomplete="off" placeholder="https://…/photo.jpg" />
    <label for="f-link">Reference link <span class="opt">(optional)</span></label>
    <input id="f-link" type="url" autocomplete="off" placeholder="https://…" />
    <label for="f-cat">Category</label>
    <select id="f-cat"></select>
    <p id="formError" class="form-error" role="alert"></p>
    <div class="dialog-actions">
      <button id="cancelBtn" class="btn ghost" type="button">Cancel</button>
      <button class="btn primary" type="submit">Save term</button>
    </div>
  </div></form>
</dialog>

<dialog id="detail" class="dialog" aria-label="Term detail">
  <div class="body">
    <div id="detailBody"></div>
    <div class="dialog-actions"><button id="detailClose" class="btn primary" type="button">Close</button></div>
  </div>
</dialog>

<dialog id="quiz" class="dialog" aria-label="Quiz">
  <div class="body"><div id="quizBody"></div></div>
</dialog>

<dialog id="rand" class="dialog" aria-label="Random term">
  <div class="body">
    <h2>🎲 Random term</h2>
    <div id="randBody"></div>
    <div class="dialog-actions">
      <button id="randAnother" class="btn ghost" type="button">Show another</button>
      <button id="randClose" class="btn primary" type="button">Close</button>
    </div>
  </div>
</dialog>

<dialog id="settings" class="dialog" aria-label="Settings">
  <div class="body">
    <h2>Settings</h2>
    <div class="settings-sec">
      <h3>Appearance</h3>
      <div class="theme-opts">
        <label><input type="radio" name="theme" value="system" /> System</label>
        <label><input type="radio" name="theme" value="light" /> Light</label>
        <label><input type="radio" name="theme" value="dark" /> Dark</label>
      </div>
    </div>
    <div class="settings-sec">
      <h3>Your terms &amp; backup</h3>
      <p class="muted">Terms you add are stored on this device only. Export them to keep a backup or move them to another phone/computer, then Import there.</p>
      <div class="row-btns">
        <button id="exportBtn" class="btn" type="button">⬇︎ Export my terms</button>
        <label class="btn" for="importFile" style="margin:0">⬆︎ Import terms<input id="importFile" type="file" accept="application/json,.json" hidden /></label>
      </div>
    </div>
    <div class="settings-sec">
      <h3>Help &amp; info</h3>
      <details>
        <summary>How this app works</summary>
        <div class="content">
          <p><strong>Browse &amp; search.</strong> Scroll the list or type in the search box — it matches the term, full name, explanation and example.</p>
          <p><strong>Tap a term.</strong> Tapping any card opens a detail view with a deeper explanation, history, examples, scale tables and diagrams where available.</p>
          <p><strong>Filter.</strong> Tap a category chip (or ★ Favourites). The number shows how many terms it holds.</p>
          <p><strong>Favourites.</strong> Tap the ☆ on any card to star it.</p>
          <p><strong>Edit anything.</strong> Every term has ✎ Edit — built-in ones too. The editor opens pre-filled; just change what you like and Save. No duplicating.</p>
          <p><strong>See your changes.</strong> A built-in term you’ve edited shows its name in an accent colour with an “edited” tag; tap ↺ Reset to restore the original.</p>
          <p><strong>Add your own.</strong> Tap +. New terms you create are marked with the AMS badge and can be edited (✎) or deleted (×). You can include an emoji, image link and deeper-detail text.</p>
          <p><strong>References.</strong> Every term has a link — “Learn more” for curated sources or “Look it up” for a web search.</p>
          <p><strong>Related terms.</strong> A detail view lists related terms — tap one to jump straight to it.</p>
          <p><strong>Quiz (🎓).</strong> Test yourself with flashcards or multiple-choice. It quizzes whatever filter is active — pick a category or ★ Favourites first to focus.</p>
          <p><strong>Backup.</strong> Use Export/Import above to back up your terms or move them between devices.</p>
        </div>
      </details>
      <details>
        <summary>What’s new</summary>
        <div class="content"><ul id="changelog" class="changelog"></ul></div>
      </details>
      <p id="build" class="build"></p>
    </div>
    <div class="dialog-actions"><button id="settingsClose" class="btn primary" type="button">Done</button></div>
  </div>
</dialog>

<div id="toast" role="status" aria-live="polite"></div>

<script>
__TERMS_JS__
</script>
<script>
__APP_JS__
</script>
<script>
/* Register the offline service worker (ignored when opened from a file). */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('sw.js').catch(function () { /* offline is a nice-to-have */ });
  });
}
</script>
</body>
</html>
"""

HTML = (HTML.replace("__ICON__", LOGO_B64).replace("__CSS__", CSS)
        .replace("__TERMS_JS__", terms_js).replace("__APP_JS__", APP))

dest = out/"index.html"
dest.write_text(HTML)
print("wrote", dest, len(HTML), "bytes")
