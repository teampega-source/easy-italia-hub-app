/* ── 3D card tilt – spring feel ── */
const mediaQ=window.matchMedia('(prefers-reduced-motion:reduce)');
if(!mediaQ.matches){
  document.querySelectorAll('.card').forEach(c=>{
    c.addEventListener('mouseenter',()=>{c.style.transition='transform 120ms ease-out'});
    c.addEventListener('mousemove',e=>{
      const r=c.getBoundingClientRect();
      const x=(e.clientX-r.left)/r.width-.5;
      const y=(e.clientY-r.top)/r.height-.5;
      c.style.transform=`perspective(900px) rotateY(${x*15}deg) rotateX(${-y*9}deg) translateZ(16px) scale(1.03)`;
    });
    c.addEventListener('mouseleave',()=>{
      c.style.transition='transform 420ms cubic-bezier(0.16,1,0.3,1)';
      c.style.transform='';
    });
    c.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' ')c.click()});
  });
}

/* ── Custom dual-layer cursor (fine pointers only) ── */
(function(){
  if(!matchMedia('(pointer:fine)').matches)return;
  const dot=document.getElementById('cursor-dot'),ring=document.getElementById('cursor-ring');
  if(!dot||!ring)return;
  document.body.classList.add('has-cursor');
  const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
  let mx=innerWidth/2,my=innerHeight/2,rx=mx,ry=my;
  addEventListener('mousemove',e=>{
    mx=e.clientX;my=e.clientY;
    dot.style.transform='translate('+mx+'px,'+my+'px) translate(-50%,-50%)';
    if(reduce)ring.style.transform='translate('+mx+'px,'+my+'px) translate(-50%,-50%)';
  },{passive:true});
  if(!reduce){(function loop(){rx+=(mx-rx)*0.15;ry+=(my-ry)*0.15;ring.style.transform='translate('+rx+'px,'+ry+'px) translate(-50%,-50%)';requestAnimationFrame(loop);})();}
  const HOV='a,button,[role="button"],input,.step-check,.sug,.lang-btn,.card,.feat';
  document.addEventListener('mouseover',e=>{if(e.target.closest(HOV))ring.classList.add('hover');});
  document.addEventListener('mouseout',e=>{if(e.target.closest(HOV))ring.classList.remove('hover');});
  addEventListener('mouseleave',()=>{dot.classList.add('cursor-hidden');ring.classList.add('cursor-hidden');});
  addEventListener('mouseenter',()=>{dot.classList.remove('cursor-hidden');ring.classList.remove('cursor-hidden');});
})();

