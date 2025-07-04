
import { supabase } from './client';

// Función mejorada para limpiar el estado de autenticación
export const cleanupAuthState = () => {
  try {
    // Limpiar localStorage
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        localStorage.removeItem(key);
      }
    });
    
    // Limpiar sessionStorage si existe
    if (typeof sessionStorage !== 'undefined') {
      Object.keys(sessionStorage).forEach((key) => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
          sessionStorage.removeItem(key);
        }
      });
    }
  } catch (error) {
    console.log('⚠️ No se pudo limpiar el estado de auth:', error);
  }
};

// Función segura para cerrar ventanas/popups
export const safeWindowClose = () => {
  try {
    // Solo intentar cerrar si la ventana fue abierta por un script
    if (window.opener && !window.opener.closed) {
      window.close();
    }
  } catch (error) {
    console.log('⚠️ No se pudo cerrar la ventana:', error);
    // No hacer nada más, evitar errores de CORS
  }
};

// Función mejorada para manejo seguro de autenticación
export const safeAuthOperation = async <T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<{ data: T | null; error: Error | null }> => {
  try {
    console.log(`🔐 Iniciando operación de auth: ${operationName}`);
    
    // Limpiar estado previo
    cleanupAuthState();
    
    // Ejecutar operación con timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Timeout: Operación de autenticación excedió 30 segundos')), 30000);
    });
    
    const data = await Promise.race([operation(), timeoutPromise]);
    
    console.log(`✅ Operación ${operationName} completada exitosamente`);
    return { data, error: null };
  } catch (error) {
    console.error(`❌ Error en ${operationName}:`, error);
    
    // Manejar errores específicos
    let processedError = error as Error;
    
    if (error instanceof Error) {
      if (error.message.includes('INTERNAL ASSERTION FAILED')) {
        processedError = new Error('Error interno de autenticación. Intenta nuevamente.');
      } else if (error.message.includes('Cross-Origin-Opener-Policy')) {
        processedError = new Error('Error de política del navegador. Intenta recargar la página.');
      } else if (error.message.includes('popup')) {
        processedError = new Error('Los popups están bloqueados. Permite popups para este sitio.');
      }
    }
    
    return { data: null, error: processedError };
  }
};

// Función específica para sign in seguro
export const safeSignIn = async (email: string, password: string) => {
  return safeAuthOperation(async () => {
    // Intentar cerrar sesiones previas de forma segura
    try {
      await supabase.auth.signOut({ scope: 'global' });
    } catch (signOutError) {
      console.log('⚠️ No se pudo cerrar sesión previa:', signOutError);
    }
    
    // Ejecutar sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    
    if (error) {
      throw error;
    }
    
    return data;
  }, 'signIn');
};

// Función específica para sign up seguro
export const safeSignUp = async (email: string, password: string, options?: any) => {
  return safeAuthOperation(async () => {
    const redirectUrl = `${window.location.origin}/dashboard`;
    
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: redirectUrl,
        ...options,
      },
    });
    
    if (error) {
      throw error;
    }
    
    return data;
  }, 'signUp');
};

// Función para manejo seguro de sesión
export const safeGetSession = async () => {
  return safeAuthOperation(async () => {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      throw error;
    }
    
    return data.session;
  }, 'getSession');
};
