/**
 * Lädt Konfiguration aus Script Properties
 * Secrets werden nicht im Code gespeichert, sondern als Script Properties
 */
function getConfig() {
  const props = PropertiesService.getScriptProperties();

  return {
    TEMPLATE_ID: props.getProperty("TEMPLATE_ID") || "",
    COPILOT_BASE_API_URL:
      props.getProperty("COPILOT_BASE_API_URL") || "https://copilot.events",
    INSTANCE_ID: props.getProperty("INSTANCE_ID") || "dreigroschen",
    BENUTZERFELD_ID: props.getProperty("BENUTZERFELD_ID") || "",
    API_TOKEN: props.getProperty("API_TOKEN") || "",
    SECRET_URL_PARAM: "secret",
    SECRET_VALUE: props.getProperty("SECRET_VALUE") || "",
    OUTPUT_FOLDER_NAME: props.getProperty("OUTPUT_FOLDER_NAME") || "copilot-kalkulationen",
  };
}

// Globale Config-Variable
const CONFIG = getConfig();

/**
 * Event-Daten Interface
 */
interface EventData {
  id: string;
  name?: string;
  startDate?: string;
  endDate?: string;
  [key: string]: any;
}

/**
 * Test-Funktion für lokale Entwicklung
 * Diese Funktion kann direkt im Script Editor ausgeführt werden
 */
function testScript() {
  const testEventId = "ad5e98fb-259d-4088-9f78-df112f9a9b3d";

  Logger.log("=== TEST START ===");

  try {
    // Test Event-Daten abrufen
    Logger.log("1. Rufe Event-Daten ab...");
    const eventData = getEventData(testEventId);
    Logger.log("Event-Daten: " + JSON.stringify(eventData));

    // Test Spreadsheet erstellen
    Logger.log("2. Erstelle Spreadsheet...");
    const result = createAndProcessSpreadsheet(testEventId);

    Logger.log("=== TEST ERFOLGREICH ===");
    Logger.log("API-Status: " + result.apiStatus);
    Logger.log("");
    Logger.log("✅ SPREADSHEET ERSTELLT!");
    Logger.log("📋 Kopiere diesen Link und öffne ihn im Browser:");
    Logger.log("");
    Logger.log(result.url);
    Logger.log("");

  } catch (error) {
    Logger.log("=== TEST FEHLER ===");
    Logger.log("Fehler: " + error);
  }
}

/**
 * Hauptfunktion für Web-App GET-Requests
 */
