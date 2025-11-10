const express = require('express');
/* const sql = require('mssql'); */ const sql = require('mssql'); //Acceso a base de datos local
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '2gb' })); // Aumentar el límite para manejar imágenes grandes
app.use(express.urlencoded({ limit: '2gb', extended: true }));

// ⚙️ Configura los datos reales de tu servidor SQL aquí
const dbConfig = {
    user: 'sa',  //Acceso con autenticación de windows
    password: 'clark929', 
    server: 'localhost',
    database: 'KPIDB',
    // driver: 'msnodesqlv8',
    options: {
      encrypt: true,                // Se usa true si tienes TLS
      trustServerCertificate: true 
      // trustedConnection: true
    }
};

// Creamos un pool de conexiones y lo almacenamos en app.locals
sql.connect(dbConfig).then(pool => {
  app.locals.db = pool;
  console.log('Conectado a la DB');
}).catch(err => {
    console.error('--- DETALLES COMPLETOS DEL ERROR DE CONEXIÓN ---');
    console.error(err); // Esto mostrará el objeto completo
    console.error('-------------------------------------------');
});

//  Ruta para hacer log-in
app.get('/api/kpis', async (req, res) => {
    try {
        const pool = req.app.locals.db;
        const result = await pool.request().query`SELECT * FROM Login_Users`; // ajusta tu tabla real
        res.json(result.recordset);
    } catch (err) {
        console.error('Error al obtener KPIs:', err);
        res.status(500).send('Error consultando la base de datos');
    }
});

// ============ DASHBOARD PRINCIPAL =============

//Ruta para consulta de indicadores de scrap en dashboard
app.get('/api/consultaIndicadorClave', async (req, res) => {
    try {
      //Obtenemos la fecha del parametro de la URL
      const { fechaInicio, fechaActual } = req.query;

      //Obtenemos el pool de conexiones
      const pool = req.app.locals.db;

      //Generamos el request para el indicador clave
      const requestIndicadorClave = pool.request(); //Se crea una nueva solicitud o peticion

      // Consulta para indicador clave 
      const sqlIndicadorClave = `SELECT (SUM(costScrap) / SUM(costEndItem) * 100) AS porcentajeReal FROM materialCosts WHERE CAST(fecha AS DATE) BETWEEN @fechaInicio AND @fechaActual`;
      requestIndicadorClave.input('fechaInicio', sql.Date, fechaInicio);
      requestIndicadorClave.input('fechaActual', sql.Date, fechaActual);  //Vinculamos el parametro que estamos utilizando
      const resultIndicadorClave = await requestIndicadorClave.query(sqlIndicadorClave);

      res.json(resultIndicadorClave.recordset); //Mandamos la consulta al JSON
    } 
    catch (err) {
      console.error('Error al obtener materiaCosts para indicador clave: ', err);
      res.status(500).send('Error al consultar la tabla materialCosts para indicador clave');
    }
});

//Ruta para consulta del historial de scrap en lineas
app.get('/api/consultaHistorialScrap', async (req, res) => {
    try{
      // Obtenemos la fecha del parametro de la URL
      const { fechaInicio, fechaActual } = req.query;
      //Obtenemos el pool de conexiones
      const pool = req.app.locals.db;
      //Generamos el request para el historial de scrap
      const requestHistorialScrap = pool.request(); //Se crea una nueva solicitud o peticion
      //Vinculamos los parametros que estamos utilizando
      requestHistorialScrap.input('fechaInicio', sql.Date, fechaInicio);
      requestHistorialScrap.input('fechaActual', sql.Date, fechaActual);

      //Consulta para historial de indicador scrap
      const sqlHistorialScrap = `SELECT id, fecha, costEndItem, costScrap, porcentScrap FROM materialCosts WHERE CAST(fecha AS DATE) BETWEEN @fechaInicio AND @fechaActual
      ORDER BY fecha ASC`;
      const resultHistorialScrap = await requestHistorialScrap.query(sqlHistorialScrap);

      res.json(resultHistorialScrap.recordset); //Mandamos la consulta al JSON
    }
    catch (err) {
      console.error('Error al obtener materialCosts para el historial de scrap: ', err);
      res.status(500).send('Error al consultar la tabla materialCosts para el historial de scrap');
    }
});

