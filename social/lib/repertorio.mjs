/* Il repertorio: i post scritti a mano, in quattro lingue, per i temi che
 * tornano sempre.
 *
 * Perché esiste. Senza chiave del modello l'agente montava titolo + link, e in
 * sinhala usciva un post scritto in italiano con una riga in sinhala in fondo:
 * si vedeva la forma, ma non era pubblicabile nemmeno un giorno. «Pronto da
 * usare» vuol dire che il primo giorno, senza configurare niente, la coda è
 * piena di roba che si può incollare su Facebook così com'è.
 *
 * Perché a mano e non generato. Questi testi stanno nel repository: si leggono
 * in una pull request, si correggono, e domani sono identici a oggi. È la
 * stessa regola già scritta in .references/impostazioni-bloccate.md — il testo
 * che scrive il programma si traduce a mano nelle quattro lingue.
 *
 * Le lingue non sono traduzioni l'una dell'altra parola per parola: i nomi
 * delle pratiche e degli uffici restano in italiano — permesso di soggiorno,
 * codice fiscale, questura, patronato, CAF — perché sono le parole da dire
 * allo sportello. Chi impara «residence permit» e poi si trova davanti al
 * modulo non riconosce niente.
 *
 * Quando la chiave del modello c'è, questo file non sparisce: resta la rete
 * sotto. Il modello scrive, e se non risponde o risponde male si pubblica
 * comunque qualcosa di scritto da una persona.                               */

/* La chiave si ricava dall'indirizzo, che è l'unica cosa stabile: i titoli
   delle sezioni cambiano quando si riscrive una guida, gli id no. */