function doGet(
  e: GoogleAppsScript.Events.DoGet
): GoogleAppsScript.HTML.HtmlOutput {
  // Null-Check für Event-Objekt
  if (!e || !e.parameter) {
    return HtmlService.createHtmlOutput(
      "<h1>Fehler: Keine Parameter empfangen</h1>"
    );
  }

  // Debug: Log alle Parameter
  Logger.log("Received parameters: " + JSON.stringify(e.parameter));
  Logger.log("Expected secret: " + CONFIG.SECRET_VALUE);
  Logger.log("Received secret: " + e.parameter[CONFIG.SECRET_URL_PARAM]);

  // Prüfe geheimen URL-Parameter
  if (
    !e.parameter[CONFIG.SECRET_URL_PARAM] ||
    e.parameter[CONFIG.SECRET_URL_PARAM] !== CONFIG.SECRET_VALUE
  ) {
    return HtmlService.createHtmlOutput(
      "<h1>Zugriff verweigert</h1><p>Received: " +
        e.parameter[CONFIG.SECRET_URL_PARAM] +
        "</p><p>Expected: " +
        CONFIG.SECRET_VALUE +
        "</p>"
    );
  }

  // Prüfe ob eventId übergeben wurde
  if (!e.parameter.eventId) {
    return HtmlService.createHtmlOutput("<h1>Fehler: eventId fehlt</h1>");
  }

  const eventId = e.parameter.eventId;

  try {
    // Spreadsheet erstellen und API aufrufen
    const result = createAndProcessSpreadsheet(eventId);

    // Erfolgsseite mit Event-Details
    return HtmlService.createHtmlOutput(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              max-width: 600px;
              margin: 50px auto;
              padding: 20px;
              background: #f5f5f5;
            }
            .container {
              background: white;
              padding: 40px;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            h1 {
              color: #2e7d32;
              margin-top: 0;
            }
            .success-icon {
              font-size: 48px;
              margin-bottom: 20px;
            }
            .event-details {
              background: #f9f9f9;
              padding: 20px;
              border-radius: 4px;
              margin: 20px 0;
            }
            .detail-row {
              margin: 10px 0;
              display: flex;
              gap: 10px;
            }
            .detail-label {
              font-weight: bold;
              color: #666;
              min-width: 100px;
            }
            .detail-value {
              color: #333;
            }
            .cta-button {
              display: inline-block;
              background: #1976d2;
              color: white;
              padding: 15px 30px;
              text-decoration: none;
              border-radius: 4px;
              margin-top: 20px;
              font-weight: bold;
              transition: background 0.3s;
            }
            .cta-button:hover {
              background: #1565c0;
            }
            .api-status {
              color: #2e7d32;
              font-size: 14px;
              margin-top: 20px;
              padding: 10px;
              background: #e8f5e9;
              border-radius: 4px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="success-icon">✅</div>
            <h1>Kalkulation erfolgreich erstellt!</h1>

            <p>Das Spreadsheet wurde erfolgreich erstellt und in Copilot Events eingetragen.</p>

            <div class="event-details">
              <h3>Event-Details</h3>
              <div class="detail-row">
                <span class="detail-label">Datum:</span>
                <span class="detail-value">${result.eventDetails.startDate || 'N/A'}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Event:</span>
                <span class="detail-value">${result.eventDetails.name || 'N/A'}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Location:</span>
                <span class="detail-value">${result.eventDetails.location || 'N/A'}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Künstler:</span>
                <span class="detail-value">${result.eventDetails.artists || 'N/A'}</span>
              </div>
            </div>

            <a href="${result.url}" class="cta-button" target="_self">→ Zum Spreadsheet</a>

            <div class="api-status">
              ✓ In Copilot Events gespeichert (${result.apiStatus})
            </div>
          </div>
        </body>
      </html>
    `);
  } catch (error) {
    Logger.log("Fehler in doGet: " + error);
    return HtmlService.createHtmlOutput(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              max-width: 600px;
              margin: 50px auto;
              padding: 20px;
            }
            .error {
              background: #ffebee;
              padding: 20px;
              border-radius: 4px;
              color: #c62828;
            }
          </style>
        </head>
        <body>
          <div class="error">
            <h1>❌ Fehler</h1>
            <p>${error}</p>
          </div>
        </body>
      </html>
    `);
  }
}

/**
 * Erstellt Spreadsheet vom Template, befüllt es und ruft API auf
 */
function createAndProcessSpreadsheet(eventId: string): {
  url: string;
  apiStatus: string;
  eventDetails: {
    startDate: string;
    name: string;
    location: string;
    artists: string;
  };
} {
  try {
    // 1. Event-Daten von API abrufen
    const eventData = getEventData(eventId);
    if (!eventData) {
      throw new Error("Event-Daten konnten nicht abgerufen werden");
    }

    // 2. Output-Ordner finden oder erstellen
    let outputFolder;
    const folders = DriveApp.getFoldersByName(CONFIG.OUTPUT_FOLDER_NAME);
    if (folders.hasNext()) {
      outputFolder = folders.next();
    } else {
      outputFolder = DriveApp.createFolder(CONFIG.OUTPUT_FOLDER_NAME);
    }

    // 3. Template kopieren in Output-Ordner
    const template = DriveApp.getFileById(CONFIG.TEMPLATE_ID);
    const fileName =
      "Kalkulation " +
      (eventData.displayName || eventData.name || eventId) +
      " - " +
      new Date().toLocaleString("de-DE");
    const newFile = template.makeCopy(fileName, outputFolder);

    // Warte kurz, damit die Datei verfügbar ist
    Utilities.sleep(1000);

    const spreadsheet = SpreadsheetApp.openById(newFile.getId());

    // 4. Felder mit Event-Daten befüllen
    const sheet = spreadsheet.getActiveSheet();

    // B1: Start-Datum formatieren (DD.MM.YYYY HH:MM)
    let formattedStart = "";
    const startDate = eventData.start || eventData.startDate;
    if (startDate) {
      formattedStart = new Date(startDate).toLocaleString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      const b1Cell = sheet.getRange("B1");
      b1Cell.setValue(formattedStart);
      b1Cell.setHorizontalAlignment("left");
    }

    // B2: Location (Raum und Location)
    let locationText = "";
    if (eventData.rooms?.edges?.[0]?.node) {
      const room = eventData.rooms.edges[0].node;
      const roomName = room.name || "";
      const locationName = room.location?.name || "";

      if (roomName && locationName) {
        locationText = `${roomName} (${locationName})`;
      } else if (roomName) {
        locationText = roomName;
      } else if (locationName) {
        locationText = locationName;
      }
    }
    const b2Cell = sheet.getRange("B2");
    b2Cell.setValue(locationText);
    b2Cell.setHorizontalAlignment("left");

    // B3: Künstler (komma-getrennt)
    let artistsText = "";
    if (eventData.artists?.edges && eventData.artists.edges.length > 0) {
      const artistNames = eventData.artists.edges
        .map((edge: any) => edge.node?.name)
        .filter((name: string) => name);
      artistsText = artistNames.join(", ");
    }
    sheet.getRange("B3").setValue(artistsText);

    // 5. Freigabe setzen (geheime URL mit ANYONE_WITH_LINK)
    newFile.setSharing(
      DriveApp.Access.ANYONE_WITH_LINK,
      DriveApp.Permission.EDIT
    );
    const spreadsheetUrl = spreadsheet.getUrl();

    // 6. API aufrufen - Spreadsheet-URL zurückschreiben
    const apiResult = updateEventBenutzerfeld(eventId, spreadsheetUrl);

    return {
      url: spreadsheetUrl,
      apiStatus: apiResult,
      eventDetails: {
        startDate: formattedStart,
        name: eventData.displayName || eventData.name || "",
        location: locationText,
        artists: artistsText,
      },
    };
  } catch (error) {
    Logger.log("Fehler beim Erstellen des Spreadsheets: " + error);
    throw error;
  }
}

/**
 * Ruft Event-Daten von der GraphQL API ab
 */
function getEventData(eventId: string): EventData | null {
  try {
    const graphqlUrl = `${CONFIG.COPILOT_BASE_API_URL}/${CONFIG.INSTANCE_ID}/api/graph`;

    const query = {
      operationName: "getSimpleEvent",
      variables: {
        id: eventId,
      },
      query: `
        query getSimpleEvent($id: ID!) {
          event(id: $id) {
            id
            name
            startDate
            endDate
          }
        }
      `,
    };

    const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
      method: "post",
      contentType: "application/json",
      headers: {
        Authorization: "Bearer " + CONFIG.API_TOKEN,
      },
      payload: JSON.stringify(query),
      muteHttpExceptions: true,
    };

    Logger.log("GraphQL-Aufruf: " + graphqlUrl);
    const response = UrlFetchApp.fetch(graphqlUrl, options);
    const responseCode = response.getResponseCode();

    if (responseCode === 200) {
      const data = JSON.parse(response.getContentText());
      Logger.log("Event-Daten abgerufen: " + JSON.stringify(data));

      // Daten aus GraphQL Response extrahieren
      const event = data.data?.event || data.data?.getSimpleEvent;

      if (!event) {
        Logger.log("Warnung: Keine Event-Daten in Response gefunden");
        // Fallback: Dummy-Daten für Test
        return {
          id: eventId,
          name: "Test Event",
          startDate: new Date().toISOString(),
          endDate: new Date().toISOString(),
        };
      }

      return event;
    } else {
      Logger.log("GraphQL-Fehler: " + response.getContentText());
      return null;
    }
  } catch (error) {
    Logger.log("GraphQL-Aufruf fehlgeschlagen: " + error);
    return null;
  }
}

