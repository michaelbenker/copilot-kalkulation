#!/usr/bin/env node

/**
 * Upload .env Werte zu Google Apps Script Properties
 *
 * Verwendung: node scripts/upload-env.js
 */

const fs = require('fs');
const path = require('path');

// .env Datei laden
const envPath = path.join(__dirname, '..', '.env');

if (!fs.existsSync(envPath)) {
  console.error('❌ .env Datei nicht gefunden!');
  console.error('   Kopiere .env.example zu .env und fülle die Werte aus.');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};

// Parse .env
envContent.split('\n').forEach(line => {
  line = line.trim();
  if (line && !line.startsWith('#')) {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  }
});

// Generiere Apps Script Code
const setupCode = `
/**
 * AUTOMATISCH GENERIERT aus .env
 * Führe diese Funktion im Script Editor aus, um Properties zu setzen
 */
function setupScriptPropertiesFromEnv() {
  const props = PropertiesService.getScriptProperties();

  props.setProperties(${JSON.stringify(envVars, null, 2)});

  Logger.log("✅ Script Properties erfolgreich aus .env gesetzt!");
  Logger.log("Properties: " + JSON.stringify(props.getProperties()));
}
`;

// Schreibe in temporäre Datei
const outputPath = path.join(__dirname, '..', 'src', 'SetupEnv.ts');
fs.writeFileSync(outputPath, setupCode);

console.log('✅ Setup-Code generiert: src/SetupEnv.ts');
console.log('');
console.log('📋 Nächste Schritte:');
console.log('   1. npx tsc && clasp push --force');
console.log('   2. Im Script Editor: setupScriptPropertiesFromEnv() ausführen');
console.log('   3. src/SetupEnv.ts löschen (nicht committen!)');
console.log('');
console.log('Gesetzte Properties:');
Object.keys(envVars).forEach(key => {
  const value = envVars[key];
  const masked = value.length > 10 ? value.substring(0, 10) + '...' : value;
  console.log(`   ${key}: ${masked}`);
});
