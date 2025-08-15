import * as dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { eq } from 'drizzle-orm';
import * as schema from './src/database/schema';

const client = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

const db = drizzle(client, { schema });

async function testLogin() {
  console.log('=== PROBANDO PROCESO DE LOGIN ===\n');

  try {
    const correo = 'angel@gmail.com';
    const matricula = '123456789';

    console.log(`Probando login con: ${correo} / ${matricula}\n`);

    // Paso 1: Buscar usuario por correo
    console.log('1. Buscando usuario por correo...');
    const usuario = await db
      .select()
      .from(schema.usuarios)
      .where(eq(schema.usuarios.correo, correo))
      .limit(1);

    if (usuario.length === 0) {
      console.log('❌ Usuario no encontrado');
      return;
    }

    console.log('✅ Usuario encontrado:', {
      id: usuario[0].id,
      nombre: usuario[0].nombre,
      correo: usuario[0].correo,
      rol: usuario[0].rol
    });

    // Paso 2: Buscar alumno por usuario_id
    console.log('\n2. Buscando alumno por usuario_id...');
    const alumno = await db
      .select()
      .from(schema.alumnos)
      .where(eq(schema.alumnos.usuario_id, usuario[0].id))
      .limit(1);

    if (alumno.length === 0) {
      console.log('❌ Alumno no encontrado para este usuario');
      return;
    }

    console.log('✅ Alumno encontrado:', {
      id: alumno[0].id,
      usuario_id: alumno[0].usuario_id,
      matricula: alumno[0].matricula
    });

    // Paso 3: Verificar matrícula
    console.log('\n3. Verificando matrícula...');
    const isMatriculaValid = matricula === alumno[0].matricula;
    console.log(`Matrícula recibida: ${matricula}`);
    console.log(`Matrícula en BD: ${alumno[0].matricula}`);
    console.log(`¿Coinciden?: ${isMatriculaValid ? '✅ SÍ' : '❌ NO'}`);

    if (isMatriculaValid) {
      console.log('\n✅ LOGIN EXITOSO - Credenciales válidas');
    } else {
      console.log('\n❌ LOGIN FALLIDO - Matrícula incorrecta');
    }

  } catch (error) {
    console.error('❌ Error durante el test de login:', error);
  }
}

testLogin()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
