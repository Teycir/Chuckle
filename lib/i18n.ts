/**
 * Generic internationalization (i18n) utility - can be used in any project
 * Provides translation management with fallback support
 */

/**
 * Generic i18n class for managing translations
 * @template T - Type of translation dictionary
 */
export class I18n<T extends Record<string, Record<string, string>>> {
  constructor(
    private translations: T,
    private defaultLang: keyof T
  ) {}

  /**
   * Gets a translation for a key
   * @param key - Translation key (supports dot notation for nested keys)
   * @param lang - Language code (optional, uses default if not provided)
   * @returns Translated string or key if not found
   */
  t(key: string, lang?: keyof T): string {
    const language = lang || this.defaultLang;
    const keys = key.split('.');
    let value: any = this.translations[language];
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    // Fallback to default language if not found
    if (!value && language !== this.defaultLang) {
      let fallback: any = this.translations[this.defaultLang];
      for (const k of keys) {
        fallback = fallback?.[k];
      }
      return fallback || key;
    }
    
    return value || key;
  }

  /**
   * Gets all translations for a language
   * @param lang - Language code (optional, uses default if not provided)
   * @returns Translation dictionary
   */
  getAll(lang?: keyof T): Record<string, string> {
    const language = lang || this.defaultLang;
    return this.translations[language] || this.translations[this.defaultLang];
  }

  /**
   * Checks if a language is supported
   * @param lang - Language code
   * @returns True if language is supported
   */
  hasLanguage(lang: string): boolean {
    return lang in this.translations;
  }
}
