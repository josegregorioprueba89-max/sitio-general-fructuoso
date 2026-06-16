require('dotenv').config();

const express    = require('express');
const bcrypt     = require('bcrypt');
const nodemailer = require('nodemailer');
const session    = require('express-session');
const multer     = require('multer');
const path       = require('path');
const fs         = require('fs');
const app        = express();

const SALT_ROUNDS = 10;

// ─── MULTER — subida de imágenes ───────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, 'public', 'img');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase();
    const name = Date.now() + '-' + Math.round(Math.random() * 1e6) + ext;
    cb(null, name);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB máximo
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    allowed.includes(ext) ? cb(null, true) : cb(new Error('Solo imágenes JPG, PNG o WEBP'));
  }
});

// ─── NODEMAILER ────────────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS }
});
transporter.verify(err => {
  if (err) console.warn('⚠️  Gmail no conectado:', err.message);
  else     console.log('✅ Gmail conectado');
});

async function enviarBienvenida(nombre, email) {
  await transporter.sendMail({
    from: `"Portal Fructuoso Heredia" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: '¡Bienvenido al portal del General Fructuoso Heredia!',
    html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#0f1117;color:#e8eaf0;padding:40px;border-radius:12px;">
      <h1 style="color:#7eb8c4;">Bienvenido, ${nombre}</h1>
      <p style="color:#9aa3b8;line-height:1.7;">Tu cuenta ha sido creada exitosamente. Ya puedes explorar los libros, inscribirte en eventos y dejar reseñas.</p>
      <a href="https://sitio-general-fructuoso-production.up.railway.app/libros" style="display:inline-block;margin-top:24px;background:#7eb8c4;color:#0f1117;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;">Ver libros →</a>
      <p style="margin-top:40px;font-size:0.78rem;color:#5c6480;">© ${new Date().getFullYear()} Juan Manuel Fructuoso Heredia</p>
    </div>`
  });
}

async function notificarAdmin(asunto, html) {
  await transporter.sendMail({
    from: `"Portal Fructuoso Heredia" <${process.env.GMAIL_USER}>`,
    to: process.env.GMAIL_USER,
    subject: asunto, html
  });
}

// ─── EXPRESS CONFIG ────────────────────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback_secret_cambiar',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 4 } // 4 horas
}));

// ─── MIDDLEWARE ADMIN ──────────────────────────────────────────────────────────
function requireAdmin(req, res, next) {
  if (req.session && req.session.adminLoggedIn) return next();
  res.redirect('/admin/login');
}

// ─── DATOS EN MEMORIA ──────────────────────────────────────────────────────────
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
  redes: { amazon: 'https://www.amazon.com/s?k=Juan+Manuel+Fructuoso+Heredia', facebook: '#', instagram: '#', youtube: '#' }
};

let libros = [
  {
    id: 1,
    titulo: 'Capicúa en Ajedrez',
    subtitulo: 'Narco-Novela',
    anio: 2022,
    portada: '/img/capicua-portada.jpg',
    sinopsis: 'Una narración basada en hechos reales que devela las operatividades del narcotráfico en República Dominicana entre 2000 y 2010.',
    precio: '$14.99',
    enlaceAmazon: 'https://www.amazon.com/Capic%C3%BAa-ajedrez-Spanish-Fructuoso-Heredia/dp/B09XSVFKF5',
    disponible: true, rating: 4.5, totalResenas: 12,
    genero: 'Narco-Novela · Thriller', paginas: 220
  }
];

let eventos = [
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
    lugar: 'Universidad PUCMM', ciudad: 'Santiago de los Caballeros, RD',
    descripcion: 'El autor comparte su metodología de investigación.',
    tipo: 'Conferencia', cupos: 200, inscripcionAbierta: true,
    mapa: 'https://maps.google.com/?q=PUCMM+Santiago'
  }
];

let noticias = [
  {
    id: 1,
    titulo: 'Capicúa en Ajedrez reseñada por Diario Libre',
    resumen: 'El principal diario digital de República Dominicana publica una reseña completa de la narco-novela del General Fructuoso Heredia.',
    contenido: 'La obra literaria del General (r) Juan Manuel Fructuoso Heredia recibió cobertura nacional...',
    fecha: '2022-06-15',
    imagen: '/img/noticia-placeholder.jpg'
  }
];

