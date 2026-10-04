import json
import csv
from datetime import datetime

tsv_path = "/home/yug/Documents/lingualibre.org/src/components/funds/spendings/table"
json_path = "/home/yug/Documents/lingualibre.org/src/components/funds/spendings/spendings_data.json"

def format_date(date_str):
    try:
        dt = datetime.strptime(date_str, "%Y-%m-%d")
        return dt.strftime("%d/%m/%Y")
    except ValueError:
        return date_str

with open(tsv_path, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f, delimiter='\t')
    new_entries = []
    for row in reader:
        # identifiant	Date	Moti	Personne associée	Projet associée	Étape	Montant TTC
        # Handle typo in header 'Moti'
        motif = row.get('Moti', '') or row.get('Motif', '')
        
        # Format amount - insert space before Euro sign if not present
        montant = row.get('Montant TTC', '').strip()
        if montant.endswith('€') and not montant.endswith(' €'):
            montant = montant[:-1] + ' €'
            
        entry = {
            "Date": format_date(row.get('Date', '')),
            "Montant TTC": montant,
            "Motif": motif,
            "Projet associé": row.get('Projet associée', ''),
            "Personne associée": row.get('Personne associée', ''),
            "Identifiant": row.get('identifiant', row.get('Identifiant', '')),
            "SourcePDF": "legacy_table"
        }
        new_entries.append(entry)

with open(json_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

# Combine, put new_entries at the beginning
combined_data = new_entries + data

with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(combined_data, f, ensure_ascii=False, indent=2)

print(f"Added {len(new_entries)} entries to {json_path}")