//Ruta para consulta de procesos de scrap en dashboard
app.get('/api/consultaScrapProceso', async (req, res) => {
    try {
      // Obtenemos la fecha del parametro de la URL
      const { fechaInicio, fechaActual } = req.query;
      //Obtenemos el pool de conexiones
      const pool = req.app.locals.db;
      //Generamos el request para los procesos de scrap
      const requestProcesos = pool.request(); //Se crea una nueva solicitud o peticion
      //Vinculamos los parametros que estamos utilizando
      requestProcesos.input('fechaInicio', sql.Date, fechaInicio);
      requestProcesos.input('fechaActual', sql.Date, fechaActual);

      // Consulta para procesos
      const sqlProcesos = `SELECT TOP 5 nombreProceso, amountProceso FROM scrapProcesos WHERE CAST(Fecha AS DATE) BETWEEN @fechaInicio AND @fechaActual 
      ORDER BY amountProceso DESC`;
      const resultProcesos = await requestProcesos.query(sqlProcesos);

      res.json(resultProcesos.recordset);   //Mandamos la consulta al JSON
    }
    catch (err) {
      console.error('Error al obtener scrapProcesos: ', err);
      res.status(500).send('Error al consultar la tabla scrapProcesos');
    }
});

// Ruta para los detalles de procesos de scrap (sin TOP 5) para el modal
app.get('/api/consultaScrapProcesoDetalles', async (req, res) => {
    try {
      const { fechaInicio, fechaActual } = req.query;
      const pool = req.app.locals.db;
      const requestProcesos = pool.request();
      requestProcesos.input('fechaInicio', sql.Date, fechaInicio);
      requestProcesos.input('fechaActual', sql.Date, fechaActual);

      // Consulta SIN TOP 5, ordenada para la tabla
      const sqlProcesosDetalles = `
          SELECT Fecha, nombreProceso, amountProceso 
          FROM scrapProcesos 
          WHERE CAST(Fecha AS DATE) BETWEEN @fechaInicio AND @fechaActual 
          ORDER BY amountProceso DESC
      `;
      
      const resultProcesos = await requestProcesos.query(sqlProcesosDetalles);
      res.json(resultProcesos.recordset);
    }
    catch (err) {
      console.error('Error al obtener detalles de scrapProcesos: ', err);
      res.status(500).send('Error al consultar la tabla scrapProcesos');
    }
});

// Endpoint para el gráfico TOP 5 DEFECTOS (Dashboard)
app.get('/api/consultaTopDefectos', async (req, res) => {
    try {
      const { fechaInicio, fechaActual } = req.query;
      const pool = req.app.locals.db;
      const request = pool.request();
      request.input('fechaInicio', sql.Date, fechaInicio);
      request.input('fechaActual', sql.Date, fechaActual);

      const sqlQuery = `
          SELECT TOP 5 scrapName, SUM(costo) as totalCosto 
          FROM scrapDefectos 
          WHERE CAST(fecha AS DATE) BETWEEN @fechaInicio AND @fechaActual 
          GROUP BY scrapName 
          ORDER BY totalCosto DESC
      `;
      
      const result = await request.query(sqlQuery);
      res.json(result.recordset);
    }
    catch (err) {
      console.error('Error al obtener Top 5 Defectos: ', err);
      res.status(500).send('Error al consultar scrapDefectos');
    }
});

