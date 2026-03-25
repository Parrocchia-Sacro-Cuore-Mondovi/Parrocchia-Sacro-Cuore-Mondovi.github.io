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

    # --- INIZIO LOGICA RITORNELLO E FINALE (HTML PURO) ---
    righe = testo_pulito.split('\n')
    righe_elaborate = []
    in_ritornello = False

    for riga in righe:
        riga_pulita = riga.strip()

        is_rit = riga_pulita.startswith('**Rit') and riga_pulita != '**Rit**'
        is_finale = riga_pulita.lower().startswith('**finale') and riga_pulita.lower() != '**finale**'

        # 1. Inizio blocco esteso (testo sulla stessa riga dell'apertura)
        if is_rit or is_finale:
            in_ritornello = True
            testo_riga = riga_pulita.replace('**', '')
            
            # Se è un Finale, "mangiamo" la parola "Finale" e la punteggiatura
            if is_finale:
                testo_riga = re.sub(r'(?i)^Finale[\s\.:-]*', '', testo_riga).strip()
            
            if testo_riga:
                righe_elaborate.append('> ' + testo_riga)
            else:
                righe_elaborate.append('>')
            
            # Se si apre e chiude sulla stessa riga
            if riga_pulita.endswith('**') and len(riga_pulita) > 6:
                in_ritornello = False
            continue

        # 2. Richiamo breve (es. **Rit.**)
        if riga_pulita == '**Rit.**':
            righe_elaborate.append('> Rit.')
            continue
            
        # 3. Apertura pura del Finale su una riga a sé stante
        if riga_pulita.lower() == '**finale**':
            in_ritornello = True
            righe_elaborate.append('>')
            continue

        # 4. Testo all'interno del blocco
        if in_ritornello:
            testo_riga = riga_pulita.replace('**', '')
            if testo_riga == '':
                righe_elaborate.append('>')
            else:
                righe_elaborate.append('> ' + testo_riga)
                
            # Chiusura del blocco
            if riga_pulita.endswith('**'):
                in_ritornello = False
        else:
            # Strofe normali
            righe_elaborate.append(riga)

    testo_pulito = '\n'.join(righe_elaborate)
    # --- FINE LOGICA RITORNELLO E FINALE ---

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
        { "id": "alleluia", "nome": "Alleluia", "ordine": 2 },
        { "id": "offertorio", "nome": "Offertorio", "ordine": 3 },
        { "id": "santo", "nome": "Santo", "ordine": 4 },
        { "id": "pace", "nome": "Pace", "ordine": 5 },
        { "id": "comunione", "nome": "Comunione", "ordine": 6 },
        { "id": "fine", "nome": "Fine", "ordine": 7 },
        { "id": "adorazione", "nome": "Adorazione", "ordine": 8 },
        { "id": "cresime", "nome": "Cresime", "ordine": 9 },
        { "id": "funerali", "nome": "Funerali", "ordine": 10 },
        { "id": "matrimoni", "nome": "Matrimoni", "ordine": 11 },
        { "id": "pasqua", "nome": "Tempo Pasquale", "ordine": 12 },
        { "id": "quaresima", "nome": "Quaresima", "ordine": 13 },
        { "id": "natale", "nome": "Tempo di Natale", "ordine": 14 },
        { "id": "vario", "nome": "Vario", "ordine": 15 }
    ],
    "messe": [
        { "id": "gSanto", "nome": "Giovedì Santo" },
        { "id": "vSanto", "nome": "Venerdì Santo" },
        { "id": "sSanto", "nome": "Sabato Santo" },
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