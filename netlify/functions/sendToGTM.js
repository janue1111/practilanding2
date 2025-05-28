// netlify/functions/sendToGTM.js

const fetch = require('node-fetch'); // Importa node-fetch para hacer peticiones HTTP

exports.handler = async (event) => {
    // Asegúrate de que la petición sea POST y tenga un cuerpo (body)
    if (event.httpMethod !== 'POST' || !event.body) {
        return {
            statusCode: 405,
            body: 'Method Not Allowed or Missing Body',
        };
    }

    try {
        // Netlify Forms envía los datos como 'application/x-www-form-urlencoded' (form-data).
        // event.body contendrá un string como "campo1=valor1&campo2=valor2".
        // Necesitamos parsear esto a un objeto JSON.
        const params = new URLSearchParams(event.body);
        const formData = {};
        for (const [key, value] of params.entries()) {
            // Intenta parsear los valores que crees que podrían ser JSON (como purchase_items_json)
            if (key === 'purchase_items_json') {
                try {
                    formData[key] = JSON.parse(value);
                } catch (e) {
                    formData[key] = value; // Si falla el parseo, guarda como string
                    console.warn(`Could not parse ${key} as JSON:`, value, e);
                }
            } else {
                formData[key] = value;
            }
        }

        // Aquí debes poner la URL de tu contenedor GTM Server-Side.
        // Esta es la misma URL que usarías para un webhook directo.
        // Por ejemplo: 'https://yourdomain.stape.io/data'
        const gtmServerSideUrl = 'https://YOUR_GTM_SERVER_SIDE_URL'; // <<-- ¡CAMBIA ESTO!

        // Envía los datos del formulario (ya parseados a JSON) a tu GTM Server-Side
        const response = await fetch(gtmServerSideUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json', // Importante: enviar como JSON
                'User-Agent': 'Netlify-Function-Purchase-Webhook' // Para identificar la fuente en GTM SS si es necesario
            },
            body: JSON.stringify(formData), // Convierte el objeto de datos a JSON string
        });

        // Opcional: Log la respuesta de GTM SS para depuración
        const gtmResponseText = await response.text();
        console.log('Respuesta de GTM Server-Side:', gtmResponseText);

        if (!response.ok) {
            console.error(`Error al enviar a GTM SS: ${response.status} - ${gtmResponseText}`);
            return {
                statusCode: response.status,
                body: JSON.stringify({ message: 'Error al reenviar datos a GTM SS', details: gtmResponseText }),
            };
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Datos enviados a GTM Server-Side correctamente' }),
        };

    } catch (error) {
        console.error('Error en la función Netlify:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Error interno del servidor', error: error.message }),
        };
    }
};