/* ═══ i18n — IT / EN / Sinhala (සිංහල flagged for native review) ═══ */
const I18N={
  it:{
    "nav.academy":"Academy","nav.services":"Servizi","nav.courses":"Corsi","m.forum":"Forum","m.esame":"Esame & Badge","m.academy":"Lezioni Academy","m.certprep":"Preparazione certificazioni","m.aiteacher":"Insegnante AI","m.school":"Scuola e studio","m.market":"Mercatino","m.translate":"Traduzioni","m.housing":"Casa e alloggio","m.pros":"Professionisti","nav.guide":"Guide","nav.community":"Community","nav.ai":"AI Assistant","nav.news":"News","nav.map":"Mappa","nav.contact":"Contatti","nav.journey":"Percorso","nav.login":"Accedi","nav.signup":"Registrati",
    "m.lavdir":"Lavoro e diritti","m.duesponde":"Fra Italia e Sri Lanka","m.costruire":"Costruire il futuro","m.templates":"Moduli e Lettere","m.openaccount":"Aprire un Conto","m.assegno":"Calcol. Assegno Unico","m.inps":"Verifica Diritti INPS","m.titles":"Riconosc. Titoli","m.medical":"Dizionario Medico","m.languages":"Corsi di Lingue","m.opportunities":"Opportunità","m.dashboard":"La mia Dashboard","m.tracker":"Tracker Permesso","m.cvbuilder":"CV Builder","m.docs":"Archivio Documenti","m.flights":"Voli Sri Lanka","m.cargo":"Spedizioni Cargo","f.about":"Chi siamo","f.subscriptions":"Abbonamenti",
    "hero.eyebrow":"In Italia, nella tua lingua","hero.t1":"100% gratuito","hero.t2":"Nessuna carta richiesta","hero.t3":"Fonti ufficiali citate","hero.title":"<span class='ln'><span>La comunità</span></span><span class='ln'><span><em>srilankese</em></span></span><span class='ln'><span>in Italia</span></span>","hero.sub":"Guide burocratiche, assistente AI multilingua, community di supporto e news aggiornate — in italiano, inglese, sinhala e tamil.","hero.cta1":"Inizia gratis","hero.cta2":"Esplora le guide","hero.stat1":"Fasi del percorso","hero.stat2":"Guide pratiche","hero.stat3":"Città sulla mappa","hero.stat4":"Lingue dell'interfaccia","hero.stat5":"Strumenti e servizi","hero.stat6":"Passi concreti",
    "card1.tag":"Burocrazia","card1.title":"Permesso di Soggiorno","card1.sub":"Guida completa al rinnovo","card2.tag":"AI","card2.title":"Assistente AI","card2.sub":"Risposte multilingua 24/7","card3.tag":"Community","card3.title":"Community","card3.sub":"Confronto e supporto tra pari","card4.tag":"Finanza","card4.title":"Money Transfer","card4.sub":"Wise, Ria, Western Union",
    "ad.label":"Pubblicità","ad.lead":"Fai crescere il tuo brand: raggiungi ogni giorno la community srilankese in Italia.","ad.buy":"Prenota lo spazio","ad.sponsor":"Sponsorizzato","ad.slot":"Spazio ad — 300×250","ad.book":"Prenota →",
    "does.label":"Cosa facciamo","does.title":"Un'unica piattaforma,<br/><em>tutta la tua vita in Italia</em>","does.sub":"Dai primi documenti al lavoro, dalla lingua alla community: sei aree, un solo posto, quattro lingue.","does.c1.t":"Documenti & burocrazia","does.c1.p":"Guide passo-passo, archivio documenti cifrato, moduli PDF pronti e tracker del permesso con promemoria.","does.c2.t":"Lingua & formazione","does.c2.p":"Academy, corsi, preparazione alle certificazioni A2–B2, AI Teacher e il tuo Language Score con attestato.","does.c3.t":"Consigliere AI","does.c3.p":"Assistente multilingua 24 ore su 24 e traduzione delle lettere ufficiali in italiano, inglese, sinhala e tamil.","does.c4.t":"Il Mio Percorso","does.c4.p":"Nove fasi di vita in Italia — arrivo, regolarizzazione, lavoro, casa, famiglia — con il prossimo passo sempre chiaro.","does.c5.t":"Community & servizi","does.c5.p":"Forum, mercatino, mappa dei servizi, news verificate e comparatore per le rimesse verso lo Sri Lanka.","does.c6.t":"Professionisti verificati","does.c6.p":"Avvocati, commercialisti, interpreti e mediatori verificati, che parlano la tua lingua.","tools.label":"La cassetta degli attrezzi","tools.title":"Tutti gli strumenti,<br/><em>a portata di mano</em>","tools.sub":"Oltre 30 strumenti e guide gratuiti, pensati per la vita reale in Italia. Scegli quello che ti serve oggi.","feat.label":"Cosa offriamo","feat.heading":"Tutto ciò di cui hai bisogno,<br/><em>in un unico posto</em>","feat.sub":"Dalla burocrazia all'integrazione quotidiana — ti supportiamo in ogni passo del tuo percorso.",
    "feat1.title":"Guide Burocratiche","feat1.desc":"Permesso di soggiorno, codice fiscale, SPID, residenza — guide passo-passo con checklist scaricabili.","feat2.title":"Assistente AI Multilingua","feat2.desc":"Risposte immediate in italiano, inglese, sinhala e tamil. Disponibile 24 ore su 24, 7 giorni su 7.","feat3.title":"Community Attiva","feat3.desc":"Uno spazio dove srilankesi in Italia si supportano a vicenda. Trova risposte, condividi esperienze, cresci insieme.","feat4.title":"Money Transfer","feat4.desc":"Confronta Wise, Western Union e Ria in tempo reale. Risparmia sulle rimesse verso lo Sri Lanka.","feat5.title":"Mappa dei Servizi","feat5.desc":"CAF, patronati, negozi e luoghi di culto srilankesi nelle principali città italiane.","feat6.title":"News Aggiornate","feat6.desc":"Leggi, decreti e opportunità per la comunità srilankese. Aggiornato ogni giorno.",
    "members.count":"<strong>La community srilankese</strong> che si aiuta in Italia","members.sub":"Unisciti a chi vive e lavora in Italia e affronta gli stessi passaggi. Insieme è più facile.",
    "cta.intro.tag":"Il Mio Percorso","cta.intro.desc":"La mappa delle 9 fasi per costruire la tua vita in Italia — dalla burocrazia all'integrazione quotidiana. Sai sempre dove sei e qual è il prossimo passo, con il Consigliere AI al tuo fianco.","cta.intro.pill1":"9 fasi strutturate","cta.intro.pill2":"Consigliere AI incluso","cta.intro.pill3":"Progressi salvati",
    "cta.title":"Pronto a iniziare<br/><em style=\"font-style:italic;color:var(--gold)\">il tuo percorso?</em>","cta.sub":"Registrati gratis. Nessuna carta di credito richiesta.","cta.btn1":"Crea il tuo account gratuito","cta.btn2":"Scopri come funziona",
    "footer.tag":"Il punto di riferimento della comunità srilankese in Italia. Guide, AI multilingua, community e servizi — tutto in un unico posto.","footer.product":"Prodotto","footer.aiAssistant":"Assistente AI","footer.mapServices":"Mappa servizi","footer.company":"Il progetto","footer.about":"Chi siamo","footer.advertising":"Pubblicità","footer.contact":"Contatti","footer.account":"Account","footer.register":"Registrati","footer.subscriptions":"Abbonamenti","footer.copy":"© 2026 Easy Italia Hub. Tutti i diritti riservati.","footer.privacy":"Privacy Policy","footer.cookie":"Cookie Policy","footer.terms":"Termini di Servizio","footer.legal":"Note legali",
    "chat.ainoteShort":"Risposte generate da un'AI: informazioni generali, non consulenza legale.","chat.ainote":"L'Intelligenza Artificiale fornisce informazioni generali basate su fonti pubbliche. Non sostituisce in alcun modo la consulenza legale di un avvocato, di un Patronato o di un CAF autorizzato. Easy Italia Hub declina ogni responsabilità per errori o per l'uso improprio delle informazioni.","chat.name":"Assistente Easy Italia","chat.status":"Online ora","chat.welcome1":"Ciao! Sono l'assistente di Easy Italia Hub. Come posso aiutarti oggi?","chat.welcome2":"Posso risponderti in italiano, inglese, <span lang=\"si\">සිංහල</span> o <span lang=\"ta\">தமிழ்</span>.","chat.now":"Ora","chat.sug1":"Permesso di soggiorno","chat.sug2":"SPID","chat.sug3":"Money transfer","chat.sug4":"Codice fiscale","chat.placeholder":"Scrivi un messaggio…","chat.q1":"Come si rinnova il permesso di soggiorno?","chat.q2":"Come si ottiene lo SPID?","chat.q3":"Come funziona il money transfer verso lo Sri Lanka?","chat.q4":"Come si richiede il codice fiscale?",
    "fx.teaserTitle":"💸 Confronta l'invio di denaro in Sri Lanka","fx.teaserNote":"Tasso indicativo aggiornato e confronto provider.","fx.teaserCta":"Apri il comparatore →",
    "faq.label":"Domande frequenti","faq.heading":"Domande <em>frequenti</em>",
    "faq.q1":"Quanto tempo ci vuole per il permesso di soggiorno?","faq.a1":"Dipende dalla questura e dal tipo di permesso: i tempi possono variare da alcune settimane a diversi mesi. Dopo la presentazione della domanda ricevi una ricevuta che, insieme al passaporto, vale come documento provvisorio. Per la procedura passo-passo consulta la nostra <a href=\"guide.html#permesso-soggiorno\">guida al permesso di soggiorno</a>.",
    "faq.q2":"Il servizio è gratuito?","faq.a2":"Sì. Consultare le guide, usare l'Assistente AI e leggere le news è gratuito. Non è richiesta alcuna carta di credito per registrarti.",
    "faq.q3":"In che lingue posso usare il sito?","faq.a3":"L'interfaccia del sito è disponibile in 4 lingue: italiano, inglese, sinhala (සිංහල) e tamil (தமிழ்). Puoi cambiare lingua dal menu in alto a destra.",
    "faq.q4":"Come funziona il Consigliere AI?","faq.a4":"È un assistente disponibile 24 ore su 24 che risponde alle tue domande sulla burocrazia e sui servizi. Apri la chat dal pulsante in basso a destra (o con Ctrl/⌘+J) e scrivi la tua domanda: ti indica i passaggi e le guide pertinenti.",
    "faq.q5":"Devo registrarmi per usare le guide?","faq.a5":"No. Le guide pratiche sono liberamente consultabili senza registrazione. L'account gratuito serve solo per salvare i progressi del tuo <a href=\"percorso.html\">percorso personale</a>.",
    "faq.q6":"Le informazioni sono ufficiali?","faq.a6":"Le nostre guide sono divulgative e ti orientano nei passaggi principali, ma non sostituiscono le fonti ufficiali. Per i dati definitivi verifica sempre sui siti istituzionali (es. Polizia di Stato, Agenzia delle Entrate, INPS) o rivolgiti a un CAF o patronato."
    ,"mission.label":"Chi siamo","mission.title":"Costruiamo il ponte<br><em>tra due mondi.</em>","mission.sub":"Easy Italia Hub nasce dalla necessità concreta di centinaia di migliaia di srilankesi che ogni anno si trovano a navigare il sistema burocratico italiano senza strumenti adatti.","mission.desc":"La nostra missione è semplice: rendere l'integrazione più rapida, meno stressante e più dignitosa. Perché ogni persona merita di capire i propri diritti nella propria lingua.","mission.val1.h":"Multilingua","mission.val1.p":"Italiano, inglese, sinhala e tamil","mission.val2.h":"Accessibile","mission.val2.p":"Gratuito, senza barriere d'accesso","mission.val3.h":"Community","mission.val3.p":"Costruito insieme alla comunità","mission.val4.h":"Affidabile","mission.val4.p":"Fonti ufficiali sempre verificate","mission.cta":"Scopri il team →","mission.visual":"Ogni persona<br>merita di<br><em>capire i propri diritti</em>","prob.eyebrow":"Perché esistiamo","prob.title":"Burocrazia italiana —<br><em>un labirinto da soli.</em>","prob.sub":"Ogni anno migliaia di srilankesi in Italia perdono ore su moduli sbagliati, code inutili e informazioni sparse. Senza una guida nella propria lingua, ogni passo è un ostacolo.","prob.li1":"Informazioni burocratiche sparse e difficili da trovare","prob.li2":"Scadenze nascoste e documenti dimenticati all'ultimo momento","prob.li3":"Nessun supporto nella propria lingua — tutto solo in italiano","prob.li4":"Community dispersa, difficile trovare chi ha già vissuto la stessa situazione","sol.eyebrow":"Con Easy Italia Hub","sol.title":"Ogni passo del tuo<br>percorso è chiaro.","sol.li1":"Guide pratiche passo-passo per ogni procedura burocratica","sol.li2":"Tracker scadenze e documenti — non dimentichi mai nulla","sol.li3":"Assistente AI in italiano, inglese, sinhala e tamil — sempre disponibile","sol.li4":"Community attiva di srilankesi in Italia — condividi esperienze reali","how.label":"Come funziona","how.title":"Inizia in <em>tre semplici passi</em>","how.sub":"Nessuna carta di credito. Nessun abbonamento obbligatorio. Solo tu e le risorse di cui hai bisogno.","how.s1.h":"Crea il profilo","how.s1.p":"Registrati gratis in 30 secondi. Inserisci la tua situazione e il sistema crea un percorso personalizzato per te.","how.s2.h":"Scegli la guida","how.s2.p":"Permesso di soggiorno, SPID, codice fiscale, lavoro: trovi la guida giusta con checklist scaricabili e link ufficiali.","how.s3.h":"Chiedi all'AI","how.s3.p":"Hai dubbi? L'assistente risponde in 4 lingue, 24 ore su 24. Oppure confrontati con la community — trovi sempre chi ha vissuto la tua stessa situazione.","ct.label":"Community","ct.title":"Sii tra i <em>primi</em><br>a unirti","ct.desc":"La nostra community srilankese in Italia sta prendendo forma. Unisciti ora: condividi esperienze, trova supporto e connettiti con chi affronta gli stessi passi.","ct.li1":"Supporto su burocrazia e vita quotidiana in Italia","ct.li2":"Connessione con srilankesi nella tua città","ct.li3":"Accesso anticipato alle nuove funzionalità","ct.cta":"Unisciti alla community →","ct.counter":"persone già unite","test.label":"Esempi concreti","test.title":"Come ti <em>semplifica</em> la vita","roadmap.label":"Trasparenza","roadmap.title":"Cosa stiamo <em>costruendo</em>","roadmap.sub":"La nostra roadmap è pubblica. Vota le funzionalità che vuoi vedere prima — il tuo voto conta davvero.","roadmap.done":"Completato","roadmap.wip":"In corso","roadmap.vote":"Vota","partner.label":"Sei un professionista?","partner.title":"Porta la tua expertise<br><em>alla community.</em>","partner.desc":"Avvocati, consulenti fiscali, interpreti, mediatori culturali, impiegati di consolato: se lavori con la comunità srilankese in Italia, apri la pre-registrazione alla futura rete di professionisti. È una semplice manifestazione di interesse, senza alcun costo né accordo commerciale in essere: quando il programma partirà sarai tra i primi a essere contattato.","partner.tag1":"Avvocati","partner.tag2":"Consulenti fiscali","partner.tag3":"Interpreti","partner.tag4":"Mediatori culturali","map3d.title":"La community <em>in tutta Italia</em>","map3d.sub":"Srilankesi da Nord a Sud: le città dove la community cresce.","partner.tag5":"CAF & Patronati","partner.tag6":"Consolati","partner.cta":"Pre-registra il mio interesse"
    ,"wa.title":"Uniti anche su WhatsApp","wa.sub":"Scadenze, novità e opportunità per la comunità srilankese, direttamente dove passi il tuo tempo. Niente spam, disdici quando vuoi.","wa.btn":"Unisciti al canale","donate.title":"Supporta il progetto","donate.sub":"Easy Italia Hub è completamente gratuito per tutti. Se ti è stato utile, una piccola donazione ci aiuta a mantenere le guide aggiornate, i server attivi e i servizi accessibili a tutta la community srilankese in Italia.","donate.cta":"♥ Dona ora","donate.note":"Sicuro via Stripe · Qualsiasi importo è prezioso per noi","nl.title":"Resta aggiornato.<br>Senza spam, promesso.","nl.sub":"Ogni settimana: novità burocratiche che ti riguardano, opportunità selezionate e aggiornamenti della piattaforma. In italiano e sinhala.","nl.btn":"Iscriviti gratis","nl.note":"Disdici in qualsiasi momento. Nessuna carta richiesta.","nav.voli":"Soldi & Viaggi","why.label":"Perché Easy Italia Hub","why.title":"Tutto in <em>un unico posto</em>","why.sub":"Burocrazia, lavoro, casa e community: ciò che ti serve per vivere in Italia, senza perderti tra mille siti.","why.c1.t":"Guide chiare","why.c1.p":"Permesso, SPID, codice fiscale: passo per passo, in parole semplici e in 4 lingue.","why.c2.t":"Opportunità reali","why.c2.p":"Lavoro, casa e servizi selezionati per chi arriva in Italia, aggiornati di continuo.","why.c3.t":"Community vicina","why.c3.p":"Confrontati con chi ha vissuto la tua stessa situazione. Non sei mai solo.","svc1.n":"Scheda sulla mappa","svc1.d":"La tua attività geolocalizzata nella mappa servizi più usata dalla community.","svc2.n":"Banner pubblicitari","svc2.d":"Spazi grafici in posizioni ad alta visibilità, con impression tracciate in tempo reale.","svc3.n":"Annuncio multilingua creato dal team","svc3.d":"Copy e grafica professionali in 4 lingue (IT, EN, singalese, tamil) — parli a tutta la community nella sua lingua.","svc4.n":"Newsletter mensile","svc4.d":"Menzione nella newsletter che arriva diretta nelle caselle di migliaia di iscritti.","svc5.n":"Contatti diretti clienti","svc5.d":"Ricevi i recapiti di chi è davvero interessato: lead reali, non solo click.","svc6.n":"Articolo redazionale","svc6.d":"Un pezzo dedicato scritto dalla nostra redazione: racconto del brand, non pubblicità.","svc7.n":"Sponsor podcast","svc7.d":"Il tuo brand citato nel podcast della community e in una newsletter dedicata.","svc8.n":"Consigliato dall'AI Consigliere","svc8.d":"L'assistente AI suggerisce la tua attività agli utenti pertinenti, nel momento giusto della conversazione.","svc9.n":"Immagini e video prodotti dal team","svc9.d":"Creatività pubblicitarie professionali realizzate per te: foto, grafiche e video pronti a convertire.","svc10.n":"Account manager + report competitor","svc10.d":"Un referente dedicato e analisi periodiche su risultati e concorrenti della community.","pricing.label":"Piani","pricing.title":"Scegli il tuo <em>piano</em>","pricing.sub":"Raggiungi la community srilankese e tamil in Italia con strumenti veri, non solo banner. 3 giorni gratis, poi disdici quando vuoi.","pricing.note":"Risparmia 2 mesi con il pagamento annuale · Nessun addebito durante i 3 giorni di prova · Disdici quando vuoi.","plan.per":"/mese","plan.flag":"Più scelto","plan.btnFree":"Inizia gratis","plan.btnContact":"Contattaci","plan.starter.desc":"Per piccole attività locali che vogliono farsi trovare","plan.starter.f1":"Scheda attività sulla mappa servizi","plan.starter.f2":"1 banner pubblicitario · 10.000 impression/mese","plan.starter.f3":"Annuncio in 2 lingue (IT + singalese o tamil)","plan.starter.f4":"Statistiche base","plan.starter.f5":"Supporto via email","plan.pro.desc":"Per attività in crescita che vogliono nuovi clienti","plan.pro.f1":"<strong>Tutto di Starter</strong>, più:","plan.pro.f2":"Scheda verificata e in cima alla mappa","plan.pro.f3":"3 slot + leaderboard premium · impression illimitate","plan.pro.f4":"Annuncio creato dal nostro team in 4 lingue","plan.pro.f5":"Menzione nella newsletter mensile","plan.pro.f6":"Contatti diretti dei clienti interessati","plan.pro.f7":"Statistiche avanzate + supporto prioritario","plan.biz.desc":"Per brand e franchise che vogliono dominare la community","plan.biz.f1":"<strong>Tutto di Pro</strong>, più:","plan.biz.f2":"Posizione top permanente, slot illimitati","plan.biz.f3":"Articolo redazionale dedicato scritto da noi","plan.biz.f4":"Sponsorizzazione podcast + newsletter dedicata","plan.biz.f5":"Consigliato dall'AI Consigliere agli utenti pertinenti","plan.biz.f6":"Immagini e video pubblicitari prodotti dal team","plan.biz.f7":"Account manager + report e analisi competitor","pm.badge":"3 giorni di prova gratuita","pm.title":"Pacchetti pubblicitari","pm.sub":"Raggiungi la community srilankese e tamil in Italia con strumenti veri, non solo banner. Prova 3 giorni gratis, poi scegli il pacchetto più adatto a te.","rm1.t":"Guide burocratiche essenziali","rm1.d":"Permesso di soggiorno, SPID, codice fiscale, residenza","rm2.t":"Assistente AI multilingua","rm2.d":"Risposte in italiano, inglese, sinhala e tamil","rm3.t":"Tracker scadenze e documenti","rm3.d":"Dashboard personale con promemoria automatici","rm4.t":"Forum community avanzato","rm4.d":"Discussioni verificate, esperti della community, badge reputazione","rm5.t":"CV Builder avanzato + lettere di presentazione","rm5.d":"Modelli italiani con export PDF, supporto in sinhala e tamil","rm6.t":"App mobile iOS & Android","rm6.d":"Notifiche push per scadenze, accesso offline alle guide","rm7.t":"Sportello esperti: consulenze verificate","rm7.d":"Consulenti legali e fiscali della community, prenotabili in-app","roadmap.voted":"Votato!","pc1.n":"Consulenza Legale","pc1.d":"Permessi, ricorsi, diritto del lavoro e famiglia","pc2.n":"Consulenza Fiscale","pc2.d":"730, partita IVA, ISEE e pratiche CAF","pc3.n":"Interpretariato","pc3.d":"IT ↔ SI · EN per uffici, ospedali e scuole","pc4.n":"Mediazione","pc4.d":"Supporto culturale e integrazione sociale"
  },
  en:{
    "nav.academy":"Academy","nav.services":"Services","nav.courses":"Courses","m.forum":"Forum","m.esame":"Exam & Badge","m.academy":"Academy lessons","m.certprep":"Certification prep","m.aiteacher":"AI Teacher","m.school":"School & study","m.market":"Marketplace","m.translate":"Translations","m.housing":"Housing","m.pros":"Professionals","nav.guide":"Guides","nav.community":"Community","nav.ai":"AI Assistant","nav.news":"News","nav.map":"Map","nav.contact":"Contact","nav.journey":"Journey","nav.login":"Log in","nav.signup":"Sign up",
    "m.lavdir":"Work & rights","m.duesponde":"Italy & Sri Lanka","m.costruire":"Building your future","m.templates":"Forms & Letters","m.openaccount":"Open a Bank Account","m.assegno":"Assegno Unico Calc.","m.inps":"INPS Rights Check","m.titles":"Qual. Recognition","m.medical":"Medical Dictionary","m.languages":"Language Courses","m.opportunities":"Opportunities","m.dashboard":"My Dashboard","m.tracker":"Permit Tracker","m.cvbuilder":"CV Builder","m.docs":"Document Archive","m.flights":"Sri Lanka Flights","m.cargo":"Cargo Shipping","f.about":"About us","f.subscriptions":"Subscriptions",
    "hero.eyebrow":"In Italy, in your language","hero.t1":"100% free","hero.t2":"No card required","hero.t3":"Official sources cited","hero.title":"<span class='ln'><span>The Sri Lankan</span></span><span class='ln'><span><em>community</em></span></span><span class='ln'><span>in Italy</span></span>","hero.sub":"Bureaucratic guides, multilingual AI assistant, support community and up-to-date news — in Italian, English, Sinhala and Tamil.","hero.cta1":"Start free","hero.cta2":"Explore the guides","hero.stat1":"Journey phases","hero.stat2":"Practical guides","hero.stat3":"Cities on the map","hero.stat4":"Interface languages","hero.stat5":"Tools and services","hero.stat6":"Concrete steps",
    "card1.tag":"Bureaucracy","card1.title":"Residence Permit","card1.sub":"Complete renewal guide","card2.tag":"AI","card2.title":"AI Assistant","card2.sub":"Multilingual answers 24/7","card3.tag":"Community","card3.title":"Community","card3.sub":"Peer-to-peer support","card4.tag":"Finance","card4.title":"Money Transfer","card4.sub":"Wise, Ria, Western Union",
    "ad.label":"Advertising","ad.lead":"Grow your brand: reach the Sri Lankan community in Italy every day.","ad.buy":"Book this space","ad.sponsor":"Sponsored","ad.slot":"Ad space — 300×250","ad.book":"Book →",
    "does.label":"What we do","does.title":"One platform,<br/><em>your whole life in Italy</em>","does.sub":"From your first documents to work, from language to community: six areas, one place, four languages.","does.c1.t":"Documents & bureaucracy","does.c1.p":"Step-by-step guides, encrypted document archive, ready-made PDF forms and a permit tracker with reminders.","does.c2.t":"Language & training","does.c2.p":"Academy, courses, A2–B2 certification prep, AI Teacher and your Language Score with a certificate.","does.c3.t":"AI Advisor","does.c3.p":"A multilingual assistant 24/7 and translation of official letters into Italian, English, Sinhala and Tamil.","does.c4.t":"My Journey","does.c4.p":"Nine life phases in Italy — arrival, regularisation, work, home, family — with the next step always clear.","does.c5.t":"Community & services","does.c5.p":"Forum, marketplace, services map, verified news and a comparator for remittances to Sri Lanka.","does.c6.t":"Verified professionals","does.c6.p":"Lawyers, accountants, interpreters and mediators — verified, and they speak your language.","tools.label":"The toolbox","tools.title":"Every tool,<br/><em>at your fingertips</em>","tools.sub":"Over 30 free tools and guides, built for real life in Italy. Pick what you need today.","feat.label":"What we offer","feat.heading":"Everything you need,<br/><em>in one place</em>","feat.sub":"From bureaucracy to daily integration — we support you at every step of your journey.",
    "feat1.title":"Bureaucratic Guides","feat1.desc":"Residence permit, tax code, SPID, residency — step-by-step guides with downloadable checklists.","feat2.title":"Multilingual AI Assistant","feat2.desc":"Immediate answers in Italian, English, Sinhala and Tamil. Available 24/7.","feat3.title":"Active Community","feat3.desc":"A space where Sri Lankans in Italy support one another. Find answers, share experiences, grow together.","feat4.title":"Money Transfer","feat4.desc":"Compare Wise, Western Union and Ria in real time. Save on remittances to Sri Lanka.","feat5.title":"Services Map","feat5.desc":"CAF offices, patronati, Sri Lankan shops and places of worship in major Italian cities.","feat6.title":"Up-to-date News","feat6.desc":"Laws, decrees and opportunities for the Sri Lankan community. Updated every day.",
    "members.count":"<strong>The Sri Lankan community</strong> helping each other in Italy","members.sub":"Join people living and working in Italy who face the same steps. Together it's easier.",
    "cta.intro.tag":"My Journey","cta.intro.desc":"The map of 9 phases to build your life in Italy — from bureaucracy to daily integration. You always know where you are and what comes next, with the AI Advisor by your side.","cta.intro.pill1":"9 structured phases","cta.intro.pill2":"AI Advisor included","cta.intro.pill3":"Progress always saved",
    "cta.title":"Ready to start<br/><em style=\"font-style:italic;color:var(--gold)\">your journey?</em>","cta.sub":"Sign up free. No credit card required.","cta.btn1":"Create your free account","cta.btn2":"See how it works",
    "footer.tag":"The reference point for the Sri Lankan community in Italy. Guides, multilingual AI, community and services — all in one place.","footer.product":"Product","footer.aiAssistant":"AI Assistant","footer.mapServices":"Services map","footer.company":"The project","footer.about":"About us","footer.advertising":"Advertising","footer.contact":"Contact","footer.account":"Account","footer.register":"Register","footer.subscriptions":"Subscriptions","footer.copy":"© 2026 Easy Italia Hub. All rights reserved.","footer.privacy":"Privacy Policy","footer.cookie":"Cookie Policy","footer.terms":"Terms of Service","footer.legal":"Legal notice",
    "chat.ainoteShort":"AI-generated answers: general information, not legal advice.","chat.ainote":"Artificial Intelligence provides general information based on public sources. It is in no way a substitute for the legal advice of a lawyer, a Patronato or an authorised CAF. Easy Italia Hub accepts no liability for errors or misuse of the information.","chat.name":"Easy Italia Assistant","chat.status":"Online now","chat.welcome1":"Hi! I'm the Easy Italia Hub assistant. How can I help you today?","chat.welcome2":"I can reply in Italian, English, <span lang=\"si\">සිංහල</span> or <span lang=\"ta\">தமிழ்</span>.","chat.now":"Now","chat.sug1":"Residence permit","chat.sug2":"SPID","chat.sug3":"Money transfer","chat.sug4":"Tax code","chat.placeholder":"Type a message…","chat.q1":"How do I renew the residence permit?","chat.q2":"How do I get a SPID?","chat.q3":"How does money transfer to Sri Lanka work?","chat.q4":"How do I get a tax code (codice fiscale)?",
    "fx.teaserTitle":"💸 Compare sending money to Sri Lanka","fx.teaserNote":"Up-to-date indicative rate and provider comparison.","fx.teaserCta":"Open the comparator →",
    "faq.label":"Frequently asked questions","faq.heading":"Frequently <em>asked questions</em>",
    "faq.q1":"How long does the residence permit take?","faq.a1":"It depends on the police headquarters (questura) and the type of permit: timelines can range from a few weeks to several months. After submitting your application you receive a receipt that, together with your passport, serves as a temporary document. For the step-by-step procedure, see our <a href=\"guide.html#permesso-soggiorno\">residence permit guide</a>.",
    "faq.q2":"Is the service free?","faq.a2":"Yes. Reading the guides, using the AI Assistant and reading the news are free. No credit card is required to sign up.",
    "faq.q3":"Which languages can I use the site in?","faq.a3":"The site interface is available in 4 languages: Italian, English, Sinhala (සිංහල) and Tamil (தமிழ்). You can change the language from the menu in the top right.",
    "faq.q4":"How does the AI Advisor work?","faq.a4":"It's an assistant available 24 hours a day that answers your questions about bureaucracy and services. Open the chat from the button in the bottom right (or with Ctrl/⌘+J) and type your question: it points you to the relevant steps and guides.",
    "faq.q5":"Do I need to register to use the guides?","faq.a5":"No. The practical guides are freely available without registration. The free account is only needed to save the progress of your <a href=\"percorso.html\">personal journey</a>.",
    "faq.q6":"Is the information official?","faq.a6":"Our guides are informational and orient you through the main steps, but they do not replace official sources. For definitive data always check the institutional websites (e.g. Polizia di Stato, Agenzia delle Entrate, INPS) or contact a CAF or patronato."
    ,"mission.label":"About us","mission.title":"We build the bridge<br><em>between two worlds.</em>","mission.sub":"Easy Italia Hub was born from the real need of hundreds of thousands of Sri Lankans who navigate the Italian bureaucratic system every year without the right tools.","mission.desc":"Our mission is simple: make integration faster, less stressful and more dignified. Because every person deserves to understand their rights in their own language.","mission.val1.h":"Multilingual","mission.val1.p":"Italian, English, Sinhala and Tamil","mission.val2.h":"Accessible","mission.val2.p":"Free, no access barriers","mission.val3.h":"Community","mission.val3.p":"Built together with the community","mission.val4.h":"Reliable","mission.val4.p":"Official sources always verified","mission.cta":"Meet the team →","mission.visual":"Every person<br>deserves to<br><em>understand their rights</em>","prob.eyebrow":"Why we exist","prob.title":"Italian bureaucracy —<br><em>a maze on your own.</em>","prob.sub":"Every year thousands of Sri Lankans in Italy lose hours on wrong forms, useless queues and scattered information. Without a guide in their own language, every step is an obstacle.","prob.li1":"Scattered bureaucratic information, hard to find","prob.li2":"Hidden deadlines and documents forgotten at the last moment","prob.li3":"No support in your own language — everything only in Italian","prob.li4":"Dispersed community, hard to find people who have been through the same thing","sol.eyebrow":"With Easy Italia Hub","sol.title":"Every step of your<br>journey is clear.","sol.li1":"Practical step-by-step guides for every bureaucratic procedure","sol.li2":"Deadline and document tracker — you never forget a thing","sol.li3":"AI assistant in Italian, English, Sinhala and Tamil — always available","sol.li4":"Active Sri Lankan community in Italy — share real experiences","how.label":"How it works","how.title":"Get started in <em>three simple steps</em>","how.sub":"No credit card. No mandatory subscription. Just you and the resources you need.","how.s1.h":"Create your profile","how.s1.p":"Sign up free in 30 seconds. Enter your situation and the system builds a personalised path just for you.","how.s2.h":"Choose your guide","how.s2.p":"Residence permit, SPID, tax code, work: find the right guide with downloadable checklists and official links.","how.s3.h":"Ask the AI","how.s3.p":"Have doubts? The assistant answers in 4 languages, 24 hours a day. Or talk to the community — you will always find someone who has been through the same situation.","ct.label":"Community","ct.title":"Be among the <em>first</em><br>to join","ct.desc":"Our Sri Lankan community in Italy is taking shape. Join now: share experiences, find support and connect with people who face the same steps.","ct.li1":"Support with bureaucracy and daily life in Italy","ct.li2":"Connect with Sri Lankans in your city","ct.li3":"Early access to new features","ct.cta":"Join the community →","ct.counter":"people already joined","test.label":"Real examples","test.title":"How it <em>simplifies</em> your life","roadmap.label":"Transparency","roadmap.title":"What we are <em>building</em>","roadmap.sub":"Our roadmap is public. Vote for the features you want to see first — your vote really counts.","roadmap.done":"Completed","roadmap.wip":"In progress","roadmap.vote":"Vote","partner.label":"Are you a professional?","partner.title":"Bring your expertise<br><em>to the community.</em>","partner.desc":"Lawyers, tax consultants, interpreters, cultural mediators, consulate staff: if you work with the Sri Lankan community in Italy, pre-register for our future network of professionals. It is a simple expression of interest — no cost and no commercial agreement in place: when the programme launches you will be among the first contacted.","partner.tag1":"Lawyers","partner.tag2":"Tax consultants","partner.tag3":"Interpreters","partner.tag4":"Cultural mediators","map3d.title":"The community <em>across Italy</em>","map3d.sub":"Sri Lankans from north to south: the cities where the community is growing.","partner.tag5":"CAF & Patronati","partner.tag6":"Consulates","partner.cta":"Pre-register my interest"
    ,"wa.title":"Together on WhatsApp too","wa.sub":"Deadlines, news and opportunities for the Sri Lankan community, right where you spend your time. No spam, unsubscribe anytime.","wa.btn":"Join the channel","donate.title":"Support the project","donate.sub":"Easy Italia Hub is completely free for everyone. If it has been useful to you, a small donation helps us keep the guides updated, the servers running and the services accessible to the entire Sri Lankan community in Italy.","donate.cta":"♥ Donate now","donate.note":"Secure via Stripe · Any amount is precious to us","nl.title":"Stay updated.<br>No spam, promised.","nl.sub":"Every week: bureaucratic news relevant to you, selected opportunities and platform updates. In Italian and Sinhala.","nl.btn":"Subscribe free","nl.note":"Cancel anytime. No card required.","nav.voli":"Money & Travel","why.label":"Why Easy Italia Hub","why.title":"Everything in <em>one place</em>","why.sub":"Bureaucracy, work, housing and community: what you need to live in Italy, without getting lost across a thousand sites.","why.c1.t":"Clear guides","why.c1.p":"Permit, SPID, tax code: step by step, in plain words and in 4 languages.","why.c2.t":"Real opportunities","why.c2.p":"Jobs, housing and services selected for those arriving in Italy, constantly updated.","why.c3.t":"A close community","why.c3.p":"Connect with people who lived your same situation. You're never alone.","svc1.n":"Map listing","svc1.d":"Your business geolocated on the services map most used by the community.","svc2.n":"Ad banners","svc2.d":"Graphic spaces in high-visibility positions, with impressions tracked in real time.","svc3.n":"Multilingual ad created by the team","svc3.d":"Professional copy and graphics in 4 languages (IT, EN, Sinhala, Tamil) — speak to the whole community in its language.","svc4.n":"Monthly newsletter","svc4.d":"Mention in the newsletter that lands directly in the inboxes of thousands of subscribers.","svc5.n":"Direct customer contacts","svc5.d":"Get the details of those truly interested: real leads, not just clicks.","svc6.n":"Editorial article","svc6.d":"A dedicated piece written by our editorial team: brand storytelling, not advertising.","svc7.n":"Podcast sponsor","svc7.d":"Your brand mentioned in the community podcast and in a dedicated newsletter.","svc8.n":"Recommended by the AI Advisor","svc8.d":"The AI assistant suggests your business to relevant users, at the right moment in the conversation.","svc9.n":"Images and videos produced by the team","svc9.d":"Professional ad creatives made for you: photos, graphics and videos ready to convert.","svc10.n":"Account manager + competitor report","svc10.d":"A dedicated contact and periodic analysis of results and community competitors.","pricing.label":"Plans","pricing.title":"Choose your <em>plan</em>","pricing.sub":"Reach the Sri Lankan and Tamil community in Italy with real tools, not just banners. 3 days free, then cancel whenever you want.","pricing.note":"Save 2 months with annual payment · No charge during the 3-day trial · Cancel whenever you want.","plan.per":"/month","plan.flag":"Most chosen","plan.btnFree":"Start free","plan.btnContact":"Contact us","plan.starter.desc":"For small local businesses that want to be found","plan.starter.f1":"Business listing on the services map","plan.starter.f2":"1 ad banner · 10,000 impressions/month","plan.starter.f3":"Ad in 2 languages (IT + Sinhala or Tamil)","plan.starter.f4":"Basic statistics","plan.starter.f5":"Email support","plan.pro.desc":"For growing businesses that want new customers","plan.pro.f1":"<strong>Everything in Starter</strong>, plus:","plan.pro.f2":"Verified listing at the top of the map","plan.pro.f3":"3 slots + premium leaderboard · unlimited impressions","plan.pro.f4":"Ad created by our team in 4 languages","plan.pro.f5":"Mention in the monthly newsletter","plan.pro.f6":"Direct contacts of interested customers","plan.pro.f7":"Advanced statistics + priority support","plan.biz.desc":"For brands and franchises that want to dominate the community","plan.biz.f1":"<strong>Everything in Pro</strong>, plus:","plan.biz.f2":"Permanent top position, unlimited slots","plan.biz.f3":"Dedicated editorial article written by us","plan.biz.f4":"Podcast sponsorship + dedicated newsletter","plan.biz.f5":"Recommended by the AI Advisor to relevant users","plan.biz.f6":"Ad images and videos produced by the team","plan.biz.f7":"Account manager + competitor reports and analysis","pm.badge":"3-day free trial","pm.title":"Advertising packages","pm.sub":"Reach the Sri Lankan and Tamil community in Italy with real tools, not just banners. Try 3 days free, then choose the package that fits you best.","rm1.t":"Essential bureaucracy guides","rm1.d":"Residence permit, SPID, tax code, residency","rm2.t":"Multilingual AI assistant","rm2.d":"Answers in Italian, English, Sinhala and Tamil","rm3.t":"Deadline and document tracker","rm3.d":"Personal dashboard with automatic reminders","rm4.t":"Advanced community forum","rm4.d":"Verified discussions, community experts, reputation badges","rm5.t":"Advanced CV Builder + cover letters","rm5.d":"Italian templates with PDF export, support in Sinhala and Tamil","rm6.t":"iOS & Android mobile app","rm6.d":"Push notifications for deadlines, offline access to guides","rm7.t":"Expert desk: verified consultations","rm7.d":"Community legal and tax advisors, bookable in-app","roadmap.voted":"Voted!","pc1.n":"Legal Advice","pc1.d":"Permits, appeals, labor and family law","pc2.n":"Tax Advice","pc2.d":"730, VAT number, ISEE and CAF services","pc3.n":"Interpreting","pc3.d":"IT ↔ SI · EN for offices, hospitals and schools","pc4.n":"Mediation","pc4.d":"Cultural support and social integration"
  },
  si:{
    "nav.academy":"ඇකඩමිය","nav.services":"සේවා","nav.courses":"පාඨමාලා","m.forum":"සංසදය","m.esame":"විභාගය සහ බැජ්","m.academy":"Academy පාඩම්","m.certprep":"සහතික සූදානම","m.aiteacher":"AI ගුරු","m.school":"පාසල හා අධ්‍යාපනය","m.market":"වෙළඳපොළ","m.translate":"පරිවර්තන","m.housing":"නිවාස","m.pros":"වෘත්තිකයන්","nav.guide":"මාර්ගෝපදේශ","nav.community":"ප්‍රජාව","nav.ai":"AI සහායක","nav.news":"පුවත්","nav.map":"සිතියම","nav.contact":"සම්බන්ධ","nav.journey":"මගේ ගමන","nav.login":"පිවිසෙන්න","nav.signup":"ලියාපදිංචිය",
    "m.lavdir":"රැකියාව සහ අයිතිවාසිකම්","m.duesponde":"ඉතාලිය සහ ශ්‍රී ලංකාව","m.costruire":"අනාගතය ගොඩනැගීම","m.templates":"ෆෝරම් සහ ලිපි","m.openaccount":"බැංකු ගිණුමක්","m.assegno":"Assegno Unico ගණකය","m.inps":"INPS අයිතිවාසිකම්","m.titles":"සුදුස්සකම් හඳුනාගැනීම","m.medical":"වෛද්‍ය ශබ්දකෝෂය","m.languages":"භාෂා පාඨමාලා","m.opportunities":"අවස්ථා","m.dashboard":"මගේ ඩෑෂ්බෝඩ්","m.tracker":"බලපත්‍ර ලුහුබැඳීම","m.cvbuilder":"CV සාදන මෙවලම","m.docs":"ලේඛනාගාරය","m.flights":"ශ්‍රී ලංකා ගුවන් ගමන්","m.cargo":"ගෙවල් ගෙනයාම","f.about":"අප ගැන","f.subscriptions":"දායකත්ව",
    "hero.eyebrow":"ඉතාලියේ, ඔබේ භාෂාවෙන්","hero.t1":"100% නොමිලේ","hero.t2":"ක්‍රෙඩිට් කාඩ් අවශ්‍ය නැත","hero.t3":"නිල මූලාශ්‍ර සඳහන් කර ඇත","hero.title":"<span class='ln'><span>ඉතාලියේ</span></span><span class='ln'><span><em>ශ්‍රී ලාංකික</em></span></span><span class='ln'><span>ප්‍රජාව</span></span>","hero.sub":"නිලධාරී මාර්ගෝපදේශ, බහුභාෂා AI සහායක, සහාය ප්‍රජාව සහ යාවත්කාලීන පුවත් — ඉතාලි, ඉංග්‍රීසි, සිංහල සහ දෙමළ භාෂාවලින්.","hero.cta1":"නොමිලේ අරඹන්න","hero.cta2":"මාර්ගෝපදේශ ගවේෂණය කරන්න","hero.stat1":"ගමනේ අදියර","hero.stat2":"ප්‍රායෝගික මාර්ගෝපදේශ","hero.stat3":"සිතියමේ නගර","hero.stat4":"අතුරුමුහුණත් භාෂා","hero.stat5":"මෙවලම් සහ සේවා","hero.stat6":"සැබෑ පියවර",
    "card1.tag":"නිලධාරිවාදය","card1.title":"පදිංචි බලපත්‍රය","card1.sub":"සම්පූර්ණ අලුත් කිරීමේ මාර්ගෝපදේශය","card2.tag":"AI","card2.title":"AI සහායක","card2.sub":"බහුභාෂා පිළිතුරු 24/7","card3.tag":"ප්‍රජාව","card3.title":"ප්‍රජාව","card3.sub":"සම වයසේ අයගේ සහාය","card4.tag":"මුල්‍ය","card4.title":"මුදල් හුවමාරුව","card4.sub":"Wise, Ria, Western Union",
    "ad.label":"දැන්වීම්","ad.lead":"ඔබේ වෙළඳ නාමය වර්ධනය කරන්න: සෑම දිනකම ඉතාලියේ ශ්‍රී ලාංකික ප්‍රජාව වෙත ළඟා වන්න.","ad.buy":"අවකාශය වෙන්කරවා ගන්න","ad.sponsor":"අනුග්‍රාහක","ad.slot":"දැන්වීම් අවකාශය — 300×250","ad.book":"වෙන්කරවා ගන්න →",
    "does.label":"අපි කරන දේ","does.title":"එක් වේදිකාවක්,<br/><em>ඉතාලියේ ඔබේ මුළු ජීවිතය</em>","does.sub":"ලේඛනවල සිට රැකියාව දක්වා, භාෂාවේ සිට ප්‍රජාව දක්වා: ක්ෂේත්‍ර හයක්, එක තැනක්, භාෂා හතරක්.","does.c1.t":"ලේඛන සහ නිලධාරිවාදය","does.c1.p":"පියවරෙන් පියවර මාර්ගෝපදේශ, ලේඛනාගාරය, PDF ෆෝරම් සහ බලපත්‍ර ට්‍රැකරය.","does.c2.t":"භාෂාව සහ පුහුණුව","does.c2.p":"Academy, පාඨමාලා, A2–B2 සහතික සූදානම, AI Teacher සහ Language Score.","does.c3.t":"AI උපදේශක","does.c3.p":"පැය 24 බහුභාෂා සහායක සහ නිල ලිපි පරිවර්තනය (ඉතාලි, ඉංග්‍රීසි, සිංහල, දෙමළ).","does.c4.t":"මගේ ගමන","does.c4.p":"ඉතාලියේ ජීවිත අදියර නවයක් — ඊළඟ පියවර සැමවිටම පැහැදිලියි.","does.c5.t":"ප්‍රජාව සහ සේවා","does.c5.p":"සංසදය, වෙළඳසැල, සේවා සිතියම, පුවත් සහ මුදල් යැවීමේ සංසන්දකය.","does.c6.t":"සත්‍යාපිත වෘත්තිකයන්","does.c6.p":"නීතිඥයන්, ගණකාධිකාරීන්, පරිවර්තකයන් — ඔබේ භාෂාව කතා කරන අය.","tools.label":"මෙවලම් පෙට්ටිය","tools.title":"සියලුම මෙවලම්,<br/><em>ඔබ අත ළඟ</em>","tools.sub":"ඉතාලියේ සැබෑ ජීවිතය සඳහා නොමිලේ මෙවලම් සහ මාර්ගෝපදේශ 30කට වඩා. අදට අවශ්‍ය දේ තෝරන්න.","feat.label":"අපි පිරිනමන දේ","feat.heading":"ඔබට අවශ්‍ය සියල්ල,<br/><em>එක තැනකින්</em>","feat.sub":"නිලධාරිවාදයේ සිට දෛනික ඒකාබද්ධතාව දක්වා — ඔබේ ගමනේ සෑම පියවරකදීම අපි ඔබට සහාය වෙමු.",
    "feat1.title":"නිලධාරී මාර්ගෝපදේශ","feat1.desc":"පදිංචි බලපත්‍රය, බදු කේතය, SPID, පදිංචිය — බාගත හැකි පිරික්සුම් ලැයිස්තු සහිත පියවරෙන් පියවර මාර්ගෝපදේශ.","feat2.title":"බහුභාෂා AI සහායක","feat2.desc":"ඉතාලි, ඉංග්‍රීසි, සිංහල සහ දෙමළ භාෂාවලින් ක්ෂණික පිළිතුරු. දිනපතා පැය 24 පුරා ලබා ගත හැක.","feat3.title":"සක්‍රිය ප්‍රජාව","feat3.desc":"ඉතාලියේ ශ්‍රී ලාංකිකයන් එකිනෙකාට සහාය වන අවකාශයක්. පිළිතුරු සොයාගන්න, අත්දැකීම් බෙදාගන්න, එකට වර්ධනය වන්න.","feat4.title":"මුදල් හුවමාරුව","feat4.desc":"Wise, Western Union සහ Ria තත්‍ය කාලීනව සසඳන්න. ශ්‍රී ලංකාවට යවන මුදල් වලින් ඉතිරි කරගන්න.","feat5.title":"සේවා සිතියම","feat5.desc":"ප්‍රධාන ඉතාලි නගරවල CAF, patronati, ශ්‍රී ලාංකික වෙළඳසැල් සහ පූජනීය ස්ථාන.","feat6.title":"යාවත්කාලීන පුවත්","feat6.desc":"ශ්‍රී ලාංකික ප්‍රජාව සඳහා නීති, නියෝග සහ අවස්ථා. දිනපතා යාවත්කාලීන වේ.",
    "members.count":"<strong>ශ්‍රී ලාංකික ප්‍රජාව</strong> ඉතාලියේ එකිනෙකාට උදව් කරයි","members.sub":"ඉතාලියේ ජීවත්වන සහ වැඩකරන, එම පියවරම මුහුණ දෙන අය හා එක්වන්න. එකට වඩා පහසුයි.",
    "cta.intro.tag":"මගේ ගමන","cta.intro.desc":"ඉතාලියේ ඔබේ ජීවිතය ගොඩනැගීමට අදියර 9 ක් — නිලධාරිවාදයේ සිට දෛනික ඒකාබද්ධතාව දක්වා. ඔබ කොතැනද, ඊළඟ පියවර කුමක්දැයි සැමවිටම දැනගන්න, AI උපදේශකයා ඔබ අසල.","cta.intro.pill1":"ව්‍යුහගත අදියර 9","cta.intro.pill2":"AI උපදේශකයා ඇතුළත්","cta.intro.pill3":"ප්‍රගතිය සුරකිනු ලැබේ",
    "cta.title":"ඔබේ ගමන<br/><em style=\"font-style:italic;color:var(--gold)\">අරඹන්න සූදානම්ද?</em>","cta.sub":"නොමිලේ ලියාපදිංචි වන්න. ණයපතක් අවශ්‍ය නැත.","cta.btn1":"ඔබේ නොමිලේ ගිණුම සාදන්න","cta.btn2":"එය ක්‍රියා කරන ආකාරය බලන්න",
    "footer.tag":"ඉතාලියේ ශ්‍රී ලාංකික ප්‍රජාවේ විශ්වාසනීය මධ්‍යස්ථානය. මාර්ගෝපදේශ, බහුභාෂා AI, ප්‍රජාව සහ සේවා — සියල්ල එක තැනක.","footer.product":"නිෂ්පාදනය","footer.aiAssistant":"AI සහායක","footer.mapServices":"සේවා සිතියම","footer.company":"ව්‍යාපෘතිය","footer.about":"අප ගැන","footer.advertising":"දැන්වීම්","footer.contact":"සම්බන්ධ වන්න","footer.account":"ගිණුම","footer.register":"ලියාපදිංචි වන්න","footer.subscriptions":"දායකත්ව","footer.copy":"© 2026 Easy Italia Hub. සියලු හිමිකම් ඇවිරිණි.","footer.privacy":"පෞද්ගලිකත්ව ප්‍රතිපත්තිය","footer.cookie":"කුකී ප්‍රතිපත්තිය","footer.terms":"සේවා කොන්දේසි","footer.legal":"නෛතික දැන්වීම",
    "chat.ainoteShort":"AI පිළිතුරු: සාමාන්‍ය තොරතුරු, නෛතික උපදෙස් නොවේ.","chat.ainote":"කෘත්‍රිම බුද්ධිය පොදු මූලාශ්‍ර මත පදනම්ව සාමාන්‍ය තොරතුරු සපයයි. එය නීතිඥයෙකුගේ, Patronato එකක හෝ බලයලත් CAF එකක නෛතික උපදෙස් කිසිසේත්ම ආදේශ නොකරයි. තොරතුරුවල දෝෂ හෝ අනිසි භාවිතය සම්බන්ධයෙන් Easy Italia Hub කිසිදු වගකීමක් නොදරයි.","chat.name":"Easy Italia සහායක","chat.status":"දැන් සබැඳිව","chat.welcome1":"ආයුබෝවන්! මම Easy Italia Hub සහායකයා. අද මට ඔබට කෙසේ උදව් කළ හැකිද?","chat.welcome2":"මට ඉතාලි, ඉංග්‍රීසි, <span lang=\"si\">සිංහල</span> හෝ <span lang=\"ta\">தமிழ்</span> භාෂාවෙන් පිළිතුරු දිය හැක.","chat.now":"දැන්","chat.sug1":"පදිංචි බලපත්‍රය","chat.sug2":"SPID","chat.sug3":"මුදල් හුවමාරුව","chat.sug4":"බදු කේතය","chat.placeholder":"පණිවිඩයක් ටයිප් කරන්න…","chat.q1":"පදිංචි බලපත්‍රය අලුත් කරන්නේ කෙසේද?","chat.q2":"SPID ලබා ගන්නේ කෙසේද?","chat.q3":"ශ්‍රී ලංකාවට මුදල් යැවීම ක්‍රියා කරන්නේ කෙසේද?","chat.q4":"බදු කේතය (codice fiscale) ලබා ගන්නේ කෙසේද?",
    "fx.teaserTitle":"💸 ශ්‍රී ලංකාවට මුදල් යැවීම සසඳන්න","fx.teaserNote":"යාවත්කාලීන දර්ශක අනුපාතය සහ සැපයුම්කරු සැසඳීම.","fx.teaserCta":"සංසන්දකය විවෘත කරන්න →",
    "faq.label":"නිතර අසන ප්‍රශ්න","faq.heading":"නිතර අසන <em>ප්‍රශ්න</em>",
    "faq.q1":"පදිංචි බලපත්‍රයට කොපමණ කාලයක් ගතවේද?","faq.a1":"එය ප්‍රාදේශීය පොලිස් මූලස්ථානය (questura) සහ බලපත්‍ර වර්ගය මත රඳා පවතී: කාලය සති කිහිපයක සිට මාස කිහිපයක් දක්වා වෙනස් විය හැක. ඔබේ අයදුම්පත ඉදිරිපත් කිරීමෙන් පසු, ඔබේ විදේශ ගමන් බලපත්‍රය සමඟ තාවකාලික ලේඛනයක් ලෙස වැඩ කරන රිසිට්පතක් ඔබට ලැබේ. පියවරෙන් පියවර ක්‍රියාවලිය සඳහා, අපගේ <a href=\"guide.html#permesso-soggiorno\">පදිංචි බලපත්‍ර මාර්ගෝපදේශය</a> බලන්න.",
    "faq.q2":"සේවාව නොමිලේද?","faq.a2":"ඔව්. මාර්ගෝපදේශ කියවීම, AI සහායක භාවිතය සහ පුවත් කියවීම නොමිලේ වේ. ලියාපදිංචි වීමට ණයපතක් අවශ්‍ය නැත.",
    "faq.q3":"මට වෙබ් අඩවිය භාවිත කළ හැකි භාෂා මොනවාද?","faq.a3":"වෙබ් අඩවියේ අතුරුමුහුණත භාෂා 4කින් ලබා ගත හැක: ඉතාලි, ඉංග්‍රීසි, සිංහල (සිංහල) සහ දෙමළ (தமிழ்). ඉහළ දකුණේ ඇති මෙනුවෙන් ඔබට භාෂාව වෙනස් කළ හැක.",
    "faq.q4":"AI උපදේශක ක්‍රියා කරන්නේ කෙසේද?","faq.a4":"එය නිලධාරිවාදය සහ සේවා පිළිබඳ ඔබේ ප්‍රශ්නවලට පිළිතුරු දෙන, දිනපතා පැය 24 පුරා ලබා ගත හැකි සහායකයෙකි. පහළ දකුණේ ඇති බොත්තමෙන් (හෝ Ctrl/⌘+J මගින්) කතාබහ විවෘත කර ඔබේ ප්‍රශ්නය ටයිප් කරන්න: එය ඔබට අදාළ පියවර සහ මාර්ගෝපදේශ පෙන්වයි.",
    "faq.q5":"මාර්ගෝපදේශ භාවිතා කිරීමට මට ලියාපදිංචි විය යුතුද?","faq.a5":"නැත. ප්‍රායෝගික මාර්ගෝපදේශ ලියාපදිංචියකින් තොරව නිදහසේ බැලිය හැක. නොමිලේ ගිණුම අවශ්‍ය වන්නේ ඔබේ <a href=\"percorso.html\">පෞද්ගලික ගමනේ</a> ප්‍රගතිය සුරැකීමට පමණි.",
    "faq.q6":"තොරතුරු නිල ද?","faq.a6":"අපගේ මාර්ගෝපදේශ දැනුවත් කිරීමේ ස්වභාවයෙන් යුක්ත වන අතර ප්‍රධාන පියවරවල ඔබව මෙහෙයවයි, නමුත් ඒවා නිල මූලාශ්‍ර ආදේශ නොකරයි. නිශ්චිත දත්ත සඳහා සැමවිටම නිල වෙබ් අඩවි (උදා. Polizia di Stato, Agenzia delle Entrate, INPS) පරීක්ෂා කරන්න හෝ CAF හෝ patronato වෙත සම්බන්ධ වන්න."
    ,"mission.label":"අප ගැන","mission.title":"අපි පාලම ගොඩනඟමු<br><em>ලෝක දෙකක් අතර.</em>","mission.sub":"Easy Italia Hub ඉතාලියේ නිලධාරි ක්‍රමය නිසි මෙවලම් නොමැතිව ගමන් කරන ලක්ෂ ගණනක ශ්‍රී ලාංකිකයන්ගේ සැබෑ අවශ්‍යතාවෙන් ඉපිල ආ ව්‍යාපෘතියකි.","mission.desc":"අපගේ මෙහෙවර සරලයි: ඒකාබද්ධතාව වේගවත්, අඩු ආතතියෙන් යුත් සහ වඩාත් ගෞරවාන්විත කිරීම. සෑම කෙනෙකුටම ස්වකීය භාෂාවෙන් ස්වකීය අයිතිවාසිකම් තේරුම් ගැනීමට හිමිකමක් ඇත.","mission.val1.h":"බහුභාෂා","mission.val1.p":"ඉතාලි, ඉංග්‍රීසි, සිංහල සහ දෙමළ","mission.val2.h":"ප්‍රවේශ්‍ය","mission.val2.p":"නොමිලේ, ප්‍රවේශ බාධා නොමැති","mission.val3.h":"ප්‍රජාව","mission.val3.p":"ප්‍රජාව සමඟ ගොඩනඟන ලදි","mission.val4.h":"විශ්වාසනීය","mission.val4.p":"නිල මූලාශ්‍ර සැමවිටම තහවුරු කළ","mission.cta":"කණ්ඩායම ගැන දැනගන්න →","mission.visual":"සෑම කෙනෙකුටම<br>ස්වකීය<br><em>අයිතිවාසිකම් තේරුම් ගැනීමට</em>","prob.eyebrow":"අපි පවතින්නේ ඇයි","prob.title":"ඉතාලි නිලධාරිවාදය —<br><em>හුදෙකලාවේ ගවා ගැනීමක.</em>","prob.sub":"සෑම වසරකම ඉතාලියේ ශ්‍රී ලාංකිකයන් දහස් ගණනක් වැරදි ෆෝම, නිෂ්ඵල පෝලිම් සහ විසිරුණු තොරතුරු නිසා පැය ගණනාවක් නාස්ති කරයි. ස්වකීය භාෂාවෙන් මාර්ගෝපදේශනයක් නොමැතිව, සෑම පියවරක්ම බාධාවකි.","prob.li1":"ලබා ගැනීමට අපහසු විසිරී ඇති නිලධාරී තොරතුරු","prob.li2":"අවසාන මොහොතේ අමතක වූ සැඟවුණු ගෙවිය යුතු දිනයන් සහ ලේඛන","prob.li3":"ස්වකීය භාෂාවෙන් සහාය නැත — සියල්ල ඉතාලි භාෂාවෙන් පමණි","prob.li4":"විසිරුණු ප්‍රජාව, එම ම තත්ත්වය ජීවත් කළ කෙනෙකු සොයා ගැනීම අපහසුයි","sol.eyebrow":"Easy Italia Hub සමඟ","sol.title":"ඔබේ ගමනේ සෑම<br>පියවරක්ම පැහැදිලිය.","sol.li1":"සෑම නිලධාරී ක්‍රියාවලියකටම ප්‍රායෝගික පියවරෙන් පියවර මාර්ගෝපදේශ","sol.li2":"ගෙවිය යුතු දිනයන් සහ ලේඛන නිරීක්ෂකය — කිසිවිටෙක කිසිවක් අමතක නොවේ","sol.li3":"ඉතාලි, ඉංග්‍රීසි, සිංහල සහ දෙමළ භාෂාවලින් AI සහායක — සැමවිටම ලබා ගත හැක","sol.li4":"ඉතාලියේ සක්‍රිය ශ්‍රී ලාංකික ප්‍රජාව — සැබෑ අත්දැකීම් බෙදාගන්න","how.label":"ක්‍රියා කරන ආකාරය","how.title":"<em>සරල පියවර තුනකින්</em> ආරම්භ කරන්න","how.sub":"ණයපතක් නැත. අනිවාර්ය දායකත්වයක් නැත. ඔබ සහ ඔබට අවශ්‍ය සම්පත් පමණයි.","how.s1.h":"ඔබේ පැතිකඩ සාදන්න","how.s1.p":"තත්පර 30 ක් ඇතුළත නොමිලේ ලියාපදිංචි වන්න. ඔබේ තත්ත්වය ඇතුළු කරන්න, ක්‍රමය ඔබ සඳහා අභිරුචි ගමනක් නිර්මාණය කරයි.","how.s2.h":"ඔබේ මාර්ගෝපදේශය තෝරන්න","how.s2.p":"පදිංචි බලපත්‍රය, SPID, බදු කේතය, රැකියාව: බාගත හැකි පිරික්සුම් ලැයිස්තු සහ නිල සබැඳි සහිත නිවැරදි මාර්ගෝපදේශය සොයාගන්න.","how.s3.h":"AI ගෙන් අහන්න","how.s3.p":"සැකයක් තිබේද? සහායකයා භාෂා 4 කින්, දිනකට පැය 24 පිළිතුරු දෙයි. නැතිනම් ප්‍රජාව සමඟ සාකච්ඡා කරන්න — ඔබේ එම ම තත්ත්වයෙන් ගෙවිය ඇති කෙනෙකු සැමවිටම සොයාගත හැකිය.","ct.label":"ප්‍රජාව","ct.title":"<em>ප්‍රථමයන්</em> අතරට<br>සම්බන්ධ වන්න","ct.desc":"ඉතාලියේ අපගේ ශ්‍රී ලාංකික ප්‍රජාව හැඩ ගැනෙමින් තිබේ. දැනම සම්බන්ධ වන්න: අත්දැකීම් බෙදාගන්න, සහාය සොයාගන්න, එම ම ගෙවිය යුතු ගමන කරන අය හා සම්බන්ධ වන්න.","ct.li1":"ඉතාලියේ නිලධාරිවාදය සහ දෛනික ජීවිතය පිළිබඳ සහාය","ct.li2":"ඔබේ නගරයේ ශ්‍රී ලාංකිකයන් සමඟ සම්බන්ධ වන්න","ct.li3":"නව විශේෂාංගවලට ශ්‍රීලාගේ ප්‍රවේශය","ct.cta":"ප්‍රජාවට සම්බන්ධ වන්න →","ct.counter":"දැනටමත් සම්බන්ධ වූ අය","test.label":"උදාහරණ","test.title":"ඔබේ ජීවිතය <em>සරල</em> කරයි","roadmap.label":"විනිවිදභාවය","roadmap.title":"අපි <em>ගොඩනඟන</em> දේ","roadmap.sub":"අපගේ roadmap ප්‍රසිද්ධයි. ඔබ කලින් දැකීමට කැමති විශේෂාංග සඳහා ඡන්දය දෙන්න — ඔබේ ඡන්දය සැබවින්ම ගණනය වේ.","roadmap.done":"සම්පූර්ණ","roadmap.wip":"ක්‍රියාත්මකයි","roadmap.vote":"ඡන්දය","partner.label":"ඔබ වෘත්තිකයෙකුද?","partner.title":"ඔබේ ප්‍රවීණතාව<br><em>ප්‍රජාවට ගෙන එන්න.</em>","partner.desc":"නීතිඥයින්, බදු උපදේශකයින්, පරිවර්තකයින්, සංස්කෘතික මධ්‍යස්ථකරුවන්, කොන්සියුලේට් සේවකයින්: ඔබ ඉතාලියේ ශ්‍රී ලාංකික ප්‍රජාව සමඟ වැඩ කරන්නේ නම්, අනාගත වෘත්තීය ජාලය සඳහා පෙර-ලියාපදිංචි වන්න. මෙය කිසිදු ගාස්තුවක් හෝ වාණිජ ගිවිසුමක් නොමැති සරල කැමැත්ත ප්‍රකාශයකි — වැඩසටහන ආරම්භ වන විට ඔබ මුලින්ම සම්බන්ධ කරගනු ලැබේ.","partner.tag1":"නීතිඥයින්","partner.tag2":"බදු උපදේශකයින්","partner.tag3":"පරිවර්තකයින්","partner.tag4":"සංස්කෘතික මධ්‍යස්ථකරුවන්","map3d.title":"ප්‍රජාව <em>ඉතාලිය පුරා</em>","map3d.sub":"උතුරේ සිට දකුණට ශ්‍රී ලාංකිකයන්: ප්‍රජාව වර්ධනය වන නගර.","partner.tag5":"CAF & Patronati","partner.tag6":"කොන්සියුලේට්","partner.cta":"මගේ කැමැත්ත පෙර-ලියාපදිංචි කරන්න"
    ,"wa.title":"WhatsApp හරහාද එකට","wa.sub":"ශ්‍රී ලාංකික ප්‍රජාව සඳහා නියමිත දින, පුවත් සහ අවස්ථා — ඔබ සිටින තැනම. spam නැත, ඕනෑම විටෙක ඉවත් විය හැක.","wa.btn":"නාලිකාවට එක්වන්න","donate.title":"ව්‍යාපෘතිය සහාය කරන්න","donate.sub":"Easy Italia Hub සියල්ලන් සඳහා සම්පූර්ණ නොමිලේ වේ. ඔබට ප්‍රයෝජනවත් වී ඇත්නම්, කුඩා පරිත්‍යාගයකින් මාර්ගෝපදේශ යාවත්කාලීනව සහ ශ්‍රී ලාංකික ප්‍රජාවට සේවා ලබා ගත හැකිව පවත්වාගෙන යාමට උදව් කළ හැකිය.","donate.cta":"♥ දැන් පරිත්‍යාග කරන්න","donate.note":"Stripe හරහා ආරක්ෂිතයි · ඕනෑම මුදලක් අපට ඉතා වටිනවා","nl.title":"යාවත්කාලීනව සිටින්න.<br>ස්පෑම් නැත, කතිකාවෙනි.","nl.sub":"සෑම සතියකම: ඔබට අදාළ නිලධාරී අලුත් ව්‍යාපාර, තෝරාගත් අවස්ථා සහ වේදිකා යාවත්කාලීන. ඉතාලි සහ සිංහල භාෂාවලින්.","nl.btn":"නොමිලේ දායක වන්න","nl.note":"ඕනෑ වේලාවක් ඉවත් වන්න. කාඩ් අවශ්‍ය නැත.","nav.voli":"මුදල් සහ ගමන්","why.label":"ඇයි Easy Italia Hub","why.title":"සියල්ල <em>එකම තැනක</em>","why.sub":"නිලධාරිවාදය, රැකියා, නිවාස සහ ප්‍රජාව: ඉතාලියේ ජීවත් වීමට ඔබට අවශ්‍ය දේ, වෙබ් අඩවි දහසක් අතර අතරමං නොවී.","why.c1.t":"පැහැදිලි මාර්ගෝපදේශ","why.c1.p":"පදිංචි බලපත්‍රය, SPID, බදු අංකය: පියවරෙන් පියවර, සරල වචනවලින් සහ භාෂා 4කින්.","why.c2.t":"සැබෑ අවස්ථා","why.c2.p":"ඉතාලියට පැමිණෙන්නන් සඳහා තෝරාගත් රැකියා, නිවාස සහ සේවා, නිරතුරුව යාවත්කාලීන කරයි.","why.c3.t":"සමීප ප්‍රජාවක්","why.c3.p":"ඔබට සමාන තත්වයක් අත්විඳි අය සමඟ සම්බන්ධ වන්න. ඔබ කිසිදා තනිවම නැත.","svc1.n":"සිතියමේ ලැයිස්තුව","svc1.d":"ප්‍රජාව වැඩිපුරම භාවිතා කරන සේවා සිතියමේ ඔබේ ව්‍යාපාරය භූගෝලීයව සලකුණු කර ඇත.","svc2.n":"දැන්වීම් බැනර","svc2.d":"ඉහළ දෘශ්‍යතා ස්ථානවල ග්‍රැෆික් අවකාශ, තත්‍ය කාලීනව ලුහුබැඳ ගන්නා දර්ශන සහිතව.","svc3.n":"කණ්ඩායම නිර්මාණය කළ බහුභාෂා දැන්වීම","svc3.d":"භාෂා 4කින් (IT, EN, සිංහල, දෙමළ) වෘත්තීය පිටපත් සහ ග්‍රැෆික් — මුළු ප්‍රජාවටම ඔවුන්ගේ භාෂාවෙන් කතා කරන්න.","svc4.n":"මාසික පුවත් පත්‍රිකාව","svc4.d":"දහස් ගණන් ග්‍රාහකයන්ගේ එන ලිපි පෙට්ටිවලට කෙලින්ම ලැබෙන පුවත් පත්‍රිකාවේ සඳහන් කිරීම.","svc5.n":"සෘජු පාරිභෝගික සම්බන්ධතා","svc5.d":"සැබවින්ම උනන්දුවක් දක්වන අයගේ විස්තර ලබා ගන්න: සැබෑ ඉල්ලුම්, ක්ලික් පමණක් නොවේ.","svc6.n":"කර්තෘ ලිපිය","svc6.d":"අපගේ කර්තෘ මණ්ඩලය විසින් ලියන ලද කැපවූ ලිපියක්: දැන්වීමක් නොව, වෙළඳ නාම කතාව.","svc7.n":"පොඩ්කාස්ට් අනුග්‍රාහක","svc7.d":"ප්‍රජා පොඩ්කාස්ට් එකේ සහ කැපවූ පුවත් පත්‍රිකාවක ඔබේ වෙළඳ නාමය සඳහන් වේ.","svc8.n":"AI උපදේශක නිර්දේශ කරයි","svc8.d":"AI සහායක ඔබේ ව්‍යාපාරය අදාළ පරිශීලකයන්ට, සංවාදයේ නියම මොහොතේ යෝජනා කරයි.","svc9.n":"කණ්ඩායම නිෂ්පාදනය කරන රූප සහ වීඩියෝ","svc9.d":"ඔබ වෙනුවෙන් සාදන ලද වෘත්තීය දැන්වීම් නිර්මාණ: පරිවර්තනය කිරීමට සූදානම් ඡායාරූප, ග්‍රැෆික් සහ වීඩියෝ.","svc10.n":"ගිණුම් කළමනාකරු + තරඟකරු වාර්තාව","svc10.d":"කැපවූ සම්බන්ධතාවක් සහ ප්‍රජාවේ ප්‍රතිඵල සහ තරඟකරුවන් පිළිබඳ වරින් වර විශ්ලේෂණ.","pricing.label":"සැලසුම්","pricing.title":"ඔබේ <em>සැලැස්ම</em> තෝරන්න","pricing.sub":"ඉතාලියේ ශ්‍රී ලාංකික සහ දෙමළ ප්‍රජාව බැනර් පමණක් නොව සැබෑ මෙවලම් සමඟ ළඟා වන්න. දින 3ක් නොමිලේ, පසුව ඕනෑම විටක අවලංගු කරන්න.","pricing.note":"වාර්ෂික ගෙවීමෙන් මාස 2ක් ඉතිරි කරන්න · දින 3 අත්හදා බැලීමේදී කිසිදු ගාස්තුවක් නැත · ඕනෑම විටක අවලංගු කරන්න.","plan.per":"/මාසය","plan.flag":"වැඩිපුරම තෝරාගත්","plan.btnFree":"නොමිලේ අරඹන්න","plan.btnContact":"අප හා සම්බන්ධ වන්න","plan.starter.desc":"සොයා ගැනීමට අවශ්‍ය කුඩා දේශීය ව්‍යාපාර සඳහා","plan.starter.f1":"සේවා සිතියමේ ව්‍යාපාර ලැයිස්තුව","plan.starter.f2":"බැනර 1ක් · මසකට දර්ශන 10,000ක්","plan.starter.f3":"භාෂා 2කින් දැන්වීම (IT + සිංහල හෝ දෙමළ)","plan.starter.f4":"මූලික සංඛ්‍යාලේඛන","plan.starter.f5":"විද්‍යුත් තැපෑල සහාය","plan.pro.desc":"නව පාරිභෝගිකයන් අවශ්‍ය වර්ධනය වන ව්‍යාපාර සඳහා","plan.pro.f1":"<strong>Starter හි සියල්ල</strong>, අමතරව:","plan.pro.f2":"සත්‍යාපිත ලැයිස්තුව සහ සිතියමේ ඉහළින්ම","plan.pro.f3":"ස්ලොට් 3ක් + premium leaderboard · අසීමිත දර්ශන","plan.pro.f4":"අපගේ කණ්ඩායම භාෂා 4කින් නිර්මාණය කළ දැන්වීම","plan.pro.f5":"මාසික පුවත් පත්‍රිකාවේ සඳහන් කිරීම","plan.pro.f6":"උනන්දුවක් දක්වන පාරිභෝගිකයන්ගේ සෘජු සම්බන්ධතා","plan.pro.f7":"උසස් සංඛ්‍යාලේඛන + ප්‍රමුඛතා සහාය","plan.biz.desc":"ප්‍රජාව ආධිපත්‍යය දැරීමට අවශ්‍ය වෙළඳ නාම සහ franchise සඳහා","plan.biz.f1":"<strong>Pro හි සියල්ල</strong>, අමතරව:","plan.biz.f2":"ස්ථිර ඉහළම ස්ථානය, අසීමිත ස්ලොට්","plan.biz.f3":"අප විසින් ලියන ලද කැපවූ කර්තෘ ලිපිය","plan.biz.f4":"පොඩ්කාස්ට් අනුග්‍රහය + කැපවූ පුවත් පත්‍රිකාව","plan.biz.f5":"අදාළ පරිශීලකයන්ට AI උපදේශක විසින් නිර්දේශ කරයි","plan.biz.f6":"කණ්ඩායම නිෂ්පාදනය කරන දැන්වීම් රූප සහ වීඩියෝ","plan.biz.f7":"ගිණුම් කළමනාකරු + තරඟකරු වාර්තා සහ විශ්ලේෂණ","pm.badge":"දින 3 නොමිලේ අත්හදා බැලීම","pm.title":"දැන්වීම් පැකේජ","pm.sub":"ඉතාලියේ ශ්‍රී ලාංකික සහ දෙමළ ප්‍රජාව බැනර් පමණක් නොව සැබෑ මෙවලම් සමඟ ළඟා වන්න. දින 3ක් නොමිලේ අත්හදා බලා, පසුව ඔබට වඩාත් ගැලපෙන පැකේජය තෝරන්න.","rm1.t":"අත්‍යවශ්‍ය නිලධාරිවාද මාර්ගෝපදේශ","rm1.d":"පදිංචි බලපත්‍රය, SPID, බදු අංකය, පදිංචිය","rm2.t":"බහුභාෂා AI සහායක","rm2.d":"ඉතාලි, ඉංග්‍රීසි, සිංහල සහ දෙමළ භාෂාවෙන් පිළිතුරු","rm3.t":"කාලසීමා සහ ලේඛන ට්‍රැකරය","rm3.d":"ස්වයංක්‍රීය මතක් කිරීම් සහිත පුද්ගලික උපකරණ පුවරුව","rm4.t":"උසස් ප්‍රජා සංසදය","rm4.d":"සත්‍යාපිත සාකච්ඡා, ප්‍රජා විශේෂඥයන්, කීර්ති නාම පදක්කම්","rm5.t":"උසස් CV Builder + ආවරණ ලිපි","rm5.d":"PDF අපනයනය සහිත ඉතාලි ආකෘති, සිංහල සහ දෙමළ සහාය","rm6.t":"iOS සහ Android ජංගම යෙදුම","rm6.d":"කාලසීමා සඳහා push දැනුම්දීම්, මාර්ගෝපදේශවලට offline ප්‍රවේශය","rm7.t":"විශේෂඥ සේවාව: තහවුරු කළ උපදේශන","rm7.d":"ප්‍රජාවේ නීති හා බදු උපදේශකයන්, යෙදුම තුළ වෙන්කරවා ගත හැක","roadmap.voted":"ඡන්දය දුන්නා!","pc1.n":"නීති උපදේශන","pc1.d":"බලපත්‍ර, අභියාචනා, ශ්‍රම හා පවුල් නීතිය","pc2.n":"බදු උපදේශන","pc2.d":"730, VAT අංකය, ISEE සහ CAF සේවා","pc3.n":"භාෂණ පරිවර්තනය","pc3.d":"IT ↔ SI · EN කාර්යාල, රෝහල් සහ පාසල් සඳහා","pc4.n":"මැදිහත්වීම","pc4.d":"සංස්කෘතික සහාය හා සමාජ ඒකාබද්ධතාව"
  }
  ,ta:{
    "nav.academy":"அகாடமி","nav.services":"சேவைகள்","nav.courses":"படிப்புகள்","m.forum":"மன்றம்","m.esame":"தேர்வு & பேட்ஜ்","m.academy":"Academy பாடங்கள்","m.certprep":"சான்றிதழ் தயாரிப்பு","m.aiteacher":"AI ஆசிரியர்","m.school":"பள்ளி & படிப்பு","m.market":"சந்தை","m.translate":"மொழிபெயர்ப்புகள்","m.housing":"வீடு","m.pros":"நிபுணர்கள்","nav.guide":"வழிகாட்டிகள்","nav.community":"சமூகம்","nav.ai":"AI உதவியாளர்","nav.news":"செய்திகள்","nav.map":"வரைபடம்","nav.contact":"தொடர்பு","nav.journey":"என் பயணம்","nav.login":"உள்நுழைய","nav.signup":"பதிவு",
    "m.lavdir":"வேலை மற்றும் உரிமைகள்","m.duesponde":"இத்தாலி மற்றும் இலங்கை","m.costruire":"எதிர்காலத்தை கட்டமைத்தல்","m.templates":"படிவங்கள் & கடிதங்கள்","m.openaccount":"வங்கி கணக்கு திறக்க","m.assegno":"Assegno Unico கணக்கு","m.inps":"INPS உரிமைகள்","m.titles":"தகுதி அங்கீகாரம்","m.medical":"மருத்துவ அகராதி","m.languages":"மொழி வகுப்புகள்","m.opportunities":"வாய்ப்புகள்","m.dashboard":"என் டாஷ்போர்டு","m.tracker":"அனுமதி கண்காணிப்பு","m.cvbuilder":"CV உருவாக்கி","m.docs":"ஆவண காப்பகம்","m.flights":"இலங்கை விமானங்கள்","m.cargo":"சரக்கு அனுப்புதல்","f.about":"எங்களைப் பற்றி","f.subscriptions":"சந்தாக்கள்",
    "hero.eyebrow":"இத்தாலியில், உங்கள் மொழியில்","hero.t1":"100% இலவசம்","hero.t2":"அட்டை தேவையில்லை","hero.t3":"அதிகாரப்பூர்வ ஆதாரங்கள்","hero.title":"<span class='ln'><span>இத்தாலியில்</span></span><span class='ln'><span><em>இலங்கை</em></span></span><span class='ln'><span>சமூகம்</span></span>","hero.sub":"அதிகாரபூர்வ வழிகாட்டிகள், பன்மொழி AI உதவியாளர், ஆதரவு சமூகம் மற்றும் புதிய செய்திகள் — இத்தாலியம், ஆங்கிலம், சிங்களம் மற்றும் தமிழில்.","hero.cta1":"இலவசமாக தொடங்குங்கள்","hero.cta2":"வழிகாட்டிகளை ஆராயுங்கள்","hero.stat1":"பயண நிலைகள்","hero.stat2":"நடைமுறை வழிகாட்டிகள்","hero.stat3":"வரைபடத்தில் நகரங்கள்","hero.stat4":"இடைமுக மொழிகள்","hero.stat5":"கருவிகள் & சேவைகள்","hero.stat6":"உறுதியான படிகள்",
    "card1.tag":"அதிகாரத்துவம்","card1.title":"வசிப்பிட அனுமதி","card1.sub":"முழுமையான புதுப்பித்தல் வழிகாட்டி","card2.tag":"AI","card2.title":"AI உதவியாளர்","card2.sub":"பன்மொழி பதில்கள் 24/7","card3.tag":"சமூகம்","card3.title":"சமூகம்","card3.sub":"சக ஆதரவு","card4.tag":"நிதி","card4.title":"பண பரிமாற்றம்","card4.sub":"Wise, Ria, Western Union",
    "ad.label":"விளம்பரம்","ad.lead":"உங்கள் பிராண்டை வளர்த்துக் கொள்ளுங்கள்: இத்தாலியில் உள்ள இலங்கை சமூகத்தை தினமும் சென்றடையுங்கள்.","ad.buy":"இந்த இடத்தை முன்பதிவு செய்யுங்கள்","ad.sponsor":"விளம்பரதாரர்","ad.slot":"விளம்பர இடம் — 300×250","ad.book":"முன்பதிவு →",
    "does.label":"நாங்கள் செய்வது","does.title":"ஒரே தளம்,<br/><em>இத்தாலியில் உங்கள் முழு வாழ்க்கை</em>","does.sub":"ஆவணங்கள் முதல் வேலை வரை, மொழி முதல் சமூகம் வரை: ஆறு பகுதிகள், ஒரே இடம், நான்கு மொழிகள்.","does.c1.t":"ஆவணங்கள் & அதிகாரத்துவம்","does.c1.p":"படிப்படியான வழிகாட்டிகள், ஆவணக் காப்பகம், PDF படிவங்கள் மற்றும் அனுமதி டிராக்கர்.","does.c2.t":"மொழி & பயிற்சி","does.c2.p":"Academy, படிப்புகள், A2–B2 சான்றிதழ் தயாரிப்பு, AI Teacher மற்றும் Language Score.","does.c3.t":"AI ஆலோசகர்","does.c3.p":"24 மணிநேர பன்மொழி உதவியாளர் மற்றும் அதிகாரப்பூர்வ கடிதங்களின் மொழிபெயர்ப்பு.","does.c4.t":"என் பயணம்","does.c4.p":"இத்தாலியில் ஒன்பது வாழ்க்கை நிலைகள் — அடுத்த படி எப்போதும் தெளிவாக.","does.c5.t":"சமூகம் & சேவைகள்","does.c5.p":"மன்றம், சந்தை, சேவை வரைபடம், செய்திகள் மற்றும் பணப் பரிமாற்ற ஒப்பீட்டாளர்.","does.c6.t":"சரிபார்க்கப்பட்ட நிபுணர்கள்","does.c6.p":"வழக்கறிஞர்கள், கணக்காளர்கள், மொழிபெயர்ப்பாளர்கள் — உங்கள் மொழி பேசுபவர்கள்.","tools.label":"கருவிப்பெட்டி","tools.title":"எல்லா கருவிகளும்,<br/><em>உங்கள் கைவசம்</em>","tools.sub":"இத்தாலியின் நிஜ வாழ்க்கைக்காக 30க்கும் மேற்பட்ட இலவச கருவிகள் மற்றும் வழிகாட்டிகள்.","feat.label":"நாங்கள் வழங்குவது","feat.heading":"உங்களுக்குத் தேவையான அனைத்தும்,<br/><em>ஒரே இடத்தில்</em>","feat.sub":"அதிகாரத்துவத்திலிருந்து தினசரி ஒருங்கிணைப்பு வரை — உங்கள் பயணத்தின் ஒவ்வொரு படியிலும் நாங்கள் உங்களுக்கு ஆதரவளிக்கிறோம்.",
    "feat1.title":"அதிகாரபூர்வ வழிகாட்டிகள்","feat1.desc":"வசிப்பிட அனுமதி, வரி அடையாள எண், SPID, வசிப்பிடம் — பதிவிறக்கக்கூடிய சரிபார்ப்புப் பட்டியல்களுடன் படிப்படியான வழிகாட்டிகள்.","feat2.title":"பன்மொழி AI உதவியாளர்","feat2.desc":"இத்தாலியம், ஆங்கிலம், சிங்களம் மற்றும் தமிழில் உடனடி பதில்கள். 24/7 கிடைக்கும்.","feat3.title":"செயலில் உள்ள சமூகம்","feat3.desc":"இத்தாலியில் உள்ள இலங்கையர்கள் ஒருவருக்கொருவர் ஆதரவளிக்கும் இடம். பதில்களைக் கண்டறியுங்கள், அனுபவங்களைப் பகிருங்கள், ஒன்றாக வளருங்கள்.","feat4.title":"பண பரிமாற்றம்","feat4.desc":"Wise, Western Union மற்றும் Ria ஐ நேரடியாக ஒப்பிடுங்கள். இலங்கைக்கு பணம் அனுப்புவதில் சேமிக்கவும்.","feat5.title":"சேவை வரைபடம்","feat5.desc":"இத்தாலியின் பிரதான நகரங்களில் CAF, patronati, இலங்கை கடைகள் மற்றும் வழிபாட்டுத் தலங்கள்.","feat6.title":"புதுப்பிக்கப்பட்ட செய்திகள்","feat6.desc":"இலங்கை சமூகத்திற்கான சட்டங்கள், ஆணைகள் மற்றும் வாய்ப்புகள். தினமும் புதுப்பிக்கப்படுகிறது.",
    "members.count":"<strong>இலங்கை சமூகம்</strong> இத்தாலியில் ஒருவருக்கொருவர் உதவுகிறது","members.sub":"இத்தாலியில் வாழ்ந்து வேலை செய்து, அதே படிகளை எதிர்கொள்பவர்களுடன் இணையுங்கள். ஒன்றாக எளிதாகும்.",
    "cta.intro.tag":"என் பயணம்","cta.intro.desc":"இத்தாலியில் வாழ்க்கை கட்டமைக்க 9 நிலைகளின் வரைபடம் — அதிகாரத்துவத்திலிருந்து தினசரி ஒருங்கிணைப்பு வரை. நீங்கள் எங்கே இருக்கிறீர்கள், அடுத்த படி என்ன என்பதை எப்போதும் அறிவீர்கள், AI ஆலோசகர் உங்கள் அருகில்.","cta.intro.pill1":"9 கட்டமைக்கப்பட்ட நிலைகள்","cta.intro.pill2":"AI ஆலோசகர் உள்ளடங்கியது","cta.intro.pill3":"சேமிக்கப்பட்ட முன்னேற்றம்",
    "cta.title":"உங்கள் பயணத்தை<br/><em style=\"font-style:italic;color:var(--gold)\">தொடங்க தயாரா?</em>","cta.sub":"இலவசமாக பதிவு செய்யுங்கள். கடன் அட்டை தேவையில்லை.","cta.btn1":"உங்கள் இலவச கணக்கை உருவாக்குங்கள்","cta.btn2":"எப்படி வேலை செய்கிறது என்பதைப் பாருங்கள்",
    "footer.tag":"இத்தாலியில் இலங்கை சமூகத்தின் நம்பகமான மையம். வழிகாட்டிகள், AI, சமூகம் மற்றும் சேவைகள் — ஒரே இடத்தில்.","footer.product":"தயாரிப்பு","footer.aiAssistant":"AI உதவியாளர்","footer.mapServices":"சேவை வரைபடம்","footer.company":"திட்டம்","footer.about":"எங்களைப் பற்றி","footer.advertising":"விளம்பரம்","footer.contact":"தொடர்பு","footer.account":"கணக்கு","footer.register":"பதிவு செய்ய","footer.subscriptions":"சந்தாக்கள்","footer.copy":"© 2026 Easy Italia Hub. அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.","footer.privacy":"தனியுரிமைக் கொள்கை","footer.cookie":"குக்கீ கொள்கை","footer.terms":"சேவை விதிமுறைகள்","footer.legal":"சட்டக் குறிப்பு",
    "chat.ainoteShort":"AI பதில்கள்: பொதுவான தகவல், சட்ட ஆலோசனை அல்ல.","chat.ainote":"செயற்கை நுண்ணறிவு பொது ஆதாரங்களின் அடிப்படையில் பொதுவான தகவலை வழங்குகிறது. இது ஒரு வழக்கறிஞர், Patronato அல்லது அங்கீகரிக்கப்பட்ட CAF இன் சட்ட ஆலோசனைக்கு எந்த வகையிலும் மாற்றாகாது. தகவலின் பிழைகள் அல்லது தவறான பயன்பாட்டிற்கு Easy Italia Hub எந்தப் பொறுப்பையும் ஏற்காது.","chat.name":"Easy Italia உதவியாளர்","chat.status":"இப்போது ஆன்லைனில்","chat.welcome1":"வணக்கம்! நான் Easy Italia Hub உதவியாளர். இன்று உங்களுக்கு எப்படி உதவ முடியும்?","chat.welcome2":"நான் இத்தாலியம், ஆங்கிலம், <span lang=\"si\">සිංහල</span> அல்லது <span lang=\"ta\">தமிழ்</span> மொழியில் பதிலளிக்க முடியும்.","chat.now":"இப்போது","chat.sug1":"வசிப்பிட அனுமதி","chat.sug2":"SPID","chat.sug3":"பண பரிமாற்றம்","chat.sug4":"வரி அடையாள எண்","chat.placeholder":"ஒரு செய்தியை தட்டச்சு செய்யுங்கள்…","chat.q1":"வசிப்பிட அனுமதியை எவ்வாறு புதுப்பிப்பது?","chat.q2":"SPID ஐ எவ்வாறு பெறுவது?","chat.q3":"இலங்கைக்கு பண பரிமாற்றம் எவ்வாறு வேலை செய்கிறது?","chat.q4":"வரி அடையாள எண்ணை (codice fiscale) எவ்வாறு பெறுவது?",
    "fx.teaserTitle":"💸 இலங்கைக்கு பணம் அனுப்புவதை ஒப்பிடுங்கள்","fx.teaserNote":"புதுப்பிக்கப்பட்ட குறிப்பிட்ட விகிதம் மற்றும் வழங்குநர் ஒப்பீடு.","fx.teaserCta":"ஒப்பீட்டாளரைத் திறக்கவும் →",
    "faq.label":"அடிக்கடி கேட்கப்படும் கேள்விகள்","faq.heading":"அடிக்கடி கேட்கப்படும் <em>கேள்விகள்</em>",
    "faq.q1":"வசிப்பிட அனுமதிக்கு எவ்வளவு நேரம் ஆகும்?","faq.a1":"இது போலீஸ் தலைமையகம் (questura) மற்றும் அனுமதி வகையைப் பொறுத்தது: காலம் சில வாரங்களிலிருந்து பல மாதங்கள் வரை மாறுபடலாம். உங்கள் விண்ணப்பத்தை சமர்ப்பித்த பிறகு, உங்கள் கடவுச்சீட்டுடன் தற்காலிக ஆவணமாக செயல்படும் ரசீது ஒன்று கிடைக்கும். படிப்படியான நடைமுறைக்கு, எங்கள் <a href=\"guide.html#permesso-soggiorno\">வசிப்பிட அனுமதி வழிகாட்டியைப்</a> பார்க்கவும்.",
    "faq.q2":"சேவை இலவசமா?","faq.a2":"ஆம். வழிகாட்டிகளைப் படிப்பது, AI உதவியாளரைப் பயன்படுத்துவது மற்றும் செய்திகளைப் படிப்பது இலவசம். பதிவு செய்ய கடன் அட்டை தேவையில்லை.",
    "faq.q3":"வலைத்தளத்தை எந்த மொழிகளில் பயன்படுத்தலாம்?","faq.a3":"வலைத்தளத்தின் இடைமுகம் 4 மொழிகளில் கிடைக்கிறது: இத்தாலியம், ஆங்கிலம், சிங்களம் (සිංහල) மற்றும் தமிழ் (தமிழ்). மேல் வலதுபுறத்தில் உள்ள மெனுவிலிருந்து மொழியை மாற்றலாம்.",
    "faq.q4":"AI ஆலோசகர் எவ்வாறு வேலை செய்கிறது?","faq.a4":"இது அதிகாரத்துவம் மற்றும் சேவைகள் பற்றிய உங்கள் கேள்விகளுக்கு பதிலளிக்கும், தினமும் 24 மணி நேரமும் கிடைக்கும் உதவியாளர். கீழ் வலதுபுறத்தில் உள்ள பொத்தானிலிருந்து (அல்லது Ctrl/⌘+J மூலம்) அரட்டையைத் திறந்து உங்கள் கேள்வியைத் தட்டச்சு செய்யுங்கள்: இது தொடர்புடைய படிகள் மற்றும் வழிகாட்டிகளைக் காட்டுகிறது.",
    "faq.q5":"வழிகாட்டிகளைப் பயன்படுத்த நான் பதிவு செய்ய வேண்டுமா?","faq.a5":"இல்லை. நடைமுறை வழிகாட்டிகளை பதிவு இல்லாமல் சுதந்திரமாகப் பார்க்கலாம். இலவச கணக்கு உங்கள் <a href=\"percorso.html\">தனிப்பட்ட பயணத்தின்</a> முன்னேற்றத்தைச் சேமிக்க மட்டுமே தேவை.",
    "faq.q6":"தகவல்கள் அதிகாரபூர்வமானதா?","faq.a6":"எங்கள் வழிகாட்டிகள் தகவல் தரும் தன்மை கொண்டவை மற்றும் முக்கிய படிகளில் உங்களை வழிநடத்துகின்றன, ஆனால் அவை அதிகாரபூர்வ ஆதாரங்களை மாற்றாது. உறுதியான தரவுகளுக்கு எப்போதும் அதிகாரபூர்வ வலைத்தளங்களை (எ.கா. Polizia di Stato, Agenzia delle Entrate, INPS) சரிபார்க்கவும் அல்லது CAF அல்லது patronato ஐ தொடர்பு கொள்ளவும்."
    ,"mission.label":"எங்களைப் பற்றி","mission.title":"நாங்கள் பாலம் கட்டுகிறோம்<br><em>இரு உலகங்களுக்கு இடையே.</em>","mission.sub":"ஒவ்வொரு ஆண்டும் சரியான கருவிகள் இல்லாமல் இத்தாலிய அதிகாரத்துவ அமைப்பில் வழிசெலுத்தும் லட்சக்கணக்கான இலங்கையர்களின் உண்மையான தேவையிலிருந்து Easy Italia Hub பிறந்தது.","mission.desc":"எங்கள் நோக்கம் எளிமையானது: ஒருங்கிணைப்பை வேகமாகவும், குறைந்த அழுத்தத்துடனும், மிகவும் கண்ணியமாகவும் ஆக்குவது. ஏனெனில் ஒவ்வொரு நபரும் தங்கள் சொந்த மொழியில் தங்கள் உரிமைகளைப் புரிந்துகொள்ள தகுதியுடையவர்.","mission.val1.h":"பன்மொழி","mission.val1.p":"இத்தாலியம், ஆங்கிலம், சிங்களம் மற்றும் தமிழ்","mission.val2.h":"அணுகக்கூடிய","mission.val2.p":"இலவசம், அணுகல் தடைகள் இல்லை","mission.val3.h":"சமூகம்","mission.val3.p":"சமூகத்துடன் இணைந்து கட்டப்பட்டது","mission.val4.h":"நம்பகமான","mission.val4.p":"அதிகாரபூர்வ ஆதாரங்கள் எப்போதும் சரிபார்க்கப்படும்","mission.cta":"குழுவைச் சந்திக்கவும் →","mission.visual":"ஒவ்வொரு நபரும்<br>தங்கள்<br><em>உரிமைகளைப் புரிந்துகொள்ள தகுதியானவர்</em>","prob.eyebrow":"நாங்கள் ஏன் இருக்கிறோம்","prob.title":"இத்தாலிய அதிகாரத்துவம் —<br><em>தனியாக ஒரு புதிர்.</em>","prob.sub":"ஒவ்வொரு ஆண்டும் இத்தாலியில் உள்ள ஆயிரக்கணக்கான இலங்கையர்கள் தவறான படிவங்கள், பயனற்ற வரிசைகள் மற்றும் சிதறிய தகவல்களில் மணிநேரங்களை இழக்கிறார்கள். சொந்த மொழியில் வழிகாட்டி இல்லாமல், ஒவ்வொரு படியும் ஒரு தடையாகும்.","prob.li1":"சிதறிய, கண்டுபிடிக்க கடினமான அதிகாரத்துவ தகவல்கள்","prob.li2":"மறைக்கப்பட்ட காலக்கெடுக்கள் மற்றும் கடைசி நிமிடத்தில் மறந்துபோன ஆவணங்கள்","prob.li3":"சொந்த மொழியில் ஆதரவு இல்லை — அனைத்தும் இத்தாலியில் மட்டுமே","prob.li4":"சிதறிய சமூகம், அதே நிலையை அனுபவித்தவர்களைக் கண்டுபிடிப்பது கடினம்","sol.eyebrow":"Easy Italia Hub உடன்","sol.title":"உங்கள் பயணத்தின் ஒவ்வொரு<br>படியும் தெளிவாக உள்ளது.","sol.li1":"ஒவ்வொரு அதிகாரத்துவ நடைமுறைக்கும் நடைமுறை படிப்படியான வழிகாட்டிகள்","sol.li2":"காலக்கெடு மற்றும் ஆவண கண்காணிப்பு — நீங்கள் எதையும் மறக்க மாட்டீர்கள்","sol.li3":"இத்தாலியம், ஆங்கிலம், சிங்களம் மற்றும் தமிழில் AI உதவியாளர் — எப்போதும் கிடைக்கும்","sol.li4":"இத்தாலியில் செயலில் உள்ள இலங்கை சமூகம் — உண்மையான அனுபவங்களைப் பகிருங்கள்","how.label":"எப்படி வேலை செய்கிறது","how.title":"<em>மூன்று எளிய படிகளில்</em> தொடங்குங்கள்","how.sub":"கடன் அட்டை இல்லை. கட்டாய சந்தா இல்லை. நீங்களும் உங்களுக்குத் தேவையான வளங்களும் மட்டுமே.","how.s1.h":"உங்கள் சுயவிவரத்தை உருவாக்குங்கள்","how.s1.p":"30 வினாடிகளில் இலவசமாக பதிவு செய்யுங்கள். உங்கள் நிலையை உள்ளிடுங்கள், கணினி உங்களுக்காக தனிப்பயனாக்கப்பட்ட பாதையை உருவாக்குகிறது.","how.s2.h":"உங்கள் வழிகாட்டியைத் தேர்ந்தெடுக்கவும்","how.s2.p":"வசிப்பிட அனுமதி, SPID, வரி அடையாள எண், வேலை: பதிவிறக்கக்கூடிய சரிபார்ப்புப் பட்டியல்கள் மற்றும் அதிகாரபூர்வ இணைப்புகளுடன் சரியான வழிகாட்டியைக் கண்டறியவும்.","how.s3.h":"AI ஐக் கேளுங்கள்","how.s3.p":"சந்தேகங்கள் உள்ளதா? உதவியாளர் 4 மொழிகளில், தினமும் 24 மணி நேரமும் பதிலளிக்கிறது. அல்லது சமூகத்துடன் பேசுங்கள் — உங்கள் அதே நிலையை அனுபவித்த ஒருவரை எப்போதும் காண்பீர்கள்.","ct.label":"சமூகம்","ct.title":"சேர்வதில் <em>முதலாமவர்களாக</em><br>இருங்கள்","ct.desc":"இத்தாலியில் எங்கள் இலங்கை சமூகம் வடிவம் பெறுகிறது. இப்போதே இணையுங்கள்: அனுபவங்களைப் பகிருங்கள், ஆதரவைக் கண்டறியுங்கள், அதே படிகளை எதிர்கொள்பவர்களுடன் இணையுங்கள்.","ct.li1":"இத்தாலியில் அதிகாரத்துவம் மற்றும் தினசரி வாழ்க்கையில் ஆதரவு","ct.li2":"உங்கள் நகரத்தில் உள்ள இலங்கையர்களுடன் இணையுங்கள்","ct.li3":"புதிய அம்சங்களுக்கு முன்கூட்டிய அணுகல்","ct.cta":"சமூகத்தில் இணையுங்கள் →","ct.counter":"ஏற்கனவே இணைந்தவர்கள்","test.label":"எடுத்துக்காட்டுகள்","test.title":"உங்கள் வாழ்வை <em>எளிதாக்குகிறது</em>","roadmap.label":"வெளிப்படைத்தன்மை","roadmap.title":"நாங்கள் <em>உருவாக்குவது</em>","roadmap.sub":"எங்கள் roadmap பொதுவானது. நீங்கள் முதலில் பார்க்க விரும்பும் அம்சங்களுக்கு வாக்களியுங்கள் — உங்கள் வாக்கு உண்மையில் முக்கியம்.","roadmap.done":"முடிந்தது","roadmap.wip":"செயல்பாட்டில்","roadmap.vote":"வாக்களி","partner.label":"நீங்கள் ஒரு தொழில்முறை நிபுணரா?","partner.title":"உங்கள் நிபுணத்துவத்தை<br><em>சமூகத்திற்கு கொண்டு வாருங்கள்.</em>","partner.desc":"வழக்கறிஞர்கள், வரி ஆலோசகர்கள், மொழிபெயர்ப்பாளர்கள், கலாச்சார இடைத்தரகர்கள், தூதரக ஊழியர்கள்: இத்தாலியில் உள்ள இலங்கை சமூகத்துடன் நீங்கள் பணியாற்றினால், எதிர்கால நிபுணர் வலையமைப்பிற்கு முன்பதிவு செய்யுங்கள். இது எந்தக் கட்டணமும் வணிக ஒப்பந்தமும் இல்லாத எளிய ஆர்வப் பதிவு — திட்டம் தொடங்கும்போது நீங்கள் முதலில் தொடர்பு கொள்ளப்படுவீர்கள்.","partner.tag1":"வழக்கறிஞர்கள்","partner.tag2":"வரி ஆலோசகர்கள்","partner.tag3":"மொழிபெயர்ப்பாளர்கள்","partner.tag4":"கலாச்சார இடைத்தரகர்கள்","map3d.title":"சமூகம் <em>இத்தாலி முழுவதும்</em>","map3d.sub":"வடக்கிலிருந்து தெற்கு வரை இலங்கையர்: சமூகம் வளரும் நகரங்கள்.","partner.tag5":"CAF & Patronati","partner.tag6":"தூதரகங்கள்","partner.cta":"எனது ஆர்வத்தை முன்பதிவு செய்"
    ,"wa.title":"WhatsApp-இலும் இணைந்து","wa.sub":"இலங்கை சமூகத்திற்கான காலக்கெடுக்கள், செய்திகள் மற்றும் வாய்ப்புகள் — நீங்கள் நேரம் செலவிடும் இடத்திலேயே. ஸ்பேம் இல்லை, எப்போது வேண்டுமானாலும் விலகலாம்.","wa.btn":"சேனலில் சேருங்கள்","donate.title":"திட்டத்தை ஆதரிக்கவும்","donate.sub":"Easy Italia Hub அனைவருக்கும் முற்றிலும் இலவசம். இது உங்களுக்கு பயனுள்ளதாக இருந்தால், ஒரு சிறிய நன்கொடை வழிகாட்டிகளை புதுப்பித்து, சேவையகங்களை இயங்கச் செய்து, இத்தாலியில் உள்ள முழு இலங்கை சமூகத்திற்கும் சேவைகளை அணுகக்கூடியதாக வைத்திருக்க உதவுகிறது.","donate.cta":"♥ இப்போது நன்கொடை அளியுங்கள்","donate.note":"Stripe வழியாக பாதுகாப்பானது · எந்த தொகையும் எங்களுக்கு மதிப்புமிக்கது","nl.title":"புதுப்பித்த நிலையில் இருங்கள்.<br>ஸ்பேம் இல்லை, உறுதி.","nl.sub":"ஒவ்வொரு வாரமும்: உங்களுக்குத் தொடர்புடைய அதிகாரத்துவ செய்திகள், தேர்ந்தெடுக்கப்பட்ட வாய்ப்புகள் மற்றும் தள புதுப்பிப்புகள். இத்தாலியம் மற்றும் சிங்களத்தில்.","nl.btn":"இலவசமாக சந்தா சேருங்கள்","nl.note":"எந்த நேரத்திலும் ரத்து செய்யலாம். அட்டை தேவையில்லை.","nav.voli":"பணம் & பயணம்","why.label":"ஏன் Easy Italia Hub","why.title":"அனைத்தும் <em>ஒரே இடத்தில்</em>","why.sub":"அதிகாரத்துவம், வேலை, வீடு மற்றும் சமூகம்: இத்தாலியில் வாழ உங்களுக்குத் தேவையானவை, ஆயிரம் இணையதளங்களுக்கு இடையே தொலைந்து போகாமல்.","why.c1.t":"தெளிவான வழிகாட்டிகள்","why.c1.p":"வதிவிட அனுமதி, SPID, வரி எண்: படிப்படியாக, எளிய சொற்களில் மற்றும் 4 மொழிகளில்.","why.c2.t":"உண்மையான வாய்ப்புகள்","why.c2.p":"இத்தாலிக்கு வருபவர்களுக்காகத் தேர்ந்தெடுக்கப்பட்ட வேலை, வீடு மற்றும் சேவைகள், தொடர்ந்து புதுப்பிக்கப்படுகின்றன.","why.c3.t":"நெருக்கமான சமூகம்","why.c3.p":"உங்கள் அதே சூழ்நிலையை அனுபவித்தவர்களுடன் இணையுங்கள். நீங்கள் ஒருபோதும் தனியாக இல்லை.","svc1.n":"வரைபடத்தில் பட்டியல்","svc1.d":"சமூகம் அதிகம் பயன்படுத்தும் சேவை வரைபடத்தில் உங்கள் வணிகம் புவியியல் ரீதியாகக் குறிக்கப்பட்டுள்ளது.","svc2.n":"விளம்பர பேனர்கள்","svc2.d":"அதிக தெரிவுநிலை இடங்களில் வரைகலை இடங்கள், நிகழ்நேரத்தில் கண்காணிக்கப்படும் காட்சிகளுடன்.","svc3.n":"குழு உருவாக்கிய பன்மொழி விளம்பரம்","svc3.d":"4 மொழிகளில் (IT, EN, சிங்களம், தமிழ்) தொழில்முறை எழுத்து மற்றும் வரைகலை — முழு சமூகத்துடனும் அவர்களின் மொழியில் பேசுங்கள்.","svc4.n":"மாதாந்திர செய்திமடல்","svc4.d":"ஆயிரக்கணக்கான சந்தாதாரர்களின் இன்பாக்ஸுக்கு நேரடியாக வரும் செய்திமடலில் குறிப்பிடப்படுதல்.","svc5.n":"நேரடி வாடிக்கையாளர் தொடர்புகள்","svc5.d":"உண்மையில் ஆர்வமுள்ளவர்களின் விவரங்களைப் பெறுங்கள்: உண்மையான லீட்கள், வெறும் கிளிக்குகள் அல்ல.","svc6.n":"தலையங்கக் கட்டுரை","svc6.d":"எங்கள் ஆசிரியர் குழுவால் எழுதப்பட்ட பிரத்யேகக் கட்டுரை: விளம்பரம் அல்ல, பிராண்ட் கதை.","svc7.n":"பாட்காஸ்ட் ஸ்பான்சர்","svc7.d":"சமூக பாட்காஸ்டிலும் ஒரு பிரத்யேக செய்திமடலிலும் உங்கள் பிராண்ட் குறிப்பிடப்படும்.","svc8.n":"AI ஆலோசகர் பரிந்துரைக்கிறது","svc8.d":"AI உதவியாளர் உங்கள் வணிகத்தை தொடர்புடைய பயனர்களுக்கு, உரையாடலின் சரியான தருணத்தில் பரிந்துரைக்கிறது.","svc9.n":"குழு தயாரிக்கும் படங்கள் மற்றும் வீடியோக்கள்","svc9.d":"உங்களுக்காக உருவாக்கப்பட்ட தொழில்முறை விளம்பர படைப்புகள்: மாற்றத் தயாராக உள்ள புகைப்படங்கள், வரைகலை மற்றும் வீடியோக்கள்.","svc10.n":"கணக்கு மேலாளர் + போட்டியாளர் அறிக்கை","svc10.d":"ஒரு பிரத்யேக தொடர்பு மற்றும் முடிவுகள் மற்றும் சமூகப் போட்டியாளர்கள் பற்றிய காலமுறை பகுப்பாய்வு.","pricing.label":"திட்டங்கள்","pricing.title":"உங்கள் <em>திட்டத்தை</em> தேர்வு செய்யுங்கள்","pricing.sub":"இத்தாலியில் இலங்கை மற்றும் தமிழ் சமூகத்தை வெறும் பேனர்கள் அல்ல, உண்மையான கருவிகளுடன் அடையுங்கள். 3 நாட்கள் இலவசம், பிறகு நீங்கள் விரும்பும்போது ரத்து செய்யுங்கள்.","pricing.note":"வருடாந்திர கட்டணத்துடன் 2 மாதங்கள் சேமியுங்கள் · 3 நாள் சோதனையின் போது கட்டணம் இல்லை · நீங்கள் விரும்பும்போது ரத்து செய்யுங்கள்.","plan.per":"/மாதம்","plan.flag":"அதிகம் தேர்ந்தெடுக்கப்பட்டது","plan.btnFree":"இலவசமாகத் தொடங்கு","plan.btnContact":"எங்களைத் தொடர்புகொள்ளுங்கள்","plan.starter.desc":"கண்டுபிடிக்கப்பட விரும்பும் சிறிய உள்ளூர் வணிகங்களுக்கு","plan.starter.f1":"சேவை வரைபடத்தில் வணிகப் பட்டியல்","plan.starter.f2":"1 பேனர் · மாதம் 10,000 காட்சிகள்","plan.starter.f3":"2 மொழிகளில் விளம்பரம் (IT + சிங்களம் அல்லது தமிழ்)","plan.starter.f4":"அடிப்படை புள்ளிவிவரங்கள்","plan.starter.f5":"மின்னஞ்சல் ஆதரவு","plan.pro.desc":"புதிய வாடிக்கையாளர்களை விரும்பும் வளரும் வணிகங்களுக்கு","plan.pro.f1":"<strong>Starter இல் உள்ள அனைத்தும்</strong>, மேலும்:","plan.pro.f2":"சரிபார்க்கப்பட்ட பட்டியல் மற்றும் வரைபடத்தின் உச்சியில்","plan.pro.f3":"3 ஸ்லாட்டுகள் + premium leaderboard · வரம்பற்ற காட்சிகள்","plan.pro.f4":"எங்கள் குழு 4 மொழிகளில் உருவாக்கிய விளம்பரம்","plan.pro.f5":"மாதாந்திர செய்திமடலில் குறிப்பிடுதல்","plan.pro.f6":"ஆர்வமுள்ள வாடிக்கையாளர்களின் நேரடித் தொடர்புகள்","plan.pro.f7":"மேம்பட்ட புள்ளிவிவரங்கள் + முன்னுரிமை ஆதரவு","plan.biz.desc":"சமூகத்தில் ஆதிக்கம் செலுத்த விரும்பும் பிராண்டுகள் மற்றும் franchise களுக்கு","plan.biz.f1":"<strong>Pro இல் உள்ள அனைத்தும்</strong>, மேலும்:","plan.biz.f2":"நிரந்தர உச்ச நிலை, வரம்பற்ற ஸ்லாட்டுகள்","plan.biz.f3":"நாங்கள் எழுதிய பிரத்யேக தலையங்கக் கட்டுரை","plan.biz.f4":"பாட்காஸ்ட் ஸ்பான்சர்ஷிப் + பிரத்யேக செய்திமடல்","plan.biz.f5":"தொடர்புடைய பயனர்களுக்கு AI ஆலோசகர் பரிந்துரைக்கிறது","plan.biz.f6":"குழு தயாரிக்கும் விளம்பர படங்கள் மற்றும் வீடியோக்கள்","plan.biz.f7":"கணக்கு மேலாளர் + போட்டியாளர் அறிக்கைகள் மற்றும் பகுப்பாய்வு","pm.badge":"3 நாள் இலவச சோதனை","pm.title":"விளம்பர தொகுப்புகள்","pm.sub":"இத்தாலியில் இலங்கை மற்றும் தமிழ் சமூகத்தை வெறும் பேனர்கள் அல்ல, உண்மையான கருவிகளுடன் அடையுங்கள். 3 நாட்கள் இலவசமாக முயற்சித்து, பிறகு உங்களுக்கு மிகவும் பொருத்தமான தொகுப்பைத் தேர்வு செய்யுங்கள்.","rm1.t":"அத்தியாவசிய அதிகாரத்துவ வழிகாட்டிகள்","rm1.d":"வதிவிட அனுமதி, SPID, வரி எண், வசிப்பிடம்","rm2.t":"பன்மொழி AI உதவியாளர்","rm2.d":"இத்தாலியன், ஆங்கிலம், சிங்களம் மற்றும் தமிழில் பதில்கள்","rm3.t":"காலக்கெடு மற்றும் ஆவண கண்காணிப்பு","rm3.d":"தானியங்கி நினைவூட்டல்களுடன் தனிப்பட்ட டாஷ்போர்டு","rm4.t":"மேம்பட்ட சமூக மன்றம்","rm4.d":"சரிபார்க்கப்பட்ட விவாதங்கள், சமூக நிபுணர்கள், நற்பெயர் பேட்ஜ்கள்","rm5.t":"மேம்பட்ட CV Builder + அறிமுகக் கடிதங்கள்","rm5.d":"PDF ஏற்றுமதியுடன் இத்தாலிய டெம்ப்ளேட்டுகள், சிங்களம் மற்றும் தமிழ் ஆதரவு","rm6.t":"iOS & Android மொபைல் ஆப்","rm6.d":"காலக்கெடுக்கான push அறிவிப்புகள், வழிகாட்டிகளுக்கு offline அணுகல்","rm7.t":"நிபுணர் மையம்: சரிபார்க்கப்பட்ட ஆலோசனைகள்","rm7.d":"சமூகத்தின் சட்ட மற்றும் வரி ஆலோசகர்கள், ஆப்பில் முன்பதிவு செய்யலாம்","roadmap.voted":"வாக்களித்தீர்கள்!","pc1.n":"சட்ட ஆலோசனை","pc1.d":"அனுமதிகள், மேல்முறையீடுகள், தொழிலாளர் மற்றும் குடும்பச் சட்டம்","pc2.n":"வரி ஆலோசனை","pc2.d":"730, VAT எண், ISEE மற்றும் CAF சேவைகள்","pc3.n":"மொழிபெயர்ப்பு","pc3.d":"IT ↔ SI · EN அலுவலகங்கள், மருத்துவமனைகள் மற்றும் பள்ளிகளுக்கு","pc4.n":"மத்தியஸ்தம்","pc4.d":"கலாச்சார ஆதரவு மற்றும் சமூக ஒருங்கிணைப்பு"
  }
};
const LANG_META={it:{flag:"🇮🇹",code:"IT"},en:{flag:"🇬🇧",code:"EN"},si:{flag:"🇱🇰",code:"SI"},ta:{flag:"🇱🇰",code:"TA"}};
let currentLang=localStorage.getItem('eih-lang')||(navigator.language||'it').slice(0,2);
if(!I18N[currentLang])currentLang='it';

