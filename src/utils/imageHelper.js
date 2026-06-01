import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase/config';

/**
 * Helper para comprimir imágenes en el navegador del cliente utilizando la API Canvas.
 * Esto reduce el tamaño de los archivos antes de enviarlos a Firebase, ahorrando ancho de banda y almacenamiento.
 * 
 * @param {File} file - El archivo de imagen original seleccionado por el usuario.
 * @param {number} maxWidth - Ancho máximo permitido para la imagen comprimida (defecto: 600px).
 * @param {number} maxHeight - Alto máximo permitido para la imagen comprimida (defecto: 600px).
 * @param {number} quality - Calidad de compresión de la imagen (de 0.0 a 1.0, defecto: 0.7).
 * @returns {Promise<File>} Una promesa que se resuelve con el archivo de imagen comprimido en formato JPG.
 */
export const compressImage = (file, maxWidth = 1200, maxHeight = 1200, quality = 0.85) => {
  return new Promise((resolve) => {
    try {
      // Si el archivo es nulo o no es una imagen, no hacemos nada y lo devolvemos tal cual
      if (!file || !file.type || !file.type.startsWith('image/')) {
        resolve(file);
        return;
      }

      const reader = new FileReader();
      // Leer el archivo de imagen en formato base64 para poder cargarlo en un elemento Image
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        try {
          const img = new Image();
          img.src = event.target.result;
          img.onload = () => {
            try {
              let width = img.width;
              let height = img.height;

              // Calcular las nuevas dimensiones de la imagen manteniendo la proporción original
              if (width > height) {
                if (width > maxWidth) {
                  height = Math.round((height * maxWidth) / width);
                  width = maxWidth;
                }
              } else {
                if (height > maxHeight) {
                  width = Math.round((width * maxHeight) / height);
                  height = maxHeight;
                }
              }

              // Crear un Canvas en memoria para dibujar la imagen con las nuevas dimensiones
              const canvas = document.createElement('canvas');
              canvas.width = width;
              canvas.height = height;

              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0, width, height);

              // Convertir el canvas a un Blob en formato JPG aplicando la calidad de compresión
              canvas.toBlob(
                (blob) => {
                  try {
                    if (!blob) {
                      resolve(file);
                      return;
                    }
                    // Crear un nuevo objeto File a partir del blob de la imagen comprimida
                    const compressedFile = new File([blob], file.name || 'image.jpg', {
                      type: 'image/jpeg',
                      lastModified: Date.now(),
                    });
                    resolve(compressedFile);
                  } catch (errInner) {
                    console.error("Error al crear el archivo comprimido:", errInner);
                    resolve(file);
                  }
                },
                'image/jpeg',
                quality
              );
            } catch (errCanvas) {
              console.error("Error al procesar el canvas:", errCanvas);
              resolve(file);
            }
          };
          img.onerror = () => resolve(file);
        } catch (errLoad) {
          console.error("Error al cargar la imagen en memoria:", errLoad);
          resolve(file);
        }
      };
      reader.onerror = () => resolve(file);
    } catch (errGlobal) {
      console.error("Error global de compresión:", errGlobal);
      resolve(file);
    }
  });
};

/**
 * Sube una imagen a Firebase Storage. Si la subida se queda congelada o falla (debido a falta de
 * configuración de Storage en la consola de Firebase del usuario), se aplica un timeout de 4.5 segundos
 * y se genera un fallback automático convirtiendo la imagen comprimida en formato de texto Base64.
 * Esto garantiza que la aplicación NUNCA se quede colgada y las imágenes se guarden perfectamente.
 * 
 * @param {File} file - El archivo de imagen seleccionado por el usuario.
 * @returns {Promise<string>} La URL de descarga de la imagen subida o el string Base64 correspondiente.
 */
export const uploadImage = async (file) => {
  if (!file) return null;
  let compressedFile = file;

  // 1. Intentar comprimir la imagen en el navegador para ahorrar espacio
  try {
    compressedFile = await compressImage(file);
  } catch (compErr) {
    console.error("La compresión falló, utilizando el archivo original:", compErr);
  }

  // 2. Función de subida a Firebase Storage con límite de tiempo de 4.5 segundos
  const uploadWithTimeout = () => {
    return new Promise((resolve, reject) => {
      // Lanzar un error controlado si la subida tarda más de 4500ms
      const timeoutId = setTimeout(() => {
        reject(new Error("Timeout: Firebase Storage tardó demasiado. Aplicando fallback de Base64."));
      }, 4500);

      const run = async () => {
        try {
          // Generar un nombre único de archivo utilizando el timestamp
          const filename = `${Date.now()}_${(compressedFile.name || 'image').replace(/\.[^/.]+$/, "")}.jpg`;
          const storageRef = ref(storage, `images/${filename}`);
          
          // Iniciar la subida de bytes al bucket
          const snapshot = await uploadBytes(storageRef, compressedFile);
          
          // Obtener la URL de acceso público
          const downloadURL = await getDownloadURL(snapshot.ref);
          
          // Limpiar el temporizador de timeout
          clearTimeout(timeoutId);
          resolve(downloadURL);
        } catch (error) {
          // Limpiar el temporizador de timeout ante cualquier fallo
          clearTimeout(timeoutId);
          reject(error);
        }
      };

      run();
    });
  };

  // 3. Ejecutar subida y capturar fallos o lentitud excesiva de red
  try {
    const downloadURL = await uploadWithTimeout();
    return downloadURL;
  } catch (error) {
    console.warn("Storage falló o tardó demasiado. Guardando como Base64 comprimido:", error);
    
    // Fallback: Leer el archivo comprimido y transformarlo a Base64 para guardarlo en la base de datos de Firestore
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(compressedFile);
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => {
        const readerOrig = new FileReader();
        readerOrig.readAsDataURL(file);
        readerOrig.onload = () => resolve(readerOrig.result);
        readerOrig.onerror = () => resolve(null);
      };
    });
  }
};