// Endpoint para la TABLA DE DETALLES de Defectos (Modal)
app.get('/api/consultaDefectosDetalles', async (req, res) => {
    try {
      const { fechaInicio, fechaActual } = req.query;
      const pool = req.app.locals.db;
      const request = pool.request();
      request.input('fechaInicio', sql.Date, fechaInicio);
      request.input('fechaActual', sql.Date, fechaActual);

      const sqlQuery = `
          SELECT fecha, scrapName, costo 
          FROM scrapDefectos 
          WHERE CAST(fecha AS DATE) BETWEEN @fechaInicio AND @fechaActual 
          ORDER BY costo DESC
      `;
      
      const result = await request.query(sqlQuery);
      res.json(result.recordset);
    }
    catch (err) {
      console.error('Error al obtener detalles de Defectos: ', err);
      res.status(500).send('Error al consultar scrapDefectos');
    }
});

// ============ PAGINA DE SCRAP =============

//Ruta para consulta de indicadores de scrap en scrap.html
app.get('/api/consultaIndicadorClave-scrapHTML', async (req, res) => {
    try {
      //Obtenemos la fecha del parametro de la URL
      const { fechaActual } = req.query;

      //Obtenemos el pool de conexiones
      const pool = req.app.locals.db;

      //Generamos el request para el indicador clave
      const requestIndicadorClave = pool.request(); //Se crea una nueva solicitud o peticion

      // Consulta para indicador clave 
      const sqlIndicadorClave = `SELECT id, fecha, costEndItem, costScrap, porcentScrap FROM materialCosts WHERE CAST(fecha AS DATE) = @fechaActual`;
      requestIndicadorClave.input('fechaActual', sql.Date, fechaActual);  //Vinculamos el parametro que estamos utilizando
      const resultIndicadorClave = await requestIndicadorClave.query(sqlIndicadorClave);

      res.json(resultIndicadorClave.recordset); //Mandamos la consulta al JSON
    } 
    catch (err) {
      console.error('Error al obtener materiaCosts para indicador clave: ', err);
      res.status(500).send('Error al consultar la tabla materialCosts para indicador clave');
    }
});

//Ruta para consulta de procesos en scrap.html
app.get('/api/consultaScrapProceso-scrapHTML', async (req, res) => {
    try {
        //Obtenemos la fecha del parametro de la URL
        const { fechaActual } = req.query;

        //Obtenemos el pool de conexiones
        const pool = req.app.locals.db;

        //Generamos el request para el indicador clave
        const requestProcesos = pool.request(); //Se crea una nueva solicitud o peticion

        // Consulta para procesos
        const sqlProcesos = `SELECT ID, Fecha, nombreProceso, amountProceso FROM scrapProcesos WHERE CAST(Fecha AS DATE) = @fechaActual`;
        requestProcesos.input('fechaActual', sql.Date, fechaActual);  //Vinculamos el parametro que estamos utilizando
        const resultProcesos = await requestProcesos.query(sqlProcesos);

        res.json(resultProcesos.recordset); //Mandamos la consulta al JSON
    } catch (err) {
        console.error('Error al obtener scrapProcesos: ', err);
        res.status(500).send('Error al consultar la tabla scrapProcesos');
    }
    }
);

// Ruta para consulta de DEFECTOS en scrap.html
app.get('/api/consultaDefectos-scrapHTML', async (req, res) => {
    try {
        const { fechaActual } = req.query;
        const pool = req.app.locals.db;
        const request = pool.request(); 

        const sqlQuery = `
            SELECT id, fecha, scrapCode, scrapName, costo 
            FROM scrapDefectos 
            WHERE CAST(fecha AS DATE) = @fechaActual
            ORDER BY fecha DESC
        `;
        request.input('fechaActual', sql.Date, fechaActual);
        
        const result = await request.query(sqlQuery);
        res.json(result.recordset);
    } 
    catch (err) {
      console.error('Error al obtener scrapDefectos: ', err);
      res.status(500).send('Error al consultar la tabla scrapDefectos');
    }
});