function applyLang(lang){
  if(!I18N[lang])lang='it';
  currentLang=lang;
  const d=I18N[lang];
  document.documentElement.lang=lang;
  document.querySelectorAll('[data-i18n]').forEach(el=>{const k=el.getAttribute('data-i18n');if(d[k]!=null)el.textContent=d[k];});
  document.querySelectorAll('[data-i18n-html]').forEach(el=>{const k=el.getAttribute('data-i18n-html');if(d[k]!=null)el.innerHTML=d[k];});
  document.querySelectorAll('[data-i18n-ph]').forEach(el=>{const k=el.getAttribute('data-i18n-ph');if(d[k]!=null)el.setAttribute('placeholder',d[k]);});
  document.getElementById('lang-flag').textContent=LANG_META[lang].flag;
  document.getElementById('lang-code').textContent=LANG_META[lang].code;
  document.querySelectorAll('#lang-menu button').forEach(b=>b.setAttribute('aria-current',b.getAttribute('onclick').includes("'"+lang+"'")?'true':'false'));
  try{localStorage.setItem('eih-lang',lang);}catch(e){}
}
/* Nastro sinhala e tamil: serve a chi arriva e non sa che il sito parla la sua
   lingua. Lo vedono tutti, tranne chi lo ha chiuso.
   La chiave porta la versione: il nastro e cambiato (ora c'e anche il tamil),
   quindi chi aveva chiuso quello vecchio lo rivede una volta. */
