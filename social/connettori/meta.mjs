/* Connettore Meta — solo API ufficiali (spec §11).
 *
 * Cosa si può fare davvero con la Graph API, verificato sulla documentazione e
 * non dedotto: pubblicare sulla propria Pagina, leggere i commenti dei propri
 * post, rispondere ai propri commenti, leggere le statistiche della Pagina.
 *
 * Serve un token della Pagina. Qui c'era scritto che i permessi «si ottengono
 * con una app Meta verificata», e non è vero nel nostro caso: la revisione di
 * Meta serve per far usare l'app ad altre persone. Per pubblicare sulla PROPRIA
 * Pagina, essendone amministratori, basta una app in modalità sviluppo — nessuna
 * revisione, nessuna attesa. La procedura è in social/README.md.
 *
 * La differenza non è un dettaglio: la frase sbagliata faceva sembrare
 * irraggiungibile l'unica cosa che rende l'agente autonomo.
 *
 * Cosa NON si può fare, e va detto adesso invece che scoprirlo dopo:
 *   · mettere like a post di altri come Pagina — non esiste endpoint;
 *   · commentare sotto post altrui in modo automatico — non esiste endpoint;
 *   · invitare in blocco chi ha messo like a un post — è solo nell'interfaccia,
 *     e farlo con un browser pilotato significa aggirare una protezione: la
 *     specifica lo vieta (§11) e Meta chiude la pagina.
 *
 * Queste tre cose restano azioni manuali suggerite dal sistema: il testo lo
 * prepariamo noi, il dito è di una persona. È l'unica versione che sopravvive.
 *
 * Senza token il connettore non è un errore: è «non collegato», e la catena
 * continua a produrre bozze da pubblicare a mano.                            */

const BASE = 'https://graph.facebook.com/v21.0';

export function stato() {
  const token = process.env.META_PAGE_TOKEN;
  const pagina = process.env.META_PAGE_ID;
  if (!token || !pagina) return { collegato: false, motivo: 'META_PAGE_TOKEN o META_PAGE_ID mancanti' };
  return { collegato: true, pagina };
}

async function chiama(percorso, opzioni = {}) {
  const token = process.env.META_PAGE_TOKEN;
  const url = `${BASE}${percorso}${percorso.includes('?') ? '&' : '?'}access_token=${encodeURIComponent(token)}`;
  const r = await fetch(url, { ...opzioni, signal: AbortSignal.timeout ? AbortSignal.timeout(20000) : undefined });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`Meta ${r.status}: ${d?.error?.message || 'errore'}`);
  return d;
}

/** Pubblica un post di testo (con link) sulla Pagina. Richiede pages_manage_posts. */
export async function pubblica({ messaggio, link }) {
  const s = stato();
  if (!s.collegato) return { pubblicato: false, motivo: s.motivo };
  const corpo = new URLSearchParams({ message: messaggio });
  if (link) corpo.set('link', link);
  const d = await chiama(`/${s.pagina}/feed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: corpo,
  });
  return { pubblicato: true, id: d.id };
}

/** I commenti sui NOSTRI post. Richiede pages_read_user_content. */
export async function commenti({ quanti = 25 } = {}) {
  const s = stato();
  if (!s.collegato) return { collegato: false, voci: [] };
  const posts = await chiama(`/${s.pagina}/posts?fields=id,message,created_time&limit=10`);
  const voci = [];
  for (const p of posts.data || []) {
    const c = await chiama(`/${p.id}/comments?fields=id,message,created_time,from&limit=${quanti}`);
    for (const x of c.data || []) voci.push({ postId: p.id, ...x });
  }
  return { collegato: true, voci };
}

/** Risposta a un commento sotto un nostro post. Richiede pages_manage_engagement. */
export async function rispondi(idCommento, messaggio) {
  const s = stato();
  if (!s.collegato) return { inviato: false, motivo: s.motivo };
  const d = await chiama(`/${idCommento}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ message: messaggio }),
  });
  return { inviato: true, id: d.id };
}

/** Numeri della Pagina. Richiede read_insights. */
export async function statistiche() {
  const s = stato();
  if (!s.collegato) return { collegato: false };
  const d = await chiama(`/${s.pagina}/insights?metric=page_impressions,page_post_engagements,page_fans&period=day`);
  return { collegato: true, dati: d.data || [] };
}

/* Le tre azioni che la specifica chiede e che l'API non offre: si restituiscono
   come compiti per una persona, con il testo già pronto. */
export function azioniManuali(suggerimenti) {
  return suggerimenti.map((s) => ({
    ...s,
    modalita: 'manuale',
    perche: 'nessun endpoint ufficiale: va fatto dall\'interfaccia di Facebook',
  }));
}
