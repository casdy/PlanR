import { Translation, Language } from '@capacitor-mlkit/translation';
import { Capacitor } from '@capacitor/core';

/**
 * Service to handle on-device Google ML Kit Natural Language Translation via Capacitor.
 * This ensures 100% on-device processing to guarantee user privacy and offline capabilities.
 */
class TranslationService {
  /**
   * Checks if the language model is present on the device, downloading it if not.
   * Prompts a potentially 30MB download, so it must gracefully handle network/storage errors.
   * 
   * @param languageCode The BCP-47 language tag (e.g., 'es', 'fr', 'de').
   * @returns A boolean indicating if the model is ready for inference.
   */
  async downloadModel(languageCode: string): Promise<boolean> {
    if (Capacitor.getPlatform() === 'web') {
      console.warn('ML Kit translation models are not available on web.');
      return false;
    }

    const language = languageCode as Language;

    try {
      // 1. Check if the model is already downloaded locally.
      const downloadedModels = await Translation.getDownloadedModels();
      const isDownloaded = downloadedModels.languages.includes(language as Language);

      if (isDownloaded) {
        return true; // Model is ready offline.
      }

      // 2. Download the model.
      // This step requires an internet connection and sufficient storage (approx 30MB per model).
      console.log(`Downloading ML Kit translation model for: ${languageCode}...`);
      await Translation.downloadModel({ language });
      console.log(`Model for ${languageCode} successfully downloaded.`);
      
      return true;
    } catch (error) {
      console.error(`Failed to download translation model for ${languageCode}. 
      Ensure you have an active internet connection and adequate device storage.`, error);
      return false; // Graceful degradation if storage/network fails.
    }
  }

  /**
   * Translates text natively on the device Neural Processing Unit (NPU).
   * Note: Both source and target models must be downloaded first.
   * 
   * @param text The string to translate.
   * @param sourceLang The language code of the original text.
   * @param targetLang The language code to translate into.
   * @returns The translated string. If inference fails, gracefully falls back to the original text.
   */
  async translateText(text: string, sourceLang: string, targetLang: string): Promise<string> {
    if (!text || text.trim() === '') return text;

    try {
      // Ensure target model is present to prevent inference failure.
      // (For production readiness, you might also want to ensure the source model if it's not En).
      const isReady = await this.downloadModel(targetLang);
      if (!isReady) {
        console.warn('Translation model unavailable. Bypassing translation.');
        return text;
      }

      const { text: translatedText } = await Translation.translate({
        text,
        sourceLanguage: sourceLang as Language,
        targetLanguage: targetLang as Language,
      });

      return translatedText;
    } catch (error) {
      console.error('On-device translation inference failed. Falling back to original text.', error);
      return text;
    }
  }
}

export const translationService = new TranslationService();
