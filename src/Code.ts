/**
 * Lädt Konfiguration aus Script Properties
 * Secrets werden nicht im Code gespeichert, sondern als Script Properties
 */
function getConfig() {
  const props = PropertiesService.getScriptProperties();

  return {
    TEMPLATE_ID: props.getProperty("TEMPLATE_ID") || "",
    COPILOT_BASE_API_URL: props.getProperty("COPILOT_BASE_API_URL") || "https://copilot.events",
    INSTANCE_ID: props.getProperty("INSTANCE_ID") || "dreigroschen",
    BENUTZERFELD_ID: props.getProperty("BENUTZERFELD_ID") || "",
    API_TOKEN: props.getProperty("API_TOKEN") || "",
    SECRET_URL_PARAM: "secret",
    SECRET_VALUE: props.getProperty("SECRET_VALUE") || "",
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
    Logger.log("Spreadsheet erstellt: " + result.url);
    Logger.log("API-Status: " + result.apiStatus);

    Logger.log("=== TEST ERFOLGREICH ===");
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
    return HtmlService.createHtmlOutput("<h1>Fehler: Keine Parameter empfangen</h1>");
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
    return HtmlService.createHtmlOutput(`
      <h1>Spreadsheet erstellt</h1>
      <p>Event-ID: ${eventId}</p>
      <p>Link: <a href="${result.url}" target="_blank">${result.url}</a></p>
      <p>API-Status: ${result.apiStatus}</p>
    `);
  } catch (error) {
    Logger.log("Fehler in doGet: " + error);
    return HtmlService.createHtmlOutput(`<h1>Fehler</h1><p>${error}</p>`);
  }
}

/**
 * Erstellt Spreadsheet vom Template, befüllt es und ruft API auf
 */
function createAndProcessSpreadsheet(eventId: string): {
  url: string;
  apiStatus: string;
} {
  try {
    // 1. Event-Daten von API abrufen
    const eventData = getEventData(eventId);
    if (!eventData) {
      throw new Error("Event-Daten konnten nicht abgerufen werden");
    }

    // 2. Template kopieren
    const template = DriveApp.getFileById(CONFIG.TEMPLATE_ID);
    const fileName =
      "Kalkulation " +
      (eventData.displayName || eventData.name || eventId) +
      " - " +
      new Date().toLocaleString("de-DE");
    const newFile = template.makeCopy(fileName);

    // Warte kurz, damit die Datei verfügbar ist
    Utilities.sleep(1000);

    const spreadsheet = SpreadsheetApp.openById(newFile.getId());

    // 3. Felder mit Event-Daten befüllen
    const sheet = spreadsheet.getActiveSheet();
    sheet.getRange("B1").setValue(eventData.displayName || eventData.name || "");
    sheet.getRange("B2").setValue(eventData.start || eventData.startDate || "");
    sheet.getRange("B3").setValue(eventData.end || eventData.endDate || "");
    sheet.getRange("D2").setValue(new Date().toLocaleString("de-DE"));

    // 4. Freigabe setzen (geheime URL mit ANYONE_WITH_LINK)
    newFile.setSharing(
      DriveApp.Access.ANYONE_WITH_LINK,
      DriveApp.Permission.EDIT
    );
    const spreadsheetUrl = spreadsheet.getUrl();

    // 5. API aufrufen - Spreadsheet-URL zurückschreiben
    const apiResult = updateEventBenutzerfeld(eventId, spreadsheetUrl);

    return {
      url: spreadsheetUrl,
      apiStatus: apiResult,
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

    const payload = {
      value: spreadsheetUrl,
    };

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
    const response = UrlFetchApp.fetch(apiUrl, options);
    const responseCode = response.getResponseCode();

    if (responseCode === 200 || responseCode === 201 || responseCode === 204) {
      Logger.log("API-Erfolg: " + responseCode);
      return "Erfolgreich (" + responseCode + ")";
    } else {
      Logger.log("API-Fehler: " + response.getContentText());
      return "Fehler (" + responseCode + "): " + response.getContentText();
    }
  } catch (error) {
    Logger.log("API-Aufruf fehlgeschlagen: " + error);
    return "Fehler: " + error;
  }
}
