const Database = require('better-sqlite3');
const path = require('path');

// Ruta a la base de datos
const dbPath = path.join(__dirname, 'local.db');

// Crear conexión a la base de datos
const db = new Database(dbPath);

console.log('Agregando columna salon_id a la tabla calendario...');

try {
  // Agregar la columna salon_id a la tabla calendario
  db.exec(`
    ALTER TABLE calendario 
    ADD COLUMN salon_id INTEGER 
    REFERENCES salones(id)
  `);
  console.log('Columna salon_id agregada exitosamente a la tabla calendario.');
} catch (err) {
  if (err.message.includes('duplicate column name')) {
    console.log('La columna salon_id ya existe en la tabla calendario.');
  } else {
    console.error('Error al agregar la columna salon_id:', err.message);
  }
} finally {
  // Cerrar la conexión
  db.close();
  console.log('Conexión a la base de datos cerrada.');
}
