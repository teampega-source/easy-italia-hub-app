/* Le parole della mappa, nelle quattro lingue.

   Perché stanno qui e non nel giro normale delle traduzioni: le schede dei
   luoghi non esistono nell'HTML. Le costruisce il JavaScript della pagina
   quando scegli una città e una categoria, e il traduttore a impronte legge
   il documento — quello che nasce dopo non lo vede mai. Risultato: un inglese
   apriva /mappa, cliccava «Milano → Luoghi di culto» e si leggeva «Il tempio
   della comunità cingalese di Milano, aperto dal 1997» in mezzo a una pagina
   per il resto tutta in inglese. Ed è proprio il contenuto per cui quella
   pagina esiste.

   La regola è già scritta in `.references/impostazioni-bloccate.md`: ogni
   testo scritto dal JavaScript dopo il caricamento va messo a mano nelle
   quattro lingue.

   La chiave è la frase italiana, non un codice: è la stessa convenzione dei
   file in `traduzioni/`, e serve a far saltare all'occhio una frase cambiata
   invece di lasciarla tornare in italiano di nascosto. Se cambi una frase in
   `mappa.html` devi cambiarla anche qui, in tutte e tre.

   `{citta}`, `{categoria}` e `{frase}` sono i buchi che il codice riempie.
   Vanno tenuti, e vanno messi dove la lingua li vuole: in sinhala e in tamil
   il nome della città non sta dove sta in italiano.

   I nomi propri non si traducono: Mahamevnawa, Vesak, Pongal, Puthandu,
   Dhamma, Maitri Vihara, ISEE, NASpI, INPS, CAF, OpenStreetMap. */