//Ruta para insercion de indicadores scrap en scrap.html
app.post('/api/insertScrapIndicator', async (req, res) => {
  const { fecha, costEndItem, costScrap, porcentScrap } = req.body; //Datos recibidos del frontend
  try {
    const pool = req.app.locals.db;
    
    await pool.request()
        // .input('fecha', sql.DateTime2, fecha) //Aseguramos el formato de fecha
        // .input('costEndItem', sql.Float, costEndItem)
        // .input('costScrap', sql.Float, costScrap)
        // .input('porcentScrap', sql.Float, porcentScrap)
        .query`
            INSERT INTO materialCosts (fecha, costEndItem, costScrap, porcentScrap)
            VALUES (${fecha}, ${costEndItem}, ${costScrap}, ${porcentScrap})
        `;
    res.status(200).json({ message: 'Insertado correctamente' });
  } catch (err) {
    console.error('❌ Error al insertar proceso:', err);
    res.status(500).send('Error al insertar en la base de datos');
  }
});

//Ruta para insercion de procesos en scrap.html
app.post('/api/insertScrapProceso', async (req, res) => {
  console.log('--- INTENTO DE INSERTAR PROCESO RECIBIDO ---');

  const { fecha, nombreProceso, amountProceso } = req.body;
  console.log('Datos recibidos del frontend:', { fecha, nombreProceso, amountProceso });


  try {
    const pool = req.app.locals.db;
    await pool.request().query`
            INSERT INTO scrapProcesos (Fecha, nombreProceso, amountProceso)
            VALUES (${fecha}, ${nombreProceso}, ${amountProceso})
        `;
    console.log('--- Inserción en DB exitosa ---');
    res.status(200).json({ message: 'Insertado correctamente' });
  } catch (err) {
    console.error('❌ Error al insertar proceso:', err);
    res.status(500).send('Error al insertar en la base de datos');
  }
});

// Ruta para insercion de defectos en scrap.html
app.post('/api/insertScrapDefecto', async (req, res) => {
    // Obtenemos los 4 campos del formulario
    const { fecha, scrapCode, scrapName, costo } = req.body;

    try {
        const pool = req.app.locals.db;
        await pool.request()
            // .input('fecha', sql.DateTime, fecha)
            .input('scrapCode', sql.VarChar(50), scrapCode)
            .input('scrapName', sql.VarChar(50), scrapName)
            .input('costo', sql.Float, costo)
            .query`
                INSERT INTO scrapDefectos (fecha, scrapCode, scrapName, costo) 
                VALUES (${fecha}, @scrapCode, @scrapName, @costo)
            `;
        
        res.status(200).json({ message: 'Defecto insertado correctamente' });
    } catch (err) {
        console.error('Error al insertar en scrapDefectos: ', err);
        res.status(500).send('Error al guardar el defecto');
    }
});

// Ruta para modificar indicadores en scrap.html
app.put('/api/updateScrapIndicator/:id', async (req, res) => {
    const { id } = req.params;
    const { fecha, costEndItem, costScrap, porcentScrap } = req.body;

    try {
        const pool = req.app.locals.db; // Usa el pool de conexiones como en las otras rutas
        await pool.request().query`
                UPDATE materialCosts
                SET fecha = ${fecha}, costEndItem = ${costEndItem}, costScrap = ${costScrap}, porcentScrap = ${porcentScrap}
                WHERE id = ${id}
            `;
        
        res.status(200).send('Registro actualizado con éxito');
    } catch (err) {
        console.error('❌ Error al actualizar en la base de datos:', err);
        res.status(500).send('Error al actualizar en la base de datos');
    }
});

// Ruta para modificar procesos en scrap.html
app.put('/api/updateScrapProceso/:id', async (req, res) => {
    const { id } = req.params;
    const { fecha, nombreProceso, amountProceso } = req.body;

    try {
        const pool = req.app.locals.db;
        await pool.request().query`
            UPDATE scrapProcesos
            SET 
                Fecha = ${fecha}, 
                nombreProceso = ${nombreProceso}, 
                amountProceso = ${amountProceso}
            WHERE 
                ID = ${id}
        `;

        res.status(200).send('Proceso actualizado con éxito');
    } catch (err) {
        console.error('❌ Error al actualizar el proceso:', err);
        res.status(500).send('Error al actualizar el proceso en la base de datos');
    }
});