(function(){
  var bar = document.getElementById('si-bar');
  if(!bar) return;
  var chiuso = null;
  try{ chiuso = localStorage.getItem('eih-si-bar-2'); }catch(e){}
  if(chiuso === 'off') return;
  /* Il nastro e' gia' visibile: lo decide l'inline nel <head>, che mette
     html.si-bar-on prima del primo disegno. Rifarlo qui, a pagina gia'
     comparsa, rimetteva in gioco il layout e faceva sobbalzare la pagina.
     Qui resta solo il cablaggio del pulsante di chiusura. */
  if(!document.documentElement.classList.contains('si-bar-on')){
    bar.hidden = false;
    document.body.classList.add('has-si-bar');
  }

  var close = document.getElementById('si-close');
  if(close) close.addEventListener('click', function(){
    bar.hidden = true;
    document.body.classList.remove('has-si-bar');
    document.documentElement.classList.remove('si-bar-on');
    try{ localStorage.setItem('eih-si-bar-2','off'); }catch(e){}
  });

  // il pulsante del nastro apre lo stesso menu della barra in alto
  var lb = document.getElementById('si-lang');
  if(lb) lb.addEventListener('click', function(e){
    var nav = document.getElementById('lang-btn');
    if(nav){ nav.scrollIntoView({block:'nearest'}); toggleLang(e); nav.focus(); }
  });
})();

