import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase
const SUPABASE_URL = "https://hlbbaaewjebasisxgnrt.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhsYmJhYWV3amViYXNpc3hnbnJ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTUwMzA4NiwiZXhwIjoyMDY1MDc5MDg2fQ.ynu_YF1m3_eaC7txH3ZbBRAlRKp5Ni9Lz2bJcXNen04";

// Crear cliente de Supabase con service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function fixEmployeeManagement() {
  console.log('🔧 Iniciando arreglo del sistema de gestión de empleados...\n');

  try {
    // 1. Agregar la columna created_by_email
    console.log('1️⃣ Agregando columna created_by_email...');
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE profiles ADD COLUMN created_by_email TEXT;'
    });
    
    if (alterError) {
      if (alterError.message.includes('already exists')) {
        console.log('✅ La columna created_by_email ya existe');
      } else {
        throw alterError;
      }
    } else {
      console.log('✅ Columna created_by_email agregada exitosamente');
    }

    // 2. Migrar datos existentes
    console.log('\n2️⃣ Migrando datos existentes...');
    const { error: updateError } = await supabase.rpc('exec_sql', {
      sql: `
        UPDATE profiles
        SET created_by_email = (
          SELECT email FROM profiles AS admin
          WHERE admin.id = profiles.created_by
        )
        WHERE role = 'empleado' AND created_by IS NOT NULL;
      `
    });
    
    if (updateError) {
      throw updateError;
    }
    console.log('✅ Datos migrados exitosamente');

    // 3. Crear índice para mejor rendimiento
    console.log('\n3️⃣ Creando índice para mejor rendimiento...');
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_profiles_created_by_email 
        ON profiles(created_by_email) 
        WHERE role = 'empleado';
      `
    });
    
    if (indexError) {
      throw indexError;
    }
    console.log('✅ Índice creado exitosamente');

    // 4. Verificar los resultados
    console.log('\n4️⃣ Verificando resultados...');
    const { data: employees, error: selectError } = await supabase
      .from('profiles')
      .select('id, email, role, created_by, created_by_email, created_at')
      .eq('role', 'empleado')
      .order('created_at', { ascending: false });

    if (selectError) {
      throw selectError;
    }

    console.log(`✅ Se encontraron ${employees.length} empleados:`);
    employees.forEach(emp => {
      console.log(`   - ${emp.email} (creado por: ${emp.created_by_email || 'N/A'})`);
    });

    console.log('\n🎉 ¡Arreglo completado exitosamente!');
    console.log('Ahora el sistema de gestión de empleados debería funcionar correctamente.');

  } catch (error) {
    console.error('❌ Error durante el arreglo:', error);
    
    // Si el error es porque no existe la función exec_sql, usar queries directas
    if (error.message.includes('exec_sql')) {
      console.log('\n🔄 Intentando método alternativo...');
      await fixWithDirectQueries();
    }
  }
}

async function fixWithDirectQueries() {
  try {
    console.log('1️⃣ Verificando si la columna created_by_email existe...');
    
    // Verificar si la columna existe
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'profiles')
      .eq('column_name', 'created_by_email');

    if (columnsError) {
      throw columnsError;
    }

    if (columns.length === 0) {
      console.log('❌ La columna created_by_email no existe. Por favor ejecuta manualmente en el SQL Editor:');
      console.log('ALTER TABLE profiles ADD COLUMN created_by_email TEXT;');
      return;
    }

    console.log('✅ La columna created_by_email ya existe');

    // Actualizar created_by_email para empleados existentes
    console.log('\n2️⃣ Actualizando created_by_email para empleados existentes...');
    
    // Obtener todos los empleados
    const { data: employees, error: employeesError } = await supabase
      .from('profiles')
      .select('id, created_by')
      .eq('role', 'empleado')
      .is('created_by_email', null);

    if (employeesError) {
      throw employeesError;
    }

    console.log(`Encontrados ${employees.length} empleados para actualizar`);

    // Actualizar cada empleado
    for (const employee of employees) {
      if (employee.created_by) {
        // Obtener el email del admin que creó este empleado
        const { data: admin, error: adminError } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', employee.created_by)
          .single();

        if (adminError) {
          console.log(`⚠️ No se pudo obtener el admin para empleado ${employee.id}:`, adminError.message);
          continue;
        }

        // Actualizar el empleado con el email del admin
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ created_by_email: admin.email })
          .eq('id', employee.id);

        if (updateError) {
          console.log(`⚠️ Error actualizando empleado ${employee.id}:`, updateError.message);
        } else {
          console.log(`✅ Empleado ${employee.id} actualizado con created_by_email: ${admin.email}`);
        }
      }
    }

    console.log('\n🎉 ¡Actualización completada!');

  } catch (error) {
    console.error('❌ Error en método alternativo:', error);
  }
}

// Ejecutar el script
fixEmployeeManagement(); 