// Ruta para modificar defectos en scrap.html
app.put('/api/updateScrapDefecto/:id', async (req, res) => {
    const { id } = req.params;
    const { fecha, scrapCode, scrapName, costo } = req.body;

    try {
        const pool = req.app.locals.db;
        await pool.request()
            .input('id', sql.Int, id)
            // .input('fecha', sql.DateTime, fecha)
            // .input('scrapCode', sql.VarChar(50), scrapCode)
            // .input('scrapName', sql.VarChar(50), scrapName)
            // .input('costo', sql.Float, costo)
            .query`
                UPDATE scrapDefectos
                SET fecha = ${fecha}, scrapCode = ${scrapCode}, 
                    scrapName = ${scrapName}, costo = ${costo}
                WHERE id = @id
            `;
        
        res.status(200).json({ message: 'Defecto actualizado correctamente' });
    } catch (err) {
        console.error('Error al actualizar en scrapDefectos: ', err);
        res.status(500).send('Error al actualizar el defecto');
    }
});


//Ruta para eliminar registros de proceso en scrap.html
app.delete('/api/deleteOnScrapProcesos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const pool = req.app.locals.db;
    const result = await pool.request().query`DELETE FROM scrapProcesos WHERE ID = ${id}`;
    res.sendStatus(200);
  } catch (err) {
    console.error('❌ Error al eliminar el registro:', err);
    res.status(500).send('Error al eliminar el registro');
  }
});

//Ruta para eliminar registros de proceso en scrap.html
app.delete('/api/deleteOnScrapIndicator/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const pool = req.app.locals.db;
    const result = await pool.request().query`DELETE FROM materialCosts WHERE id = ${id}`;
    res.sendStatus(200);
  } catch (err) {
    console.error('❌ Error al eliminar el registro:', err);
    res.status(500).send('Error al eliminar el registro');
  }
});

// Ruta para eliminar defectos en scrap.html
app.delete('/api/deleteScrapDefecto/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const pool = req.app.locals.db;
        await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM scrapDefectos WHERE id = @id');
        
        res.status(200).json({ message: 'Defecto eliminado correctamente' });
    } catch (err) {
        console.error('Error al eliminar de scrapDefectos: ', err);
        res.status(500).send('Error al eliminar el defecto');
    }
});

// ============ PAGINA DE ENERGÍA energy.html y Gráfica de Energía =============

// Ruta para consultar los registros de energía
app.get('/api/consultaEnergy', async (req, res) => {
    const { fecha } = req.query; // Recibimos la fecha como parámetro
    if (!fecha) {
        return res.status(400).send('Se requiere una fecha.');
    }

    try {
        const pool = req.app.locals.db;
        const request = pool.request();
        // request.input('fecha', sql.Date, fecha); // Usamos sql.Date para comparar solo la parte de la fecha
        
        // Seleccionamos donde la parte de la FECHA de la columna datetime coincida
        const result = await request.query`
            SELECT * FROM energyConsumption 
            WHERE CAST(fecha AS DATE) = ${fecha} 
            ORDER BY fecha DESC
        `;
        
        res.json(result.recordset);
    } catch (err) {
        console.error('Error al obtener los datos de energía: ', err);
        res.status(500).send('Error al consultar la tabla energyConsumption');
    }
});

