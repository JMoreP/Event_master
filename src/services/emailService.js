import emailjs from '@emailjs/browser';

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

/**
 * Sends an invitation email to a new team member.
 * @param {string} toEmail - The email address of the invited person.
 * @param {string} toName - The name (or placeholder) of the invited person.
 * @param {string} role - The assigned role.
 * @returns {Promise} - EmailJS send promise.
 */
export const sendInvitationEmail = async (toEmail, toName, role) => {
    if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
        console.error("EmailJS credentials missing in .env:", { SERVICE_ID, TEMPLATE_ID, PUBLIC_KEY });
        throw new Error("El servicio de correo no está configurado correctamente en las variables de entorno (.env)");
    }

    const templateParams = {
        to_email: toEmail,
        to_name: toName,
        role: role,
        app_name: 'EventMaster',
        registration_link: window.location.origin + '/register'
    };

    console.log("Enviando correo con parámetros:", templateParams);

    try {
        const response = await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
        console.log('SUCCESS!', response.status, response.text);
        return response;
    } catch (err) {
        console.error('FAILED...', err);
        // Ensure error has a readable message
        const errorMsg = err.text || err.message || (typeof err === 'string' ? err : 'Error desconocido al enviar correo');
        throw new Error(errorMsg);
    }
};

/**
 * Sends an invitation email to a new speaker.
 * @param {string} toEmail - The email address of the invited speaker.
 * @param {string} toName - The name of the invited speaker.
 * @param {string} eventTitle - The title of the event they are invited to.
 * @returns {Promise} - EmailJS send promise.
 */
export const sendSpeakerInvitationEmail = async (toEmail, toName, eventTitle) => {
    if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
        console.warn("EmailJS is not configured. Email will not be sent.");
        return Promise.resolve({ status: 'skipped', message: 'No credentials' });
    }

    const templateParams = {
        to_email: toEmail,
        to_name: toName,
        event_title: eventTitle,
        role: 'Ponente Invitado',
        app_name: 'EventMaster',
        registration_link: window.location.origin + '/register'
    };

    try {
        const response = await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
        console.log('SPEAKER INVITATION SUCCESS!', response.status, response.text);
        return response;
    } catch (err) {
        console.error('SPEAKER INVITATION FAILED...', err);
        throw err;
    }
};
