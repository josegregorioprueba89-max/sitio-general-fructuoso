// servidor.js
const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;

// Configuración para usar plantillas EJS
app.set('view engine', 'ejs');
app.use(express.static('public'));

// Ruta principal (Home)
app.get('/', (req, res) => {
    res.render('index', { 
        titulo: 'General Juan Fructuoso Heredia',
        mensaje: 'Bienvenido al sitio oficial.' 
    });
});

// Nueva ruta para el Perfil
app.get('/perfil', (req, res) => {
    res.render('perfil', { 
        titulo: 'Perfil del General',
        nombre: 'Juan Fructuoso Heredia',
        descripcion: 'Biografía y trayectoria destacada.'
    });
});

// Arrancar el servidor en el puerto 8080
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
