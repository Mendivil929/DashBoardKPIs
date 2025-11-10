// script-scrap.js (VERSIÓN CORREGIDA Y ORDENADA)

// ======================= MANEJO MODAL INDICADORES =======================
const editModal = document.getElementById('editModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const editIndicatorForm = document.getElementById('editIndicatorForm');

function openEditModal() { editModal.style.display = 'flex'; }
function closeEditModal() { editModal.style.display = 'none'; }

closeModalBtn.addEventListener('click', closeEditModal);
window.addEventListener('click', (e) => { if (e.target === editModal) closeEditModal(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && editModal.style.display === 'flex') closeEditModal(); });

// ======================= MANEJO MODAL PROCESOS =======================
const editProcessModal = document.getElementById('editProcessModal');
const closeProcessModalBtn = document.getElementById('closeProcessModalBtn');
const editProcessForm = document.getElementById('editProcessForm');

function openEditProcessModal() { editProcessModal.style.display = 'flex'; }
function closeProcessModal() { editProcessModal.style.display = 'none'; } // <-- Nombre corregido

closeProcessModalBtn.addEventListener('click', closeProcessModal); // <-- Llamada corregida
window.addEventListener('click', (e) => { if (e.target === editProcessModal) closeProcessModal(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && editProcessModal.style.display === 'flex') closeProcessModal(); });

// ======================= MANEJO MODAL PROCESOS =======================
const editDefectoModal = document.getElementById('editDefectoModal');
const closeDefectoModalBtn = document.getElementById('closeDefectoModalBtn');
const editDefectoForm = document.getElementById('editDefectoForm');
function openEditDefectoModal() { editDefectoModal.style.display = 'flex'; }
function closeEditDefectoModal() { editDefectoModal.style.display = 'none'; }
closeDefectoModalBtn.addEventListener('click', closeEditDefectoModal);
window.addEventListener('click', (e) => { if (e.target === editDefectoModal) closeEditDefectoModal(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && editDefectoModal.style.display === 'flex') closeEditDefectoModal(); });


// ======================= INICIALIZACIÓN Y MANEJO DE FORMULARIOS (Main) =======================
function inicializarScrap() {
    const scrapIndicatorForm = document.getElementById('scrapIndicatorForm');
    const scrapForm = document.getElementById('scrapForm');
    const scrapDefectoForm = document.getElementById('scrapDefectoForm');

    inicializarCalendarios();

    // Formulario para INSERTAR Indicadores
    scrapIndicatorForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fecha = document.getElementById('fecha-indicador').value.replace('T', ' ');
        const costEndItem = document.getElementById('costEndItem').value;
        const costScrap = parseFloat(document.getElementById('costScrap').value);
        const porcentScrap = (costScrap / costEndItem) * 100;
        const data = { fecha, costEndItem, costScrap, porcentScrap };
        try {
            const res = await fetch('http://localhost:3000/api/insertScrapIndicator', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error('Error al insertar');
            // alert('✅ Indicador guardado correctamente'); // Comentado para evitar doble alerta
            scrapIndicatorForm.reset();
            const masterDate = document.getElementById('fecha-principal').value;
            const now = new Date();
            now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
            const currentTime = now.toISOString().slice(11, 16);
            document.getElementById('fecha-indicador').value = `${masterDate}T${currentTime}`;
            fetchRegistros();
        } catch (err) { console.error('❌ Error al guardar:', err); alert('❌ Error al guardar'); }
    });
    
    // Formulario para INSERTAR Procesos
    scrapForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fecha = document.getElementById('fecha-proceso').value.replace('T', ' ');
        const nombre = document.getElementById('proceso').value;
        const cantidad = parseFloat(document.getElementById('cantidad').value);
        // alert(`Datos a enviar:\nFecha: ${fecha}\nNombre Proceso: ${nombre}\nCantidad: ${cantidad}`); // Alert de depuración
        try {
            const res = await fetch('http://localhost:3000/api/insertScrapProceso', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fecha, nombreProceso: nombre, amountProceso: cantidad })
            });
            if (!res.ok) throw new Error('Error al insertar');
            // alert('✅ Proceso guardado con éxito'); // Comentado para evitar doble alerta
            scrapForm.reset();
            fetchRegistros();
            document.getElementById('fecha-proceso').value = fecha;
        } catch (err) { console.error('❌ Error al guardar:', err); alert('❌ Error al guardar'); }
    });

    // Formulario para INSERTAR Defectos
    scrapDefectoForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        guardarNuevoDefecto();
    });

    // Submit del modal de Indicadores
    editIndicatorForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('edit-id-hidden').value;
        const fecha = document.getElementById('edit-fecha-indicador').value.replace('T', ' ');
        const costEndItem = document.getElementById('edit-costEndItem').value;
        const costScrap = parseFloat(document.getElementById('edit-costScrap').value);
        const porcentScrap = (costScrap / costEndItem) * 100;
        const data = { fecha, costEndItem, costScrap, porcentScrap };
        try {
            const res = await fetch(`http://localhost:3000/api/updateScrapIndicator/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error('Error al actualizar');
            // alert('✅ Registro actualizado correctamente'); // Comentado para evitar doble alerta
            closeEditModal();
            fetchRegistros();
        } catch (err) { console.error('❌ Error al actualizar:', err); alert('❌ Error al actualizar'); }
    });

    // Submit del modal de Procesos
    editProcessForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('edit-process-id-hidden').value;
        const fecha = document.getElementById('edit-fecha-proceso').value.replace('T', ' ');
        const nombreProceso = document.getElementById('edit-proceso-nombre').value;
        const amountProceso = parseFloat(document.getElementById('edit-proceso-cantidad').value);
        const data = { fecha, nombreProceso, amountProceso };
        try {
            const res = await fetch(`http://localhost:3000/api/updateScrapProceso/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error('Error al actualizar');
            // alert('✅ Proceso actualizado correctamente'); // Comentado para evitar doble alerta
            closeProcessModal();
            fetchRegistros();
        } catch (err) { console.error('❌ Error al actualizar proceso:', err); alert('❌ Error al actualizar proceso'); }
    });

    // Submit del modal de Defectos
    editDefectoForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        actualizarDefecto();
    });

    // Carga inicial de registros
    fetchRegistros();
    cargarSelectDefectos();
}

