import os
import re
import json

# Configurazione
CARTELLA_TESTI = 'testi'
FILE_DATA_JS = 'js/data.js'

def analizza_file(percorso):
    # 'utf-8-sig' serve a eliminare quel simbolo \ufeff che ha rotto tutto!
    with open(percorso, 'r', encoding='utf-8-sig') as f:
        contenuto = f.read()

    titolo = "Canto senza titolo"
    momento = "vario"
    messe = []
    
    # 1. Estrai Titolo (Cerca la riga che inizia con # ovunque nel file)
    match_titolo = re.search(r'^\s*#\s*(.+)$', contenuto, re.MULTILINE)
    if match_titolo:
        titolo = match_titolo.group(1).strip()

    # 2. Estrai Metadati (Se presenti tra i ---)
    match_meta = re.search(r'---\s*\n([\s\S]+?)\n---', contenuto)
    if match_meta:
        blocco = match_meta.group(1)
        m_mom = re.search(r'momento:\s*(.+)', blocco)
        if m_mom: momento = m_mom.group(1).strip()
        m_mes = re.findall(r'-\s*(.+)', blocco)
        if m_mes: messe = [m.strip() for m in m_mes]

    # 3. Pulisci il Testo per data.js
    testo_pulito = re.sub(r'^\s*#\s*.*$', '', contenuto, flags=re.MULTILINE)
    testo_pulito = re.sub(r'---[\s\S]+?---', '', testo_pulito)
    testo_pulito = testo_pulito.strip()

    # --- INIZIO LOGICA RITORNELLO (BLOCKQUOTE) ---
    righe = testo_pulito.split('\n')
    righe_elaborate = []
    in_ritornello = False

    for riga in righe:
        riga_pulita = riga.strip()

        # Inizio ritornello esteso
        if riga_pulita.startswith('**Rit.') and riga_pulita != '**Rit.**':
            in_ritornello = True
            # Togliamo i fastidiosi asterischi per non confondere il Markdown
            testo_riga = riga_pulita.replace('**', '')
            righe_elaborate.append('> ' + testo_riga) 
            
            if riga_pulita.endswith('**') and len(riga_pulita) > 8:
                in_ritornello = False
            continue

        # Richiamo breve del ritornello
        if riga_pulita == '**Rit.**':
            righe_elaborate.append('> Rit.')
            continue

        # Testo dentro il ritornello
        if in_ritornello:
            testo_riga = riga_pulita.replace('**', '')
            if testo_riga == '':
                righe_elaborate.append('>') 
            else:
                righe_elaborate.append('> ' + testo_riga)
                
            if riga_pulita.endswith('**'):
                in_ritornello = False
        else:
            # Testo normale (strofe)
            righe_elaborate.append(riga)

    testo_pulito = '\n'.join(righe_elaborate)
    # --- FINE LOGICA RITORNELLO ---

    return {
        "titolo": titolo,
        "momento": momento,
        "messe": messe,
        "testo_md": testo_pulito
    }

def main():
    canti = []
    if not os.path.exists(CARTELLA_TESTI):
        print(f"Errore: Cartella '{CARTELLA_TESTI}' non trovata!")
        return

    # Legge tutti i file .txt nella cartella
    for file in sorted(os.listdir(CARTELLA_TESTI)):
        if file.endswith('.txt'):
            print(f"Processando: {file}")
            canti.append(analizza_file(os.path.join(CARTELLA_TESTI, file)))

    # Carica la struttura base per non perdere i 'momenti' e le 'messe' predefinite
    struttura_base = """const datiParrocchialiSalvati = {
    "momenti": [
        { "id": "ingresso", "nome": "Ingresso", "ordine": 1 },
        { "id": "offertorio", "nome": "Offertorio", "ordine": 2 },
        { "id": "santo", "nome": "Santo", "ordine": 3 },
        { "id": "pace", "nome": "Pace", "ordine": 4 },
        { "id": "comunione", "nome": "Comunione", "ordine": 5 },
        { "id": "fine", "nome": "Fine", "ordine": 6 },
        { "id": "vario", "nome": "Vario", "ordine": 7 }
    ],
    "messe": [
        { "id": "natale", "nome": "Natale" },
        { "id": "pasqua", "nome": "Triduo Pasquale" },
        { "id": "prime_comunioni", "nome": "Prime Comunioni" },
        { "id": "cresime", "nome": "Cresime" },
        { "id": "festa_patronale", "nome": "Festa Patronale" }
    ],
    "canti": []
};"""

    # Genera il JSON dei canti formattato bene
    canti_json = json.dumps(canti, indent=4, ensure_ascii=False)
    
    # Sostituisce l'array vuoto con i canti reali
    nuovo_js = struttura_base.replace('"canti": []', f'"canti": {canti_json}')

    with open(FILE_DATA_JS, 'w', encoding='utf-8') as f:
        f.write(nuovo_js)
    
    print(f"\nFatto! {len(canti)} canti inseriti correttamente in {FILE_DATA_JS}")

if __name__ == "__main__":
    main()