function toggleLang(e){if(e)e.stopPropagation();const m=document.getElementById('lang-menu'),b=document.getElementById('lang-btn');const open=!m.classList.contains('open');m.classList.toggle('open',open);b.setAttribute('aria-expanded',open);}
function closeLang(){const m=document.getElementById('lang-menu');if(m){m.classList.remove('open');document.getElementById('lang-btn').setAttribute('aria-expanded','false');}}
function setLang(lang){applyLang(lang);closeLang();}


window.refreshLang=function(){applyLang(currentLang);};
document.addEventListener('click',e=>{if(!e.target.closest('.lang-switch'))closeLang();});
applyLang(currentLang);

/* ── Tier-1: hero masked intro + staggered scroll reveal ── */
(function(){
  const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
  // Hero headline reveals via CSS keyframe (lineUp) automatically on load.
  // Scroll-reveal targets (below the fold)
  const targets=[...document.querySelectorAll('.ad-mini-bar,.wa-section,.donate-card,.cta-card,.footer-brand,.footer-col,.svc-card,.plan,.tools-section .section-label,.tools-section .section-title,.tools-section .section-sub,.tw-group,.does-section .section-label,.does-section .section-title,.does-section .section-sub,.does-card')];
  targets.forEach(el=>el.classList.add('reveal'));
  if(reduce){targets.forEach(el=>el.classList.add('in'));return;}
  const io=new IntersectionObserver(es=>{es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});},{threshold:0.12,rootMargin:'0px 0px -8% 0px'});
  targets.forEach(el=>io.observe(el));
})();

