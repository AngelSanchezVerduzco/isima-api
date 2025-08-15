import fetch from 'node-fetch';

async function testEndpointLogin() {
  console.log('=== PROBANDO ENDPOINT DE LOGIN ===\n');

  try {
    const API_URL = 'https://isima-api-production.up.railway.app';
    const loginData = {
      correo: 'angel@gmail.com',
      contraseña: '123456789'
    };

    console.log('Enviando datos de login:', loginData);

    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginData)
    });

    console.log(`Status: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Login exitoso:');
      console.log('Usuario:', data.usuario);
      console.log('Token recibido:', data.access_token ? 'SÍ' : 'NO');
    } else {
      const errorData = await response.text();
      console.log('❌ Error en login:');
      console.log('Respuesta del servidor:', errorData);
    }

  } catch (error) {
    console.error('❌ Error al conectar con el endpoint:', error.message);
  }
}

testEndpointLogin()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
