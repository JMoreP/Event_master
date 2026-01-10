import axios from 'axios';

// Configuración leída de variables de entorno
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

/**
 * Sube una imagen a Cloudinary
 * @param {File} file - El archivo de imagen a subir
 * @returns {Promise<string>} - La URL segura de la imagen subida
 */
export const uploadImage = async (file) => {
    if (!file) return null;

    if (!CLOUD_NAME || !UPLOAD_PRESET) {
        throw new Error('Faltan las credenciales de Cloudinary (CLOUD_NAME o UPLOAD_PRESET)');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);

    try {
        const response = await axios.post(
            `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
            formData
        );
        return response.data.secure_url;
    } catch (error) {
        console.error('Error subiendo imagen a Cloudinary:', error);
        throw error;
    }
};
