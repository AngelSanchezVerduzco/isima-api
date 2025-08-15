import fetch from 'node-fetch';

async function testEndpoint() {
  console.log('=== PROBANDO ENDPOINT DIRECTO ===\n');

  try {
    // Simular una petición al endpoint
    const API_URL = 'http://localhost:3000';
    const response = await fetch(`${API_URL}/horarios/horario-grupo-alumno`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer YOUR_TOKEN_HERE', // Necesitarías un token válido
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.log(`❌ Error HTTP: ${response.status}`);
      console.log('Esto es normal si no tienes un token válido');
      return;
    }

    const data = await response.json();
    console.log('✅ Respuesta del endpoint:');
    console.log(JSON.stringify(data, null, 2));

  } catch (error) {
    console.log('❌ Error al conectar con el endpoint:');
    console.log(error.message);
    console.log('\nEsto es normal si el servidor no está corriendo o no tienes un token válido');
  }
}

testEndpoint()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