window.EIH_MAPPA_TESTI = {

  /* ─────────────────────────────── inglese ─────────────────────────────── */
  en: {
    /* nomi che sono etichette, non nomi propri: un'insegna registrata resta
       com'e', «Comunità cattolica tamil» no — quella e' una descrizione. */
    'Comunità cattolica tamil': 'Tamil Catholic community',
    'Zona Via Padova e Loreto': 'Via Padova and Loreto area',
    'Zona Stazione Centrale e Vasto': 'Stazione Centrale and Vasto area',
    'Monastero Buddhista di Roma': 'Rome Buddhist Monastery',
    'Comunità cattolica srilankese di Catania': 'Sri Lankan Catholic community of Catania',
    'Tempio buddhista di Ponte a Moriano': 'Buddhist temple at Ponte a Moriano',
    /* note delle città */
    'La comunità più numerosa d’Italia (oltre 17.000 residenti): negozi, templi e servizi in ogni quartiere.':
      'The largest community in Italy (over 17,000 residents): shops, temples and services in every neighbourhood.',
    'Seconda comunità del Paese (oltre 16.000 residenti) e sede del più grande tempio theravada d’Europa.':
      'The country’s second largest community (over 16,000 residents) and home to the largest Theravada temple in Europe.',
    'Circa 10.000 residenti, fra comunità cingalese e tamil, soprattutto nei quartieri est e sul litorale.':
      'Around 10,000 residents, both Sinhalese and Tamil, mostly in the eastern districts and along the coast.',
    'Circa 7.500 residenti: la capitale srilankese del Veneto, con il Verona Mahavihara.':
      'Around 7,500 residents: the Sri Lankan capital of the Veneto, home to the Verona Mahavihara.',
    'Circa 4.000 residenti e l’associazione Srilankesi Uniti, nata qui nel 2012.':
      'Around 4,000 residents and the Srilankesi Uniti association, founded here in 2012.',
    'Quasi 4.000 residenti in provincia; comunità cattolica srilankese attiva in decine di comuni.':
      'Nearly 4,000 residents across the province; an active Sri Lankan Catholic community in dozens of towns.',
    'Storica presenza tamil e cingalese, con associazioni culturali e linguistiche.':
      'A long-standing Tamil and Sinhalese presence, with cultural and language associations.',
    'Circa 1.300 residenti: piccola comunità molto unita nel sud-est della Sicilia.':
      'Around 1,300 residents: a small, tight-knit community in south-eastern Sicily.',
    'Forte presenza nella Lombardia industriale, con programmi mensili Mahamevnawa.':
      'A strong presence in industrial Lombardy, with monthly Mahamevnawa programmes.',
    'Comunità legata alle fabbriche e ai servizi della bassa bergamasca.':
      'A community built around the factories and services of the lower Bergamo plain.',
    'Cintura milanese: molte famiglie fra Monza, Sesto e la Brianza.':
      'Milan’s outer belt: many families across Monza, Sesto and the Brianza.',
    'Riferimento del nord-ovest, con il Centro Buddista del Piemonte.':
      'The reference point for the north-west, home to the Piedmont Buddhist Centre.',
    'Comunità legata al porto e ai servizi alla persona.':
      'A community built around the port and personal care services.',
    'Seconda area veneta per presenza, dopo Verona.':
      'The second largest presence in the Veneto, after Verona.',
    'Presenza diffusa nei distretti manifatturieri vicentini.':
      'A widespread presence across the manufacturing districts around Vicenza.',
    'Comunità cingalese e tamil con organizzazioni culturali e incontri Mahamevnawa.':
      'A Sinhalese and Tamil community with cultural organisations and Mahamevnawa gatherings.',
    'Area emiliana con il centro Maitri Vihara a Spilamberto.':
      'An Emilian area, home to the Maitri Vihara centre in Spilamberto.',
    'Fra le città con più organizzazioni culturali tamil in Italia.':
      'Among the Italian cities with the most Tamil cultural organisations.',
    'Comunità toscana attiva nei servizi, nella ristorazione e nell’assistenza.':
      'A Tuscan community active in services, catering and care work.',
    'Tempio buddhista a Ponte a Moriano, punto di ritrovo per la Toscana nord.':
      'A Buddhist temple at Ponte a Moriano, a meeting point for northern Tuscany.',
    'Comunità tamil del Salento, con associazioni linguistiche e culturali.':
      'The Tamil community of the Salento, with language and cultural associations.',
    'Estensione della grande comunità campana verso l’entroterra.':
      'An extension of the large Campania community towards the inland.',
    /* note dei luoghi */
    'Il tempio della comunità cingalese di Milano, aperto dal 1997. Cerimonie Vesak ogni maggio.':
      'The temple of Milan’s Sinhalese community, open since 1997. Vesak ceremonies every May.',
    'Monastero theravada srilankese: meditazione, Dhamma School per i bambini.':
      'A Sri Lankan Theravada monastery: meditation and a Dhamma School for children.',
    'Centro culturale e spirituale srilankese nella zona nord-est.':
      'A Sri Lankan cultural and spiritual centre in the north-east of the city.',
    'Festività tamil: Pongal e Puthandu. Riferimento per Brianza e Comasco.':
      'Tamil festivals: Pongal and Puthandu. A reference point for the Brianza and Como areas.',
    'Oltre 10 attività in 100 metri: alimentari, ristoranti, money transfer, parrucchieri.':
      'Over 10 businesses in 100 metres: grocers, restaurants, money transfer shops, hairdressers.',
    'Seconda area di riferimento: minimarket, phone center e ristoranti della comunità.':
      'The second reference area: minimarkets, phone centres and community restaurants.',
    'Mediazione culturale e supporto ai cittadini stranieri, attiva dal 2002.':
      'Cultural mediation and support for foreign nationals, running since 2002.',
    'Il più grande tempio buddhista theravada d’Europa, inaugurato nel 2015 dalla comunità srilankese. Guida: Ven. Panangala Vajiragnana Maha Thero.':
      'The largest Theravada Buddhist temple in Europe, opened in 2015 by the Sri Lankan community. Led by Ven. Panangala Vajiragnana Maha Thero.',
    'Incontri e programmi mensili di meditazione della rete Mahamevnawa.':
      'Monthly meditation meetings and programmes run by the Mahamevnawa network.',
    'Minimarket, money transfer e ristoranti asiatici usati quotidianamente dalla comunità.':
      'Minimarkets, money transfer shops and Asian restaurants used daily by the community.',
    'Comunità Buddhista Theravada in Italia. Responsabile: Ven. Dheerananda Nayaka Thero Molligoda.':
      'Theravada Buddhist Community in Italy. Led by Ven. Dheerananda Nayaka Thero Molligoda.',
    'Festività cattoliche srilankesi, fra cui Nostra Signora di Madhu.':
      'Sri Lankan Catholic festivals, including Our Lady of Madhu.',
    'Monastero theravada dal 1990, aperto alle comunità thai, srilankese e birmana.':
      'A Theravada monastery since 1990, open to the Thai, Sri Lankan and Burmese communities.',
    'Programmi mensili di meditazione e scuola di Dhamma.':
      'Monthly meditation programmes and a Dhamma school.',
    'Associazione religiosa, educativa e culturale dello Sri Lanka: il punto di riferimento del Veneto.':
      'A Sri Lankan religious, educational and cultural association: the reference point for the Veneto.',
    'Riferimento anche per Verona e Messina.':
      'Also a reference point for Verona and Messina.',
    'Associazione per la cultura buddhista in Emilia-Romagna, guidata dal monaco Dambadeniye Dhammarama.':
      'An association for Buddhist culture in Emilia-Romagna, led by the monk Dambadeniye Dhammarama.',
    'Incontri mensili di meditazione e scuola di Dhamma per la comunità bresciana.':
      'Monthly meditation meetings and a Dhamma school for the Brescia community.',
    'Programmi mensili di meditazione della rete srilankese Mahamevnawa.':
      'Monthly meditation programmes run by the Sri Lankan Mahamevnawa network.',
    'Cingalesi e tamil attivi nelle parrocchie della Città metropolitana, con la festa di S. Agata.':
      'Sinhalese and Tamil parishioners active across the metropolitan area, including the feast of St Agatha.',
    'Incontri mensili di meditazione aperti a tutta la comunità emiliana.':
      'Monthly meditation meetings open to the whole Emilian community.',
    'Nata a Messina nel 2012: assistenza, mediazione e rapporti con il consolato mobile dello Sri Lanka.':
      'Founded in Messina in 2012: assistance, mediation and liaison with the Sri Lankan mobile consulate.',
    'Centro di riferimento per la pratica buddhista in città.':
      'The reference centre for Buddhist practice in the city.',
    'Punto di ritrovo della comunità cingalese della Toscana settentrionale.':
      'A meeting point for the Sinhalese community of northern Tuscany.',
    /* reti dei patronati e categorie */
    'Trova la sede ACLI più vicina': 'Find your nearest ACLI office',
    'Trova la sede INCA CGIL': 'Find an INCA CGIL office',
    'Trova la sede INAS CISL': 'Find an INAS CISL office',
    'Trova la sede ITAL UIL': 'Find an ITAL UIL office',
    'Sportelli e sedi ACLI in Italia': 'ACLI help desks and offices in Italy',
    'CAF & patronati': 'CAF & patronati',
    'Negozi srilankesi': 'Sri Lankan shops',
    'Luoghi di culto': 'Places of worship',
    'Professionisti': 'Professionals',
    /* messaggi della ricerca */
    'Il tuo browser non permette la geolocalizzazione.':
      'Your browser does not allow location access.',
    'Cerco la tua posizione…': 'Finding your location…',
    'Cerco i CAF e i patronati vicino a te…': 'Looking for CAF and patronato offices near you…',
    'Nessun ufficio trovato nel raggio di 15 km. Sotto trovi i recapiti delle reti nazionali, che coprono tutta Italia.':
      'No office found within 15 km. Below are the contacts of the national networks, which cover the whole of Italy.',
    'Ricerca non disponibile in questo momento. Usa i recapiti delle reti nazionali qui sotto.':
      'Search is unavailable right now. Use the national network contacts below.',
    'Per cercare vicino a te serve il permesso di accedere alla posizione. Puoi comunque scegliere la tua città dall’elenco.':
      'Searching near you requires permission to access your location. You can still pick your city from the list.',
    'Non riesco a rilevare la posizione. Scegli la tua città dall’elenco.':
      'I can’t detect your location. Please pick your city from the list.',
    'Cerco le attività a {citta}…': 'Looking for businesses in {citta}…',
    'Nessuna attività mappata su OpenStreetMap a {citta}. Se ne conosci una, segnalacela: la aggiungiamo all’elenco.':
      'No businesses mapped on OpenStreetMap in {citta}. If you know one, tell us and we’ll add it to the list.',
    'Dati da OpenStreetMap: telefona prima di andare, gli orari cambiano spesso.':
      'Data from OpenStreetMap: call before you go, opening hours change often.',
    'Ufficio': 'Office',
    'Attività': 'Business',
    /* schede dei servizi */
    'A {citta} (e in tutta Italia) puoi rivolgerti agli sportelli delle reti ufficiali nazionali per ISEE, permesso di soggiorno, pensioni, NASpI e pratiche INPS. Usa i localizzatori ufficiali per la sede più vicina:':
      'In {citta} — and anywhere in Italy — you can turn to the official national networks for ISEE, residence permits, pensions, NASpI and INPS paperwork. Use the official locators to find your nearest office:',
    'Sito web ↗': 'Website ↗',
    '🔎 Cerca altre attività a {citta}': '🔎 Search for more businesses in {citta}',
    'Segnala un altro luogo': 'Suggest another place',
    'Le attività della comunità cambiano in fretta. Cerca in tempo reale su OpenStreetMap i negozi, i ristoranti e i money transfer di {citta}.':
      'Community businesses change fast. Search OpenStreetMap live for the shops, restaurants and money transfer points of {citta}.',
    '🔎 Cerca le attività a {citta}': '🔎 Search for businesses in {citta}',
    'Segnala un’attività': 'Suggest a business',
    'Stiamo raccogliendo alimentari e attività della comunità':
      'We’re still collecting grocers and community businesses',
    'Stiamo raccogliendo templi e centri culturali cingalesi e tamil':
      'We’re still collecting Sinhalese and Tamil temples and cultural centres',
    'Stiamo raccogliendo commercialisti, avvocati e mediatori che parlano la tua lingua':
      'We’re still collecting accountants, lawyers and mediators who speak your language',
    '{frase} a {citta}. Per ora questo elenco è <strong>in raccolta</strong>: pubblichiamo solo i contatti che ci segnala la community, per non dare informazioni non verificate.':
      '{frase} in {citta}. For now this list is <strong>still being built</strong>: we only publish contacts the community reports to us, so we never give out unverified information.',
    'Conosci un posto affidabile a {citta}?': 'Do you know a place you trust in {citta}?',
    'Segnala il tuo': 'Tell us about it',
    'Tutte le categorie a {citta}. ': 'All categories in {citta}. ',
    '{categoria} a {citta}.': '{categoria} in {citta}.',
    '4 categorie': '4 categories',
    'Vedi servizi': 'See services'
  },

  /* ─────────────────────────────── singalese ────────────────────────────── */
  si: {
    'Comunità cattolica tamil': 'දෙමළ කතෝලික ප්‍රජාව',
    'Zona Via Padova e Loreto': 'Via Padova සහ Loreto ප්‍රදේශය',
    'Zona Stazione Centrale e Vasto': 'Stazione Centrale සහ Vasto ප්‍රදේශය',
    'Monastero Buddhista di Roma': 'රෝම බෞද්ධ ආරාමය',
    'Comunità cattolica srilankese di Catania': 'Catania හි ශ්‍රී ලාංකික කතෝලික ප්‍රජාව',
    'Tempio buddhista di Ponte a Moriano': 'Ponte a Moriano බෞද්ධ විහාරය',
    'La comunità più numerosa d’Italia (oltre 17.000 residenti): negozi, templi e servizi in ogni quartiere.':
      'ඉතාලියේ විශාලතම ප්‍රජාව (පදිංචිකරුවන් 17,000කට වැඩි): සෑම ප්‍රදේශයකම වෙළඳසැල්, විහාරස්ථාන සහ සේවා.',
    'Seconda comunità del Paese (oltre 16.000 residenti) e sede del più grande tempio theravada d’Europa.':
      'රටේ දෙවන විශාලතම ප්‍රජාව (පදිංචිකරුවන් 16,000කට වැඩි) සහ යුරෝපයේ විශාලතම ථේරවාද විහාරයේ නිවහන.',
    'Circa 10.000 residenti, fra comunità cingalese e tamil, soprattutto nei quartieri est e sul litorale.':
      'සිංහල හා දෙමළ ප්‍රජාවන් ඇතුළුව පදිංචිකරුවන් 10,000ක් පමණ, ප්‍රධාන වශයෙන් නැගෙනහිර ප්‍රදේශවල සහ වෙරළ තීරයේ.',
    'Circa 7.500 residenti: la capitale srilankese del Veneto, con il Verona Mahavihara.':
      'පදිංචිකරුවන් 7,500ක් පමණ: Verona Mahavihara සමඟ, Veneto ප්‍රදේශයේ ශ්‍රී ලාංකික අගනුවර.',
    'Circa 4.000 residenti e l’associazione Srilankesi Uniti, nata qui nel 2012.':
      'පදිංචිකරුවන් 4,000ක් පමණ සහ 2012දී මෙහි ආරම්භ වූ Srilankesi Uniti සංගමය.',
    'Quasi 4.000 residenti in provincia; comunità cattolica srilankese attiva in decine di comuni.':
      'දිස්ත්‍රික්කය පුරා පදිංචිකරුවන් 4,000කට ආසන්න; නගර දුසිම් ගණනක ක්‍රියාකාරී ශ්‍රී ලාංකික කතෝලික ප්‍රජාවක්.',
    'Storica presenza tamil e cingalese, con associazioni culturali e linguistiche.':
      'සංස්කෘතික හා භාෂා සංගම් සමඟ, දිගු කලක් තිස්සේ පවතින දෙමළ හා සිංහල ප්‍රජාවක්.',
    'Circa 1.300 residenti: piccola comunità molto unita nel sud-est della Sicilia.':
      'පදිංචිකරුවන් 1,300ක් පමණ: සිසිලියේ අග්නිදිග කොටසේ කුඩා, ඉතා සමගි ප්‍රජාවක්.',
    'Forte presenza nella Lombardia industriale, con programmi mensili Mahamevnawa.':
      'මාසික Mahamevnawa වැඩසටහන් සමඟ, කාර්මික Lombardia ප්‍රදේශයේ ශක්තිමත් පැවැත්මක්.',
    'Comunità legata alle fabbriche e ai servizi della bassa bergamasca.':
      'පහත Bergamo තැනිතලාවේ කර්මාන්තශාලා හා සේවා වටා ගොඩනැඟුණු ප්‍රජාවක්.',
    'Cintura milanese: molte famiglie fra Monza, Sesto e la Brianza.':
      'මිලාන් නගරයේ පිටත වළල්ල: Monza, Sesto සහ Brianza පුරා පවුල් රාශියක්.',
    'Riferimento del nord-ovest, con il Centro Buddista del Piemonte.':
      'Piemonte බෞද්ධ මධ්‍යස්ථානය සමඟ, වයඹ දිග ප්‍රදේශයේ මධ්‍යස්ථානය.',
    'Comunità legata al porto e ai servizi alla persona.':
      'වරාය හා පුද්ගල සත්කාර සේවා වටා ගොඩනැඟුණු ප්‍රජාවක්.',
    'Seconda area veneta per presenza, dopo Verona.':
      'Verona ට පසුව, Veneto ප්‍රදේශයේ දෙවන විශාලතම පැවැත්ම.',
    'Presenza diffusa nei distretti manifatturieri vicentini.':
      'Vicenza අවට නිෂ්පාදන කලාප පුරා විසිර පවතින ප්‍රජාවක්.',
    'Comunità cingalese e tamil con organizzazioni culturali e incontri Mahamevnawa.':
      'සංස්කෘතික සංවිධාන හා Mahamevnawa හමුවීම් සහිත සිංහල හා දෙමළ ප්‍රජාවක්.',
    'Area emiliana con il centro Maitri Vihara a Spilamberto.':
      'Spilamberto හි Maitri Vihara මධ්‍යස්ථානය පිහිටි Emilia ප්‍රදේශය.',
    'Fra le città con più organizzazioni culturali tamil in Italia.':
      'ඉතාලියේ වැඩිම දෙමළ සංස්කෘතික සංවිධාන ඇති නගර අතර එකක්.',
    'Comunità toscana attiva nei servizi, nella ristorazione e nell’assistenza.':
      'සේවා, ආපනශාලා හා සත්කාර ක්ෂේත්‍රවල ක්‍රියාකාරී Toscana ප්‍රජාවක්.',
    'Tempio buddhista a Ponte a Moriano, punto di ritrovo per la Toscana nord.':
      'Ponte a Moriano හි බෞද්ධ විහාරයක්, උතුරු Toscana සඳහා හමුවීමේ ස්ථානය.',
    'Comunità tamil del Salento, con associazioni linguistiche e culturali.':
      'භාෂා හා සංස්කෘතික සංගම් සහිත Salento ප්‍රදේශයේ දෙමළ ප්‍රජාව.',
    'Estensione della grande comunità campana verso l’entroterra.':
      'විශාල Campania ප්‍රජාවේ අභ්‍යන්තර ප්‍රදේශ දෙසට වූ විහිදීමක්.',
    'Il tempio della comunità cingalese di Milano, aperto dal 1997. Cerimonie Vesak ogni maggio.':
      'මිලාන් සිංහල ප්‍රජාවේ විහාරය, 1997 සිට විවෘතයි. සෑම මැයි මාසයකම වෙසක් උත්සව.',
    'Monastero theravada srilankese: meditazione, Dhamma School per i bambini.':
      'ශ්‍රී ලාංකික ථේරවාද ආරාමයක්: භාවනාව සහ ළමයින් සඳහා දහම් පාසල.',
    'Centro culturale e spirituale srilankese nella zona nord-est.':
      'නගරයේ ඊසාන දිග කොටසේ ශ්‍රී ලාංකික සංස්කෘතික හා ආගමික මධ්‍යස්ථානයක්.',
    'Festività tamil: Pongal e Puthandu. Riferimento per Brianza e Comasco.':
      'දෙමළ උත්සව: Pongal සහ Puthandu. Brianza සහ Como ප්‍රදේශ සඳහා මධ්‍යස්ථානය.',
    'Oltre 10 attività in 100 metri: alimentari, ristoranti, money transfer, parrucchieri.':
      'මීටර් 100ක් තුළ ව්‍යාපාර 10කට වැඩි ගණනක්: ආහාර වෙළඳසැල්, ආපනශාලා, මුදල් හුවමාරු, කොණ්ඩා සැරසුම්.',
    'Seconda area di riferimento: minimarket, phone center e ristoranti della comunità.':
      'දෙවන ප්‍රධාන ප්‍රදේශය: කුඩා වෙළඳසැල්, දුරකථන මධ්‍යස්ථාන සහ ප්‍රජා ආපනශාලා.',
    'Mediazione culturale e supporto ai cittadini stranieri, attiva dal 2002.':
      'විදේශිකයන් සඳහා සංස්කෘතික මැදිහත්වීම හා සහාය, 2002 සිට ක්‍රියාත්මකයි.',
    'Il più grande tempio buddhista theravada d’Europa, inaugurato nel 2015 dalla comunità srilankese. Guida: Ven. Panangala Vajiragnana Maha Thero.':
      'යුරෝපයේ විශාලතම ථේරවාද බෞද්ධ විහාරය, 2015දී ශ්‍රී ලාංකික ප්‍රජාව විසින් විවෘත කරන ලදී. පූජ්‍ය පනංගල වජිරඤාණ මහා ථේරෝ.',
    'Incontri e programmi mensili di meditazione della rete Mahamevnawa.':
      'Mahamevnawa ජාලය මඟින් මෙහෙයවන මාසික භාවනා හමුවීම් සහ වැඩසටහන්.',
    'Minimarket, money transfer e ristoranti asiatici usati quotidianamente dalla comunità.':
      'ප්‍රජාව දිනපතා භාවිත කරන කුඩා වෙළඳසැල්, මුදල් හුවමාරු සහ ආසියානු ආපනශාලා.',
    'Comunità Buddhista Theravada in Italia. Responsabile: Ven. Dheerananda Nayaka Thero Molligoda.':
      'ඉතාලියේ ථේරවාද බෞද්ධ ප්‍රජාව. පූජ්‍ය මොල්ලිගොඩ ධීරානන්ද නායක ථේරෝ.',
    'Festività cattoliche srilankesi, fra cui Nostra Signora di Madhu.':
      'මධු මාතාවේ උත්සවය ඇතුළු ශ්‍රී ලාංකික කතෝලික උත්සව.',
    'Monastero theravada dal 1990, aperto alle comunità thai, srilankese e birmana.':
      '1990 සිට පවතින ථේරවාද ආරාමයක්, තායි, ශ්‍රී ලාංකික හා බුරුම ප්‍රජාවන්ට විවෘතයි.',
    'Programmi mensili di meditazione e scuola di Dhamma.':
      'මාසික භාවනා වැඩසටහන් සහ දහම් පාසල.',
    'Associazione religiosa, educativa e culturale dello Sri Lanka: il punto di riferimento del Veneto.':
      'ශ්‍රී ලාංකික ආගමික, අධ්‍යාපනික හා සංස්කෘතික සංගමයක්: Veneto ප්‍රදේශයේ මධ්‍යස්ථානය.',
    'Riferimento anche per Verona e Messina.':
      'Verona සහ Messina සඳහාද මධ්‍යස්ථානයකි.',
    'Associazione per la cultura buddhista in Emilia-Romagna, guidata dal monaco Dambadeniye Dhammarama.':
      'Emilia-Romagna ප්‍රදේශයේ බෞද්ධ සංස්කෘතිය සඳහා සංගමයක්, පූජ්‍ය දඹදෙණියේ ධම්මාරාම හිමි විසින් මෙහෙයවනු ලැබේ.',
    'Incontri mensili di meditazione e scuola di Dhamma per la comunità bresciana.':
      'Brescia ප්‍රජාව සඳහා මාසික භාවනා හමුවීම් සහ දහම් පාසල.',
    'Programmi mensili di meditazione della rete srilankese Mahamevnawa.':
      'ශ්‍රී ලාංකික Mahamevnawa ජාලයේ මාසික භාවනා වැඩසටහන්.',
    'Cingalesi e tamil attivi nelle parrocchie della Città metropolitana, con la festa di S. Agata.':
      'S. Agata උත්සවය ඇතුළුව, මහ නගර ප්‍රදේශයේ පල්ලිවල ක්‍රියාකාරී සිංහල හා දෙමළ ජනයා.',
    'Incontri mensili di meditazione aperti a tutta la comunità emiliana.':
      'මුළු Emilia ප්‍රජාවටම විවෘත මාසික භාවනා හමුවීම්.',
    'Nata a Messina nel 2012: assistenza, mediazione e rapporti con il consolato mobile dello Sri Lanka.':
      '2012දී Messina හි ආරම්භ විය: සහාය, මැදිහත්වීම සහ ශ්‍රී ලංකා ජංගම කොන්සල් සේවය සමඟ සම්බන්ධතා.',
    'Centro di riferimento per la pratica buddhista in città.':
      'නගරයේ බෞද්ධ පිළිවෙත සඳහා ප්‍රධාන මධ්‍යස්ථානය.',
    'Punto di ritrovo della comunità cingalese della Toscana settentrionale.':
      'උතුරු Toscana හි සිංහල ප්‍රජාවේ හමුවීමේ ස්ථානය.',
    'Trova la sede ACLI più vicina': 'ඔබට ළඟම ACLI කාර්යාලය සොයන්න',
    'Trova la sede INCA CGIL': 'INCA CGIL කාර්යාලයක් සොයන්න',
    'Trova la sede INAS CISL': 'INAS CISL කාර්යාලයක් සොයන්න',
    'Trova la sede ITAL UIL': 'ITAL UIL කාර්යාලයක් සොයන්න',
    'Sportelli e sedi ACLI in Italia': 'ඉතාලියේ ACLI සේවා මධ්‍යස්ථාන සහ කාර්යාල',
    'CAF & patronati': 'CAF සහ patronato',
    'Negozi srilankesi': 'ශ්‍රී ලාංකික වෙළඳසැල්',
    'Luoghi di culto': 'ආගමික ස්ථාන',
    'Professionisti': 'වෘත්තිකයන්',
    'Il tuo browser non permette la geolocalizzazione.':
      'ඔබේ බ්‍රව්සරය ස්ථානය භාවිතයට ඉඩ නොදේ.',
    'Cerco la tua posizione…': 'ඔබේ ස්ථානය සොයමින්…',
    'Cerco i CAF e i patronati vicino a te…': 'ඔබ අසල CAF සහ patronato කාර්යාල සොයමින්…',
    'Nessun ufficio trovato nel raggio di 15 km. Sotto trovi i recapiti delle reti nazionali, che coprono tutta Italia.':
      'කිලෝමීටර් 15ක් ඇතුළත කාර්යාලයක් හමු නොවීය. පහත ඇත්තේ මුළු ඉතාලියම ආවරණය කරන ජාතික ජාලවල සම්බන්ධතා තොරතුරුයි.',
    'Ricerca non disponibile in questo momento. Usa i recapiti delle reti nazionali qui sotto.':
      'මේ මොහොතේ සෙවීම ලබා ගත නොහැක. පහත ජාතික ජාලවල සම්බන්ධතා භාවිත කරන්න.',
    'Per cercare vicino a te serve il permesso di accedere alla posizione. Puoi comunque scegliere la tua città dall’elenco.':
      'ඔබ අසල සෙවීමට ස්ථානයට ප්‍රවේශ වීමේ අවසරය අවශ්‍යයි. එසේ වුවද ලැයිස්තුවෙන් ඔබේ නගරය තෝරාගත හැක.',
    'Non riesco a rilevare la posizione. Scegli la tua città dall’elenco.':
      'ස්ථානය හඳුනාගත නොහැක. ලැයිස්තුවෙන් ඔබේ නගරය තෝරන්න.',
    'Cerco le attività a {citta}…': '{citta} හි ව්‍යාපාර සොයමින්…',
    'Nessuna attività mappata su OpenStreetMap a {citta}. Se ne conosci una, segnalacela: la aggiungiamo all’elenco.':
      '{citta} හි OpenStreetMap මත සලකුණු කළ ව්‍යාපාරයක් නැත. ඔබ එකක් දන්නේ නම් අපට කියන්න — ලැයිස්තුවට එක් කරමු.',
    'Dati da OpenStreetMap: telefona prima di andare, gli orari cambiano spesso.':
      'දත්ත OpenStreetMap වෙතින්: යාමට පෙර දුරකථනයෙන් අමතන්න, විවෘත වේලාවන් නිතර වෙනස් වේ.',
    'Ufficio': 'කාර්යාලය',
    'Attività': 'ව්‍යාපාරය',
    'A {citta} (e in tutta Italia) puoi rivolgerti agli sportelli delle reti ufficiali nazionali per ISEE, permesso di soggiorno, pensioni, NASpI e pratiche INPS. Usa i localizzatori ufficiali per la sede più vicina:':
      '{citta} හි — සහ ඉතාලිය පුරාම — ISEE, පදිංචි බලපත්‍රය, විශ්‍රාම වැටුප්, NASpI සහ INPS කටයුතු සඳහා නිල ජාතික ජාලවලට යොමු විය හැක. ළඟම කාර්යාලය සොයා ගැනීමට නිල සෙවුම් මෙවලම් භාවිත කරන්න:',
    'Sito web ↗': 'වෙබ් අඩවිය ↗',
    '🔎 Cerca altre attività a {citta}': '🔎 {citta} හි තවත් ව්‍යාපාර සොයන්න',
    'Segnala un altro luogo': 'තවත් ස්ථානයක් යෝජනා කරන්න',
    'Le attività della comunità cambiano in fretta. Cerca in tempo reale su OpenStreetMap i negozi, i ristoranti e i money transfer di {citta}.':
      'ප්‍රජා ව්‍යාපාර ඉක්මනින් වෙනස් වේ. {citta} හි වෙළඳසැල්, ආපනශාලා සහ මුදල් හුවමාරු ස්ථාන OpenStreetMap මත සජීවීව සොයන්න.',
    '🔎 Cerca le attività a {citta}': '🔎 {citta} හි ව්‍යාපාර සොයන්න',
    'Segnala un’attività': 'ව්‍යාපාරයක් යෝජනා කරන්න',
    'Stiamo raccogliendo alimentari e attività della comunità':
      'ආහාර වෙළඳසැල් සහ ප්‍රජා ව්‍යාපාර තවමත් රැස් කරමින් සිටිමු',
    'Stiamo raccogliendo templi e centri culturali cingalesi e tamil':
      'සිංහල හා දෙමළ විහාරස්ථාන සහ සංස්කෘතික මධ්‍යස්ථාන තවමත් රැස් කරමින් සිටිමු',
    'Stiamo raccogliendo commercialisti, avvocati e mediatori che parlano la tua lingua':
      'ඔබේ භාෂාව කතා කරන ගණකාධිකාරීවරු, නීතිඥයන් සහ මැදිහත්කරුවන් තවමත් රැස් කරමින් සිටිමු',
    '{frase} a {citta}. Per ora questo elenco è <strong>in raccolta</strong>: pubblichiamo solo i contatti che ci segnala la community, per non dare informazioni non verificate.':
      '{citta} සඳහා {frase}. දැනට මෙම ලැයිස්තුව <strong>සකස් වෙමින් පවතී</strong>: තහවුරු නොකළ තොරතුරු ලබා නොදීම සඳහා, ප්‍රජාව අපට දන්වන සම්බන්ධතා පමණක් අප ප්‍රකාශ කරමු.',
    'Conosci un posto affidabile a {citta}?': '{citta} හි ඔබ විශ්වාස කරන ස්ථානයක් දන්නවාද?',
    'Segnala il tuo': 'අපට කියන්න',
    'Tutte le categorie a {citta}. ': '{citta} හි සියලු ප්‍රවර්ග. ',
    '{categoria} a {citta}.': '{citta} හි {categoria}.',
    '4 categorie': 'ප්‍රවර්ග 4',
    'Vedi servizi': 'සේවා බලන්න'
  },

  /* ──────────────────────────────── tamil ───────────────────────────────── */
  ta: {
    'Comunità cattolica tamil': 'தமிழ் கத்தோலிக்கச் சமூகம்',
    'Zona Via Padova e Loreto': 'Via Padova மற்றும் Loreto பகுதி',
    'Zona Stazione Centrale e Vasto': 'Stazione Centrale மற்றும் Vasto பகுதி',
    'Monastero Buddhista di Roma': 'ரோம் பௌத்த மடாலயம்',
    'Comunità cattolica srilankese di Catania': 'Catania வின் இலங்கைக் கத்தோலிக்கச் சமூகம்',
    'Tempio buddhista di Ponte a Moriano': 'Ponte a Moriano பௌத்த விகாரை',
    'La comunità più numerosa d’Italia (oltre 17.000 residenti): negozi, templi e servizi in ogni quartiere.':
      'இத்தாலியின் மிகப்பெரிய சமூகம் (17,000க்கும் மேற்பட்ட வசிப்பாளர்கள்): ஒவ்வொரு பகுதியிலும் கடைகள், கோயில்கள், சேவைகள்.',
    'Seconda comunità del Paese (oltre 16.000 residenti) e sede del più grande tempio theravada d’Europa.':
      'நாட்டின் இரண்டாவது பெரிய சமூகம் (16,000க்கும் மேற்பட்ட வசிப்பாளர்கள்) மற்றும் ஐரோப்பாவின் மிகப்பெரிய தேரவாத விகாரையின் இடம்.',
    'Circa 10.000 residenti, fra comunità cingalese e tamil, soprattutto nei quartieri est e sul litorale.':
      'சிங்கள மற்றும் தமிழ் சமூகங்கள் சேர்ந்து சுமார் 10,000 வசிப்பாளர்கள், முக்கியமாக கிழக்குப் பகுதிகளிலும் கடற்கரையோரத்திலும்.',
    'Circa 7.500 residenti: la capitale srilankese del Veneto, con il Verona Mahavihara.':
      'சுமார் 7,500 வசிப்பாளர்கள்: Verona Mahavihara உள்ள, Veneto பகுதியின் இலங்கைத் தலைநகர்.',
    'Circa 4.000 residenti e l’associazione Srilankesi Uniti, nata qui nel 2012.':
      'சுமார் 4,000 வசிப்பாளர்கள் மற்றும் 2012ல் இங்கே தொடங்கப்பட்ட Srilankesi Uniti அமைப்பு.',
    'Quasi 4.000 residenti in provincia; comunità cattolica srilankese attiva in decine di comuni.':
      'மாவட்டம் முழுவதும் கிட்டத்தட்ட 4,000 வசிப்பாளர்கள்; பல்வேறு நகரங்களில் இயங்கும் இலங்கைக் கத்தோலிக்கச் சமூகம்.',
    'Storica presenza tamil e cingalese, con associazioni culturali e linguistiche.':
      'பண்பாட்டு மற்றும் மொழி அமைப்புகளுடன், நீண்டகாலமாகத் தொடரும் தமிழ் மற்றும் சிங்களச் சமூகம்.',
    'Circa 1.300 residenti: piccola comunità molto unita nel sud-est della Sicilia.':
      'சுமார் 1,300 வசிப்பாளர்கள்: சிசிலியின் தென்கிழக்கில் சிறிய, மிக நெருக்கமான சமூகம்.',
    'Forte presenza nella Lombardia industriale, con programmi mensili Mahamevnawa.':
      'மாதாந்திர Mahamevnawa நிகழ்ச்சிகளுடன், தொழிற்துறை Lombardia பகுதியில் வலுவான இருப்பு.',
    'Comunità legata alle fabbriche e ai servizi della bassa bergamasca.':
      'கீழ் Bergamo சமவெளியின் தொழிற்சாலைகள் மற்றும் சேவைகளைச் சுற்றி உருவான சமூகம்.',
    'Cintura milanese: molte famiglie fra Monza, Sesto e la Brianza.':
      'மிலான் புறநகர் வளையம்: Monza, Sesto மற்றும் Brianza முழுவதும் பல குடும்பங்கள்.',
    'Riferimento del nord-ovest, con il Centro Buddista del Piemonte.':
      'Piemonte பௌத்த மையத்துடன், வடமேற்குப் பகுதியின் மையம்.',
    'Comunità legata al porto e ai servizi alla persona.':
      'துறைமுகம் மற்றும் தனிநபர் பராமரிப்புச் சேவைகளைச் சுற்றி உருவான சமூகம்.',
    'Seconda area veneta per presenza, dopo Verona.':
      'Verona வுக்கு அடுத்தபடியாக, Veneto பகுதியின் இரண்டாவது பெரிய இருப்பு.',
    'Presenza diffusa nei distretti manifatturieri vicentini.':
      'Vicenza சுற்றியுள்ள உற்பத்தி மாவட்டங்கள் முழுவதும் பரவியுள்ள இருப்பு.',
    'Comunità cingalese e tamil con organizzazioni culturali e incontri Mahamevnawa.':
      'பண்பாட்டு அமைப்புகள் மற்றும் Mahamevnawa சந்திப்புகளுடன் கூடிய சிங்கள மற்றும் தமிழ்ச் சமூகம்.',
    'Area emiliana con il centro Maitri Vihara a Spilamberto.':
      'Spilamberto வில் Maitri Vihara மையம் அமைந்துள்ள Emilia பகுதி.',
    'Fra le città con più organizzazioni culturali tamil in Italia.':
      'இத்தாலியில் அதிக தமிழ்ப் பண்பாட்டு அமைப்புகளைக் கொண்ட நகரங்களில் ஒன்று.',
    'Comunità toscana attiva nei servizi, nella ristorazione e nell’assistenza.':
      'சேவைத் துறை, உணவகங்கள் மற்றும் பராமரிப்புப் பணிகளில் இயங்கும் Toscana சமூகம்.',
    'Tempio buddhista a Ponte a Moriano, punto di ritrovo per la Toscana nord.':
      'Ponte a Moriano வில் ஒரு பௌத்த விகாரை, வட Toscana வுக்கான சந்திப்பு இடம்.',
    'Comunità tamil del Salento, con associazioni linguistiche e culturali.':
      'மொழி மற்றும் பண்பாட்டு அமைப்புகளுடன் கூடிய Salento பகுதியின் தமிழ்ச் சமூகம்.',
    'Estensione della grande comunità campana verso l’entroterra.':
      'பெரிய Campania சமூகத்தின் உள்நாட்டுப் பகுதிகளை நோக்கிய விரிவாக்கம்.',
    'Il tempio della comunità cingalese di Milano, aperto dal 1997. Cerimonie Vesak ogni maggio.':
      'மிலான் சிங்களச் சமூகத்தின் விகாரை, 1997 முதல் திறந்திருக்கிறது. ஒவ்வொரு மே மாதமும் Vesak விழாக்கள்.',
    'Monastero theravada srilankese: meditazione, Dhamma School per i bambini.':
      'இலங்கைத் தேரவாத மடாலயம்: தியானம் மற்றும் சிறார்களுக்கான Dhamma பள்ளி.',
    'Centro culturale e spirituale srilankese nella zona nord-est.':
      'நகரின் வடகிழக்குப் பகுதியில் இலங்கைப் பண்பாட்டு மற்றும் ஆன்மிக மையம்.',
    'Festività tamil: Pongal e Puthandu. Riferimento per Brianza e Comasco.':
      'தமிழ்ப் பண்டிகைகள்: பொங்கல் மற்றும் புத்தாண்டு. Brianza மற்றும் Como பகுதிகளுக்கான மையம்.',
    'Oltre 10 attività in 100 metri: alimentari, ristoranti, money transfer, parrucchieri.':
      '100 மீட்டருக்குள் 10க்கும் மேற்பட்ட வணிகங்கள்: மளிகைக் கடைகள், உணவகங்கள், பணப் பரிமாற்றம், முடிதிருத்தகங்கள்.',
    'Seconda area di riferimento: minimarket, phone center e ristoranti della comunità.':
      'இரண்டாவது முக்கியப் பகுதி: சிறு கடைகள், தொலைபேசி மையங்கள் மற்றும் சமூக உணவகங்கள்.',
    'Mediazione culturale e supporto ai cittadini stranieri, attiva dal 2002.':
      'வெளிநாட்டவர்களுக்கான பண்பாட்டு இடைநிலை மற்றும் ஆதரவு, 2002 முதல் இயங்குகிறது.',
    'Il più grande tempio buddhista theravada d’Europa, inaugurato nel 2015 dalla comunità srilankese. Guida: Ven. Panangala Vajiragnana Maha Thero.':
      'ஐரோப்பாவின் மிகப்பெரிய தேரவாத பௌத்த விகாரை, 2015ல் இலங்கைச் சமூகத்தால் திறக்கப்பட்டது. வழிநடத்துபவர்: Ven. Panangala Vajiragnana Maha Thero.',
    'Incontri e programmi mensili di meditazione della rete Mahamevnawa.':
      'Mahamevnawa வலையமைப்பு நடத்தும் மாதாந்திர தியானச் சந்திப்புகள் மற்றும் நிகழ்ச்சிகள்.',
    'Minimarket, money transfer e ristoranti asiatici usati quotidianamente dalla comunità.':
      'சமூகத்தினர் தினமும் பயன்படுத்தும் சிறு கடைகள், பணப் பரிமாற்ற நிலையங்கள் மற்றும் ஆசிய உணவகங்கள்.',
    'Comunità Buddhista Theravada in Italia. Responsabile: Ven. Dheerananda Nayaka Thero Molligoda.':
      'இத்தாலியில் தேரவாத பௌத்தச் சமூகம். வழிநடத்துபவர்: Ven. Dheerananda Nayaka Thero Molligoda.',
    'Festività cattoliche srilankesi, fra cui Nostra Signora di Madhu.':
      'மது அன்னை விழா உள்ளிட்ட இலங்கைக் கத்தோலிக்கப் பண்டிகைகள்.',
    'Monastero theravada dal 1990, aperto alle comunità thai, srilankese e birmana.':
      '1990 முதல் இயங்கும் தேரவாத மடாலயம், தாய், இலங்கை மற்றும் பர்மியச் சமூகங்களுக்குத் திறந்திருக்கிறது.',
    'Programmi mensili di meditazione e scuola di Dhamma.':
      'மாதாந்திர தியான நிகழ்ச்சிகள் மற்றும் Dhamma பள்ளி.',
    'Associazione religiosa, educativa e culturale dello Sri Lanka: il punto di riferimento del Veneto.':
      'இலங்கையின் சமய, கல்வி மற்றும் பண்பாட்டு அமைப்பு: Veneto பகுதியின் மையம்.',
    'Riferimento anche per Verona e Messina.':
      'Verona மற்றும் Messina வுக்கும் ஒரு மையம்.',
    'Associazione per la cultura buddhista in Emilia-Romagna, guidata dal monaco Dambadeniye Dhammarama.':
      'Emilia-Romagna பகுதியில் பௌத்தப் பண்பாட்டுக்கான அமைப்பு, துறவி Dambadeniye Dhammarama வழிநடத்துகிறார்.',
    'Incontri mensili di meditazione e scuola di Dhamma per la comunità bresciana.':
      'Brescia சமூகத்துக்கான மாதாந்திர தியானச் சந்திப்புகள் மற்றும் Dhamma பள்ளி.',
    'Programmi mensili di meditazione della rete srilankese Mahamevnawa.':
      'இலங்கை Mahamevnawa வலையமைப்பின் மாதாந்திர தியான நிகழ்ச்சிகள்.',
    'Cingalesi e tamil attivi nelle parrocchie della Città metropolitana, con la festa di S. Agata.':
      'S. Agata விழா உள்ளிட்ட, பெருநகரப் பகுதியின் ஆலயங்களில் இயங்கும் சிங்களர் மற்றும் தமிழர்.',
    'Incontri mensili di meditazione aperti a tutta la comunità emiliana.':
      'முழு Emilia சமூகத்துக்கும் திறந்த மாதாந்திர தியானச் சந்திப்புகள்.',
    'Nata a Messina nel 2012: assistenza, mediazione e rapporti con il consolato mobile dello Sri Lanka.':
      '2012ல் Messina வில் தொடங்கியது: உதவி, இடைநிலை மற்றும் இலங்கை நடமாடும் தூதரகத்துடன் தொடர்பு.',
    'Centro di riferimento per la pratica buddhista in città.':
      'நகரில் பௌத்த வழிபாட்டுக்கான முக்கிய மையம்.',
    'Punto di ritrovo della comunità cingalese della Toscana settentrionale.':
      'வட Toscana வின் சிங்களச் சமூகத்தின் சந்திப்பு இடம்.',
    'Trova la sede ACLI più vicina': 'உங்களுக்கு அருகிலுள்ள ACLI அலுவலகத்தைத் தேடுங்கள்',
    'Trova la sede INCA CGIL': 'INCA CGIL அலுவலகத்தைத் தேடுங்கள்',
    'Trova la sede INAS CISL': 'INAS CISL அலுவலகத்தைத் தேடுங்கள்',
    'Trova la sede ITAL UIL': 'ITAL UIL அலுவலகத்தைத் தேடுங்கள்',
    'Sportelli e sedi ACLI in Italia': 'இத்தாலியில் ACLI சேவை மையங்கள் மற்றும் அலுவலகங்கள்',
    'CAF & patronati': 'CAF மற்றும் patronato',
    'Negozi srilankesi': 'இலங்கைக் கடைகள்',
    'Luoghi di culto': 'வழிபாட்டுத் தலங்கள்',
    'Professionisti': 'தொழில் வல்லுநர்கள்',
    'Il tuo browser non permette la geolocalizzazione.':
      'உங்கள் உலாவி இருப்பிடத்தைப் பயன்படுத்த அனுமதிக்கவில்லை.',
    'Cerco la tua posizione…': 'உங்கள் இருப்பிடத்தைத் தேடுகிறோம்…',
    'Cerco i CAF e i patronati vicino a te…': 'உங்களுக்கு அருகில் CAF மற்றும் patronato அலுவலகங்களைத் தேடுகிறோம்…',
    'Nessun ufficio trovato nel raggio di 15 km. Sotto trovi i recapiti delle reti nazionali, che coprono tutta Italia.':
      '15 கி.மீ. சுற்றளவில் எந்த அலுவலகமும் கிடைக்கவில்லை. இத்தாலி முழுவதையும் உள்ளடக்கிய தேசிய வலையமைப்புகளின் தொடர்புத் தகவல்கள் கீழே உள்ளன.',
    'Ricerca non disponibile in questo momento. Usa i recapiti delle reti nazionali qui sotto.':
      'இப்போது தேடல் கிடைக்கவில்லை. கீழேயுள்ள தேசிய வலையமைப்புத் தொடர்புகளைப் பயன்படுத்துங்கள்.',
    'Per cercare vicino a te serve il permesso di accedere alla posizione. Puoi comunque scegliere la tua città dall’elenco.':
      'உங்களுக்கு அருகில் தேட இருப்பிட அனுமதி தேவை. இருப்பினும் பட்டியலிலிருந்து உங்கள் நகரத்தைத் தேர்வு செய்யலாம்.',
    'Non riesco a rilevare la posizione. Scegli la tua città dall’elenco.':
      'இருப்பிடத்தைக் கண்டறிய முடியவில்லை. பட்டியலிலிருந்து உங்கள் நகரத்தைத் தேர்வு செய்யுங்கள்.',
    'Cerco le attività a {citta}…': '{citta} இல் வணிகங்களைத் தேடுகிறோம்…',
    'Nessuna attività mappata su OpenStreetMap a {citta}. Se ne conosci una, segnalacela: la aggiungiamo all’elenco.':
      '{citta} இல் OpenStreetMap இல் பதிவான வணிகம் எதுவும் இல்லை. உங்களுக்குத் தெரிந்தால் எங்களிடம் சொல்லுங்கள் — பட்டியலில் சேர்ப்போம்.',
    'Dati da OpenStreetMap: telefona prima di andare, gli orari cambiano spesso.':
      'தரவு OpenStreetMap இலிருந்து: செல்வதற்கு முன் தொலைபேசியில் அழையுங்கள், நேரங்கள் அடிக்கடி மாறும்.',
    'Ufficio': 'அலுவலகம்',
    'Attività': 'வணிகம்',
    'A {citta} (e in tutta Italia) puoi rivolgerti agli sportelli delle reti ufficiali nazionali per ISEE, permesso di soggiorno, pensioni, NASpI e pratiche INPS. Usa i localizzatori ufficiali per la sede più vicina:':
      '{citta} இல் — மற்றும் இத்தாலி முழுவதும் — ISEE, வதிவிட அனுமதி, ஓய்வூதியம், NASpI மற்றும் INPS நடைமுறைகளுக்கு அரசு அங்கீகரித்த தேசிய வலையமைப்புகளை அணுகலாம். அருகிலுள்ள அலுவலகத்தைக் கண்டறிய அதிகாரப்பூர்வ தேடல் கருவிகளைப் பயன்படுத்துங்கள்:',
    'Sito web ↗': 'இணையதளம் ↗',
    '🔎 Cerca altre attività a {citta}': '🔎 {citta} இல் மேலும் வணிகங்களைத் தேடுங்கள்',
    'Segnala un altro luogo': 'மற்றொரு இடத்தைப் பரிந்துரையுங்கள்',
    'Le attività della comunità cambiano in fretta. Cerca in tempo reale su OpenStreetMap i negozi, i ristoranti e i money transfer di {citta}.':
      'சமூக வணிகங்கள் விரைவாக மாறுகின்றன. {citta} இல் உள்ள கடைகள், உணவகங்கள் மற்றும் பணப் பரிமாற்ற நிலையங்களை OpenStreetMap இல் நேரலையில் தேடுங்கள்.',
    '🔎 Cerca le attività a {citta}': '🔎 {citta} இல் வணிகங்களைத் தேடுங்கள்',
    'Segnala un’attività': 'ஒரு வணிகத்தைப் பரிந்துரையுங்கள்',
    'Stiamo raccogliendo alimentari e attività della comunità':
      'மளிகைக் கடைகளையும் சமூக வணிகங்களையும் இன்னும் சேகரித்து வருகிறோம்',
    'Stiamo raccogliendo templi e centri culturali cingalesi e tamil':
      'சிங்கள மற்றும் தமிழ் கோயில்களையும் பண்பாட்டு மையங்களையும் இன்னும் சேகரித்து வருகிறோம்',
    'Stiamo raccogliendo commercialisti, avvocati e mediatori che parlano la tua lingua':
      'உங்கள் மொழி பேசும் கணக்காளர்கள், வழக்கறிஞர்கள் மற்றும் இடைநிலையாளர்களை இன்னும் சேகரித்து வருகிறோம்',
    '{frase} a {citta}. Per ora questo elenco è <strong>in raccolta</strong>: pubblichiamo solo i contatti che ci segnala la community, per non dare informazioni non verificate.':
      '{citta} இல் {frase}. தற்போது இந்தப் பட்டியல் <strong>உருவாக்கப்பட்டு வருகிறது</strong>: சரிபார்க்கப்படாத தகவலைத் தராமல் இருக்க, சமூகம் எங்களுக்குத் தெரிவிக்கும் தொடர்புகளை மட்டுமே வெளியிடுகிறோம்.',
    'Conosci un posto affidabile a {citta}?': '{citta} இல் நீங்கள் நம்பும் இடம் ஒன்று தெரியுமா?',
    'Segnala il tuo': 'எங்களிடம் சொல்லுங்கள்',
    'Tutte le categorie a {citta}. ': '{citta} இல் அனைத்துப் பிரிவுகளும். ',
    '{categoria} a {citta}.': '{citta} இல் {categoria}.',
    '4 categorie': '4 பிரிவுகள்',
    'Vedi servizi': 'சேவைகளைப் பார்க்க'
  }
};
