import jsQR from "jsqr";
import Jimp from 'jimp';

export const decodeQR = async (path: string): Promise<string> => {
  try {
    const image = await Jimp.read(path);
    const imageData = {
      data: new Uint8ClampedArray(image.bitmap.data),
      width: image.bitmap.width,
      height: image.bitmap.height,
    };
    const decodedQR = jsQR(imageData.data, imageData.width, imageData.height);
    if (!decodedQR) {
      throw new Error('QR code not found in the image.');
    }

    return decodedQR.data;
  } catch (error) {
    console.error('Error decoding QR code:', error);

    return 'invalid-content';
  }
}
