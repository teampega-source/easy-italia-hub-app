/* Le domande frequenti in inglese, per il dato strutturato FAQPage.

   La pagina predefinita e' in inglese: il JSON-LD deve descrivere lo stesso
   testo che l'utente legge, non l'italiano che sta nel markup di partenza.
   Le tre pagine che hanno una sezione FAQ sono index, community e
   guida-conti. Se aggiungi domande a una di queste pagine, aggiorna anche
   qui: il generatore non inventa traduzioni. */

export const FAQ_EN = {
  index: [
    {
      q: 'How long does the residence permit take?',
      a: 'It depends on the police headquarters (questura) and the type of permit: timelines can range from a few weeks to several months. After submitting your application you receive a receipt that, together with your passport, serves as a temporary document. For the step-by-step procedure, see our residence permit guide.'
    },
    {
      q: 'Is the service free?',
      a: 'Yes. Reading the guides, using the AI Assistant and reading the news are free. No credit card is required to sign up.'
    },
    {
      q: 'Which languages can I use the site in?',
      a: 'The site interface is available in 4 languages: Italian, English, Sinhala (සිංහල) and Tamil (தமிழ்). You can change the language from the menu in the top right.'
    },
    {
      q: 'How does the AI Advisor work?',
      a: "It's an assistant available 24 hours a day that answers your questions about bureaucracy and services. Open the chat from the button in the bottom right (or with Ctrl/⌘+J) and type your question: it points you to the relevant steps and guides."
    },
    {
      q: 'Do I need to register to use the guides?',
      a: 'No. The practical guides are freely available without registration. The free account is only needed to save the progress of your personal journey.'
    },
    {
      q: 'Is the information official?',
      a: 'Our guides are informational and orient you through the main steps, but they do not replace official sources. For definitive data always check the institutional websites (e.g. Polizia di Stato, Agenzia delle Entrate, INPS) or contact a CAF or patronato.'
    }
  ],

  community: [
    {
      q: 'Where can I find a free patronato or CAF?',
      a: 'Patronati (e.g. INCA-CGIL, ACLI, INAS-CISL, ITAL-UIL) and CAF offices help free of charge with residence permits, pensions, the single child allowance, ISEE, NASpI and INPS paperwork. By law, patronato support for social-security and welfare matters is free for you. Find the nearest office on the patronato website, or look for social service desks on our Services Map. For INPS services you can also start from inps.it.'
    },
    {
      q: 'Can I enrol my children at school?',
      a: "Yes. In Italy education is a right and a duty for all minors, including the children of parents without a valid residence permit. Schools cannot refuse enrolment because of missing residence documents. Enrolment is normally done online on the Ministry portal during the enrolment window; outside that period, contact the school directly. Official information on mim.gov.it (Ministry of Education) or ask for help at your municipality's school desk."
    },
    {
      q: 'How does family reunification work?',
      a: "To bring your spouse and children to Italy you must apply for the nulla osta (clearance) for family reunification at the Sportello Unico per l'Immigrazione (SUI) at the Prefecture. You generally need a suitable residence permit, a minimum income and adequate housing (with a housing suitability certificate). The application is submitted online through the Ministry of the Interior portal. Check the requirements and procedure on interno.gov.it and ask a patronato to guide you to avoid mistakes."
    },
    {
      q: 'How do I get a GP and a health card?',
      a: 'With a valid residence permit you register with the National Health Service (SSN) at the ASL for your area: choose a GP and receive your health card. You usually need your permit or receipt, tax code and proof of residence or address. If you do not have a valid permit, you are still entitled to urgent and essential care under the STP code. Information on salute.gov.it and your local ASL website.'
    },
    {
      q: 'How do I get SPID?',
      a: 'SPID is the digital identity used to access Italian public administration online services (INPS, Agenzia delle Entrate, healthcare). To apply you need a valid ID document, your health card/tax code, an email address and a mobile number. Choose an accredited provider and complete identity verification (in person, by webcam or with CIE). The official list of providers and instructions are on spid.gov.it. See also our Guide.'
    },
    {
      q: 'My residence permit is about to expire: what should I do?',
      a: 'Apply for renewal before it expires (it is generally advisable to start at least 60 days in advance). The kit is normally sent through authorised post offices (Sportello Amico); the receipt proves you may stay lawfully while you wait for the decision. Ask a patronato to help you prepare the right documents. Official procedure and forms on interno.gov.it.'
    },
    {
      q: 'I need a tax code: how do I apply?',
      a: 'The tax code (codice fiscale) is needed for almost everything: work, healthcare, contracts, banking. It is issued free of charge by the Agenzia delle Entrate; foreign nationals can also obtain it through the Sportello Unico or the Questura when dealing with residence paperwork. For procedures, documents and offices see agenziaentrate.gov.it.'
    },
    {
      q: 'Can I apply for the single child allowance?',
      a: 'The Assegno Unico e Universale (single universal child allowance) for dependent children is also available to many foreign nationals who live and work in Italy, provided they meet the requirements (including a suitable residence permit and residence). The amount depends on your ISEE. Apply through INPS (online, via a patronato or CAF). Up-to-date requirements and simulator on inps.it.'
    }
  ],

  'guida-conti': [
    {
      q: 'Can I open an account without being resident in Italy?',
      a: 'Yes, but it depends on the bank. Online accounts like HYPE, N26 and Revolut often accept you without Italian residence, provided you have valid ID and a phone number. Traditional banks usually require certified residence (a residence certificate or an Italian ID card).'
    },
    {
      q: 'Do I need SPID to open an account?',
      a: 'No, SPID is not required to open an account. Some banks accept it as an online identification method instead of the selfie or video check, but you can always open the account in a branch with physical documents.'
    },
    {
      q: 'Is a residence permit under renewal accepted?',
      a: 'Yes. Italian law treats the postal kit receipt (the yellow slip from the post office) as an equivalent document while the renewal is pending. Bring the expired permit too. Not every branch knows this — be ready to explain it, or ask for a supervisor.'
    },
    {
      q: 'What is the difference between a current account and a postal savings book?',
      a: 'A current account (bank or BancoPosta) comes with an IBAN, a payment card, salary payments and online payments. A postal savings book is a savings product — it has no IBAN and cannot receive a salary or pay bills automatically. To live in Italy you need a current account.'
    },
    {
      q: 'Can I send money to Sri Lanka from my Italian account?',
      a: 'Yes, by international SWIFT transfer or through remittance services like Wise, WorldRemit or Western Union. See our Money Transfer guide to compare rates and choose the cheapest option.'
    },
    {
      q: 'How long does it take to open the account?',
      a: 'Online account: 10–30 minutes to apply + 24–48 hours for activation and the IBAN. Traditional bank or post office: 1–2 hours in the branch + 7–10 days for the physical card. You often get the IBAN right after signing the contract.'
    }
  ]
};
