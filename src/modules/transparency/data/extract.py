import os
import sys
import json
import requests
from bs4 import BeautifulSoup
import pdfplumber
import pandas as pd

def download_file(url, out_path):
    print(f"Downloading {url}...")
    headers = {'User-Agent': 'LinguaLibreDashboardBot/1.0 (bot@lingualibre.org)'}
    r = requests.get(url, headers=headers)
    with open(out_path, 'wb') as f:
        f.write(r.content)

def extract_tables_from_pdf(pdf_path):
    print(f"Extracting tables from {pdf_path}")
    extracted_data = []
    
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            tables = page.extract_tables({"snap_tolerance": 3, "intersection_tolerance": 3})
            for table in tables:
                if not table: continue
                # find header row
                header_idx = -1
                for i, row in enumerate(table):
                    row_texts = [str(x).lower().strip() if x else '' for x in row]
                    if any('date' in x for x in row_texts) and any('montant' in x for x in row_texts):
                        header_idx = i
                        break
                
                if header_idx != -1:
                    # Parse from header_idx + 1
                    headers_list = [str(h).strip().replace('\n', ' ') if h else '' for h in table[header_idx]]
                    
                    for row in table[header_idx+1:]:
                        if not row: continue
                        if all(x is None or str(x).strip() == '' for x in row): continue
                        
                        entry = {}
                        for i, cell in enumerate(row):
                            val = str(cell).strip().replace('\n', ' ') if cell else ""
                            if i < len(headers_list) and headers_list[i]:
                                entry[headers_list[i]] = val
                        
                        if entry:
                            extracted_data.append(entry)

    return extracted_data

def main():
    base_dir = "/home/yug/Documents/lingualibre.org/src/components/wmfr-pdf"
    html_file = os.path.join(base_dir, "depenses")
    pdf_dir = os.path.join(base_dir, "pdfs")
    
    os.makedirs(pdf_dir, exist_ok=True)
    
    with open(html_file, 'r', encoding='utf-8') as f:
        html_content = f.read()
    
    soup = BeautifulSoup(html_content, 'html.parser')
    links = soup.find_all('a', href=True)
    pdf_urls = [a['href'] for a in links if a['href'].endswith('.pdf')]
    
    all_spendings = []
    
    for url in pdf_urls:
        filename = url.split('/')[-1]
        pdf_path = os.path.join(pdf_dir, filename)
        
        # force re-download if it was the error page
        redownload = False
        if os.path.exists(pdf_path):
            with open(pdf_path, 'rb') as f:
                head = f.read(20)
                if b'Please set a user-agent' in head:
                    redownload = True
        
        if not os.path.exists(pdf_path) or redownload:
            download_file(url, pdf_path)
            
        try:
            data = extract_tables_from_pdf(pdf_path)
            # Tag with the source
            for d in data:
                d['SourcePDF'] = filename
            all_spendings.extend(data)
        except Exception as e:
            print(f"Error processing {filename}: {e}")
            
    # Normalize headers
    output_data = []
    for row in all_spendings:
        normalized_row = {
            "Date": "",
            "Montant TTC": "",
            "Motif": "",
            "Projet associé": "",
            "Personne associée": "",
            "Identifiant": "",
            "SourcePDF": row.get("SourcePDF", "")
        }
        for k, v in row.items():
            k_lower = k.lower()
            if 'date' in k_lower:
                normalized_row['Date'] = v
            elif 'montant' in k_lower:
                normalized_row['Montant TTC'] = v
            elif 'motif' in k_lower or 'libell' in k_lower or 'description' in k_lower:
                normalized_row['Motif'] = v
            elif 'projet' in k_lower:
                normalized_row['Projet associé'] = v
            elif 'personne' in k_lower or 'bénéficiaire' in k_lower or 'acteur' in k_lower:
                normalized_row['Personne associée'] = v
            elif 'identifiant' in k_lower or 'id ' in k_lower or ' réf ' in k_lower or k_lower == 'id':
                normalized_row['Identifiant'] = v
        
        # Keep it if at least Date or Montant or Motif are present
        if normalized_row['Date'] or normalized_row['Montant TTC'] or normalized_row['Motif']:
            output_data.append(normalized_row)
            
    out_json = os.path.join(base_dir, "spendings_data.json")
    with open(out_json, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)
        
    print(f"Extraction complete. Wrote {len(output_data)} entries to {out_json}")

if __name__ == "__main__":
    main()
