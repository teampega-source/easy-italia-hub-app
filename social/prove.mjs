/* Le prove del Safety Agent e della catena (spec §22, criteri di accettazione).
 *
 * Girano senza rete e senza chiavi: un controllo che ha bisogno del modello per
 * essere verificato non è un controllo, è una speranza.
 *
 * Uso: node social/prove.mjs                                                 */

import { controlla, modalita } from './lib/sicurezza.mjs';
import { opportunita, punteggio } from './agenti/fonti.mjs';
import { pacchetto } from './agenti/contenuto.mjs';
import { scrivi } from './rapporto.mjs';

let fatte = 0, rotte = 0;
function prova(nome, condizione, dettaglio) {
  fatte++;
  if (condizione) { console.log('  ok  ', nome); }
  else { rotte++; console.log('  ROTTA', nome, dettaglio !== undefined ? '· ' + JSON.stringify(dettaglio) : ''); }
}

console.log('\n— Safety: quello che deve passare —');
{
  const a = controlla({ testo: 'Come si chiede il codice fiscale, spiegato in sinhala. easyitaliahub.it', formato: 'facebook', fonte: 'https://easyitaliahub.it/guide' });
  prova('una guida può NOMINARE il codice fiscale', a.gravita !== 'blocco', a.problemi);

  const b = controlla({ testo: 'Il permesso di soggiorno si rinnova 60 giorni prima della scadenza. Fonte ufficiale collegata.', formato: 'facebook', fonte: 'https://www.poliziadistato.it' });
  prova('tema regolato CON fonte passa', b.gravita !== 'blocco', b.problemi);
}

console.log('\n— Safety: quello che deve fermarsi —');
{
  const a = controlla({ testo: 'Ti garantiamo il permesso di soggiorno in 30 giorni!', formato: 'facebook', fonte: 'https://x.it' });
  prova('promessa di esito → blocco', a.gravita === 'blocco', a.problemi);

  const b = controlla({ testo: 'Metti like e seguimi e ti seguo, tagga 5 amici!', formato: 'facebook', fonte: 'https://x.it' });
  prova('scambio artificiale → blocco', b.gravita === 'blocco', b.problemi);

  const c = controlla({ testo: 'Mandaci il tuo codice fiscale in privato e ti aiutiamo.', formato: 'facebook', fonte: 'https://x.it' });
  prova('chiede dati personali → blocco', c.gravita === 'blocco', c.problemi);

  const d = controlla({ testo: 'Il permesso di soggiorno scade: ecco cosa fare.', formato: 'facebook' });
  prova('tema regolato SENZA fonte → blocco', d.gravita === 'blocco', d.problemi);

  const e = controlla({ testo: 'Affrettati, ultimi giorni!', formato: 'facebook', fonte: 'https://x.it' });
  prova('urgenza inventata → avviso', e.gravita === 'avviso', e.problemi);

  const f = controlla({ testo: 'x'.repeat(600), formato: 'facebook', fonte: 'https://x.it' });
  prova('troppo lungo per Facebook → avviso', f.gravita === 'avviso', f.problemi);

  const g = controlla({ testo: '', formato: 'facebook' });
  prova('testo vuoto → blocco', g.gravita === 'blocco');
}

console.log('\n— Modalità: niente si pubblica da solo —');
{
  const sano = { gravita: null, problemi: [] };
  prova('un post normale va in revisione', modalita({ azione: 'post' }, sano) === 'revisione');
  prova('un commento va sempre in revisione', modalita({ azione: 'commento' }, sano) === 'revisione');
  prova('like e inviti restano manuali', modalita({ azione: 'invito' }, sano) === 'manuale');
  prova('un blocco è scartato', modalita({ azione: 'post' }, { gravita: 'blocco' }) === 'scartato');
}

