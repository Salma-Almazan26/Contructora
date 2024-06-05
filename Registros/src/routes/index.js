const { Router } = require('express');
const router = Router();
const admin = require('firebase-admin');
const session = require('express-session');
const bodyParser = require('body-parser');

//una vez que agregamos el archivo en el proyecto creamos una variable con la direccion del archivo
var serviceAccount = require("../../constructora-f1b33-firebase-adminsdk-cjf8x-996d3faa6c.json");

//conexion a la base de datos en tiempo real
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://constructora-f1b33-default-rtdb.firebaseio.com/'
});


router.use(session({ secret: 'blackpink', resave: false, saveUninitialized: true }));
router.use(bodyParser.urlencoded({ extended: true }));

const db =admin.database();

router.get('/', (req, res) => {
    res.render('index'); 


console.log("holiiiiiii", req.session.user); 
});

router.get('/dashboard',async (req, res) => {

    console.log("Entrando en GET /dashboard");
    try {
        const usuarioEmail = req.session.user.email.replace(/[@.]/g, '');
        const userId = req.session.user.id;
    
        // Obtén todos los documentos del usuario desde Firebase
        const documentosRef = db.ref(`users/${usuarioEmail}/documentos`);
        //const snapshot = await documentosRef.once('value');
        //const documentos = snapshot.val() || {};
        
        // Convierte los documentos a un array
        //const documentosArray = Object.values(documentos);

        const documentosSnapshot = await documentosRef.once('value');
        const documentos = documentosSnapshot.val() || {};
    
    const documentosIds = Object.keys(documentos).map(docId => ({
        id: docId,
        ...documentos[docId],
      }));
    console.log("ids2: ", documentosIds)
    // Obtén los datos de los documentos
    //const documentosArray = Object.values(documentos);
      
    // Almacena toda la información del usuario y sus documentos en la sesión
    req.session.user = {
        ...req.session.user,
        documentos: documentosIds
    };
    // Almacena toda la información del usuario en la sesión
    //req.session.user = user;
    //console.log("documentos",documentosArray)

    documentosIds.forEach(documento => {
        console.log("Empresa del documento:", documento.obra);
      });
      
    
        res.render('dashboard', { user: req.session.user, documentos: documentosIds });
      } catch (error) {
        console.error('Error al obtener documentos del usuario:', error);
        res.status(500).send('Error interno del servidor');
      }
      });
      

// autenticacion
router.post('/dashboard', async (req, res) => {
    console.log("Entrando en POST /dashboard");
    const { email, password } = req.body;
    
    try {
    const usersRef = db.ref('Users');
    const snapshot = await usersRef.orderByChild('email').equalTo(email).once('value');
    const users = snapshot.val();
    
    if (users) {
    const userId = Object.keys(users)[0];
    const user = users[userId];
    
    if (user.password === password) {
    console.log("entre justo aqui");

    // Obtén los documentos del usuario desde Firebase
    const usuarioEmail = user.email.replace(/[@.]/g, '');
    const documentosRef = db.ref(`users/${usuarioEmail}/documentos`);
    
    const documentosSnapshot = await documentosRef.once('value');
    const documentos = documentosSnapshot.val() || {};
    
    const documentosIds = Object.keys(documentos).map(docId => ({
        id: docId,
        ...documentos[docId],
      }));
    console.log("ids: ", documentosIds)
    // Obtén los datos de los documentos
    //const documentosArray = Object.values(documentos);
      
    // Almacena toda la información del usuario y sus documentos en la sesión
    req.session.user = {
        ...req.session.user,
        documentos: documentosIds
    };
    // Almacena toda la información del usuario en la sesión
    req.session.user = user;
    //console.log("documentos",documentosArray)

    documentosIds.forEach(documento => {
        console.log("Empresa del documento:", documento.obra);
      });
      
    res.render('dashboard', { user: req.session.user, documentos: documentosIds});
    

    } else {
    res.render('index', { error: 'Email o Contraseña incorrecta' });
    }
    } else {
    res.render('index', { error: 'Usuario no encontrado' });
    }
    } catch (error) {
    console.error('Error al autenticar usuario:', error);
    res.status(500).send('Error interno del servidor');
    }
    });

