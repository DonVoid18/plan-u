import { randomUUID } from "crypto";
import fs from "fs/promises";
import path from "path";

/**
 * Guarda una imagen en la carpeta private/images
 * @param file - El archivo de imagen a guardar
 * @returns La ruta relativa de la imagen guardada
 */
export async function saveImage(file: File): Promise<string> {
  try {
    // Obtener la extensión del archivo
    const fileName = file.name;
    const fileExtension = path.extname(fileName);

    // Generar un nombre único para el archivo
    const uniqueFileName = `${randomUUID()}${fileExtension}`;

    // Ruta de la carpeta private/images
    const privateImagesDir = path.join(process.cwd(), "private", "images");

    // Crear la carpeta si no existe
    await fs.mkdir(privateImagesDir, { recursive: true });

    // Ruta completa del archivo
    const filePath = path.join(privateImagesDir, uniqueFileName);

    // Convertir el archivo a buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Guardar el archivo
    await fs.writeFile(filePath, buffer);

    // Retornar la ruta relativa
    return `/private/images/${uniqueFileName}`;
  } catch (error) {
    console.error("Error al guardar la imagen:", error);
    throw new Error("No se pudo guardar la imagen");
  }
}

/**
 * Elimina una imagen de la carpeta private/images
 * @param imagePath - La ruta relativa de la imagen a eliminar
 */
export async function deleteImage(imagePath: string): Promise<void> {
  try {
    // Extraer solo el nombre del archivo de la ruta
    const fileName = path.basename(imagePath);

    // Ruta completa del archivo
    const filePath = path.join(process.cwd(), "private", "images", fileName);

    // Verificar si el archivo existe
    try {
      await fs.access(filePath);
      // Eliminar el archivo
      await fs.unlink(filePath);
    } catch (error) {
      // El archivo no existe, no hacer nada
      console.log("El archivo no existe o ya fue eliminado:", filePath);
    }
  } catch (error) {
    console.error("Error al eliminar la imagen:", error);
    throw new Error("No se pudo eliminar la imagen");
  }
}