// Ruta para el DASHBOARD de Energía 
app.get('/api/consultaEnergyDashboard', async (req, res) => {
    const { fechaInicio, fechaActual } = req.query;

    if (!fechaInicio || !fechaActual) {
        return res.status(400).send('Se requieren fechas de inicio y fin.');
    }

    try {
        const pool = req.app.locals.db;
        const request = pool.request();
        
        request.input('fechaInicio', sql.Date, fechaInicio);
        request.input('fechaActual', sql.Date, fechaActual);
        
        // Esta consulta agrupa por día y calcula los totales
        const result = await request.query(`
            SELECT 
                CAST(fecha AS DATE) AS dia,
                SUM(electricidad_consumo) AS total_electricidad_consumo,
                SUM(electricidad_produccion) AS total_electricidad_produccion,
                SUM(helio_consumo) AS total_helio_consumo,
                SUM(helio_produccion) AS total_helio_produccion
            FROM energyConsumption 
            WHERE CAST(fecha AS DATE) BETWEEN @fechaInicio AND @fechaActual
            GROUP BY CAST(fecha AS DATE)
            ORDER BY dia ASC
        `);
        
        res.json(result.recordset);
    } catch (err) {
        console.error('Error al obtener los datos agregados de energía: ', err);
        res.status(500).send('Error al consultar energyConsumption');
    }
});

// Ruta para el MODAL de Energía (detalles filtrados por fecha)
app.get('/api/consultaEnergyDetalles', async (req, res) => {
    const { fechaInicio, fechaActual } = req.query;

    if (!fechaInicio || !fechaActual) {
        return res.status(400).send('Se requieren fechas de inicio y fin.');
    }

    try {
        const pool = req.app.locals.db;
        const request = pool.request();
        
        request.input('fechaInicio', sql.Date, fechaInicio);
        request.input('fechaActual', sql.Date, fechaActual);
        
        // Usamos CAST(fecha AS DATE) para ignorar la hora y filtrar por día
        const result = await request.query(`
            SELECT * FROM energyConsumption 
            WHERE CAST(fecha AS DATE) BETWEEN @fechaInicio AND @fechaActual
            ORDER BY fecha DESC
        `);
        
        res.json(result.recordset);
    } catch (err) {
        console.error('Error al obtener los detalles de energía: ', err);
        res.status(500).send('Error al consultar energyConsumption');
    }
});

// Ruta para insertar un nuevo registro de energía
app.post('/api/insertEnergy', async (req, res) => {
  const { fecha, electricidad_consumo, electricidad_produccion, helio_consumo, helio_produccion } = req.body;

  try {
    const pool = req.app.locals.db;
    await pool.request().query`
      INSERT INTO energyConsumption (fecha, electricidad_consumo, electricidad_produccion, helio_consumo, helio_produccion)
      VALUES (${fecha}, ${electricidad_consumo}, ${electricidad_produccion}, ${helio_consumo}, ${helio_produccion})
    `;
    res.status(200).json({ message: 'Registro de energía insertado correctamente' });
  } catch (err) {
    console.error('❌ Error al insertar el registro de energía:', err);
    res.status(500).send('Error al insertar en la base de datos');
  }
});

// Ruta para actualizar (Modificar) un registro de energía
app.put('/api/updateEnergy/:id', async (req, res) => {
    const { id } = req.params;
    const { electricidad_consumo, electricidad_produccion, helio_consumo, helio_produccion } = req.body;
    try {
        const pool = req.app.locals.db;
        await pool.request()
            .input('id', sql.Int, id)
            // .input('fecha', sql.DateTime, fecha)
            .input('electricidad_consumo', sql.Decimal(10, 3), electricidad_consumo)
            .input('electricidad_produccion', sql.Int, electricidad_produccion)
            .input('helio_consumo', sql.Decimal(10, 3), helio_consumo)
            .input('helio_produccion', sql.Int, helio_produccion)
            .query`
                UPDATE energyConsumption 
                SET electricidad_consumo = @electricidad_consumo, 
                    electricidad_produccion = @electricidad_produccion, 
                    helio_consumo = @helio_consumo, 
                    helio_produccion = @helio_produccion
                WHERE id = @id
            `;
        
        res.status(200).json({ message: 'Registro actualizado correctamente' });
    } catch (err) {
        console.error('Error al actualizar el registro de energía: ', err);
        res.status(500).send('Error al actualizar el registro');
    }
});