//Pagina de registro
router.get('/registro', (req, res) => {
    res.render('registro'); // Reemplaza 'registro' con el nombre de tu vista de registro
});

router.get('/new', (req, res) => {
    res.render('new'); // Reemplaza 'registro' con el nombre de tu vista de registro
});
let userId = 1;

router.post('/new-user', (req, res)=>{
    console.log(req.body);
    //creamos una variable donde estan todos los datos que va a lleva el usuario
    const newUser= {
        id: userId,
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        password2: req.body.password2
    };

    userId++;
    //mandamos los datos a una coleccion llamada Users
    db.ref('Users').push(newUser);
    res.render('index');
});

router.post('/guardar-datos', (req, res) => {
    // Verificar si req.session.user está definido y tiene la propiedad email
    if (req.session.user && req.session.user.email) {
        // Creamos una variable con todos los datos que va a llevar el documento
        const nuevoDocumento = {
            empresa: req.body.title,
            rfcEmpresa: req.body.rfc,
            obra: req.body.nombreObra,
            direccion: req.body.direccionObra,
            noContrato: req.body.numeroContrato,
            noObra: req.body.numeroObra,
            fechaIniciacion: req.body.fechaIniciacion,
            fechaFinalizacion: req.body.fechaFinalizacion,
            contratista: req.body.nombreContratista,
            noDocumento: req.body.numeroDocumentoContratista,
            direccionContratista: req.body.direccionContratista,
            telefonoContratista: req.body.telefonoContratista,

            encabezados: [],
            tabla: []
        };

        // Agregamos los encabezados al documento
        const encabezados = req.body.encabezados.split(",").filter(Boolean);
        console.log("Variable............", req.body.encabezados)
        console.log("Datos del formulario:", req.body);

       /*  for (let i = 0; i < encabezados.length; i++) {
           
            nuevoDocumento.encabezados.push({
                nombre: encabezados[i]
            });
        }
        let fila;*/
        // Agregamos datos de la tabla al documento
      for (let i = 0; i <= req.body.numFilas; i++) {

            if(req.body[`encabezado_${i}`]){
                fila = {
                    encabezado: req.body[`encabezado_${i}`] || "",
                };
            }else if(req.body[`no_${i}`]){
            fila = {
                no: req.body[`no_${i}`] || "",
                descripcion: req.body[`descripcion_${i}`] || "",
                unidad: req.body[`unidad_${i}`] || "",
                cantidad: req.body[`cantidad_${i}`] || "",
                precioUnitario: req.body[`precio_${i}`] || "",
                total: req.body[`total_${i}`] || "",
                // ... Otros campos de la fila ...
            
            };
        }else{
            fila = {};
        }
        // Añadir fila a la tabla usando un índice numérico como clave
        nuevoDocumento.tabla[i] = fila;
        
        
        console.log("Encabezados:::::::::::::::::::::::", encabezados);
        
    }
        console.log("Datos a enviar a Firebase:", nuevoDocumento);

        // Quitamos los caracteres especiales del correo
        var user = req.session.user.email
        var usuarioFiltrado = user.replace(/[@.]/g, '')

        function limpiarCaracteresEspeciales(texto) {
            // Reemplaza todos los caracteres no permitidos con un guion bajo (_)
            return texto.replace(/[_@.-]/g, '');
        }

        // Obtenemos una referencia al usuario actual
        var usuarioRef = db.ref('users').child(usuarioFiltrado);

        // Genera una clave única para el nuevo documento y elimina caracteres especiales
        var nuevoDocumentoKey = limpiarCaracteresEspeciales(usuarioRef.child('documentos').push().key);

        // Añadimos el nuevo documento a la colección de documentos del usuario
        var documentoRef = usuarioRef.child('documentos').child(nuevoDocumentoKey);
        documentoRef.set(nuevoDocumento);
        

        res.redirect('/dashboard');
    } else {
        // Si req.session.user no está definido o no tiene la propiedad email, redirige al usuario
        res.redirect('/dashboard');
    }
});

