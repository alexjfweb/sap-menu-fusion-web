import 'dotenv/config';
import { Client } from 'pg';

console.log('DEBUG DATABASE_URL:', process.env.DATABASE_URL); // Log de depuración

// Usa la variable de entorno DATABASE_URL
const connectionString = process.env.DATABASE_URL;

async function testSqlConnection() {
  if (!connectionString) {
    console.error('❌ No se encontró la variable de entorno DATABASE_URL.');
    process.exit(1);
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }, // Necesario para Supabase
  });

  try {
    await client.connect();
    const result = await client.query('SELECT * FROM products LIMIT 1;');
    if (result.rows.length > 0) {
      console.log('✅ Conexión SQL directa exitosa. Primer producto:', result.rows[0]);
    } else {
      console.log('✅ Conexión SQL directa exitosa, pero la tabla products está vacía.');
    }
  } catch (error) {
    console.error('❌ Error en la conexión SQL directa:', error.message);
  } finally {
    await client.end();
  }
}

testSqlConnection(); 