const selfsigned = require('selfsigned');
const fs = require('fs');
const path = require('path');

// Generar certificados autofirmados
const attributes = [{ name: 'commonName', value: 'localhost' }];
const pems = selfsigned.generate(attributes, { 
  days: 365, // Válido por un año
  keySize: 2048 
});

// Crear el directorio de certificados si no existe
const certsDir = path.join(__dirname, 'certs');
if (!fs.existsSync(certsDir)) {
  fs.mkdirSync(certsDir);
}

// Guardar los certificados
fs.writeFileSync(path.join(certsDir, 'key.pem'), pems.private);
fs.writeFileSync(path.join(certsDir, 'cert.pem'), pems.cert);

console.log('Certificados SSL generados en el directorio "certs"');
console.log('- Clave privada: certs/key.pem');
console.log('- Certificado: certs/cert.pem');