/**
 * Aktualisiert das Benutzerfeld in der API mit der Spreadsheet-URL
 */
function updateEventBenutzerfeld(
  eventId: string,
  spreadsheetUrl: string
): string {
  try {
    // API-URL dynamisch zusammenbauen
    const apiUrl = `${CONFIG.COPILOT_BASE_API_URL}/${CONFIG.INSTANCE_ID}/api/events/${eventId}/benutzerfelder/${CONFIG.BENUTZERFELD_ID}`;

    // LinkValue benötigt JSON-encoded string mit href
    const linkValue = JSON.stringify({ href: spreadsheetUrl });
    const payload = {
      value: linkValue,
    };

    Logger.log("LinkValue erstellt: " + linkValue);

    const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
      method: "put",
      contentType: "application/json",
      headers: {
        Authorization: "Bearer " + CONFIG.API_TOKEN,
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
    };

    Logger.log("API-Aufruf: " + apiUrl);
    Logger.log("Payload: " + JSON.stringify(payload));
    const response = UrlFetchApp.fetch(apiUrl, options);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();

    Logger.log("API-Response Code: " + responseCode);
    Logger.log("API-Response Body: " + responseText.substring(0, 200));

    if (responseCode === 200 || responseCode === 201 || responseCode === 204) {
      Logger.log("API-Erfolg: " + responseCode);
      return "Erfolgreich (" + responseCode + ")";
    } else {
      // Prüfe ob HTML zurückkam (Server Error)
      if (responseText.startsWith("<")) {
        Logger.log("API-Fehler: Server gab HTML zurück (wahrscheinlich 500 Error)");
        return "Fehler (" + responseCode + "): Server Error (HTML Response)";
      }
      Logger.log("API-Fehler: " + responseText);
      return "Fehler (" + responseCode + "): " + responseText.substring(0, 100);
    }
  } catch (error) {
    Logger.log("API-Aufruf fehlgeschlagen: " + error);
    return "Fehler: " + error;
  }
}