// Ruta para ver un documento específico
router.get('/:id', async (req, res) => {
    //const {email} = req.body
    try {
        const documentoId = req.params.id;
        console.log("hola----------",req.params.id)

        const usuarioEmail = req.session.user.email.replace(/[@.]/g, '');
        // Obtén todos los documentos del usuario desde Firebase
        const documentosRef = db.ref(`users/${usuarioEmail}/documentos`);
        const snapshot = await documentosRef.once('value');
        const documentos = snapshot.val() || {};

        // Obtén las claves (IDs) de los documentos
        const documentosIds = Object.keys(documentos);

        if (!documentosIds.includes(documentoId)) {
            return res.status(404).send('Documento no encontrado');
        }

        // Llama a la función para obtener el documento por su ID
        const documento = documentos[documentoId];

        console.log("estoy enviando esto", documento)
        // Renderiza el archivo HBS con los datos del documento
        res.render('documento', { documento, documentoId });

    } catch (error) {
      console.error('Error al obtener el documento:', error);
      res.status(500).send('Error interno del servidor');
    }
  });

//Entrar a editar
router.get('/editar/:documentoId', async  (req, res) => {
    try{
        const documentoId = req.params.documentoId;
        console.log("hola----------",req.params.documentoId)

        const usuarioEmail = req.session.user.email.replace(/[@.]/g, '');
        // Obtén todos los documentos del usuario desde Firebase
        const documentosRef = db.ref(`users/${usuarioEmail}/documentos`);
        const snapshot = await documentosRef.once('value');
        const documentos = snapshot.val() || {};

        // Obtén las claves (IDs) de los documentos
        const documentosIds = Object.keys(documentos);

        if (!documentosIds.includes(documentoId)) {
            return res.status(404).send('Documento no encontrado');
        }

        // Llama a la función para obtener el documento por su ID
        const documento = documentos[documentoId];

        console.log("estoy enviando esto", documento)
        // Renderiza el archivo HBS con los datos del documento
        res.render('editar', {documentoId, documento });
        
    }catch(error){
        console.error('Error al obtener el documento:', error);
        res.status(500).send('Error interno del servidor');
    }
    
});

// Ruta para manejar la actualización de datos del documento
router.post('/actualizar-datos', async(req, res) => {
    
    const documentoId = req.body.documentoId;
    const usuarioEmail = req.session.user.email.replace(/[@.]/g, '');
    console.log("tiene de actualizarrrrrr", req.body)

    // Obtener la referencia al documento que se desea actualizar
    const documentoRef = db.ref(`users/${usuarioEmail}/documentos/${documentoId}`);

    const tablaData = [];
for (const key in req.body) {
    if (key.startsWith('tabla')) {
        const match = key.match(/\[(\d+)\]\[(\w+)\]/);
        if (match) {
            const index = parseInt(match[1]);
            const field = match[2];
            if (!tablaData[index]) {
                tablaData[index] = {};
            }
            tablaData[index][field] = req.body[key];
        }
    }
}

// Construir la estructura de datos para la tabla
const tabla = tablaData.filter(row => Object.keys(row).length > 0);

    const updatedData = {
        empresa: req.body.title,
        rfcEmpresa: req.body.rfc,
        obra: req.body.nombreObra,
        direccion: req.body.direccionObra,
        noContrato: req.body.numeroContrato,
        noObra: req.body.numeroObra,
        fechaIniciacion: req.body.fechaIniciacion,
        fechaFinalizacion: req.body.fechaFinalizacion,
        contratista: req.body.nombreContratista,
        noDocumento: req.body.numeroDocumentoContratista,
        direccionContratista: req.body.direccionContratista,
        telefonoContratista: req.body.telefonoContratista,
        tabla: tabla

    };
    
    console.log("que trae update: ",updatedData)
    try {
        
       // Actualiza los datos en la base de datos de Firebase
       await db.ref(`users/${usuarioEmail}/documentos/${documentoId}`).update(updatedData);

       // Redirige al usuario a alguna página de confirmación o a la vista del documento actualizado
       res.redirect(documentoId);
   } catch (error) {
       // Maneja el error en caso de que ocurra
       console.error('Error al actualizar datos en Firebase:', error);
       // Puedes redirigir al usuario a una página de error
       res.status(500).send('Error al actualizar datos en Firebase');
   }
});
  

module.exports = router;