/* ── Strands background (React Bits, port Canvas 2D) ── */
(function(){
  const cv=document.querySelector('.eih-strands');if(!cv)return;
  const ctx=cv.getContext('2d');
  const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
  const cols=['#6e747d','#7c828c','#8a909a','#9aa0aa'];
  const N=11;let W=0,H=0,dpr=1,t=0,raf=0,mx=.5,my=.5,vis=true;
  function size(){dpr=Math.min(devicePixelRatio||1,2);const r=cv.getBoundingClientRect();W=r.width;H=r.height;cv.width=W*dpr;cv.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);}
  function strand(i,time){
    const f=i/(N-1),y0=H*(.12+f*.76),amp=H*(.06+.05*Math.sin(i*1.7)),k=2.1+f*1.4,
      sp=.18+f*.12,ph=i*.9+(mx-.5)*1.2,col=cols[i%cols.length];
    ctx.beginPath();
    for(let x=-10;x<=W+10;x+=8){
      const u=x/W,wob=(my-.5)*22*Math.sin(u*3+time*.3),
        y=y0+Math.sin(u*Math.PI*k+time*sp+ph)*amp*(.5+.5*Math.sin(u*Math.PI))+wob;
      x<=-10?ctx.moveTo(x,y):ctx.lineTo(x,y);
    }
    ctx.strokeStyle=col;ctx.globalAlpha=.16+.12*Math.sin(i*1.3+time*.2);
    ctx.lineWidth=1+.7*Math.sin(i*2.1);ctx.stroke();
  }
  function frame(){t+=1;ctx.clearRect(0,0,W,H);ctx.lineCap='round';for(let i=0;i<N;i++)strand(i,t/16);raf=requestAnimationFrame(frame);}
  size();
  if(reduce){t=40;ctx.clearRect(0,0,W,H);ctx.lineCap='round';for(let i=0;i<N;i++)strand(i,2.5);return;}
  cv.parentElement.addEventListener('pointermove',e=>{const r=cv.getBoundingClientRect();mx=(e.clientX-r.left)/r.width;my=(e.clientY-r.top)/r.height;},{passive:true});
  new ResizeObserver(size).observe(cv);
  const io=new IntersectionObserver(([e])=>{vis=e.isIntersecting;if(vis&&!raf)frame();else if(!vis){cancelAnimationFrame(raf);raf=0;}},{threshold:0});
  io.observe(cv);
})();

