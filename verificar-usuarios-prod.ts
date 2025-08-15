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

async function verificarUsuarios() {
  console.log('=== VERIFICANDO USUARIOS EN PRODUCCIÓN ===\n');

  try {
    // Verificar todos los usuarios
    console.log('1. Todos los usuarios:');
    const usuarios = await db.select().from(schema.usuarios);
    console.log(`Total usuarios: ${usuarios.length}`);
    usuarios.forEach(usuario => {
      console.log(`  - ID: ${usuario.id}, Nombre: ${usuario.nombre}, Correo: ${usuario.correo}, Rol: ${usuario.rol}`);
    });

    // Verificar alumnos específicamente
    console.log('\n2. Alumnos:');
    const alumnos = await db
      .select({
        id: schema.alumnos.id,
        usuarioId: schema.alumnos.usuario_id,
        matricula: schema.alumnos.matricula,
        nombre: schema.usuarios.nombre,
        correo: schema.usuarios.correo
      })
      .from(schema.alumnos)
      .innerJoin(schema.usuarios, eq(schema.alumnos.usuario_id, schema.usuarios.id));

    console.log(`Total alumnos: ${alumnos.length}`);
    alumnos.forEach(alumno => {
      console.log(`  - ID: ${alumno.id}, Usuario ID: ${alumno.usuarioId}, Matrícula: ${alumno.matricula}, Nombre: ${alumno.nombre}, Correo: ${alumno.correo}`);
    });

    // Verificar credenciales específicas
    console.log('\n3. Verificando credenciales específicas:');
    
    // Buscar por correo
    const usuarioPorCorreo = await db
      .select()
      .from(schema.usuarios)
      .where(eq(schema.usuarios.correo, 'angel@gmail.com'))
      .limit(1);
    
    if (usuarioPorCorreo.length > 0) {
      console.log('✅ Usuario angel@gmail.com encontrado:', usuarioPorCorreo[0]);
      
      // Buscar si es alumno
      const alumno = await db
        .select()
        .from(schema.alumnos)
        .where(eq(schema.alumnos.usuario_id, usuarioPorCorreo[0].id))
        .limit(1);
      
      if (alumno.length > 0) {
        console.log('✅ Es alumno con matrícula:', alumno[0].matricula);
      } else {
        console.log('❌ No es alumno');
      }
    } else {
      console.log('❌ Usuario angel@gmail.com no encontrado');
    }

    // Buscar por matrícula
    const alumnoPorMatricula = await db
      .select({
        id: schema.alumnos.id,
        matricula: schema.alumnos.matricula,
        nombre: schema.usuarios.nombre,
        correo: schema.usuarios.correo
      })
      .from(schema.alumnos)
      .innerJoin(schema.usuarios, eq(schema.alumnos.usuario_id, schema.usuarios.id))
      .where(eq(schema.alumnos.matricula, '123456789'))
      .limit(1);

    if (alumnoPorMatricula.length > 0) {
      console.log('✅ Alumno con matrícula 123456789 encontrado:', alumnoPorMatricula[0]);
    } else {
      console.log('❌ Alumno con matrícula 123456789 no encontrado');
    }

  } catch (error) {
    console.error('❌ Error al verificar usuarios:', error);
  }
}

verificarUsuarios()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
