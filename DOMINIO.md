# 🌐 Dominio reale — guida operativa

Oggi il sito usa il placeholder `easyitaliahub.it` in canonical/OG/hreflang/sitemap,
mentre l'unico indirizzo reale è `https://deploy-pi-green.vercel.app`.
Finché resta così, la SEO "lavora" per un dominio che non esiste.

## Passi (≈20 minuti + propagazione DNS)

### 1. Compra il dominio (UTENTE)
Registrar consigliati: Cloudflare Registrar (prezzo costo), Namecheap, OVH.
Scegli il nome definitivo — candidati: `easyitaliahub.it` / `.com` / `.eu`.
> Il `.it` richiede un contatto/documento UE in fase di registrazione.

### 2. Collegalo a Vercel (UTENTE, 5 min)
1. https://vercel.com → progetto → **Settings → Domains** → *Add* → scrivi il dominio.
2. Aggiungi sia `dominio.tld` sia `www.dominio.tld` (Vercel fa il redirect).
3. Vercel mostra i record DNS da impostare dal registrar:
   - apex: record **A → 76.76.21.21**
   - www: **CNAME → cname.vercel-dns.com**
4. Attendi la verifica (di solito minuti; max 24-48 h). HTTPS è automatico.

### 3. Aggiorna il codice (CLAUDE o UTENTE, 1 comando)
```bash
./scripts/set-domain.sh ildominiocomprato.tld
git add -A && git commit -m "chore: switch dominio" && git push
```
Lo script sostituisce il dominio in tutti i canonical, Open Graph, Twitter card,
hreflang, JSON-LD, `sitemap.xml` e `robots.txt`.

### 4. Dopo il go-live
- [ ] Google Search Console: aggiungi la proprietà e invia `sitemap.xml`.
- [ ] Verifica anteprima WhatsApp con il nuovo URL.
- [ ] (Se cambierai dominio in futuro) ripeti lo script: è idempotente.
