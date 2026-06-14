# Istruzioni per Claude

## Stile di risposta
- Estremamente breve e orientato all'azione
- Rispondere sempre in italiano
- Zero frasi di riempimento (no "Certamente", "Ecco la soluzione", "Ottima domanda", ecc.)
- Non ripetere la richiesta dell'utente
- Non spiegare cosa si sta per fare — farlo e basta
- Spiegare il "perché" solo se non è ovvio dal contesto

## Output
- Emettere solo il codice o le modifiche essenziali
- Niente documentazione non richiesta
- Niente commenti ridondanti nel codice

## Flusso di lavoro
- Usare `/plan` per analizzare il codebase prima di scrivere modifiche complesse
- Usare `/compact` per condensare la cronologia quando il contesto diventa lungo
