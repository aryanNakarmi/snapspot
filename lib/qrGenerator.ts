import QRCode from 'qrcode';

export const generateQRCode = async (eventCode: string): Promise<string> => {
  try {
    const eventUrl = `${window.location.origin}/event/${eventCode}`;
    const qrCodeUrl = await QRCode.toDataURL(eventUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });
    return qrCodeUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
};

// Download QR code
export const downloadQRCode = async (eventCode: string, eventName: string) => {
  try {
    const qrCodeUrl = await generateQRCode(eventCode);
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `${eventName}-QR-${eventCode}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Error downloading QR code:', error);
    throw error;
  }
};
