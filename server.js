require('dotenv').config();

const express    = require('express');
const bcrypt     = require('bcrypt');
const nodemailer = require('nodemailer');
const path       = require('path');
const app        = express();

const SALT_ROUNDS = 10;

// ─── TRANSPORTER NODEMAILER ────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,   // jose.colorvision@gmail.com
    pass: process.env.GMAIL_PASS    // App Password de Google (16 caracteres)
  }
});

// Verificar conexión al arrancar (no bloquea el servidor si falla)
transporter.verify((error) => {
  if (error) {
    console.warn('⚠️  Nodemailer no conectado:', error.message);
  } else {
    console.log('✅ Nodemailer listo — Gmail conectado');
  }
});

// ─── HELPERS DE EMAIL ──────────────────────────────────────────────────────────
async function enviarBienvenida(nombre, email) {
  await transporter.sendMail({
    from:    `"Portal Fructuoso Heredia" <${process.env.GMAIL_USER}>`,
    to:      email,
    subject: '¡Bienvenido al portal del General Fructuoso Heredia!',
    html: `
      <div style="font-family:Arial,sans-serif; max-width:560px; margin:0 auto; background:#0f1117; color:#e8eaf0; padding:40px; border-radius:12px;">
        <h1 style="font-size:1.4rem; color:#7eb8c4; margin-bottom:8px;">Bienvenido, ${nombre}</h1>
        <p style="color:#9aa3b8; line-height:1.7;">Tu cuenta en el portal oficial del General (r) Juan Manuel Fructuoso Heredia ha sido creada exitosamente.</p>
        <p style="color:#9aa3b8; line-height:1.7;">Ya puedes explorar los libros, inscribirte en eventos y dejar reseñas.</p>
        <a href="https://sitio-general-fructuoso-production.up.railway.app/libros"
           style="display:inline-block; margin-top:24px; background:#7eb8c4; color:#0f1117; padding:12px 28px; border-radius:8px; text-decoration:none; font-weight:700;">
          Ver libros →
        </a>
        <p style="margin-top:40px; font-size:0.78rem; color:#5c6480;">© ${new Date().getFullYear()} Juan Manuel Fructuoso Heredia</p>
      </div>
    `
  });
}

async function notificarAdminRegistro(nombre, email) {
  await transporter.sendMail({
    from:    `"Portal Fructuoso Heredia" <${process.env.GMAIL_USER}>`,
    to:      process.env.GMAIL_USER,
    subject: `🆕 Nuevo registro: ${nombre}`,
    html: `
      <div style="font-family:Arial,sans-serif; max-width:560px; margin:0 auto;">
        <h2 style="color:#7eb8c4;">Nuevo usuario registrado</h2>
        <p><strong>Nombre:</strong> ${nombre}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-DO')}</p>
      </div>
    `
  });
}

async function notificarConsulta(nombre, email, mensaje) {
  await transporter.sendMail({
    from:    `"Portal Fructuoso Heredia" <${process.env.GMAIL_USER}>`,
    to:      process.env.GMAIL_USER,
    subject: `📩 Nueva consulta de ${nombre}`,
    html: `
      <div style="font-family:Arial,sans-serif; max-width:560px; margin:0 auto;">
        <h2 style="color:#7eb8c4;">Nueva consulta desde el portal</h2>
        <p><strong>Nombre:</strong> ${nombre}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Mensaje:</strong></p>
        <p style="background:#f5f5f5; padding:16px; border-radius:8px;">${mensaje}</p>
      </div>
    `
  });
}

// ─── CONFIGURACIÓN EXPRESS ─────────────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── DATOS DEL AUTOR ──────────────────────────────────────────────────────────
const autor = {
  nombre: 'Juan Manuel Fructuoso Heredia',
  titulo: 'General (r) · Abogado · Escritor',
  tagline: 'Más de 30 años al servicio de la verdad — primero en las calles, ahora en las páginas.',
  bio: [
    'Juan Manuel Fructuoso Heredia es abogado, ex General de la Policía Nacional Dominicana y escritor con más de 30 años de experiencia investigativa al servicio de la justicia en República Dominicana.',
    'Su carrera policial le dio acceso de primera mano a los mecanismos internos del crimen organizado, la corrupción institucional y el narcotráfico, experiencias que hoy transforma en narrativa de alto impacto.',
    'Su obra literaria fusiona la rigurosidad investigativa con la tensión del thriller policial, ofreciendo al lector dominicano y latinoamericano una mirada sin filtros a décadas de oscuros eventos que marcaron al país.'
  ],
  foto: '/img/autor-placeholder.jpg',
  whatsapp: 'https://wa.me/18093041128',
  redes: {
    amazon:    'https://www.amazon.com/s?k=Juan+Manuel+Fructuoso+Heredia',
    facebook:  '#',
    instagram: '#',
    youtube:   '#'
  }
};

