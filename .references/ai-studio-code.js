// Logica Multilingua e Struttura Base
const content = {
  IT: { 
    nav: ["Burocrazia", "Bonus", "Lavoro", "Annunci"],
    heroTitle: "Il tuo futuro in Italia, più semplice.",
    adNotice: "Pubblica il tuo primo annuncio GRATIS per 14 giorni!"
  },
  SI: { 
    nav: ["බියුරොක්‍රැසි", "බෝනස්", "රැකියා", "දැන්වීම්"],
    heroTitle: "ඉතාලියේ ඔබේ අනාගතය වඩාත් සරලයි.",
    adNotice: "ඔබේ පළමු දැන්වීම දින 14ක් නොමිලේ පළ කරන්න!"
  },
  EN: { 
    nav: ["Bureaucracy", "Bonuses", "Jobs", "Ads"],
    heroTitle: "Your future in Italy, made easy.",
    adNotice: "Post your first ad for FREE for 14 days!"
  }
};

// Funzione Sicurezza Anti-Phishing
function generateSecurityCode() {
   // Genera un codice che l'utente vedrà in ogni mail ufficiale
   return Math.random().toString(36).substring(2, 8).toUpperCase();
}