let resenas = [
  { id: 1, libroId: 1, usuario: 'María G.',  rating: 5, comentario: 'Una novela que te atrapa desde la primera página.', fecha: '2024-03-10', aprobada: true },
  { id: 2, libroId: 1, usuario: 'Carlos R.', rating: 4, comentario: 'Increíble cómo narra hechos reales. Muy recomendada.', fecha: '2024-05-22', aprobada: true }
];

let usuarios = [
  { id: 1, nombre: 'Admin', email: 'jose.colorvision@gmail.com', passwordHash: null, rol: 'admin', fechaRegistro: '2024-01-01' }
];

const logros = {
  profesionales: [
    { año: '1990s–2022', titulo: 'General de la Policía Nacional Dominicana', descripcion: 'Más de 30 años de carrera investigativa al servicio del Estado dominicano.' },
    { año: '2000–2010',  titulo: 'Investigador del Crimen Organizado',         descripcion: 'Participó directamente en operativos contra el narcotráfico.' },
    { año: '2022',       titulo: 'Abogado en ejercicio',                       descripcion: 'Litigante activo con especialización en derecho penal.' }
  ],
  literarios: [
    { año: '2022', titulo: 'Publicación en Amazon KDP', descripcion: 'Lanzamiento de "Capicúa en Ajedrez" disponible mundialmente.' },
    { año: '2022', titulo: 'Cobertura en Diario Libre', descripcion: 'La narco-novela fue reseñada por medios nacionales.' }
  ]
};

function esEmailValido(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ═══════════════════════════════════════════════════════
// RUTAS PÚBLICAS
// ═══════════════════════════════════════════════════════
app.get('/', (req, res) => {
  res.render('index', { autor, libros, eventos, noticias, resenas: resenas.filter(r => r.aprobada) });
});
app.get('/libros', (req, res) => {
  res.render('libros', { autor, libros, resenas: resenas.filter(r => r.aprobada) });
});
app.get('/libros/:id', (req, res) => {
  const libro = libros.find(l => l.id === parseInt(req.params.id));
  if (!libro) return res.redirect('/libros');
  res.render('libro-detalle', { autor, libro, resenas: resenas.filter(r => r.libroId === libro.id && r.aprobada) });
});
app.get('/biografia',  (req, res) => res.render('biografia',  { autor, logros }));
app.get('/eventos',    (req, res) => res.render('eventos',    { autor, eventos }));
app.get('/galeria',    (req, res) => res.render('galeria',    { autor }));
app.get('/noticias',   (req, res) => res.render('noticias',   { autor, noticias }));
app.get('/contacto',   (req, res) => res.render('contacto',   { autor, mensaje: null, error: null }));
app.get('/registro',   (req, res) => res.render('registro',   { autor, mensaje: null, error: null, nombreVal: '', emailVal: '' }));

// ═══════════════════════════════════════════════════════
// PANEL ADMIN — LOGIN
// ═══════════════════════════════════════════════════════
app.get('/admin/login', (req, res) => {
  if (req.session.adminLoggedIn) return res.redirect('/admin');
  res.render('admin/login', { error: null });
});

app.post('/admin/login', (req, res) => {
  const password = (req.body.password || '').trim();
  if (password === process.env.ADMIN_PASSWORD) {
    req.session.adminLoggedIn = true;
    return res.redirect('/admin');
  }
  res.render('admin/login', { error: 'Contraseña incorrecta.' });
});

app.get('/admin/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/admin/login');
});

// ═══════════════════════════════════════════════════════
// PANEL ADMIN — DASHBOARD
// ═══════════════════════════════════════════════════════
app.get('/admin', requireAdmin, (req, res) => {
  res.render('admin/dashboard', {
    autor,
    stats: {
      libros:   libros.length,
      eventos:  eventos.length,
      noticias: noticias.length,
      usuarios: usuarios.length,
      resenas:  resenas.length
    }
  });
});

// ═══════════════════════════════════════════════════════
// ADMIN — LIBROS
// ═══════════════════════════════════════════════════════
app.get('/admin/libros', requireAdmin, (req, res) => {
  res.render('admin/libros', { autor, libros, mensaje: req.query.ok || null, error: null });
});

