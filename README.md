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

**Workflow:**

```bash
# Code bearbeiten in src/Code.ts

# Kompilieren und pushen
npm run push

# Oder manuell
npx tsc && clasp push --force
```

**Testen ohne Deployment:**

1. Im Script Editor: Funktion `testScript` auswählen
2. **Ausführen** klicken
3. **Ausführungsprotokoll** öffnen für Logs

**Vorteile:**
- ✅ Kein Deployment nötig
- ✅ Schnellere Iteration
- ✅ Detaillierte Logs
- ✅ Direktes Debugging

### Deployment

**Erstmaliges Deployment:**

1. Code pushen:
   ```bash
   npm run push
   ```

2. Im Google Apps Script Editor:
   - **Bereitstellen** → **Neue Bereitstellung**
   - Typ: **Web-App** auswählen
   - **Beschreibung**: z.B. "v1.0"
   - **Ausführen als**: Ich
   - **Zugriff**: Jeder
   - **Bereitstellen** klicken
   - **Web-App URL kopieren**

3. Bei erster Ausführung: Berechtigungen erteilen
   - **Erweitert** klicken
   - **Zu copilot-kalkulation wechseln (unsicher)**
   - Alle Berechtigungen **Zulassen**

**Updates deployen:**

1. Code ändern und pushen:
   ```bash
   npm run push
   ```

2. Im Script Editor:
   - **Bereitstellen** → **Bereitstellungen verwalten**
   - **Stift-Symbol** (Bearbeiten) klicken
   - **Neue Version** auswählen
   - **Bereitstellen**

Die URL bleibt gleich, nur die Version ändert sich.

## Konfiguration

**Secrets werden als Script Properties gespeichert**, nicht im Code (Git Guardian Security).

### Script Properties setzen

**Option 1: Aus .env hochladen (empfohlen)**

1. Kopiere `.env.example` zu `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fülle `.env` mit deinen Werten aus

3. Generiere Setup-Code:
   ```bash
   npm run setup-env
   ```

4. Push und im Script Editor ausführen:
   ```bash
   npm run push
   # Im Script Editor: setupScriptPropertiesFromEnv() ausführen
   ```

5. Lösche `src/SetupEnv.ts` (nicht committen!)

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

**URL-Parameter:**
- `secret`: Geheimer Wert aus Script Properties (`SECRET_VALUE`)
- `eventId`: UUID des Events in Copilot Events

**Beispiel:**
```
https://script.google.com/macros/s/AKfycbyfMxW-1NtQhpq3zoAe1JKS8Uc17O1bnvQ-rRJXPxtAtdUUi3jfzkCLlYnHEn8rn1Cn/exec?secret=K9mL7pQ2xN8wR4vB5tYh&eventId=ad5e98fb-259d-4088-9f78-df112f9a9b3d
```

**Response bei Erfolg:**
```html
<h1>Spreadsheet erstellt</h1>
<p>Event-ID: ad5e98fb-259d-4088-9f78-df112f9a9b3d</p>
<p>Link: <a href="https://docs.google.com/spreadsheets/d/...">https://docs.google.com/spreadsheets/d/...</a></p>
<p>API-Status: Erfolgreich (204)</p>
```

**Response bei Fehler:**
- `Zugriff verweigert`: Secret-Parameter fehlt oder falsch
- `Fehler: eventId fehlt`: eventId-Parameter nicht übergeben
- `Error: ...`: Technischer Fehler (siehe Ausführungsprotokoll)

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
│   ├── Code.ts           # Hauptlogik der Web-App (TypeScript)
│   └── Page.html         # UI mit Button (nicht verwendet)
├── scripts/
│   └── upload-env.js     # Hilfsskript: .env → Script Properties
├── build/
│   └── Code.js           # Kompiliertes JavaScript (nicht committen)
├── .env.example          # Template für lokale Secrets
├── .env                  # Lokale Secrets (nicht committen)
├── .clasp.json           # clasp Konfiguration (nicht committen)
├── .claspignore          # Ignorierte Dateien für clasp
├── .gitignore            # Git ignore
├── appsscript.json       # Apps Script Manifest
├── tsconfig.json         # TypeScript-Konfiguration
├── package.json          # npm Scripts und Dependencies
└── README.md             # Diese Datei
```

## Was macht die App genau?

1. **Empfängt Request** mit `secret` und `eventId`
2. **Validiert Secret** (Script Property `SECRET_VALUE`)
3. **Ruft GraphQL API** auf mit Event-ID
4. **Parsed Event-Daten**:
   - `displayName` → Spreadsheet B1
   - `start` → Spreadsheet B2
   - `end` → Spreadsheet B3 (falls vorhanden)
   - Aktuelles Datum → Spreadsheet D2
5. **Kopiert Template** und befüllt Zellen
6. **Setzt Freigabe** auf "Jeder mit Link"
7. **PUT-Request** an Copilot Events API mit Spreadsheet-URL
8. **Zeigt Erfolgsmeldung** mit Links

## Sicherheit

- ✅ **Secrets in Script Properties** (nicht im Code)
- ✅ **`.env` in `.gitignore`** (lokale Secrets werden nicht committed)
- ✅ **`.clasp.json` in `.gitignore`** (enthält Script-ID)
- ✅ **URL-Parameter-Validierung** (Secret wird geprüft)
- ✅ **Geheime URL** mit Secret-Token
- ✅ **Private Git Repository** (Secrets im Commit-History sind akzeptabel)

## Troubleshooting

### "Script-Funktion nicht gefunden: doGet"
- **Lösung**: Code nicht gepusht → `npm run push`
- Neue Deployment-Version erstellen

### "Zugriff verweigert"
- **Lösung**: Secret-Parameter falsch oder fehlt
- Prüfe `SECRET_VALUE` in Script Properties

### "Cannot read properties of undefined"
- **Lösung**: Script Properties nicht gesetzt
- Führe `npm run setup-env` und `setupScriptPropertiesFromEnv()` aus

### "Service Spreadsheets failed"
- **Lösung**: Template-ID falsch oder keine Berechtigung
- Prüfe `TEMPLATE_ID` in Script Properties
- Template auf "Jeder mit Link" freigeben

### Event-Daten werden nicht eingetragen
- **Lösung**: GraphQL Response hat anderes Format
- Prüfe Logs im Ausführungsprotokoll
- Passe Feldnamen in `src/Code.ts` an

### API-Request schlägt fehl (nicht 204)
- **Lösung**: API_TOKEN ungültig oder falsche URL
- Prüfe Token und Benutzerfeld-ID in Script Properties
- Teste API-Request mit curl

## npm Scripts

```bash
npm run build        # TypeScript kompilieren
npm run push         # Build + clasp push
npm run setup-env    # .env → Setup-Code generieren
```

## Lizenz

Private