// Ruta para eliminar un registro de energía
app.delete('/api/deleteEnergy/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const pool = req.app.locals.db;
    await pool.request().query`DELETE FROM energyConsumption WHERE id = ${id}`;
    res.status(200).send('Registro eliminado correctamente');
  } catch (err)
  {
    console.error('❌ Error al eliminar el registro de energía:', err);
    res.status(500).send('Error al eliminar el registro');
  }
});

// ============ PERFIL DEL USUARIO =============

// 1. OBTENER DATOS DE UN USUARIO POR ID
app.get('/api/user/profile/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const pool = req.app.locals.db;
        const result = await pool.request()
            .input('id', sql.Int, id)
            // IMPORTANTE: Nunca selecciones la contraseña, ni siquiera hasheada.
            .query('SELECT id_user, userName, name, lastName, foto FROM Login_Users WHERE id_user = @id');

        if (result.recordset.length > 0) {
            res.json(result.recordset[0]);
        } else {
            res.status(404).send('Usuario no encontrado');
        }
    } catch (err) {
        console.error('❌ Error al obtener perfil de usuario:', err);
        res.status(500).send('Error en el servidor');
    }
});

// 2. ACTUALIZAR INFORMACIÓN PERSONAL
app.put('/api/user/profile/:id', async (req, res) => {
    const { id } = req.params;
    const { name, lastName } = req.body;
    try {
        const pool = req.app.locals.db;
        await pool.request()
            .input('id', sql.Int, id)
            // .input('userName', sql.VarChar(50), userName)
            .input('name', sql.VarChar(50), name)
            .input('lastName', sql.VarChar(50), lastName)
            .query(`
                UPDATE Login_Users 
                SET name = @name, lastName = @lastName 
                WHERE id_user = @id
            `);
        res.status(200).json({ message: 'Perfil actualizado correctamente' });
    } catch (err) {
        console.error('❌ Error al actualizar perfil:', err);
        res.status(500).send('Error en el servidor');
    }
});

// 3. ACTUALIZAR FOTO DE PERFIL (manejando Base64)
app.put('/api/user/photo/:id', async (req, res) => {
    const { id } = req.params;
    const { foto } = req.body; // Se espera una cadena Base64

    // Quitar el prefijo 'data:image/jpeg;base64,' para obtener solo los datos binarios
    const base64Data = foto.replace(/^data:image\/\w+;base64,/, "");
    const photoBuffer = Buffer.from(base64Data, 'base64');

    try {
        const pool = req.app.locals.db;
        await pool.request()
            .input('id', sql.Int, id)
            .input('foto', sql.VarBinary(sql.MAX), photoBuffer)
            .query('UPDATE Login_Users SET foto = @foto WHERE id_user = @id');
        
        res.status(200).json({ message: 'Foto de perfil actualizada' });
    } catch (err) {
        console.error('❌ Error al actualizar foto:', err);
        res.status(500).send('Error en el servidor');
    }
});

// 4. ACTUALIZAR CONTRASEÑA
app.put('/api/user/password/:id', async (req, res) => {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    // 🚨 ¡ADVERTENCIA DE SEGURIDAD!
    // En un entorno real, NUNCA debes almacenar contraseñas en texto plano.
    // Deberías usar una librería como 'bcrypt' para comparar la 'currentPassword'
    // con la hash almacenada y para hashear la 'newPassword' antes de guardarla.
    // Por simplicidad para que funcione con tu estructura actual, lo hacemos directamente.

    try {
        const pool = req.app.locals.db;
        const result = await pool.request()
            .input('id', sql.Int, id)
            .input('currentPassword', sql.VarChar(50), currentPassword)
            .input('newPassword', sql.VarChar(50), newPassword)
            .query(`
                UPDATE Login_Users 
                SET password_user = @newPassword 
                WHERE id_user = @id AND password_user = @currentPassword
            `);
        
        if (result.rowsAffected[0] > 0) {
            res.status(200).json({ message: 'Contraseña actualizada' });
        } else {
            // Esto ocurre si el id no existe o si la 'currentPassword' es incorrecta
            res.status(400).json({ message: 'La contraseña actual es incorrecta o el usuario no existe' });
        }
    } catch (err) {
        console.error('❌ Error al cambiar contraseña:', err);
        res.status(500).send('Error en el servidor');
    }
});