app.post('/admin/libros/nuevo', requireAdmin, upload.single('portada'), (req, res) => {
  const { titulo, subtitulo, anio, sinopsis, precio, enlaceAmazon, genero, paginas } = req.body;
  if (!titulo || !sinopsis || !precio) return res.render('admin/libros', { autor, libros, mensaje: null, error: 'Título, sinopsis y precio son obligatorios.' });

  const portada = req.file ? '/img/' + req.file.filename : '/img/capicua-portada.jpg';
  libros.push({
    id: libros.length + 1,
    titulo: titulo.trim(),
    subtitulo: (subtitulo || '').trim(),
    anio: parseInt(anio) || new Date().getFullYear(),
    portada,
    sinopsis: sinopsis.trim(),
    precio: precio.trim(),
    enlaceAmazon: (enlaceAmazon || '').trim(),
    disponible: true, rating: 0, totalResenas: 0,
    genero: (genero || 'General').trim(),
    paginas: parseInt(paginas) || 0
  });
  res.redirect('/admin/libros?ok=Libro+publicado+exitosamente');
});

app.post('/admin/libros/eliminar/:id', requireAdmin, (req, res) => {
  libros = libros.filter(l => l.id !== parseInt(req.params.id));
  res.redirect('/admin/libros?ok=Libro+eliminado');
});

// ═══════════════════════════════════════════════════════
// ADMIN — EVENTOS
// ═══════════════════════════════════════════════════════
app.get('/admin/eventos', requireAdmin, (req, res) => {
  res.render('admin/eventos', { autor, eventos, mensaje: req.query.ok || null, error: null });
});

app.post('/admin/eventos/nuevo', requireAdmin, (req, res) => {
  const { titulo, fecha, hora, lugar, ciudad, descripcion, tipo, cupos, mapa } = req.body;
  if (!titulo || !fecha || !lugar) return res.render('admin/eventos', { autor, eventos, mensaje: null, error: 'Título, fecha y lugar son obligatorios.' });

  eventos.push({
    id: eventos.length + 1,
    titulo: titulo.trim(),
    fecha, hora: (hora || '').trim(),
    lugar: lugar.trim(),
    ciudad: (ciudad || '').trim(),
    descripcion: (descripcion || '').trim(),
    tipo: (tipo || 'Evento').trim(),
    cupos: parseInt(cupos) || 100,
    inscripcionAbierta: true,
    mapa: (mapa || '').trim()
  });
  res.redirect('/admin/eventos?ok=Evento+creado+exitosamente');
});

app.post('/admin/eventos/eliminar/:id', requireAdmin, (req, res) => {
  eventos = eventos.filter(e => e.id !== parseInt(req.params.id));
  res.redirect('/admin/eventos?ok=Evento+eliminado');
});

// ═══════════════════════════════════════════════════════
// ADMIN — NOTICIAS
// ═══════════════════════════════════════════════════════
app.get('/admin/noticias', requireAdmin, (req, res) => {
  res.render('admin/noticias', { autor, noticias, mensaje: req.query.ok || null, error: null });
});

app.post('/admin/noticias/nueva', requireAdmin, upload.single('imagen'), (req, res) => {
  const { titulo, resumen, contenido } = req.body;
  if (!titulo || !resumen || !contenido) return res.render('admin/noticias', { autor, noticias, mensaje: null, error: 'Todos los campos son obligatorios.' });

  const imagen = req.file ? '/img/' + req.file.filename : '/img/noticia-placeholder.jpg';
  noticias.unshift({
    id: noticias.length + 1,
    titulo: titulo.trim(),
    resumen: resumen.trim(),
    contenido: contenido.trim(),
    fecha: new Date().toISOString().split('T')[0],
    imagen
  });
  res.redirect('/admin/noticias?ok=Noticia+publicada+exitosamente');
});

app.post('/admin/noticias/eliminar/:id', requireAdmin, (req, res) => {
  noticias = noticias.filter(n => n.id !== parseInt(req.params.id));
  res.redirect('/admin/noticias?ok=Noticia+eliminada');
});

// ═══════════════════════════════════════════════════════
// ADMIN — USUARIOS Y RESEÑAS
// ═══════════════════════════════════════════════════════
app.get('/admin/usuarios', requireAdmin, (req, res) => {
  res.render('admin/usuarios', { autor, usuarios, resenas, mensaje: req.query.ok || null });
});

