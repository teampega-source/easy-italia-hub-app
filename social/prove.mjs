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
  prova('marca le bozze come grezze senza modello', p.lingue.it.grezzo === true);
  prova('ogni formato ha il suo verdetto', Object.keys(p.lingue.it.verifiche).length === 4);
  prova('la fonte finisce nel post', p.lingue.it.testi.facebook.includes(o.fonte));
  const md = scrivi({ oggi: '2026-01-01', bozze: [p], commenti: null, lingue: ['it', 'si'] });
  prova('il rapporto cita il tema', md.includes(o.titolo));
  prova('il rapporto avverte che le bozze sono grezze', md.includes('grezze'));
}

console.log(`\n${fatte - rotte}/${fatte} prove passate\n`);
process.exit(rotte ? 1 : 0);
