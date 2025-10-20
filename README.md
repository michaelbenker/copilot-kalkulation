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
   npm install -D @types/google-apps-script
   ```

### Entwicklung

- **Code bearbeiten**: Bearbeite `src/Code.ts` und andere TypeScript-Dateien
- **Code hochladen**: `clasp push`
- **Code herunterladen**: `clasp pull`
- **Logs anzeigen**: `clasp logs`
- **Script öffnen**: `clasp open`

### Deployment

1. Code mit clasp pushen:

   ```bash
   clasp push
   ```

2. In Google Apps Script Editor:
   - Gehe zu **Deploy** → **New deployment**
   - Wähle **Web app**
   - Setze **Execute as**: Me
   - Setze **Who has access**: Anyone (für geheime URL)
   - Kopiere die Web-App URL

## Konfiguration

In [src/Code.ts](src/Code.ts) müssen folgende Werte konfiguriert werden:

```typescript
const CONFIG = {
  TEMPLATE_ID: "DEINE_TEMPLATE_SPREADSHEET_ID", // Google Sheets Template-ID (example.xlsx)

  // Copilot Events API Konfiguration
  COPILOT_BASE_API_URL: "https://copilot.events", // Basis-URL der Copilot API
  INSTANCE_ID: "dreigroschen", // Instanz-ID
  BENUTZERFELD_ID: "55c6136e-29c9-4df8-977e-80da350bee09", // ID des Benutzerfelds
  API_TOKEN: "d0fe9006-a5dc-4b43-b359-2f2ceb16b0f6", // Bearer Token

  // Web-App Security
  SECRET_URL_PARAM: "secret",
  SECRET_VALUE: "dein-geheimer-wert", // Geheimer Wert für URL-Zugriff
};
```

### Template-ID ermitteln

1. Öffne dein Template-Spreadsheet (example.xlsx) in Google Sheets
2. Kopiere die ID aus der URL: `https://docs.google.com/spreadsheets/d/{TEMPLATE_ID}/edit`

## Verwendung

Die Web-App wird mit folgender URL aufgerufen:

```
https://script.google.com/macros/s/{DEPLOYMENT_ID}/exec?secret={SECRET_VALUE}&eventId={EVENT_ID}
```

**Beispiel:**

```
https://script.google.com/macros/s/AKfy...xyz/exec?secret=mein-geheimer-wert&eventId=fdf2b5c2-94e3-41a7-a888-3bea5760661e
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
--header 'Authorization: Bearer d0fe9006-a5dc-4b43-b359-2f2ceb16b0f6' \
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
--header 'Authorization: Bearer d0fe9006-a5dc-4b43-b359-2f2ceb16b0f6' \
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
└── README.md             # Diese Datei
```

## Response

Nach erfolgreicher Ausführung zeigt die Web-App:

- Event-ID
- Generierte Spreadsheet-URL
- API-Status (Erfolgreich/Fehler)

## Lizenz

Private
