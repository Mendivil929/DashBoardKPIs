// ======================= INICIALIZACIÓN Y MANEJO DE FORMULARIOS (Main) =======================
function inicializarScrap() {
    const scrapIndicatorForm = document.getElementById('scrapIndicatorForm');
    const scrapForm = document.getElementById('scrapForm'); // Asegúrate que esté definido
    inicializarCalendarios();

    // ¡SIMPLIFICADO! Este formulario ahora SOLO INSERTA.
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
            // Sincronizamos la fecha después de resetear
            const masterDate = document.getElementById('fecha-principal').value;
            const now = new Date();
            now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
            const currentTime = now.toISOString().slice(11, 16);
            document.getElementById('fecha-indicador').value = `${masterDate}T${currentTime}`;
            fetchRegistros();
        } catch (err) {
            console.error('❌ Error al guardar:', err);
            alert('❌ Error al guardar');
        }
    });
    
    // El formulario de procesos se queda igual
    scrapForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const controlFecha = document.getElementById('fecha-proceso').value;
        const fecha = document.getElementById('fecha-proceso').value;
        const nombre = document.getElementById('proceso').value;
        const cantidad = parseFloat(document.getElementById('cantidad').value);
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
            document.getElementById('fecha-proceso').value = controlFecha;
        } catch (err) {
            console.error('❌ Error al guardar:', err);
            alert('❌ Error al guardar');
        }
    });

    fetchRegistros();
}

// ======================= LÓGICA PRINCIPAL DE LA PÁGINA =======================

async function fetchRegistros() {
    // Registros de costos de material y scrap
    try {
        const fecha = document.getElementById("fecha-principal").value;
        const res = await fetch(`http://localhost:3000/api/consultaIndicadorClave-scrapHTML?fechaActual=${fecha}`);
        if (!res.ok) throw new Error('Error al obtener registros');

        const data = await res.json();
        const tbody = document.querySelector('#scrapIndicatorTable tbody');
        tbody.innerHTML = '';

        data.forEach(reg => {
            const row = document.createElement('tr');
            const regString = JSON.stringify(reg);
            row.innerHTML = `
                <td>${reg.id}</td>
                <td>${reg.fecha ? reg.fecha.slice(0, 16).replace('T', ' ') : ''}</td>
                <td>${'$' + reg.costEndItem}</td>
                <td>${'$' + reg.costScrap}</td>
                <td>${reg.porcentScrap}</td>
                <td class="contenedorBotones">
                    <button class="edit-btn" onclick='modifyRegistroIndicadores(this, ${regString})' 
                    data-full-date="${reg.fecha}">Modificar</button>
                    <button class="delete-btn" onclick="deleteRegistroIndicadores(${reg.id})">Eliminar</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (err) {
        console.error('❌ Error al cargar registros de costos:', err);
    }

    // Registros de procesos de scrap
    try {
        const res = await fetch('http://localhost:3000/api/consultaScrapProceso-scrapHTML');
        if (!res.ok) throw new Error('Error al obtener registros');

        const data = await res.json();
        const tbody = document.querySelector('#scrapTable tbody');
        tbody.innerHTML = '';

        data.forEach(reg => {
            const row = document.createElement('tr');
            // Nota: No hay botón de modificar aquí, así que no se necesita cambiar nada
            row.innerHTML = `
                <td>${reg.ID}</td>
                <td>${reg.Fecha ? reg.Fecha.split('T')[0] : ''}</td>
                <td>${reg.nombreProceso}</td>
                <td>${'$' + reg.amountProceso}</td>
                <td>
                    <button class="delete-btn" onclick="deleteRegistroProcesos(${reg.ID})">Eliminar</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (err) {
        console.error('❌ Error al cargar registros de procesos:', err);
    }
}

// Llena la modal y la abre.
function modifyRegistroIndicadores(buttonElement, reg) {
    // 1. Llenamos el formulario de la MODAL con los datos del registro
    document.getElementById('edit-id-hidden').value = reg.id;
    
    // Leemos la fecha COMPLETA desde el atributo data- del botón
    const fullDate = buttonElement.getAttribute('data-full-date');
    // Usamos .slice() para mostrarla formateada, pero la fecha original está segura.
    document.getElementById('edit-fecha-indicador').value = fullDate.slice(0, 16); 

    document.getElementById('edit-costEndItem').value = reg.costEndItem;
    document.getElementById('edit-costScrap').value = reg.costScrap;

    // 2. Abrimos la modal
    openEditModal();
}

// ======================= MANEJO DE LA VENTANA MODAL =======================
const editModal = document.getElementById('editModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const editIndicatorForm = document.getElementById('editIndicatorForm');

// Función para abrir la modal (será llamada por el botón "Modificar")
function openEditModal() {
    editModal.style.display = 'flex';
}

// Función para cerrar la modal
function closeEditModal() {
    editModal.style.display = 'none';
}

// Event Listeners para cerrar la modal
closeModalBtn.addEventListener('click', closeEditModal);
window.addEventListener('click', (e) => {
    if (e.target === editModal) {
        closeEditModal();
    }
});
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && editModal.style.display === 'flex') {
        closeEditModal();
    }
});

// Lógica para enviar la actualización DESDE LA MODAL
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
        closeEditModal(); // Cerramos la modal
        fetchRegistros(); // Refrescamos la tabla

    } catch (err) {
        console.error('❌ Error al actualizar:', err);
        alert('❌ Error al actualizar');
    }
});


// Las funciones de eliminar se quedan igual que antes
async function deleteRegistroProcesos(id) {
    if (!confirm('¿Seguro que deseas eliminar este registro?')) return;
    try {
        const res = await fetch(`http://localhost:3000/api/deleteOnScrapProcesos/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Error al eliminar');
        alert('✅ Registro eliminado');
        fetchRegistros();
    } catch (err) {
        console.error('❌ Error al eliminar registro:', err);
    }
}

async function deleteRegistroIndicadores(id) {
    if (!confirm('¿Seguro que deseas eliminar este registro?')) return;
    try {
        const res = await fetch(`http://localhost:3000/api/deleteOnScrapIndicator/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Error al eliminar');
        alert('✅ Registro eliminado');
        fetchRegistros();
    } catch (err) {
        console.error('❌ Error al eliminar registro:', err);
    }
}

// La función de inicializar calendarios se queda igual
function inicializarCalendarios() {
    const masterControl = document.getElementById('fecha-principal');
    const slaveControls = [
        document.getElementById('fecha-indicador'),
        document.getElementById('fecha-proceso')
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

document.addEventListener('DOMContentLoaded', inicializarScrap);