// ================ APARTADO DE CONFIGURACIONES ================

// ---------- Configuraciones de scrap ----------

// Endpoint para LEER (GET) todos los códigos de defecto
app.get('/api/defectosCodigos', async (req, res) => {
    try {
        const pool = req.app.locals.db;
        // Usamos el nombre de tabla correcto: scrapDefectosCodigos
        const result = await pool.request().query('SELECT * FROM scrapDefectosCodigos ORDER BY scrapCode');
        res.json(result.recordset);
    } catch (err) {
        console.error('Error al obtener los códigos de defecto: ', err);
        res.status(500).send('Error al consultar la tabla scrapDefectosCodigos');
    }
});

// Endpoint para AÑADIR (POST) un nuevo código de defecto
app.post('/api/defectosCodigos', async (req, res) => {
    // Obtenemos los datos que envía el formulario desde el frontend
    const { scrapCode, scrapName } = req.body;

    try {
        const pool = req.app.locals.db;
        await pool.request()
            .input('scrapCode', sql.VarChar(50), scrapCode)
            .input('scrapName', sql.VarChar(50), scrapName)
            .query(`
                INSERT INTO scrapDefectosCodigos (scrapCode, scrapName) 
                VALUES (@scrapCode, @scrapName)
            `);
        
        // Respondemos con éxito
        res.status(200).json({ message: 'Defecto añadido correctamente' });
    } catch (err) {
        console.error('Error al insertar el código de defecto: ', err);
        // Manejar errores (ej. código duplicado)
        if (err.number === 2627 || err.number === 2601) { // Error de Primary Key/Unique constraint
            return res.status(409).send('Error: El Scrap Code ya existe.');
        }
        res.status(500).send('Error al guardar en la base de datos');
    }
});

// Endpoint para ELIMINAR (DELETE) un código de defecto
app.delete('/api/defectosCodigos/:id', async (req, res) => {
    // Obtenemos el 'id' que viene en la URL
    const { id } = req.params;

    try {
        const pool = req.app.locals.db;
        await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM scrapDefectosCodigos WHERE id = @id');
        
        // Respondemos con éxito
        res.status(200).json({ message: 'Defecto eliminado correctamente' });
    } catch (err) {
        console.error('Error al eliminar el código de defecto: ', err);
        res.status(500).send('Error al eliminar de la base de datos');
    }
});

// Endpoint para ACTUALIZAR (PUT) un código de defecto
app.put('/api/defectosCodigos/:id', async (req, res) => {
    const { id } = req.params;
    const { scrapCode, scrapName } = req.body;

    try {
        const pool = req.app.locals.db;
        await pool.request()
            .input('id', sql.Int, id)
            .input('scrapCode', sql.VarChar(50), scrapCode)
            .input('scrapName', sql.VarChar(50), scrapName)
            .query(`
                UPDATE scrapDefectosCodigos 
                SET scrapCode = @scrapCode, scrapName = @scrapName 
                WHERE id = @id
            `);
        
        res.status(200).json({ message: 'Defecto actualizado correctamente' });
    } catch (err) {
        console.error('Error al actualizar el código de defecto: ', err);
        if (err.number === 2627 || err.number === 2601) {
            return res.status(409).send('Error: El Scrap Code ya existe.');
        }
        res.status(500).send('Error al actualizar en la base de datos');
    }
});

// Iniciamos el servidor en el puerto 3000 y nos aseguramos de que la conexión a la DB esté lista
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`✅ Servidor backend escuchando en http://localhost:${PORT}`);
});