// ======================= LÓGICA DE DATOS Y MODALES =======================

async function fetchRegistros() {
    const buttonIndicador = document.getElementById('buttonIndicador');
    buttonIndicador.disabled = false;
    toggleButtonIndicator();
    const fecha = document.getElementById("fecha-principal").value;

    // Cargar Tabla Indicadores
    try {
        const res = await fetch(`http://localhost:3000/api/consultaIndicadorClave-scrapHTML?fechaActual=${fecha}`);
        if (!res.ok) throw new Error('Error al obtener registros');
        const data = await res.json();
        const tbody = document.querySelector('#scrapIndicatorTable tbody');
        tbody.innerHTML = '';
        if(data.length > 0){
            console.log('✅ El indicador clave ya está cargado para el día seleccionado.');
            buttonIndicador.disabled = true;
            toggleButtonIndicator();
        }
        data.forEach(reg => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${reg.id}</td>
                <td>${reg.fecha ? reg.fecha.slice(0, 16).replace('T', ' ') : ''}</td>
                <td>${'$' + reg.costEndItem}</td>
                <td>${'$' + reg.costScrap}</td>
                <td>${reg.porcentScrap}</td>
                <td class="contenedorBotones">
                    <button class="edit-btn" onclick='modifyRegistroIndicadores(${JSON.stringify(reg)})'>Modificar</button>
                    <button class="delete-btn" onclick="deleteRegistroIndicadores(${reg.id})">Eliminar</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (err) { console.error('❌ Error al cargar registros de costos:', err); }

    // Cargar Tabla Procesos
    try {
        // fecha = document.getElementById("fecha-principal").value;
        const res = await fetch(`http://localhost:3000/api/consultaScrapProceso-scrapHTML?fechaActual=${fecha}`);
        if (!res.ok) throw new Error('Error al obtener registros');
        const data = await res.json();
        const tbody = document.querySelector('#scrapTable tbody');
        tbody.innerHTML = '';
        data.forEach(reg => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${reg.ID}</td>
                <td>${reg.Fecha ? reg.Fecha.slice(0, 16).replace('T', ' ') : ''}</td>
                <td>${reg.nombreProceso}</td>
                <td>${'$' + reg.amountProceso}</td>
                <td class="contenedorBotones">
                    <button class="edit-btn" onclick='modifyRegistroProceso(${JSON.stringify(reg)})'>Modificar</button>
                    <button class="delete-btn" onclick="deleteRegistroProcesos(${reg.ID})">Eliminar</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (err) { console.error('❌ Error al cargar registros de procesos:', err); }

    // Cargar Tabla Defectos
    try {
        const res = await fetch(`http://localhost:3000/api/consultaDefectos-scrapHTML?fechaActual=${fecha}`);
        if (!res.ok) throw new Error('Error al obtener registros de defectos');
        const data = await res.json();
        const tbody = document.querySelector('#scrapDefectoTable tbody');
        tbody.innerHTML = '';
        data.forEach(reg => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${reg.id}</td>
                <td>${reg.fecha ? reg.fecha.slice(0, 16).replace('T', ' ') : ''}</td>
                <td>${reg.scrapCode}</td>
                <td>${reg.scrapName}</td>
                <td>$${reg.costo.toFixed(2)}</td>
                <td class="contenedorBotones">
                    <button class="edit-btn" onclick='modifyRegistroDefecto(${JSON.stringify(reg)})'>Modificar</button>
                    <button class="delete-btn" onclick="deleteRegistroDefecto(${reg.id})">Eliminar</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (err) { console.error('❌ Error al cargar registros de defectos:', err); }
}

// Modificar registros en modales
function modifyRegistroIndicadores(reg) {
    document.getElementById('edit-id-hidden').value = reg.id;
    document.getElementById('edit-fecha-indicador').value = reg.fecha.slice(0, 16);
    document.getElementById('edit-costEndItem').value = reg.costEndItem;
    document.getElementById('edit-costScrap').value = reg.costScrap;
    openEditModal();
}

function modifyRegistroProceso(reg) {
    document.getElementById('edit-process-id-hidden').value = reg.ID;
    document.getElementById('edit-fecha-proceso').value = reg.Fecha.slice(0, 16);
    document.getElementById('edit-proceso-nombre').value = reg.nombreProceso;
    document.getElementById('edit-proceso-cantidad').value = reg.amountProceso;
    openEditProcessModal();
}


window.modifyRegistroDefecto = (reg) => {
    document.getElementById('edit-defecto-id-hidden').value = reg.id;
    document.getElementById('edit-fecha-defecto').value = reg.fecha.slice(0, 16);
    document.getElementById('edit-defecto-nombre').value = reg.scrapCode; // Asignamos el scrapCode al <select>
    document.getElementById('edit-defecto-costo').value = reg.costo;
    openEditDefectoModal();
}

// ======================= LÓGICA PARA FORMULARIO DE DEFECTOS =======================

async function cargarSelectDefectos() {
    let defectos = []; // Almacenamos los defectos aquí para reutilizarlos
    try {
        const response = await fetch('http://localhost:3000/api/defectosCodigos');
        if (!response.ok) throw new Error('Error al cargar códigos de defecto');
        
        defectos = await response.json();
        
        // Poblar el <select> del formulario de AÑADIR
        const selectAnadir = document.getElementById('defecto-nombre');
        selectAnadir.innerHTML = ''; 
        const defaultOptionAnadir = document.createElement('option');
        defaultOptionAnadir.value = "";
        defaultOptionAnadir.textContent = "Seleccione un defecto...";
        defaultOptionAnadir.disabled = true;
        defaultOptionAnadir.selected = true;
        selectAnadir.appendChild(defaultOptionAnadir);

        defectos.forEach(defecto => {
            const option = document.createElement('option');
            option.value = defecto.scrapCode;
            option.textContent = defecto.scrapName;
            option.dataset.scrapName = defecto.scrapName; 
            selectAnadir.appendChild(option);
        });
        
        // Poblar el <select> del MODAL de EDICIÓN
        const selectEditar = document.getElementById('edit-defecto-nombre');
        selectEditar.innerHTML = ''; // Limpiamos por si acaso
        
        defectos.forEach(defecto => {
            const option = document.createElement('option');
            option.value = defecto.scrapCode;
            option.textContent = defecto.scrapName;
            option.dataset.scrapName = defecto.scrapName; 
            selectEditar.appendChild(option);
        });


    } catch (error) {
        console.error('Error al poblar el select de defectos:', error);
        // Deshabilitar ambos formularios si falla la carga
        document.getElementById('defecto-nombre').disabled = true;
        document.getElementById('defecto-costo').disabled = true;
        document.getElementById('buttonDefecto').disabled = true;
        document.getElementById('edit-defecto-nombre').disabled = true;
    }
}

async function guardarNuevoDefecto() {
    const fecha = document.getElementById('fecha-defecto').value.replace('T', ' ');
    const costo = parseFloat(document.getElementById('defecto-costo').value);
    const select = document.getElementById('defecto-nombre');
    
    if (!select.value || select.value === "") {
        alert('No se ha seleccionado un defecto.');
        return;
    }
    
    const selectedOption = select.options[select.selectedIndex];
    const scrapCode = selectedOption.value;
    const scrapName = selectedOption.dataset.scrapName;

    const data = { fecha, scrapCode, scrapName, costo };

    try {
        const res = await fetch('http://localhost:3000/api/insertScrapDefecto', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Error al guardar el defecto');

        document.getElementById('scrapDefectoForm').reset();
        
        const masterDate = document.getElementById('fecha-principal').value;
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        const currentTime = now.toISOString().slice(11, 16);
        document.getElementById('fecha-defecto').value = `${masterDate}T${currentTime}`;
        
        select.selectedIndex = 0;
        
        fetchRegistros(); //  Recargamos todas las tablas 

    } catch (err) {
        console.error('❌ Error al guardar defecto:', err);
        alert('❌ Error al guardar el defecto');
    }
}

// Función para actualizar un defecto
async function actualizarDefecto() {
    const id = document.getElementById('edit-defecto-id-hidden').value;
    const fecha = document.getElementById('edit-fecha-defecto').value.replace('T', ' ');
    const costo = parseFloat(document.getElementById('edit-defecto-costo').value);
    const select = document.getElementById('edit-defecto-nombre');
    
    const selectedOption = select.options[select.selectedIndex];
    const scrapCode = selectedOption.value;
    const scrapName = selectedOption.dataset.scrapName;

    const data = { fecha, scrapCode, scrapName, costo };

    try {
        const res = await fetch(`http://localhost:3000/api/updateScrapDefecto/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Error al actualizar el defecto');

        closeEditDefectoModal(); // Cierra el modal
        fetchRegistros(); // Recarga todas las tablas

    } catch (err) {
        console.error('❌ Error al actualizar defecto:', err);
        alert('❌ Error al actualizar el defecto');
    }
}

// ======================= FUNCIONES DE ELIMINAR Y CALENDARIOS =======================
async function deleteRegistroProcesos(id) {
    if (!confirm('¿Seguro que deseas eliminar este registro?')) return;
    try {
        const res = await fetch(`http://localhost:3000/api/deleteOnScrapProcesos/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Error al eliminar');
        // alert('✅ Registro eliminado');  // Comentado para evitar doble alerta
        fetchRegistros();
    } catch (err) { console.error('❌ Error al eliminar registro:', err); }
}

async function deleteRegistroIndicadores(id) {
    if (!confirm('¿Seguro que deseas eliminar este registro?')) return;
    try {
        const res = await fetch(`http://localhost:3000/api/deleteOnScrapIndicator/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Error al eliminar');
        // alert('✅ Registro eliminado');  // Comentado para evitar doble alerta
        fetchRegistros();
    } catch (err) { console.error('❌ Error al eliminar registro:', err); }
}

window.deleteRegistroDefecto = async (id) => {
    if (!confirm('¿Seguro que deseas eliminar este registro de defecto?')) return;
    try {
        const res = await fetch(`http://localhost:3000/api/deleteScrapDefecto/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Error al eliminar defecto');
        fetchRegistros();
    } catch (err) { console.error('❌ Error al eliminar registro de defecto:', err); }
}

function inicializarCalendarios() {
    const masterControl = document.getElementById('fecha-principal');

    const slaveControls = [ 
        document.getElementById('fecha-indicador'), 
        document.getElementById('fecha-proceso'),
        document.getElementById('fecha-defecto')
    ];

    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    const fechaHoraActual = now.toISOString().slice(0, 16);
    const fechaActual = fechaHoraActual.split('T')[0];

    masterControl.value = fechaActual;
    slaveControls.forEach(slave => { slave.value = fechaHoraActual; });

    masterControl.addEventListener('change', () => {
        const nuevaFecha = masterControl.value;
        slaveControls.forEach(slave => {
            const horaEsclavo = slave.value.split('T')[1];
            slave.value = `${nuevaFecha}T${horaEsclavo}`;
        });
        fetchRegistros();
    });

    slaveControls.forEach(slave => {
        slave.addEventListener('input', () => {
            const fechaMaestro = masterControl.value;
            const fechaEsclavo = slave.value.split('T')[0];
            if (fechaEsclavo !== fechaMaestro) {
                const nuevaHora = slave.value.split('T')[1];
                slave.value = `${fechaMaestro}T${nuevaHora}`;
            }
        });
    });
}

// -------------------------- HERRAMIENTAS DE PERSONALIZACION --------------------------

function toggleButtonIndicator(){
    const buttonIndicador = document.getElementById('buttonIndicador');
    if(buttonIndicador.disabled){
        buttonIndicador.classList.add('deshabilitado');

    } else {
        buttonIndicador.classList.remove('deshabilitado');
    }
}

document.addEventListener('DOMContentLoaded', inicializarScrap);