// ─── LIBROS ────────────────────────────────────────────────────────────────────
const libros = [
  {
    id: 1,
    titulo: 'Capicúa en Ajedrez',
    subtitulo: 'Narco-Novela',
    anio: 2022,
    portada: '/img/capicua-portada.jpg',
    sinopsis: 'Una narración basada en hechos reales que devela las operatividades del narcotráfico en República Dominicana entre 2000 y 2010. Asesinatos, secuestros, tráfico de influencia y la confabulación de autoridades con el crimen organizado.',
    precio: '$14.99',
    enlaceAmazon: 'https://www.amazon.com/Capic%C3%BAa-ajedrez-Spanish-Fructuoso-Heredia/dp/B09XSVFKF5',
    disponible: true,
    rating: 4.5,
    totalResenas: 12,
    genero: 'Narco-Novela · Thriller',
    paginas: 220
  }
];

// ─── LOGROS ────────────────────────────────────────────────────────────────────
const logros = {
  profesionales: [
    { año: '1990s–2022', titulo: 'General de la Policía Nacional Dominicana', descripcion: 'Más de 30 años de carrera investigativa al servicio del Estado dominicano.' },
    { año: '2000–2010',  titulo: 'Investigador del Crimen Organizado',         descripcion: 'Participó directamente en operativos y análisis contra el narcotráfico en la isla.' },
    { año: '2022',       titulo: 'Abogado en ejercicio',                       descripcion: 'Litigante activo con especialización en derecho penal y seguridad ciudadana.' }
  ],
  literarios: [
    { año: '2022', titulo: 'Publicación en Amazon KDP', descripcion: 'Lanzamiento de "Capicúa en Ajedrez" disponible para lectores en todo el mundo.' },
    { año: '2022', titulo: 'Cobertura en Diario Libre', descripcion: 'La narco-novela fue reseñada por medios nacionales de República Dominicana.' }
  ]
};

// ─── EVENTOS ───────────────────────────────────────────────────────────────────
const eventos = [
  {
    id: 1,
    titulo: 'Presentación: Capicúa en Ajedrez',
    fecha: '2026-07-20', hora: '6:00 PM',
    lugar: 'Biblioteca Nacional Pedro Henríquez Ureña',
    ciudad: 'Santo Domingo, RD',
    descripcion: 'Presentación oficial del libro con sesión de preguntas y firma de ejemplares.',
    tipo: 'Presentación', cupos: 150, inscripcionAbierta: true,
    mapa: 'https://maps.google.com/?q=Biblioteca+Nacional+Santo+Domingo'
  },
  {
    id: 2,
    titulo: 'Conferencia: Narcotráfico y Literatura',
    fecha: '2026-08-15', hora: '7:30 PM',
    lugar: 'Universidad PUCMM',
    ciudad: 'Santiago de los Caballeros, RD',
    descripcion: 'El autor comparte su metodología de investigación y cómo convirtió 30 años de experiencia policial en narrativa literaria.',
    tipo: 'Conferencia', cupos: 200, inscripcionAbierta: true,
    mapa: 'https://maps.google.com/?q=PUCMM+Santiago'
  }
];

// ─── RESEÑAS ───────────────────────────────────────────────────────────────────
let resenas = [
  { id: 1, libroId: 1, usuario: 'María G.',  rating: 5, comentario: 'Una novela que te atrapa desde la primera página. La experiencia real del autor se siente en cada línea.', fecha: '2024-03-10', aprobada: true },
  { id: 2, libroId: 1, usuario: 'Carlos R.', rating: 4, comentario: 'Increíble cómo narra hechos reales de manera tan cercana. Muy recomendada.',                               fecha: '2024-05-22', aprobada: true }
];

// ─── USUARIOS ──────────────────────────────────────────────────────────────────
let usuarios = [
  { id: 1, nombre: 'Admin', email: 'jose.colorvision@gmail.com', passwordHash: null, rol: 'admin', fechaRegistro: '2024-01-01' }
];

