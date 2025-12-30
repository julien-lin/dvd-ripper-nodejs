import { useEffect, useState } from 'react';

/**
 * Hook personnalisé pour gérer le thème (light/dark)
 * Synchronise avec localStorage et applique la classe 'dark' sur <html>
 */
export function useTheme() {
  // Déterminer le thème initial
  const getInitialTheme = () => {
    // 1. Vérifier localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || savedTheme === 'light') {
      return savedTheme;
    }
    
    // 2. Vérifier la préférence système
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    
    // 3. Défaut: light
    return 'light';
  };

  const [theme, setTheme] = useState(getInitialTheme());
  
  // Debug: afficher les changements de thème
  useEffect(() => {
    console.log('🎨 Thème actuel:', theme);
  }, [theme]);

  // Appliquer le thème au chargement et à chaque changement
  useEffect(() => {
    const root = document.documentElement;
    
    console.log('🔄 Application du thème:', theme);
    
    if (theme === 'dark') {
      root.classList.add('dark');
      console.log('✅ Classe dark ajoutée à <html>');
    } else {
      root.classList.remove('dark');
      console.log('❌ Classe dark retirée de <html>');
    }
    
    // Sauvegarder dans localStorage
    localStorage.setItem('theme', theme);
    console.log('💾 Thème sauvegardé:', theme);
  }, [theme]);

  // Écouter les changements de préférence système
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e) => {
      // Seulement si l'utilisateur n'a pas défini de préférence manuelle
      const savedTheme = localStorage.getItem('theme');
      if (!savedTheme) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };
    
    // Écouter les changements (navigateurs modernes)
    mediaQuery.addEventListener('change', handleChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  // Fonction pour basculer le thème
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark');
  };

  // Fonction pour définir un thème spécifique
  const setLightTheme = () => setTheme('light');
  const setDarkTheme = () => setTheme('dark');

  return {
    theme,
    isDark: theme === 'dark',
    isLight: theme === 'light',
    toggleTheme,
    setLightTheme,
    setDarkTheme,
  };
}

export default useTheme;

