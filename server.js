// server.js (Corregido)
const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;

app.set('view engine', 'ejs');
app.use(express.static('public'));

// Ruta principal: Solo envía lo necesario para el inicio
app.get('/', (req, res) => {
    res.render('index', { 
        titulo: 'General Juan Fructuoso Heredia',
        mensaje: 'Bienvenido al sitio oficial.'
    });
});

// Ruta perfil: Aquí sí usamos la descripción
app.get('/perfil', (req, res) => {
    res.render('perfil', { 
        titulo: 'Perfil del General',
        nombre: 'Juan Fructuoso Heredia',
        descripcion: 'Biografía y trayectoria destacada.'
    });
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
