export const ERROR_MESSAGES = {
  English: {
    tooManyRequests: 'API exhausted. Please wait a moment and try again.',
    generationFailed: 'Meme generation failed. Please try again.',
    noApiKey: 'API key not configured. Please add your API key in settings.',
    invalidApiKey: 'Invalid API key format.',
    networkError: 'Network error. Check your internet connection.',
    templateUnavailable: 'Template unavailable. Please try another template.'
  },
  Spanish: {
    tooManyRequests: 'API agotada. Por favor, espera un momento e inténtalo de nuevo.',
    generationFailed: 'Generación de meme fallida. Por favor, inténtalo de nuevo.',
    noApiKey: 'Clave API no configurada. Por favor, agrega tu clave API en la configuración.',
    invalidApiKey: 'Formato de clave API inválido.',
    networkError: 'Error de red. Verifica tu conexión a internet.',
    templateUnavailable: 'Plantilla no disponible. Por favor, prueba otra plantilla.'
  },
  French: {
    tooManyRequests: 'API épuisée. Veuillez attendre un moment et réessayer.',
    generationFailed: 'Échec de la génération du meme. Veuillez réessayer.',
    noApiKey: 'Clé API non configurée. Veuillez ajouter votre clé API dans les paramètres.',
    invalidApiKey: 'Format de clé API invalide.',
    networkError: 'Erreur réseau. Vérifiez votre connexion internet.',
    templateUnavailable: 'Modèle non disponible. Veuillez essayer un autre modèle.'
  },
  German: {
    tooManyRequests: 'API erschöpft. Bitte warten Sie einen Moment und versuchen Sie es erneut.',
    generationFailed: 'Meme-Generierung fehlgeschlagen. Bitte versuchen Sie es erneut.',
    noApiKey: 'API-Schlüssel nicht konfiguriert. Bitte fügen Sie Ihren API-Schlüssel in den Einstellungen hinzu.',
    invalidApiKey: 'Ungültiges API-Schlüsselformat.',
    networkError: 'Netzwerkfehler. Überprüfen Sie Ihre Internetverbindung.',
    templateUnavailable: 'Vorlage nicht verfügbar. Bitte versuchen Sie eine andere Vorlage.'
  }
} as const;

export async function getErrorMessage(key: keyof typeof ERROR_MESSAGES.English): Promise<string> {
  const { selectedLanguage } = await chrome.storage.local.get(['selectedLanguage']);
  const lang = (selectedLanguage || 'English') as keyof typeof ERROR_MESSAGES;
  return ERROR_MESSAGES[lang]?.[key] || ERROR_MESSAGES.English[key];
}
