/* Community Agent — le risposte ai commenti sotto i NOSTRI post (spec §5).
 *
 * Qui l'autonomia si taglia con l'accetta, e la linea è questa: risponde da
 * solo soltanto a quello a cui una risposta sbagliata non fa male.
 *
 *   auto      · «grazie», «bravi», «è gratis?», «in che lingue?»
 *               Risposte fisse, scritte a mano, senza modello di mezzo.
 *   revisione · tutto il resto, e cioè ogni domanda vera.
 *
 * Perché non lasciare il modello libero di rispondere a chi chiede del
 * permesso di soggiorno: una risposta plausibile e sbagliata sotto un nostro
 * post viene letta come la nostra posizione ufficiale, e chi la legge ci va
 * allo sportello. Il modello prepara la bozza, la persona la manda.
 *
 * La lingua della risposta è quella del commento: chi scrive in sinhala si
 * merita una risposta in sinhala, non in italiano con l'aria di fare un
 * favore.                                                                    */

import { genera, leggiJson, disponibile } from '../lib/ai.mjs';
import { VOCE, SITO, NOME_LINGUA } from '../lib/marca.mjs';
import { controlla } from '../lib/sicurezza.mjs';

/* Riconoscimento della scrittura: il sinhala e il tamil hanno il loro blocco
   Unicode, quindi non serve indovinare. Fra italiano e inglese si guardano
   poche parole frequenti — ed è sufficiente, perché in caso di dubbio la
   risposta va comunque in revisione. */
export function lingua(testo) {
  const t = String(testo || '');
  if (/[඀-෿]/.test(t)) return 'si';
  if (/[஀-௿]/.test(t)) return 'ta';
  if (/\b(the|how|can|thanks|hello|is it|free)\b/i.test(t)) return 'en';
  return 'it';
}

/* Le uniche risposte che partono da sole. Scritte a mano, quattro lingue.
   Se una domanda non entra qui dentro, non è semplice: è solo breve. */
const FISSE = {
  ringraziamento: {
    prova: /^(?:\s*(?:grazie|thanks|thank you|බොහොම ස්තූතියි|ස්තූතියි|நன்றி)[\s!.…❤️🙏👏]*)+$/iu,
    testo: {
      it: 'Grazie a te 🙏 Se ti serve qualcosa, siamo su easyitaliahub.it — è tutto gratis.',
      en: 'Thank you 🙏 Anything you need, we are at easyitaliahub.it — everything is free.',
      si: 'ස්තූතියි 🙏 ඕනෑම දෙයක් සඳහා easyitaliahub.it — සියල්ල නොමිලේ.',
      ta: 'நன்றி 🙏 எதுவும் தேவைப்பட்டால் easyitaliahub.it — அனைத்தும் இலவசம்.',
    },
  },
  costo: {
    /* Niente \b davanti a «è»: in JavaScript il confine di parola è ASCII, e
       davanti a una lettera accentata non scatta mai. La prova lo ha preso. */
    prova: /(?:è|e')\s*gratis|quanto costa|is it free|how much|free\?|නොමිලේද|இலவசமா/iu,
    testo: {
      it: `Sì, è tutto gratis: nessun costo, nessuna carta. ${SITO}`,
      en: `Yes, everything is free: no cost, no card. ${SITO}`,
      si: `ඔව්, සියල්ල නොමිලේ: ගාස්තුවක් නැත, කාඩ්පතක් අවශ්‍ය නැත. ${SITO}`,
      ta: `ஆம், அனைத்தும் இலவசம்: கட்டணம் இல்லை, அட்டை தேவையில்லை. ${SITO}`,
    },
  },
  lingue: {
    prova: /\b(?:in che lingua|which language|sinhala|සිංහලෙන්|தமிழில்)\b/iu,
    testo: {
      it: `Il sito è in sinhala, tamil, inglese e italiano. Scegli la lingua in alto. ${SITO}`,
      en: `The site is in Sinhala, Tamil, English and Italian. Pick your language at the top. ${SITO}`,
      si: `වෙබ් අඩවිය සිංහල, දෙමළ, ඉංග්‍රීසි සහ ඉතාලි භාෂාවලින්. ඉහළින් භාෂාව තෝරන්න. ${SITO}`,
      ta: `தளம் சிங்களம், தமிழ், ஆங்கிலம், இத்தாலியன் மொழிகளில் உள்ளது. மேலே மொழியைத் தேர்ந்தெடுங்கள். ${SITO}`,
    },
  },
};

const ISTRUZIONE = `${VOCE}

Rispondi a un commento sotto un nostro post su Facebook.

Regole:
- massimo tre frasi;
- rispondi nella lingua del commento;
- se la domanda riguarda una pratica (permesso, INPS, cittadinanza, tasse),
  non dare la risposta a memoria: indica la pagina nostra che la spiega e
  ricorda che la fonte ufficiale è collegata lì dentro;
- se il caso è personale o complicato, invita a scrivere in privato o ad
  andare a un patronato, senza chiedere dati nel commento;
- niente saluti lunghi, niente "come da lei richiesto".

Rispondi SOLO con JSON: {"risposta":"…","motivo":"…","delicato":true|false}`;

export async function rispostaA(commento) {
  const testo = String(commento.message || '');
  const lg = lingua(testo);

  for (const [nome, f] of Object.entries(FISSE)) {
    if (f.prova.test(testo.trim())) {
      const risposta = f.testo[lg] || f.testo.it;
      return {
        idCommento: commento.id,
        lingua: lg,
        risposta,
        motivo: `risposta fissa «${nome}»`,
        modalita: 'auto',
        verifica: controlla({ testo: risposta, formato: 'facebook', fonte: SITO }),
      };
    }
  }

  const r = await genera(
    ISTRUZIONE,
    `Lingua del commento: ${NOME_LINGUA[lg]}.\nCommento: «${testo}»`,
    { temperatura: 0.4, max: 400 }
  );
  const d = r.testo ? leggiJson(r.testo) : null;
  const risposta = d?.risposta || null;

  return {
    idCommento: commento.id,
    lingua: lg,
    risposta,
    motivo: d?.motivo || (disponibile() ? 'bozza del modello' : 'nessun modello collegato: da scrivere a mano'),
    /* Qualunque cosa non sia una delle risposte fisse passa da una persona.
       Non è prudenza eccessiva: è che una risposta sbagliata sotto un nostro
       post diventa la nostra posizione ufficiale. */
    modalita: 'revisione',
    verifica: risposta ? controlla({ testo: risposta, formato: 'facebook', fonte: SITO }) : null,
  };
}

export async function risposte(commenti) {
  const fuori = [];
  for (const c of commenti) fuori.push(await rispostaA(c));
  return fuori;
}
