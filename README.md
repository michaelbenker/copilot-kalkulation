# Copilot Kalkulation - Google Apps Script Web-App

Eine Google Apps Script Web-App, die automatisch ein neues Spreadsheet aus einem Template erstellt und die Spreadsheet-URL per API an Copilot Events zurückschreibt.

## Funktionsweise

1. Web-App wird über geheime URL mit `eventId` Parameter aufgerufen
2. Ruft Event-Daten per GraphQL von Copilot Events API ab
3. Erstellt neues Spreadsheet vom Template (example.xlsx)
4. Befüllt Zellen B1, B2, B3, D2 mit Event-Daten:
   - **B1**: Event-Name
   - **B2**: Start-Datum
   - **B3**: End-Datum
   - **D2**: Erstellungszeitpunkt
5. Setzt Freigabe auf "Jeder mit Link" (geheime URL)
6. Schreibt Spreadsheet-URL per PUT-Request an Copilot Events API zurück

## Technologie

- **Google Apps Script** (TypeScript)
- **clasp** für lokale Entwicklung
- **UrlFetchApp** für API-Aufrufe

## Setup

### Voraussetzungen

- Node.js installiert
- Google Apps Script Extension in VS Code
- clasp installiert: `npm install -g @google/clasp`
- Google Account mit Apps Script Zugriff

### Installation

1. Repository klonen
2. Bei clasp anmelden (falls noch nicht geschehen):
   ```bash
   clasp login
   ```

3. TypeScript-Abhängigkeiten installieren:
   ```bash
   npm install -D @types/google-apps-script typescript
   ```

### Entwicklung

- **Code bearbeiten**: Bearbeite `src/Code.ts` und andere TypeScript-Dateien
- **Kompilieren und pushen**: `npx tsc && clasp push --force`
- **Testen**: Im Script Editor `testScript` ausführen
- **Logs anzeigen**: Im Script Editor → Ausführungsprotokoll
- **Script öffnen**: Im Browser [script.google.com](https://script.google.com)

### Deployment

1. Code mit clasp pushen:
   ```bash
   npx tsc && clasp push --force
   ```

2. In Google Apps Script Editor:
   - Gehe zu **Deploy** → **New deployment**
   - Wähle **Web app**
   - Setze **Execute as**: Me
   - Setze **Who has access**: Anyone (für geheime URL)
   - Kopiere die Web-App URL

## Konfiguration

**Secrets werden als Script Properties gespeichert**, nicht im Code (Git Guardian Security).

### Script Properties setzen

**Option 1: Setup-Funktion ausführen**

Im Script Editor:
1. Wähle Funktion `setupScriptProperties` aus dem Dropdown
2. Klicke **Ausführen**
3. Passe die Werte in der Funktion vorher an

**Option 2: Manuell setzen**

Im Script Editor:
1. **Projekteinstellungen** (⚙️) → **Script Properties**
2. **Eigenschaft hinzufügen** für jede Property

**Erforderliche Properties:**

| Property | Beispiel | Beschreibung |
|----------|----------|--------------|
| `TEMPLATE_ID` | `1NhO...OI0` | Google Sheets Template-ID |
| `API_TOKEN` | `d0fe9006-...` | Bearer Token für Copilot Events API |
| `SECRET_VALUE` | `K9mL7p...` | Geheimer Wert für URL-Zugriff |
| `BENUTZERFELD_ID` | `55c6136e-...` | ID des Benutzerfelds in Copilot Events |
| `INSTANCE_ID` | `dreigroschen` | Copilot Events Instanz-ID |
| `COPILOT_BASE_API_URL` | `https://copilot.events` | Basis-URL der API |

### Template-ID ermitteln
1. Öffne dein Template-Spreadsheet in Google Sheets
2. Kopiere die ID aus der URL: `https://docs.google.com/spreadsheets/d/{TEMPLATE_ID}/edit`

## Verwendung

Die Web-App wird mit folgender URL aufgerufen:

```
https://script.google.com/macros/s/{DEPLOYMENT_ID}/exec?secret={SECRET_VALUE}&eventId={EVENT_ID}
```

**Beispiel:**
```
https://script.google.com/macros/s/AKfy...xyz/exec?secret=K9mL7pQ2xN8wR4vB5tYh&eventId=ad5e98fb-259d-4088-9f78-df112f9a9b3d
```

### API-Integration

#### 1. GraphQL: Event-Daten abrufen

```
POST {COPILOT_BASE_API_URL}/{INSTANCE_ID}/api/graph
```

**Request:**
```bash
curl --location 'https://copilot.events/dreigroschen/api/graph' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer {API_TOKEN}' \
--data '{
    "operationName": "getSimpleEvent",
    "variables": {
        "id": "ad5e98fb-259d-4088-9f78-df112f9a9b3d"
    }
}'
```

#### 2. PUT: Spreadsheet-URL zurückschreiben

```
PUT {COPILOT_BASE_API_URL}/{INSTANCE_ID}/api/events/{eventId}/benutzerfelder/{BENUTZERFELD_ID}
```

**Request:**
```bash
curl --location --request PUT 'https://copilot.events/dreigroschen/api/events/{eventId}/benutzerfelder/55c6136e-29c9-4df8-977e-80da350bee09' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer {API_TOKEN}' \
--data '{
  "value": "{spreadsheetUrl}"
}'
```

## Projektstruktur

```
.
├── src/
│   ├── Code.ts           # Hauptlogik der Web-App
│   └── Page.html         # UI mit Button (nicht verwendet)
├── appsscript.json       # Apps Script Manifest
├── tsconfig.json         # TypeScript-Konfiguration
├── .claspignore          # Ignorierte Dateien für clasp
├── .gitignore            # Git ignore (node_modules, build, .clasp.json)
└── README.md             # Diese Datei
```

## Response

Nach erfolgreicher Ausführung zeigt die Web-App:
- Event-ID
- Generierte Spreadsheet-URL
- API-Status (Erfolgreich/Fehler)

## Sicherheit

- ✅ Secrets in Script Properties (nicht im Code)
- ✅ `.clasp.json` in `.gitignore` (enthält Script-ID)
- ✅ URL-Parameter-Validierung
- ✅ Geheime URL mit Secret-Token

## Lizenz

Private
