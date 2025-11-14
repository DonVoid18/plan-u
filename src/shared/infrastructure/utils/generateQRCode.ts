import QRCode from "qrcode";

/**
 * Genera un código QR como Data URL (base64)
 * @param data - El contenido que se codificará en el QR
 * @returns Promise con el Data URL del QR
 */
export async function generateQRCode(data: string): Promise<string> {
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(data, {
      errorCorrectionLevel: "H",
      type: "image/png",
      width: 300,
      margin: 1,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });
    return qrCodeDataUrl;
  } catch (error) {
    console.error("Error generando código QR:", error);
    throw new Error("No se pudo generar el código QR");
  }
}
