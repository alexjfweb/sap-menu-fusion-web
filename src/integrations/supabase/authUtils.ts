
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

// Funciones simplificadas que ya no wrappean los errores
export const safeSignIn = async (email: string, password: string) => {
  try {
    // Intentar cerrar sesiones previas de forma segura
    await supabase.auth.signOut({ scope: 'global' });
  } catch (signOutError) {
    console.log('⚠️ No se pudo cerrar sesión previa:', signOutError);
  }
  
  // Ejecutar sign in directamente
  return await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
};

export const safeSignUp = async (email: string, password: string, options?: any) => {
  const redirectUrl = `${window.location.origin}/dashboard`;
  
  return await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      emailRedirectTo: redirectUrl,
      ...options,
    },
  });
};

// Función para manejo seguro de sesión
export const safeGetSession = async () => {
  return await supabase.auth.getSession();
};
