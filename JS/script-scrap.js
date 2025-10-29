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


// ======================= INICIALIZACIÓN Y MANEJO DE FORMULARIOS (Main) =======================
function inicializarScrap() {
    const scrapIndicatorForm = document.getElementById('scrapIndicatorForm');
    const scrapForm = document.getElementById('scrapForm');
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
            alert('✅ Indicador guardado correctamente');
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
        alert(`Datos a enviar:\nFecha: ${fecha}\nNombre Proceso: ${nombre}\nCantidad: ${cantidad}`);
        try {
            const res = await fetch('http://localhost:3000/api/insertScrapProceso', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fecha, nombreProceso: nombre, amountProceso: cantidad })
            });
            if (!res.ok) throw new Error('Error al insertar');
            alert('✅ Proceso guardado con éxito');
            scrapForm.reset();
            fetchRegistros();
            document.getElementById('fecha-proceso').value = fecha;
        } catch (err) { console.error('❌ Error al guardar:', err); alert('❌ Error al guardar'); }
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
            alert('✅ Registro actualizado correctamente');
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
            alert('✅ Proceso actualizado correctamente');
            closeProcessModal();
            fetchRegistros();
        } catch (err) { console.error('❌ Error al actualizar proceso:', err); alert('❌ Error al actualizar proceso'); }
    });

    fetchRegistros();
}

// ======================= LÓGICA DE DATOS Y MODALES =======================

async function fetchRegistros() {
    try {
        const fecha = document.getElementById("fecha-principal").value;
        const res = await fetch(`http://localhost:3000/api/consultaIndicadorClave-scrapHTML?fechaActual=${fecha}`);
        if (!res.ok) throw new Error('Error al obtener registros');
        const data = await res.json();
        const tbody = document.querySelector('#scrapIndicatorTable tbody');
        tbody.innerHTML = '';
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
    try {
        const res = await fetch('http://localhost:3000/api/consultaScrapProceso-scrapHTML');
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
}

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

// ======================= FUNCIONES DE ELIMINAR Y CALENDARIOS =======================
async function deleteRegistroProcesos(id) {
    if (!confirm('¿Seguro que deseas eliminar este registro?')) return;
    try {
        const res = await fetch(`http://localhost:3000/api/deleteOnScrapProcesos/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Error al eliminar');
        alert('✅ Registro eliminado');
        fetchRegistros();
    } catch (err) { console.error('❌ Error al eliminar registro:', err); }
}

async function deleteRegistroIndicadores(id) {
    if (!confirm('¿Seguro que deseas eliminar este registro?')) return;
    try {
        const res = await fetch(`http://localhost:3000/api/deleteOnScrapIndicator/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Error al eliminar');
        alert('✅ Registro eliminado');
        fetchRegistros();
    } catch (err) { console.error('❌ Error al eliminar registro:', err); }
}

function inicializarCalendarios() {
    const masterControl = document.getElementById('fecha-principal');
    const slaveControls = [ document.getElementById('fecha-indicador'), document.getElementById('fecha-proceso') ];
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

document.addEventListener('DOMContentLoaded', inicializarScrap);