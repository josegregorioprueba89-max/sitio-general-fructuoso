const express = require('express');
const app = express();
const path = require('path');

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
  redes: {
    amazon: 'https://www.amazon.com/s?k=Juan+Manuel+Fructuoso+Heredia',
    facebook: '#',
    instagram: '#',
    youtube: '#'
  }
};

// ─── DATOS DE LIBROS ───────────────────────────────────────────────────────────
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
    { año: '2000–2010', titulo: 'Investigador del Crimen Organizado', descripcion: 'Participó directamente en operativos y análisis contra el narcotráfico en la isla.' },
    { año: '2022',      titulo: 'Abogado en ejercicio', descripcion: 'Litigante activo con especialización en derecho penal y seguridad ciudadana.' }
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
    fecha: '2026-07-20',
    hora: '6:00 PM',
    lugar: 'Biblioteca Nacional Pedro Henríquez Ureña',
    ciudad: 'Santo Domingo, RD',
    descripcion: 'Presentación oficial del libro con sesión de preguntas y firma de ejemplares.',
    tipo: 'Presentación',
    cupos: 150,
    inscripcionAbierta: true,
    mapa: 'https://maps.google.com/?q=Biblioteca+Nacional+Santo+Domingo'
  },
  {
    id: 2,
    titulo: 'Conferencia: Narcotráfico y Literatura',
    fecha: '2026-08-15',
    hora: '7:30 PM',
    lugar: 'Universidad PUCMM',
    ciudad: 'Santiago de los Caballeros, RD',
    descripcion: 'El autor comparte su metodología de investigación y cómo convirtió 30 años de experiencia policial en narrativa literaria.',
    tipo: 'Conferencia',
    cupos: 200,
    inscripcionAbierta: true,
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
  { id: 1, nombre: 'Admin', email: 'admin@fructuosoheredia.com', rol: 'admin', fechaRegistro: '2024-01-01' }
];

// ─── HELPERS ───────────────────────────────────────────────────────────────────
function esEmailValido(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ─── RUTAS GET ─────────────────────────────────────────────────────────────────
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

app.get('/registro', (req, res) => {
  res.render('registro', { autor, mensaje: null, error: null, nombreVal: '', emailVal: '' });
});

// ─── POST /registro — LÓGICA AUDITADA ─────────────────────────────────────────
app.post('/registro', (req, res) => {
  // 1. Extraer y limpiar campos
  const nombre   = (req.body.nombre   || '').trim();
  const email    = (req.body.email    || '').trim().toLowerCase();
  const password  = (req.body.password  || '');
  const password2 = (req.body.password2 || '');

  const renderError = (msg) => res.render('registro', {
    autor,
    mensaje: null,
    error: msg,
    nombreVal: nombre,   // repobla el form para no perder lo escrito
    emailVal: email
  });

  // 2. Validaciones server-side (no confiar solo en el HTML)
  if (!nombre || !email || !password || !password2) {
    return renderError('Todos los campos son obligatorios.');
  }

  if (nombre.length < 2) {
    return renderError('El nombre debe tener al menos 2 caracteres.');
  }

  if (!esEmailValido(email)) {
    return renderError('El formato del correo electrónico no es válido.');
  }

  if (password.length < 8) {
    return renderError('La contraseña debe tener al menos 8 caracteres.');
  }

  if (password !== password2) {
    return renderError('Las contraseñas no coinciden.');
  }

  // 3. Verificar duplicado
  const existe = usuarios.find(u => u.email === email);
  if (existe) {
    return renderError('Este correo ya está registrado. Usa otro o vuelve al inicio.');
  }

  // 4. Guardar usuario
  // NOTA: En producción real usar bcrypt para hashear el password.
  // Aquí se omite porque no está en las dependencias del package.json.
  const nuevoUsuario = {
    id: usuarios.length + 1,
    nombre,
    email,
    rol: 'lector',
    fechaRegistro: new Date().toISOString().split('T')[0]
  };
  usuarios.push(nuevoUsuario);

  // 5. Respuesta de éxito — re-render (no redirect) para mostrar mensaje
  res.render('registro', {
    autor,
    mensaje: `¡Bienvenido, ${nombre}! Tu cuenta ha sido creada exitosamente.`,
    error: null,
    nombreVal: '',
    emailVal: ''
  });
});

// ─── POST /resena ──────────────────────────────────────────────────────────────
app.post('/resena', (req, res) => {
  const libroId    = parseInt(req.body.libroId) || 0;
  const usuario    = (req.body.usuario   || '').trim();
  const rating     = parseInt(req.body.rating) || 0;
  const comentario = (req.body.comentario || '').trim();

  if (!usuario || !rating || !comentario || rating < 1 || rating > 5) {
    return res.redirect('/libros/' + libroId);
  }

  resenas.push({
    id: resenas.length + 1,
    libroId,
    usuario,
    rating,
    comentario,
    fecha: new Date().toISOString().split('T')[0],
    aprobada: true
  });

  res.redirect('/libros/' + libroId + '?resena=enviada');
});

// ─── POST /inscribirse ─────────────────────────────────────────────────────────
app.post('/inscribirse', (req, res) => {
  const nombre = (req.body.nombre || '').trim();
  if (!nombre) return res.redirect('/eventos');
  res.redirect('/eventos?inscrito=' + encodeURIComponent(nombre));
});

// ─── INICIO ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`✅ Portal corriendo en puerto ${PORT}`));