/* ── Tier-2: count-up stats + magnetic buttons ── */
(function(){
  const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
  // Count-up statistics
  function animateCount(el){
    const raw=el.dataset.val||el.textContent.trim();
    el.dataset.val=raw;
    const m=raw.match(/^([\d.,]+)(.*)$/);
    if(!m){return;}
    const target=parseFloat(m[1].replace(',','.'));
    const suffix=m[2]||'';
    if(reduce||isNaN(target)){el.textContent=raw;return;}
    const dur=1500,t0=performance.now();
    (function tick(now){
      const p=Math.min((now-t0)/dur,1);
      const eased=1-Math.pow(1-p,3);
      el.textContent=Math.round(target*eased)+suffix;
      if(p<1)requestAnimationFrame(tick);else el.textContent=raw;
    })(t0);
  }
  const stats=[...document.querySelectorAll('.stat-n')];
  if(stats.length){
    const sio=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){animateCount(e.target);sio.unobserve(e.target);}}),{threshold:.6});
    stats.forEach(s=>sio.observe(s));
  }
  // Magnetic buttons (fine pointers only)
  if(!reduce && matchMedia('(pointer:fine)').matches){
    document.querySelectorAll('.btn-primary,.nav-cta,.btn-ghost').forEach(btn=>{
      btn.classList.add('magnetic');
      btn.addEventListener('mousemove',e=>{
        const r=btn.getBoundingClientRect();
        const x=e.clientX-(r.left+r.width/2),y=e.clientY-(r.top+r.height/2);
        btn.style.transform='translate('+(x*0.28)+'px,'+(y*0.28)+'px)';
      });
      btn.addEventListener('mouseleave',()=>{btn.style.transform='';});
    });
  }
})();