// ─── HELPER EMAIL VÁLIDO ───────────────────────────────────────────────────────
function esEmailValido(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ═══════════════════════════════════════════════════════
// RUTAS GET
// ═══════════════════════════════════════════════════════
app.get('/', (req, res) => {
  res.render('index', { autor, libros, eventos, resenas: resenas.filter(r => r.aprobada) });
});

app.get('/libros', (req, res) => {
  res.render('libros', { autor, libros, resenas: resenas.filter(r => r.aprobada) });
});

app.get('/libros/:id', (req, res) => {
  const libro = libros.find(l => l.id === parseInt(req.params.id));
  if (!libro) return res.redirect('/libros');
  const resenasLibro = resenas.filter(r => r.libroId === libro.id && r.aprobada);
  res.render('libro-detalle', { autor, libro, resenas: resenasLibro });
});

app.get('/biografia', (req, res) => {
  res.render('biografia', { autor, logros });
});

app.get('/eventos', (req, res) => {
  res.render('eventos', { autor, eventos });
});

app.get('/galeria', (req, res) => {
  res.render('galeria', { autor });
});

app.get('/contacto', (req, res) => {
  res.render('contacto', { autor, mensaje: null, error: null });
});

app.get('/registro', (req, res) => {
  res.render('registro', { autor, mensaje: null, error: null, nombreVal: '', emailVal: '' });
});

// ═══════════════════════════════════════════════════════
// RUTAS POST
// ═══════════════════════════════════════════════════════

// ─── POST /registro ────────────────────────────────────
app.post('/registro', async (req, res) => {
  const nombre    = (req.body.nombre    || '').trim();
  const email     = (req.body.email     || '').trim().toLowerCase();
  const password  = (req.body.password  || '');
  const password2 = (req.body.password2 || '');

  const renderError = (msg) => res.render('registro', {
    autor, mensaje: null, error: msg, nombreVal: nombre, emailVal: email
  });

  if (!nombre || !email || !password || !password2) return renderError('Todos los campos son obligatorios.');
  if (nombre.length < 2)      return renderError('El nombre debe tener al menos 2 caracteres.');
  if (!esEmailValido(email))  return renderError('El formato del correo no es válido.');
  if (password.length < 8)    return renderError('La contraseña debe tener al menos 8 caracteres.');
  if (password !== password2) return renderError('Las contraseñas no coinciden.');
  if (usuarios.find(u => u.email === email)) return renderError('Este correo ya está registrado.');

  try {
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    usuarios.push({ id: usuarios.length + 1, nombre, email, passwordHash, rol: 'lector', fechaRegistro: new Date().toISOString().split('T')[0] });

    // Emails en paralelo — si fallan no rompen el registro
    Promise.all([
      enviarBienvenida(nombre, email),
      notificarAdminRegistro(nombre, email)
    ]).catch(err => console.warn('⚠️  Error enviando emails:', err.message));

    res.render('registro', { autor, mensaje: `¡Bienvenido, ${nombre}! Revisa tu correo.`, error: null, nombreVal: '', emailVal: '' });
  } catch (err) {
    console.error('Error en registro:', err);
    renderError('Error interno. Por favor intenta de nuevo.');
  }
});

// ─── POST /contacto ────────────────────────────────────
app.post('/contacto', async (req, res) => {
  const nombre   = (req.body.nombre   || '').trim();
  const email    = (req.body.email    || '').trim().toLowerCase();
  const mensaje  = (req.body.mensaje  || '').trim();

  const renderError = (msg) => res.render('contacto', { autor, mensaje: null, error: msg });

  if (!nombre || !email || !mensaje) return renderError('Todos los campos son obligatorios.');
  if (!esEmailValido(email))         return renderError('El formato del correo no es válido.');
  if (mensaje.length < 10)           return renderError('El mensaje debe tener al menos 10 caracteres.');

  try {
    await notificarConsulta(nombre, email, mensaje);
    res.render('contacto', { autor, mensaje: '✅ Tu mensaje fue enviado. Te responderemos pronto.', error: null });
  } catch (err) {
    console.error('Error enviando consulta:', err);
    renderError('No se pudo enviar el mensaje. Intenta por WhatsApp.');
  }
});

// ─── POST /resena ──────────────────────────────────────
app.post('/resena', (req, res) => {
  const libroId    = parseInt(req.body.libroId) || 0;
  const usuario    = (req.body.usuario    || '').trim();
  const rating     = parseInt(req.body.rating) || 0;
  const comentario = (req.body.comentario || '').trim();

  if (!usuario || !comentario || rating < 1 || rating > 5) return res.redirect('/libros/' + libroId);

  resenas.push({ id: resenas.length + 1, libroId, usuario, rating, comentario, fecha: new Date().toISOString().split('T')[0], aprobada: true });
  res.redirect('/libros/' + libroId + '?resena=enviada');
});

// ─── POST /inscribirse ─────────────────────────────────
app.post('/inscribirse', (req, res) => {
  const nombre = (req.body.nombre || '').trim();
  if (!nombre) return res.redirect('/eventos');
  res.redirect('/eventos?inscrito=' + encodeURIComponent(nombre));
});

// ═══════════════════════════════════════════════════════
// INICIO
// ═══════════════════════════════════════════════════════
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`✅ Portal corriendo en puerto ${PORT}`));