app.post('/admin/resenas/eliminar/:id', requireAdmin, (req, res) => {
  resenas = resenas.filter(r => r.id !== parseInt(req.params.id));
  res.redirect('/admin/usuarios?ok=Reseña+eliminada');
});

// ═══════════════════════════════════════════════════════
// RUTAS POST PÚBLICAS
// ═══════════════════════════════════════════════════════
app.post('/registro', async (req, res) => {
  const nombre    = (req.body.nombre    || '').trim();
  const email     = (req.body.email     || '').trim().toLowerCase();
  const password  = (req.body.password  || '');
  const password2 = (req.body.password2 || '');

  const renderError = (msg) => res.render('registro', { autor, mensaje: null, error: msg, nombreVal: nombre, emailVal: email });

  if (!nombre || !email || !password || !password2) return renderError('Todos los campos son obligatorios.');
  if (nombre.length < 2)      return renderError('El nombre debe tener al menos 2 caracteres.');
  if (!esEmailValido(email))  return renderError('El formato del correo no es válido.');
  if (password.length < 8)    return renderError('La contraseña debe tener al menos 8 caracteres.');
  if (password !== password2) return renderError('Las contraseñas no coinciden.');
  if (usuarios.find(u => u.email === email)) return renderError('Este correo ya está registrado.');

  try {
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    usuarios.push({ id: usuarios.length + 1, nombre, email, passwordHash, rol: 'lector', fechaRegistro: new Date().toISOString().split('T')[0] });

    Promise.all([
      enviarBienvenida(nombre, email),
      notificarAdmin(`🆕 Nuevo registro: ${nombre}`, `<p><b>Nombre:</b> ${nombre}</p><p><b>Email:</b> ${email}</p>`)
    ]).catch(err => console.warn('⚠️  Email error:', err.message));

    res.render('registro', { autor, mensaje: `¡Bienvenido, ${nombre}! Revisa tu correo.`, error: null, nombreVal: '', emailVal: '' });
  } catch (err) {
    console.error(err);
    res.render('registro', { autor, mensaje: null, error: 'Error interno. Intenta de nuevo.', nombreVal: nombre, emailVal: email });
  }
});

app.post('/contacto', async (req, res) => {
  const nombre  = (req.body.nombre  || '').trim();
  const email   = (req.body.email   || '').trim().toLowerCase();
  const mensaje = (req.body.mensaje || '').trim();

  if (!nombre || !email || !mensaje) return res.render('contacto', { autor, mensaje: null, error: 'Todos los campos son obligatorios.' });
  if (!esEmailValido(email))         return res.render('contacto', { autor, mensaje: null, error: 'Correo no válido.' });

  try {
    await notificarAdmin(`📩 Consulta de ${nombre}`, `<p><b>Nombre:</b> ${nombre}</p><p><b>Email:</b> ${email}</p><p><b>Mensaje:</b> ${mensaje}</p>`);
    res.render('contacto', { autor, mensaje: '✅ Mensaje enviado. Te responderemos pronto.', error: null });
  } catch (err) {
    res.render('contacto', { autor, mensaje: null, error: 'No se pudo enviar. Contáctanos por WhatsApp.' });
  }
});

app.post('/resena', (req, res) => {
  const libroId    = parseInt(req.body.libroId) || 0;
  const usuario    = (req.body.usuario    || '').trim();
  const rating     = parseInt(req.body.rating) || 0;
  const comentario = (req.body.comentario || '').trim();

  if (!usuario || !comentario || rating < 1 || rating > 5) return res.redirect('/libros/' + libroId);
  resenas.push({ id: resenas.length + 1, libroId, usuario, rating, comentario, fecha: new Date().toISOString().split('T')[0], aprobada: true });
  res.redirect('/libros/' + libroId + '?resena=enviada');
});

app.post('/inscribirse', (req, res) => {
  const nombre = (req.body.nombre || '').trim();
  if (!nombre) return res.redirect('/eventos');
  res.redirect('/eventos?inscrito=' + encodeURIComponent(nombre));
});

// ─── INICIO ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`✅ Portal corriendo en puerto ${PORT}`));