export function chiave(fonte) {
  const f = String(fonte || '');
  const anc = f.match(/\/guide#([a-z0-9-]+)/);
  if (anc) return 'guide#' + anc[1];
  const perc = f.match(/easyitaliahub\.it(\/[a-z0-9-]*)/);
  return perc ? (perc[1] || '/') : null;
}

/* gancio · la prima riga, sotto i 90 caratteri: nel feed è l'unica che si legge
   corpo  · due frasi, non tre. Chi scorre non legge il terzo periodo.          */
export const REPERTORIO = {
  'guide#permesso-soggiorno': {
    it: {
      gancio: 'Il permesso scade fra tre mesi? Il rinnovo si prepara adesso.',
      corpo: 'Nella guida c\'è cosa serve, dove si consegna e quanto si aspetta. Ogni passaggio rimanda al sito della Questura, non alla nostra opinione.',
    },
    si: {
      gancio: 'permesso di soggiorno එක මාස තුනකින් ඉවරද? අලුත් කිරීම දැන් පටන් ගන්න.',
      corpo: 'මොනවද ඕන, කොහෙද දෙන්නේ, කොපමණ කල් යනවද — ඔක්කොම මාර්ගෝපදේශයේ. හැම පියවරක්ම Questura වෙබ් අඩවියට සම්බන්ධයි.',
    },
    en: {
      gancio: 'Permit expiring in three months? The renewal starts now.',
      corpo: 'The guide has what you need, where to hand it in, how long it takes. Every step links to the Questura, not to our opinion.',
    },
    ta: {
      gancio: 'permesso di soggiorno மூன்று மாதத்தில் முடிகிறதா? புதுப்பித்தல் இப்போதே.',
      corpo: 'என்ன தேவை, எங்கே கொடுக்க வேண்டும், எவ்வளவு நேரம் — வழிகாட்டியில் உள்ளது. ஒவ்வொரு படியும் Questura தளத்துடன் இணைக்கப்பட்டுள்ளது.',
    },
  },

  'guide#spid': {
    it: {
      gancio: 'Lo SPID è gratis. E con la carta d\'identità elettronica non serve nemmeno.',
      corpo: 'La guida spiega tutte e due le strade — SPID e CIE — passo per passo. Le fonti sono quelle ufficiali.',
    },
    si: {
      gancio: 'SPID නොමිලේ. carta d\'identità elettronica තියෙනවා නම් ඒකවත් ඕන නෑ.',
      corpo: 'ක්‍රම දෙකම — SPID සහ CIE — පියවරෙන් පියවර මාර්ගෝපදේශයේ. නිල මූලාශ්‍ර සම්බන්ධ කර තිබේ.',
    },
    en: {
      gancio: 'SPID is free. And with the electronic ID card you do not even need it.',
      corpo: 'The guide covers both routes — SPID and CIE — step by step. The sources are the official ones.',
    },
    ta: {
      gancio: 'SPID இலவசம். மின்னணு அடையாள அட்டை இருந்தால் அதுவும் தேவையில்லை.',
      corpo: 'இரண்டு வழிகளும் — SPID மற்றும் CIE — படிப்படியாக வழிகாட்டியில். ஆதாரங்கள் அதிகாரப்பூர்வமானவை.',
    },
  },

  'guide#residenza': {
    it: {
      gancio: 'Senza residenza non arriva la tessera sanitaria, e non si vota al comune.',
      corpo: 'Come si chiede in anagrafe, cosa portare, cosa succede quando passa il vigile. Guida con le fonti del Comune.',
    },
    si: {
      gancio: 'residenza නැතුව tessera sanitaria එන්නේ නෑ.',
      corpo: 'anagrafe එකේ ඉල්ලන්නේ කොහොමද, මොනවා ගෙනියන්නද, පොලිසිය ගෙදර ආවම මොකද වෙන්නේ. Comune මූලාශ්‍ර සමඟ.',
    },
    en: {
      gancio: 'No residenza, no health card — and no vote in your own town.',
      corpo: 'How to apply at the anagrafe, what to bring, what happens when the officer visits. Sources from the Comune.',
    },
    ta: {
      gancio: 'residenza இல்லாமல் tessera sanitaria வராது.',
      corpo: 'anagrafe-ல் எப்படி விண்ணப்பிப்பது, என்ன கொண்டு செல்வது, அதிகாரி வரும்போது என்ன நடக்கும். Comune ஆதாரங்களுடன்.',
    },
  },

  'guide#tessera-sanitaria': {
    it: {
      gancio: 'Il medico di base è gratis. Serve iscriversi, e in molti non lo sanno.',
      corpo: 'Dove si va, quali documenti servono, come si sceglie il medico. La guida rimanda alla ASL, che è la fonte.',
    },
    si: {
      gancio: 'medico di base නොමිලේ. ලියාපදිංචි වෙන්න ඕන — ගොඩක් අය ඒක දන්නේ නෑ.',
      corpo: 'කොහෙද යන්නේ, මොන ලියකියවිලිද, දොස්තර තෝරන්නේ කොහොමද. මාර්ගෝපදේශය ASL එකට සම්බන්ධයි.',
    },
    en: {
      gancio: 'Your family doctor is free. You have to register — many people never do.',
      corpo: 'Where to go, which documents, how to pick the doctor. The guide links to the ASL, which is the source.',
    },
    ta: {
      gancio: 'குடும்ப மருத்துவர் இலவசம். பதிவு செய்ய வேண்டும் — பலருக்கு தெரிவதில்லை.',
      corpo: 'எங்கே செல்வது, என்ன ஆவணங்கள், மருத்துவரை எப்படித் தேர்ந்தெடுப்பது. வழிகாட்டி ASL உடன் இணைக்கிறது.',
    },
  },

  'guide#naspi': {
    it: {
      gancio: 'Licenziato o finito il contratto? La NASpI si chiede entro un termine.',
      corpo: 'Chi ne ha diritto e come si presenta la domanda, con il patronato o da soli. Requisiti e tempi vengono dall\'INPS.',
    },
    si: {
      gancio: 'රැකියාව නැති වුණාද? NASpI ඉල්ලීමට කාලසීමාවක් තියෙනවා.',
      corpo: 'කාටද අයිතිය, ඉල්ලුම් කරන්නේ කොහොමද — patronato එකෙන් හෝ තනියම. කොන්දේසි INPS එකෙන්.',
    },
    en: {
      gancio: 'Laid off, or contract ended? NASpI has a deadline to apply.',
      corpo: 'Who qualifies and how to file, with a patronato or on your own. Requirements and timing come from INPS.',
    },
    ta: {
      gancio: 'வேலை போய்விட்டதா? NASpI விண்ணப்பிக்க கால அவகாசம் உண்டு.',
      corpo: 'யாருக்கு உரிமை, எப்படி விண்ணப்பிப்பது — patronato மூலம் அல்லது நீங்களே. நிபந்தனைகள் INPS-லிருந்து.',
    },
  },

  'guide#cittadinanza': {
    it: {
      gancio: 'Cittadinanza o lungo soggiorno UE: sono due strade diverse.',
      corpo: 'Quale conviene, cosa chiedono, quanto tempo di residenza serve. Tutto rimandato alle norme, senza promesse.',
    },
    si: {
      gancio: 'cittadinanza සහ lungo soggiorno UE — ඒවා දෙකක්, එකක් නෙවෙයි.',
      corpo: 'මොකක්ද හොඳ, මොනවද ඉල්ලන්නේ, කොපමණ කාලයක් ඉන්න ඕනද. නීතියට සම්බන්ධයි, පොරොන්දු නෑ.',
    },
    en: {
      gancio: 'Citizenship or EU long-term permit: two different roads.',
      corpo: 'Which one fits, what they ask, how many years of residence. All linked to the rules — no promises.',
    },
    ta: {
      gancio: 'cittadinanza அல்லது lungo soggiorno UE — இரண்டு வெவ்வேறு வழிகள்.',
      corpo: 'எது பொருந்தும், என்ன கேட்கிறார்கள், எத்தனை ஆண்டுகள் தேவை. விதிகளுடன் இணைக்கப்பட்டுள்ளது — வாக்குறுதிகள் இல்லை.',
    },
  },

  'guide#codice-fiscale': {
    it: {
      gancio: 'Il codice fiscale serve per tutto: lavoro, medico, banca, contratto.',
      corpo: 'Come si ottiene e dove, gratis, in mezz\'ora. La guida rimanda all\'Agenzia delle Entrate.',
    },
    si: {
      gancio: 'codice fiscale එක හැම දේටම ඕන: රැකියාව, දොස්තර, බැංකුව, කුලිය.',
      corpo: 'ලබාගන්නේ කොහොමද, කොහෙන්ද — නොමිලේ, පැය භාගයකින්. Agenzia delle Entrate එකට සම්බන්ධයි.',
    },
    en: {
      gancio: 'The codice fiscale is needed for everything: job, doctor, bank, lease.',
      corpo: 'How to get it and where, free, in half an hour. The guide links to the Agenzia delle Entrate.',
    },
    ta: {
      gancio: 'codice fiscale எல்லாவற்றுக்கும் தேவை: வேலை, மருத்துவர், வங்கி, வாடகை.',
      corpo: 'எப்படி, எங்கே பெறுவது — இலவசம், அரை மணி நேரத்தில். Agenzia delle Entrate உடன் இணைப்பு.',
    },
  },

  'guide#busta-paga': {
    it: {
      gancio: 'Sulla busta paga c\'è scritto se ti stanno pagando bene.',
      corpo: 'Riga per riga: lordo, netto, contributi, ferie maturate. Se i conti non tornano, si va al patronato.',
    },
    si: {
      gancio: 'busta paga එකේ තියෙනවා ඔයාට හරියට ගෙවනවද කියලා.',
      corpo: 'පේළියෙන් පේළිය: lordo, netto, contributi, නිවාඩු. ගණන් හරි නැත්නම් patronato එකට යන්න.',
    },
    en: {
      gancio: 'Your payslip already tells you whether you are being paid properly.',
      corpo: 'Line by line: gross, net, contributions, holidays accrued. If the numbers are off, go to a patronato.',
    },
    ta: {
      gancio: 'உங்கள் busta paga-வில் சரியாக ஊதியம் தருகிறார்களா என்று உள்ளது.',
      corpo: 'வரிக்கு வரி: lordo, netto, contributi, விடுமுறை. கணக்கு சரியில்லையென்றால் patronato-க்கு செல்லுங்கள்.',
    },
  },

  'guide#partita-iva': {
    it: {
      gancio: 'Vuoi lavorare in proprio? La partita IVA si apre gratis.',
      corpo: 'Cos\'è il regime forfettario, quanto si paga davvero, quando conviene. Fonti dell\'Agenzia delle Entrate.',
    },
    si: {
      gancio: 'තනියම වැඩ කරන්න ඕනද? partita IVA එක නොමිලේ අරින්න පුළුවන්.',
      corpo: 'regime forfettario කියන්නේ මොකක්ද, ඇත්තටම කීයද ගෙවන්නේ, කවදාද වටින්නේ. Agenzia delle Entrate මූලාශ්‍ර.',
    },
    en: {
      gancio: 'Want to work for yourself? Opening a partita IVA is free.',
      corpo: 'What the flat-rate regime is, what you actually pay, when it is worth it. Sources from the Agenzia delle Entrate.',
    },
    ta: {
      gancio: 'சொந்தமாக வேலை செய்ய வேண்டுமா? partita IVA இலவசமாகத் திறக்கலாம்.',
      corpo: 'regime forfettario என்றால் என்ன, உண்மையில் எவ்வளவு கட்டணம், எப்போது பயன். Agenzia delle Entrate ஆதாரங்கள்.',
    },
  },

  'guide#rimesse': {
    it: {
      gancio: 'Mandare soldi a casa: la commissione più bassa non è sempre quella scritta.',
      corpo: 'Come si confronta il costo vero, cambio compreso. Nessuno ci paga per consigliare un servizio.',
    },
    si: {
      gancio: 'ගෙදරට සල්ලි යවනවා: අඩුම commission එක ලියලා තියෙන එක නෙවෙයි.',
      corpo: 'ඇත්ත වියදම — cambio එකත් එක්ක — සසඳන්නේ කොහොමද. කිසිම සේවාවක් නිර්දේශ කරන්න අපිට සල්ලි ලැබෙන්නේ නෑ.',
    },
    en: {
      gancio: 'Sending money home: the lowest fee is not always the one advertised.',
      corpo: 'How to compare the real cost, exchange rate included. Nobody pays us to recommend a service.',
    },
    ta: {
      gancio: 'வீட்டுக்குப் பணம் அனுப்புதல்: குறைந்த கட்டணம் விளம்பரத்தில் உள்ளது அல்ல.',
      corpo: 'உண்மையான செலவை — மாற்று விகிதம் உட்பட — எப்படி ஒப்பிடுவது. எந்தச் சேவையையும் பரிந்துரைக்க எங்களுக்குப் பணம் இல்லை.',
    },
  },

  '/': {
    it: {
      gancio: 'Una domanda sui documenti alle undici di sera? C\'è chi risponde.',
      corpo: 'L\'assistente del sito risponde in sinhala, tamil, inglese e italiano, a qualsiasi ora. Se il caso è complicato ti dice a quale patronato andare.',
    },
    si: {
      gancio: 'රෑ එකොළහට ලියකියවිලි ගැන ප්‍රශ්නයක්ද? උත්තර දෙන කෙනෙක් ඉන්නවා.',
      corpo: 'වෙබ් අඩවියේ සහායක සිංහල, දෙමළ, ඉංග්‍රීසි සහ ඉතාලි භාෂාවලින්, ඕනෑම වෙලාවක උත්තර දෙනවා. සංකීර්ණ නම් කොයි patronato එකටද යන්නේ කියලා කියනවා.',
    },
    en: {
      gancio: 'A question about your documents at eleven at night? Someone answers.',
      corpo: 'The site assistant replies in Sinhala, Tamil, English and Italian, at any hour. If the case is complicated it tells you which patronato to go to.',
    },
    ta: {
      gancio: 'இரவு பதினொரு மணிக்கு ஆவணங்கள் பற்றிய கேள்வியா? பதில் உண்டு.',
      corpo: 'தள உதவியாளர் சிங்களம், தமிழ், ஆங்கிலம், இத்தாலியில் எந்த நேரத்திலும் பதிலளிக்கும். சிக்கலானது எனில் எந்த patronato-க்கு செல்வது என்று சொல்லும்.',
    },
  },

  '/percorso': {
    it: {
      gancio: 'Dall\'arrivo alla cittadinanza, in un elenco solo: cosa viene prima e cosa dopo.',
      corpo: 'Rispondi a tre domande e il percorso si adatta a te. Segni cosa hai fatto e vedi cosa manca.',
    },
    si: {
      gancio: 'ඇවිත් ඉඳන් cittadinanza වෙනකන් — මුලින් මොකද, පස්සේ මොකද.',
      corpo: 'ප්‍රශ්න තුනකට උත්තර දෙන්න, මාර්ගය ඔයාට ගැළපෙනවා. කරපු දේ සලකුණු කරලා ඉතුරු දේ බලාගන්න.',
    },
    en: {
      gancio: 'From arrival to citizenship, in one list: what comes first, what comes after.',
      corpo: 'Answer three questions and the path adapts to you. Tick what is done, see what is left.',
    },
    ta: {
      gancio: 'வருகையிலிருந்து குடியுரிமை வரை ஒரே பட்டியலில்: எது முதலில், எது பிறகு.',
      corpo: 'மூன்று கேள்விகளுக்குப் பதிலளியுங்கள், பாதை உங்களுக்கு ஏற்ப மாறும். முடித்ததைக் குறியிடுங்கள்.',
    },
  },

  '/permesso-tracker': {
    it: {
      gancio: 'Metti la data del permesso e ti avvisiamo prima che scada.',
      corpo: 'Niente da installare. La data resta sul tuo telefono e l\'avviso arriva in tempo per prepararsi.',
    },
    si: {
      gancio: 'permesso එකේ දිනය දාන්න — ඉවර වෙන්න කලින් අපි කියනවා.',
      corpo: 'install කරන්න දෙයක් නෑ. දිනය ඔයාගේ ෆෝන් එකේම තියෙනවා, ලෑස්ති වෙන්න වෙලාව තියෙද්දී දැනුම් දෙනවා.',
    },
    en: {
      gancio: 'Put in your permit date and we warn you before it expires.',
      corpo: 'Nothing to install. The date stays on your phone, and the reminder comes in time to prepare.',
    },
    ta: {
      gancio: 'permesso தேதியைப் பதியுங்கள் — காலாவதிக்கு முன் நினைவூட்டுவோம்.',
      corpo: 'நிறுவ எதுவும் இல்லை. தேதி உங்கள் தொலைபேசியிலேயே இருக்கும், நினைவூட்டல் சரியான நேரத்தில் வரும்.',
    },
  },

  '/lavoro': {
    it: {
      gancio: 'Annunci di lavoro controllati. Chi chiede soldi per un posto non entra.',
      corpo: 'Ogni annuncio passa da un controllo prima di comparire. Se ne vedi uno sospetto, si segnala con un clic.',
    },
    si: {
      gancio: 'පරීක්ෂා කරපු රැකියා දැන්වීම්. රැකියාවකට සල්ලි ඉල්ලන අය මෙහෙ නෑ.',
      corpo: 'හැම දැන්වීමක්ම පළ වෙන්න කලින් පරීක්ෂා වෙනවා. සැක හිතෙන එකක් දැක්කොත් එක ක්ලික් එකකින් දන්වන්න.',
    },
    en: {
      gancio: 'Checked job ads. Anyone asking money for a job does not get in.',
      corpo: 'Every ad is reviewed before it appears. See something suspicious, report it with one click.',
    },
    ta: {
      gancio: 'சரிபார்க்கப்பட்ட வேலை விளம்பரங்கள். வேலைக்குப் பணம் கேட்பவர்கள் இங்கே இல்லை.',
      corpo: 'ஒவ்வொரு விளம்பரமும் வெளியிடும் முன் சரிபார்க்கப்படும். சந்தேகமாக இருந்தால் ஒரு கிளிக்கில் தெரிவியுங்கள்.',
    },
  },

  '/mappa': {
    it: {
      gancio: 'CAF, patronati e templi in 22 città, sulla mappa.',
      corpo: 'Cerchi la tua città e vedi dov\'è l\'ufficio più vicino, con indirizzo e orari. Si apre anche dal telefono.',
    },
    si: {
      gancio: 'නගර 22ක CAF, patronato සහ පන්සල් — සිතියමේ.',
      corpo: 'ඔයාගේ නගරය හොයන්න, ළඟම කාර්යාලය ලිපිනය සහ වේලාවන් එක්ක පේනවා. ෆෝන් එකෙනුත් වැඩ කරනවා.',
    },
    en: {
      gancio: 'CAF offices, patronati and temples in 22 cities, on the map.',
      corpo: 'Search your city and see the nearest office, with address and opening hours. Works on the phone too.',
    },
    ta: {
      gancio: '22 நகரங்களில் CAF, patronato மற்றும் கோயில்கள் — வரைபடத்தில்.',
      corpo: 'உங்கள் நகரத்தைத் தேடுங்கள், அருகிலுள்ள அலுவலகம் முகவரி மற்றும் நேரத்துடன். தொலைபேசியிலும் வேலை செய்யும்.',
    },
  },

  '/moduli': {
    it: {
      gancio: 'Disdetta, ferie, dimissioni: lettere già scritte, da scaricare.',
      corpo: 'Metti il tuo nome e la lettera è pronta in italiano corretto. Nessuna registrazione, nessun costo.',
    },
    si: {
      gancio: 'disdetta, නිවාඩු, ඉල්ලා අස්වීම — ලියලා තියෙන ලියුම්, බාගන්න.',
      corpo: 'නම දාන්න, ලියුම හරි ඉතාලි භාෂාවෙන් ලෑස්තියි. ලියාපදිංචියක් නෑ, ගාස්තුවක් නෑ.',
    },
    en: {
      gancio: 'Notice, holiday, resignation: letters already written, ready to download.',
      corpo: 'Put in your name and the letter is ready in correct Italian. No sign-up, no cost.',
    },
    ta: {
      gancio: 'disdetta, விடுமுறை, ராஜினாமா — எழுதி வைத்த கடிதங்கள், பதிவிறக்கம்.',
      corpo: 'உங்கள் பெயரைப் பதியுங்கள், கடிதம் சரியான இத்தாலியில் தயார். பதிவு இல்லை, கட்டணம் இல்லை.',
    },
  },

  '/cv-builder': {
    it: {
      gancio: 'Il curriculum in formato italiano, quello che i datori si aspettano.',
      corpo: 'Compili i campi e scarichi il PDF. Gratis, senza filigrana e senza abbonamento a fine mese.',
    },
    si: {
      gancio: 'ඉතාලි ආකෘතියේ curriculum — හාම්පුතුන් බලාපොරොත්තු වෙන එක.',
      corpo: 'තොරතුරු පුරවලා PDF එක බාගන්න. නොමිලේ, ජල සලකුණක් නෑ, මාසෙ අන්තිමට බිලක් නෑ.',
    },
    en: {
      gancio: 'A CV in the Italian format — the one employers here expect.',
      corpo: 'Fill in the fields and download the PDF. Free, no watermark, no subscription at the end of the month.',
    },
    ta: {
      gancio: 'இத்தாலிய வடிவத்தில் CV — முதலாளிகள் எதிர்பார்ப்பது இதுதான்.',
      corpo: 'விவரங்களை நிரப்பி PDF பதிவிறக்குங்கள். இலவசம், நீர்அடையாளம் இல்லை, மாத சந்தா இல்லை.',
    },
  },
};

/* Gli hashtag: pochi e sempre gli stessi, perché servono a farsi trovare, non
   a riempire. Quelli in sinhala non sono una traduzione — sono i termini con
   cui la comunità cerca davvero. */
export const HASHTAG = {
  it: ['#EasyItaliaHub', '#SriLankaItalia', '#PermessoDiSoggiorno'],
  en: ['#EasyItaliaHub', '#SriLankansInItaly', '#LifeInItaly'],
  si: ['#EasyItaliaHub', '#ඉතාලිය', '#SriLankansInItaly'],
  ta: ['#EasyItaliaHub', '#இத்தாலி', '#SriLankansInItaly'],
};

export function voce(fonte, lingua) {
  const k = chiave(fonte);
  const e = k && REPERTORIO[k];
  return e ? (e[lingua] || e.it) : null;
}

/** Quante voci coprono le opportunità di oggi: serve al rapporto e alle prove. */
export function copertura(opportunita) {
  const dentro = opportunita.filter((o) => voce(o.fonte, 'it'));
  return { su: opportunita.length, coperte: dentro.length };
}
