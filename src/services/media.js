import { Platform } from 'react-native';

class MediaService {
  // Convert file/image to base64 for encrypted transfer
  static async fileToBase64(uri) {
    if (Platform.OS === 'web') {
      return new Promise((resolve, reject) => {
        fetch(uri)
          .then((res) => res.blob())
          .then((blob) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          })
          .catch(reject);
      });
    }
    // On native, use expo-file-system
    const FileSystem = await import('expo-file-system');
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const ext = uri.split('.').pop().toLowerCase();
    const mimeTypes = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      pdf: 'application/pdf',
      doc: 'application/msword',
      txt: 'text/plain',
    };
    const mime = mimeTypes[ext] || 'application/octet-stream';
    return `data:${mime};base64,${base64}`;
  }

  // Pick image from device
  static async pickImage() {
    if (Platform.OS === 'web') {
      return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (e) => {
          const file = e.target.files[0];
          if (!file) return resolve(null);
          const reader = new FileReader();
          reader.onload = () =>
            resolve({
              uri: reader.result,
              name: file.name,
              size: file.size,
              type: 'image',
              mimeType: file.type,
            });
          reader.readAsDataURL(file);
        };
        input.click();
      });
    }
    // Native: use expo-image-picker
    const ImagePicker = await import('expo-image-picker');
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      base64: true,
    });
    if (result.canceled) return null;
    const asset = result.assets[0];
    return {
      uri: `data:image/jpeg;base64,${asset.base64}`,
      name: 'image.jpg',
      size: asset.base64?.length || 0,
      type: 'image',
      mimeType: 'image/jpeg',
    };
  }

  // Pick any file from device
  static async pickFile() {
    if (Platform.OS === 'web') {
      return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.onchange = async (e) => {
          const file = e.target.files[0];
          if (!file) return resolve(null);
          const reader = new FileReader();
          reader.onload = () =>
            resolve({
              uri: reader.result,
              name: file.name,
              size: file.size,
              type: 'file',
              mimeType: file.type,
            });
          reader.readAsDataURL(file);
        };
        input.click();
      });
    }
    const DocumentPicker = await import('expo-document-picker');
    const result = await DocumentPicker.getDocumentAsync({});
    if (result.canceled) return null;
    const asset = result.assets[0];
    const base64Data = await MediaService.fileToBase64(asset.uri);
    return {
      uri: base64Data,
      name: asset.name,
      size: asset.size,
      type: 'file',
      mimeType: asset.mimeType || 'application/octet-stream',
    };
  }

  // Save/download file on web
  static downloadFile(dataUri, filename) {
    if (Platform.OS === 'web') {
      const link = document.createElement('a');
      link.href = dataUri;
      link.download = filename;
      link.click();
    }
  }

  // Format file size
  static formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
}

export default MediaService;