console.log('\n— Scout sulle fonti verificate —');
{
  const o = opportunita({ quante: 5 });
  prova('trova opportunità', o.length === 5, o.length);
  prova('ognuna ha una fonte', o.every((x) => x.fonte && x.fonte.startsWith('http')));
  prova('ordinate per punteggio, senza doppioni', new Set(o.map((x) => x.titolo)).size === o.length);
  prova('senza fonte il punteggio crolla', punteggio({ titolo: 'permesso', valore: 9 }) < punteggio({ titolo: 'permesso', valore: 9, fonte: 'x' }));
}

console.log('\n— Catena completa, senza chiavi —');
{
  const o = opportunita({ quante: 1 })[0];
  const p = await pacchetto(o, { lingue: ['it', 'si'] });
  prova('produce le due lingue', Object.keys(p.lingue).length === 2);
  prova('ogni formato ha il suo verdetto', Object.keys(p.lingue.it.verifiche).length === 4);
  prova('la fonte finisce nel post', p.lingue.it.testi.facebook.includes(o.fonte));
  const md = scrivi({ oggi: '2026-01-01', bozze: [p], commenti: null, lingue: ['it', 'si'] });
  prova('il rapporto cita il tema', md.includes(o.titolo));
}

/* Il repertorio è la ragione per cui «senza chiavi» non vuol più dire
   «inservibile». Queste prove tengono ferme le due metà del patto: sui nostri
   temi esce testo vero e pubblicabile, su un tema che non conosciamo esce una
   bozza dichiarata grezza — mai qualcosa che sembra scritto e non lo è. */
console.log('\n— Repertorio: senza modello si pubblica lo stesso —');
{
  const { voce, chiave } = await import('./lib/repertorio.mjs');
  const { INVITO } = await import('./lib/marca.mjs');

  prova('la chiave esce dall\'ancora della guida',
    chiave('https://easyitaliahub.it/guide#permesso-soggiorno') === 'guide#permesso-soggiorno');
  prova('la chiave esce dal percorso', chiave('https://easyitaliahub.it/moduli') === '/moduli');
  prova('la home ha una chiave sua', chiave('https://easyitaliahub.it/') === '/');

  for (const lg of ['si', 'it', 'en', 'ta']) {
    const v = voce('https://easyitaliahub.it/guide#permesso-soggiorno', lg);
    prova(`il permesso di soggiorno è scritto in ${lg}`, Boolean(v && v.gancio && v.corpo));
  }
  const si = voce('https://easyitaliahub.it/moduli', 'si');
  prova('il sinhala è davvero in sinhala', /[඀-෿]/.test(si.gancio));
  const ta = voce('https://easyitaliahub.it/moduli', 'ta');
  prova('il tamil è davvero in tamil', /[஀-௿]/.test(ta.gancio));

  const noto = { tipo: 'strumento', titolo: 'Moduli', fonte: 'https://easyitaliahub.it/moduli', fonteNome: 'EIH', punteggio: 8 };
  const p = await pacchetto(noto, { lingue: ['si', 'it'] });
  prova('un tema nostro non è grezzo nemmeno senza modello', p.lingue.si.grezzo === false);
  prova('e viene dal repertorio', p.lingue.si.origine === 'repertorio');
  prova('quindi non ha bisogno di revisione', p.lingue.it.verifiche.facebook.modalita === 'auto');
  prova('la Storia sta nel suo limite', p.lingue.si.testi.storia.length <= 160);
  prova('l\'invito c\'è in ogni lingua',
    p.lingue.si.testi.facebook.includes(INVITO.si) && p.lingue.it.testi.facebook.includes(INVITO.it));

  const ignoto = { tipo: 'guida', titolo: 'Un tema che non conosciamo', fonte: 'https://easyitaliahub.it/guide#inventato', fonteNome: 'EIH', punteggio: 5 };
  const q = await pacchetto(ignoto, { lingue: ['it'] });
  prova('un tema fuori repertorio resta grezzo e lo dichiara', q.lingue.it.grezzo === true);
  prova('e passa comunque da una revisione', q.lingue.it.verifiche.facebook.modalita === 'revisione');
  const md = scrivi({ oggi: '2026-01-01', bozze: [q], commenti: null, lingue: ['it'] });
  prova('il rapporto avverte che le bozze sono grezze', md.includes('grezze'));
}