/* ── Tier-3: page-transition wipe ── */
(function(){
  let firstVisit=true;
  try{firstVisit=!sessionStorage.getItem('eih-loaded');sessionStorage.setItem('eih-loaded','1');}catch(e){}
  const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
  const wipe=document.getElementById('wipe');
  if(wipe){
    // Enter reveal: timeout fallback in case rAF is delayed by heavy JS
    if(!firstVisit && !reduce){
      wipe.classList.add('cover');
      requestAnimationFrame(()=>requestAnimationFrame(()=>wipe.classList.remove('cover')));
      setTimeout(()=>wipe.classList.remove('cover'), 900);
    }
    // Cover on internal page navigation
    document.addEventListener('click',e=>{
      const a=e.target.closest('a');
      if(!a)return;
      const href=a.getAttribute('href')||'';
      if(a.target==='_blank'||a.hasAttribute('download')||href===''||href.startsWith('#')||href.startsWith('http')||href.startsWith('mailto')||href.startsWith('tel'))return;
      if(/\.html(\?|#|$)/.test(href)){
        e.preventDefault();
        if(reduce){location.href=href;return;}
        wipe.classList.add('cover');
        setTimeout(()=>{location.href=href;}, 470);
      }
    });
    // Bfcache restore (browser back/forward): force-clear wipe
    const _resetWipe=()=>{wipe.style.transition='none';wipe.classList.remove('cover');requestAnimationFrame(()=>{wipe.style.transition='';});};
    addEventListener('pageshow',e=>{if(e.persisted)_resetWipe();});
    document.addEventListener('visibilitychange',()=>{if(!document.hidden&&wipe.classList.contains('cover'))setTimeout(_resetWipe,80);});
  }
})();

/* ── Mobile nav (hamburger) ── */
function toggleMenu(){
  const btn=document.getElementById('nav-toggle');
  const panel=document.getElementById('nav-collapse');
  const willOpen=btn.getAttribute('aria-expanded')!=='true';
  btn.setAttribute('aria-expanded',willOpen);
  btn.setAttribute('aria-label',willOpen?'Chiudi menu':'Apri menu');
  panel.classList.toggle('open',willOpen);
}
function closeMenu(){
  const btn=document.getElementById('nav-toggle');
  if(btn.getAttribute('aria-expanded')==='true')toggleMenu();
}
/* close the mobile menu after tapping a link or auth button, and on resize to desktop */
document.getElementById('nav-collapse').addEventListener('click',e=>{
  if(e.target.closest('a,button'))closeMenu();
});
window.addEventListener('resize',()=>{if(window.innerWidth>=1024)closeMenu();},{passive:true});

/* ── Nav dropdown sotto-menù (toggle touch/click + Esc) ── */
(function(){
  const nav=document.querySelector('.site-nav');if(!nav)return;
  function closeSubs(except){nav.querySelectorAll('.nav-has-sub.sub-open').forEach(x=>{if(x===except)return;x.classList.remove('sub-open');const b=x.querySelector('.nav-sub-btn');if(b)b.setAttribute('aria-expanded','false');});}
  nav.addEventListener('click',e=>{const b=e.target.closest('.nav-sub-btn');if(!b)return;e.preventDefault();const li=b.closest('.nav-has-sub'),o=!li.classList.contains('sub-open');closeSubs(li);li.classList.toggle('sub-open',o);b.setAttribute('aria-expanded',o);});
  document.addEventListener('click',e=>{if(!e.target.closest('.nav-has-sub'))closeSubs();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeSubs();});
})();

/* ── Smart toast (once per user, varied topics, bottom-right) ── */
(function(){
  const TIPS=[
    {icon:'📋',title:'Permesso di soggiorno',body:'Controlla la scadenza del tuo permesso e avvia il rinnovo con anticipo.',href:'permesso-tracker.html'},
    {icon:'🪪',title:'Codice Fiscale',body:'Non hai ancora il codice fiscale? Scopri come ottenerlo in pochi passi.',href:'guide.html#codice-fiscale'},
    {icon:'🏥',title:'Tessera Sanitaria',body:'Con la residenza puoi iscriverti al medico di base gratuitamente.',href:'guide.html#tessera-sanitaria'},
    {icon:'💼',title:'CV Builder',body:'Crea il tuo curriculum in formato europeo pronto da inviare.',href:'cv-builder.html'},
    {icon:'💸',title:'Money Transfer',body:'Confronta i costi di Wise, Western Union e Ria prima di inviare denaro.',href:'money-transfer.html'},
    {icon:'🤖',title:'Consigliere AI',body:'Hai una domanda burocratica? L\'AI risponde in italiano, inglese e sinhala.',href:'percorso.html'},
    {icon:'🗺️',title:'Mappa dei servizi',body:'Trova CAF, patronati e consolati vicino a te.',href:'mappa.html'},
    {icon:'📰',title:'News dalla comunità',body:'Leggi le ultime notizie rilevanti per gli srilankesi in Italia.',href:'news.html'},
    {icon:'🧾',title:'Diritti INPS',body:'Scopri a quali contributi e assegni hai diritto.',href:'diritti-inps.html'},
    {icon:'📄',title:'Moduli e Lettere',body:'Genera lettere di disdetta, delega o ospitalità in un clic.',href:'moduli.html'},
  ];
  const toast=document.getElementById('smart-toast');
  if(!toast)return;
  let seen=false;
  try{seen=!!localStorage.getItem('eih-toast-seen');}catch(e){}
  if(seen)return;
  const tip=TIPS[Math.floor(Math.random()*TIPS.length)];
  document.getElementById('st-icon').textContent=tip.icon;
  document.getElementById('st-title').textContent=tip.title;
  document.getElementById('st-body').textContent=tip.body;
  document.getElementById('st-cta').setAttribute('href',tip.href);
  // Non basta aspettare: sull'hero il riquadro copriva i due pulsanti
  // principali. Compare solo quando l'utente ha superato la prima schermata
  // e il banner cookie e' stato chiuso.
  (function(){
    var soglia=Math.max(600,Math.round(innerHeight*0.9)),fatto=false,iv;
    function prova(){
      if(fatto)return;
      if(document.body.classList.contains('eih-consent-open'))return;
      if((window.scrollY||document.documentElement.scrollTop||0)<soglia)return;
      fatto=true;removeEventListener('scroll',prova);clearInterval(iv);
      toast.classList.add('visible');
    }
    addEventListener('scroll',prova,{passive:true});
    iv=setInterval(prova,1000);
    setTimeout(function(){clearInterval(iv);},180000);
  })();
  document.getElementById('st-x').addEventListener('click',()=>{
    toast.classList.remove('visible');
    setTimeout(()=>toast.style.display='none',400);
    try{localStorage.setItem('eih-toast-seen','1');}catch(e){}
  });
  document.getElementById('st-cta').addEventListener('click',()=>{
    try{localStorage.setItem('eih-toast-seen','1');}catch(e){}
  });
})();

/* ── Back to top + header shrink-on-scroll (shared scroll handler) ── */
const toTopBtn=document.getElementById('to-top');
const siteNav=document.querySelector('.site-nav');
function scrollToTop(){
  const reduce=window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  window.scrollTo({top:0,behavior:reduce?'auto':'smooth'});
}
const bgEl=document.getElementById('bg');
const bgReduce=window.matchMedia('(prefers-reduced-motion:reduce)').matches;
let bgTick=false;
window.addEventListener('scroll',()=>{
  const y=window.scrollY;
  toTopBtn.classList.toggle('show',y>400);
  if(siteNav)siteNav.classList.toggle('scrolled',y>200);
  if(bgEl&&!bgReduce&&!bgTick){bgTick=true;requestAnimationFrame(()=>{
    const max=document.documentElement.scrollHeight-window.innerHeight;
    bgEl.style.setProperty('--sp',max>0?(window.scrollY/max).toFixed(3):'0');
    bgTick=false;
  });}
},{passive:true});

/* ── Shared modal controller (focus-trap + scroll-lock + focus restore) ── */
const FOCUSABLE='a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])';
let activeModal=null;       // currently open modal element
let lastFocused=null;       // element to restore focus to on close

function lockScroll(){
  const sw=window.innerWidth-document.documentElement.clientWidth; // scrollbar width
  document.body.style.overflow='hidden';
  if(sw>0)document.body.style.paddingRight=sw+'px'; // avoid layout shift
}
function unlockScroll(){
  document.body.style.overflow='';
  document.body.style.paddingRight='';
}
function visibleFocusable(modal){
  return [...modal.querySelectorAll(FOCUSABLE)]
    .filter(el=>el.offsetParent!==null||el===document.activeElement);
}
function openModal(id,focusId){
  const m=document.getElementById(id);
  lastFocused=document.activeElement;
  m.classList.add('open');
  activeModal=m;
  lockScroll();
  setTimeout(()=>{
    const target=focusId&&document.getElementById(focusId);
    (target||visibleFocusable(m)[0]||m).focus();
  },300);
}
function closeModal(id){
  const m=document.getElementById(id);
  if(!m.classList.contains('open'))return;
  m.classList.remove('open');
  if(activeModal===m)activeModal=null;
  if(!activeModal)unlockScroll();
  if(lastFocused&&typeof lastFocused.focus==='function')lastFocused.focus();
}

/* ── Auth modal ── */
let authMode='login';
function openAuth(mode){
  authMode=mode;
  applyAuthMode();
  openModal('auth-modal',mode==='signup'?'auth-name':'auth-email');
}
function closeAuth(){closeModal('auth-modal')}
function switchAuth(){
  authMode=authMode==='login'?'signup':'login';
  applyAuthMode();
  (document.getElementById(authMode==='signup'?'auth-name':'auth-email')||{}).focus?.();
}
function applyAuthMode(){
  const signup=authMode==='signup';
  document.getElementById('auth-title').textContent=signup?'Crea il tuo account':'Bentornato';
  document.getElementById('auth-sub').textContent=signup?'Registrati gratis su Easy Italia Hub':'Accedi al tuo account Easy Italia Hub';
  document.getElementById('auth-submit').textContent=signup?'Registrati gratis':'Accedi';
  document.getElementById('name-field').style.display=signup?'flex':'none';
  document.getElementById('auth-pass').setAttribute('autocomplete',signup?'new-password':'current-password');
  var tsBox=document.getElementById('auth-turnstile');
  if(tsBox&&window.EIH_AUTH&&window.EIH_AUTH.captchaEnabled&&window.EIH_AUTH.captchaEnabled()){
    tsBox.style.display=signup?'block':'none';
    if(signup)window.EIH_AUTH.renderCaptcha(tsBox);
  }else if(tsBox){tsBox.style.display='none';}
  document.getElementById('auth-switch-text').textContent=signup?'Hai già un account?':'Non hai un account?';
  document.getElementById('auth-switch').textContent=signup?'Accedi':'Registrati';
  const forgotRow=document.getElementById('auth-forgot-row');
  if(forgotRow)forgotRow.style.display=signup?'none':'';
}
// Benvenuto all'utente e avviso all'admin via Resend: l'SMTP di Supabase è
// limitato. Best-effort, non blocca la UI.
function eihNotifySignup(email,name){
  let lang='it';try{lang=localStorage.getItem('eih-lang')||'it';}catch(e){}
  try{fetch('/api/email',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({type:'signup',email:email,name:name,lang:lang})}).catch(function(){});}catch(e){}
}
async function eihSubmitAuth(){
  const email=(document.getElementById('auth-email')||{}).value||'';
  const pass=(document.getElementById('auth-pass')||{}).value||'';
  const name=(document.getElementById('auth-name')||{}).value||'';
  const btn=document.getElementById('auth-submit');
  const errEl=document.getElementById('auth-error-msg');
  if(errEl)errEl.textContent='';
  if(btn){btn.disabled=true;btn.textContent=authMode==='signup'?'Registrazione…':'Accesso…';}
  let authErr=null,needConfirm=false;
  if(window.EIH_AUTH){
    try{
      await window.EIH_AUTH.ready;
      let res;
      if(authMode==='signup'){
        let captchaToken='';
        if(window.EIH_AUTH.captchaEnabled&&window.EIH_AUTH.captchaEnabled()){
          captchaToken=window.EIH_AUTH.getCaptchaToken();
          if(!captchaToken){if(errEl)errEl.textContent='Completa la verifica anti-bot.';if(btn){btn.disabled=false;btn.textContent='Registrati gratis';}return;}
        }
        res=await window.EIH_AUTH.signUp(email,pass,{name:name},captchaToken);
      }
      else{res=await window.EIH_AUTH.signIn(email,pass);}
      if(res&&res.error){authErr=res.error;}
      else if(res&&!res.demo&&res.user&&!res.session){needConfirm=true;}
    }catch(e){authErr=e;}
    if(authErr&&window.EIH_AUTH.resetCaptcha)window.EIH_AUTH.resetCaptcha();
  }else{
    try{localStorage.setItem('eih-registered','1');}catch(e){}
  }
  if(btn){btn.disabled=false;btn.textContent=authMode==='signup'?'Registrati gratis':'Accedi';}
  if(authErr){
    if(errEl){
      if(authMode==='signup'){
        const msg=(authErr.message||'').toLowerCase();
        errEl.textContent=msg.includes('already')||msg.includes('registered')
          ? 'Indirizzo già in uso. Prova ad accedere.'
          : 'Registrazione non riuscita. Riprova.';
      } else {
        errEl.textContent='Email o password non corretti.';
      }
    }
    return;
  }
  if(authMode==='signup')eihNotifySignup(email,name);
  if(needConfirm){
    const modal=document.querySelector('#auth-modal .modal');
    if(modal)modal.innerHTML='<div style="text-align:center;padding:var(--sp-4) var(--sp-3)"><div style="font-size:2.5rem;margin-bottom:var(--sp-2)">📧</div><h2 style="font-size:var(--text-xl);margin-bottom:var(--sp-2)">Controlla la tua email</h2><p style="color:var(--fg-secondary);font-size:var(--text-sm)">Abbiamo inviato un link a <strong>'+email+'</strong>. Clicca sul link per attivare il tuo account, poi accedi normalmente.</p><button class="btn-primary" style="margin-top:var(--sp-3);width:100%;justify-content:center" onclick="closeAuth()">OK</button></div>';
    return;
  }
  location.href='/dashboard';
}
async function eihGoogleAuth(){
  const btn=document.getElementById('auth-google');
  const errEl=document.getElementById('auth-error-msg');
  if(errEl)errEl.textContent='';
  if(btn){btn.disabled=true;btn.style.opacity='.6';}
  try{
    if(window.EIH_AUTH){
      await window.EIH_AUTH.ready;
      const res=await window.EIH_AUTH.signInWithGoogle(location.origin+'/dashboard');
      if(res&&res.demo){if(errEl)errEl.textContent='Accesso Google non disponibile in modalità demo.';}
      else if(res&&res.error){if(errEl)errEl.textContent='Accesso con Google non riuscito. Riprova.';}
      else return; // redirect in corso
    }
  }catch(e){if(errEl)errEl.textContent='Accesso con Google non riuscito. Riprova.';}
  if(btn){btn.disabled=false;btn.style.opacity='';}
}

/* ── Password reset ── */
async function triggerPasswordReset(){
  const emailEl=document.getElementById('auth-email');
  const errEl=document.getElementById('auth-error-msg');
  const email=(emailEl&&emailEl.value||'').trim();
  if(!email){if(errEl)errEl.textContent='Inserisci prima la tua email.';return;}
  const modal=document.querySelector('#auth-modal .modal');
  if(modal)modal.innerHTML='<div style="text-align:center;padding:var(--sp-4) var(--sp-3)"><div style="font-size:2.5rem;margin-bottom:var(--sp-2)">📧</div><h2 style="font-size:var(--text-xl);margin-bottom:var(--sp-2)">Controlla la tua email</h2><p style="color:var(--fg-secondary);font-size:var(--text-sm)">Se l\'indirizzo è registrato riceverai le istruzioni a breve.</p><button class="btn-primary" style="margin-top:var(--sp-3);width:100%;justify-content:center" onclick="closeAuth()">OK</button></div>';
  if(window.EIH_AUTH)await window.EIH_AUTH.resetPassword(email).catch(()=>{});
}

/* ── Pricing / packages modal ── */
function openPricing(){location.href='/sponsorizza'}
function closePricing(){}
function startTrial(plan){
  closePricing();
  location.href='/registrati';
}

/* ── Keyboard: ESC closes, Tab is trapped inside the active modal ── */
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){
    if(activeModal){closeModal(activeModal.id);return;}
    if(open)toggleChat();
    return;
  }
  if(e.key==='Tab'&&activeModal){
    const items=visibleFocusable(activeModal);
    if(!items.length)return;
    const first=items[0],last=items[items.length-1];
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
  }
});

/* ── AI Consigliere (Claude API + RAG via /api/chat) ── */
let open=false;
const chatHistory=[];   // {role:'user'|'assistant', content}
let chatBusy=false;

/* Unread badge: counts proactive bot messages shown while the panel is closed.
   Honest count — derived from the actual welcome messages in the DOM. */
let chatUnread=0;
function setChatUnread(n){
  chatUnread=Math.max(0,n);
  const badge=document.getElementById('chat-badge');
  if(!badge)return;
  badge.textContent=chatUnread>0?String(chatUnread):'';
  badge.classList.toggle('show',chatUnread>0);
}

function toggleChat(){
  open=!open;
  const p=document.getElementById('chat-panel');
  const b=document.getElementById('chat-btn');
  p.classList.toggle('open',open);
  b.setAttribute('aria-expanded',open);
  if(open){setChatUnread(0);setTimeout(()=>document.getElementById('ch-in').focus(),300);}
}

/* On load: one proactive welcome thread is waiting while the panel is closed → badge "1". */
(function(){
  const hasWelcome=document.querySelector('#ch-msgs .msg.bot .bubble');
  if(hasWelcome && !open)setChatUnread(1);
})();

/* Global shortcut: Ctrl/⌘+J toggles the assistant. */
document.addEventListener('keydown',e=>{
  if((e.metaKey||e.ctrlKey)&&!e.altKey&&e.key.toLowerCase()==='j'){
    e.preventDefault();
    toggleChat();
  }
});

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function nowLabel(){return (I18N[currentLang]&&I18N[currentLang]['chat.now'])||'Ora';}

function appendMsg(text,type){
  const log=document.getElementById('ch-msgs');
  const d=document.createElement('div');
  d.className='msg '+type;
  const safe=escapeHtml(text).replace(/\n/g,'<br>'); // user/AI text rendered safely (no HTML injection)
  d.innerHTML='<div class="bubble"></div><div class="ts"></div>';
  d.querySelector('.bubble').innerHTML=safe;
  d.querySelector('.ts').textContent=nowLabel();
  log.appendChild(d);
  log.scrollTop=log.scrollHeight;
  return d;
}
function showTyping(){
  const log=document.getElementById('ch-msgs');
  const d=document.createElement('div');
  d.className='msg bot';d.id='ch-typing';
  d.innerHTML='<div class="bubble typing" aria-label="Sta scrivendo"><span></span><span></span><span></span></div>';
  log.appendChild(d);log.scrollTop=log.scrollHeight;
}
function hideTyping(){const t=document.getElementById('ch-typing');if(t)t.remove();}

async function sendToAgent(text){
  text=(text||'').trim();
  if(chatBusy||!text)return;
  chatBusy=true;
  appendMsg(text,'usr');
  chatHistory.push({role:'user',content:text});
  showTyping();
  try{
    const r=await fetch('/api/chat',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({messages:chatHistory,lang:currentLang})
    });
    if(!r.ok)throw new Error('http '+r.status);
    const data=await r.json();
    hideTyping();
    const reply=(data&&data.reply)?data.reply:'…';
    appendMsg(reply,'bot');
    chatHistory.push({role:'assistant',content:reply});
  }catch(err){
    hideTyping();
    const fb={
      it:"Al momento non riesco a contattare l'assistente. Riprova tra poco — intanto puoi esplorare le guide del sito.",
      en:"I can't reach the assistant right now. Please try again shortly — meanwhile you can explore the site guides.",
      si:"මට මේ මොහොතේ සහායකයා වෙත සම්බන්ධ විය නොහැක. මඳ වේලාවකින් නැවත උත්සාහ කරන්න — මේ අතර ඔබට වෙබ් අඩවියේ මාර්ගෝපදේශ බැලිය හැක."
    };
    appendMsg(fb[currentLang]||fb.it,'bot');
  }finally{
    chatBusy=false;
  }
}

function sendMsg(){
  const inp=document.getElementById('ch-in');
  const t=inp.value;inp.value='';
  sendToAgent(t);
}
function sendSug(el){
  // Send a full, unambiguous question (not the short label) so the answer
  // always matches the clicked topic regardless of prior chat history.
  const key=el.getAttribute('data-qkey');
  const dict=I18N[currentLang]||I18N.it;
  sendToAgent((key&&dict[key])||el.textContent);
}