console.log('\n— Memoria: l\'agente sa dire di no —');
{
  const { giaPubblicato, gruppoDisponibile, postOggi, segnaPost, segnaGruppo, REGOLE } = await import('./lib/registro.mjs');
  let m = { pubblicati: [], gruppi: {}, risposte: [] };
  m = segnaPost(m, { titolo: 'Mappa dei servizi', formato: 'facebook' });
  prova('lo stesso tema non torna prima di tre settimane', giaPubblicato(m, 'Mappa dei servizi'));
  prova('un tema mai uscito passa', !giaPubblicato(m, 'Altro tema'));
  prova('conta i post di oggi', postOggi(m) === 1);

  const vecchio = { pubblicati: [{ titolo: 'X', quando: new Date(Date.now() - 40 * 86400000).toISOString() }] };
  prova('dopo il periodo il tema si può ripubblicare', !giaPubblicato(vecchio, 'X'));

  let g = segnaGruppo({ gruppi: {} }, 'milano');
  prova('nello stesso gruppo non si torna subito', !gruppoDisponibile(g, 'milano'));
  prova('un gruppo mai usato è libero', gruppoDisponibile(g, 'napoli'));
  const g2 = { gruppi: { milano: new Date(Date.now() - 10 * 86400000).toISOString() } };
  prova('dopo una settimana il gruppo torna libero', gruppoDisponibile(g2, 'milano'));
  prova('le regole sono strette di proposito', REGOLE.postAlGiorno === 1 && REGOLE.stessoGruppoGiorni >= 7);
}

console.log('\n— Commenti: risponde da solo solo a quello che non fa male —');
{
  const { rispostaA, lingua } = await import('./agenti/comunita.mjs');
  prova('riconosce il sinhala', lingua('ස්තූතියි') === 'si');
  prova('riconosce il tamil', lingua('நன்றி') === 'ta');
  prova('riconosce l\'inglese', lingua('how can I get it?') === 'en');

  const g = await rispostaA({ id: '1', message: 'Grazie!' });
  prova('«grazie» → risposta fissa automatica', g.modalita === 'auto' && g.risposta.length > 0, g);

  const c = await rispostaA({ id: '2', message: 'è gratis?' });
  prova('«è gratis?» → risposta fissa automatica', c.modalita === 'auto');

  const d = await rispostaA({ id: '3', message: 'Ho il permesso scaduto da due mesi, cosa rischio?' });
  prova('una domanda vera va SEMPRE in revisione', d.modalita === 'revisione', d.modalita);
}

console.log('\n— Pubblicazione: i cancelli —');
{
  const { acceso, pubblicaDelGiorno } = await import('./pubblica.mjs');
  delete process.env.SOCIAL_AUTOPUBBLICA;
  prova('spenta per difetto', acceso() === false);
  const r = await pubblicaDelGiorno([]);
  prova('senza interruttore non pubblica', r.fatto === false && /SOCIAL_AUTOPUBBLICA/.test(r.motivo), r);

  process.env.SOCIAL_AUTOPUBBLICA = '1';
  const r2 = await pubblicaDelGiorno([]);
  prova('acceso ma senza token Meta non pubblica', r2.fatto === false && /META_PAGE/.test(r2.motivo), r2);
  delete process.env.SOCIAL_AUTOPUBBLICA;
}

console.log('\n— Gruppi: nessuna scorciatoia —');
{
  const { messaggi, elenco } = await import('./agenti/gruppi.mjs');
  const g = await messaggi([{ titolo: 'X', fonte: 'https://easyitaliahub.it' }], { gruppi: {} });
  prova('senza elenco lo dice invece di inventare gruppi', g.senzaElenco === (elenco().length === 0));
  for (const m of g.messaggi) {
    prova(`«${m.gruppo.nome}» resta manuale`, m.modalita === 'manuale');
  }
}

console.log(`\n${fatte - rotte}/${fatte} prove passate\n`);
process.exit(rotte ? 1 : 0);
