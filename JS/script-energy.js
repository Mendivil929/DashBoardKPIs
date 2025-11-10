// --- MANEJO DEL MODAL DE EDICIÓN (Tarea 3 - Correcto) ---
const editModal = document.getElementById('editEnergyModal');
const closeEnergyModalBtn = document.getElementById('closeEnergyModalBtn');
const editEnergyForm = document.getElementById('editEnergyForm');

function openEditEnergyModal() { editModal.style.display = 'flex'; }
function closeEditEnergyModal() { editModal.style.display = 'none'; }

closeEnergyModalBtn.addEventListener('click', closeEditEnergyModal);
window.addEventListener('click', (e) => { if (e.target === editModal) closeEditEnergyModal(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && editModal.style.display === 'flex') closeEditEnergyModal(); });


// --- LÓGICA DE LA PÁGINA ---

/**
 * Formatea una fecha ISO (ej. 2025-11-09T17:00:00.000Z) a un formato YYYY-MM-DD HH:MM
 */
function formatDateTime(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const anio = date.getFullYear();
    const mes = (date.getMonth() + 1).toString().padStart(2, '0');
    const dia = date.getDate().toString().padStart(2, '0');
    const horas = date.getHours().toString().padStart(2, '0');
    const minutos = date.getMinutes().toString().padStart(2, '0');
    return `${anio}-${mes}-${dia} ${horas}:${minutos}`;
}

/**
 * Formatea una fecha ISO para un input datetime-local
 * (ej. 2025-11-09T17:00:00.000Z -> 2025-11-09T10:00)
 */
function formatDateTimeForInput(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return date.toISOString().slice(0, 16);
}


/**
 * Carga los registros de la BD según el filtro de fecha (Tarea 2)
 * Ahora lee del input id="fecha"
 */
async function fetchEnergyRecords() {
    // Lee el valor del input del formulario
    const fechaInputValue = document.getElementById('fecha').value; 
    
    if (!fechaInputValue) {
        // Si el input está vacío, no cargues nada
        document.querySelector('#energyTable tbody').innerHTML = '<tr><td colspan="8">Seleccione una fecha para ver los registros.</td></tr>';
        return;
    }
    
    // Extrae SÓLO la parte de la fecha (YYYY-MM-DD)
    const fechaFiltro = fechaInputValue.split('T')[0];

    try {
        const response = await fetch(`http://localhost:3000/api/consultaEnergy?fecha=${fechaFiltro}`);
        if (!response.ok) throw new Error('Error al obtener los registros de energía');

        const data = await response.json();
        const tbody = document.querySelector('#energyTable tbody');
        tbody.innerHTML = '';

        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8">No hay registros para esta fecha.</td></tr>';
            return;
        }

        data.forEach(record => {
            const row = document.createElement('tr');
            const kwhPerUnit = record.electricidad_produccion > 0 ? (record.electricidad_consumo / record.electricidad_produccion).toFixed(4) : 'N/A';
            const m3PerUnit = record.helio_produccion > 0 ? (record.helio_consumo / record.helio_produccion).toFixed(4) : 'N/A';

            row.innerHTML = `
                <td>${record.id}</td>
                <td>${record.fecha ? record.fecha.slice(0, 16).replace('T', ' ') : ''}</td>
                <td>${record.electricidad_consumo}</td>
                <td>${record.helio_consumo}</td>
                <td>${kwhPerUnit}</td>
                <td>${m3PerUnit}</td>
                <td class="contenedorBotones">
                    <button class="edit-btn" onclick='openModifyModal(${JSON.stringify(record)})'>Modificar</button>
                    <button class="delete-btn" onclick="deleteEnergyRecord(${record.id})">Eliminar</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('❌ Error al cargar los registros de energía:', error);
    }
}

/**
 * Abre el modal de modificación con los datos del registro (Tarea 3)
 */
window.openModifyModal = (record) => {
    document.getElementById('edit-energy-id').value = record.id;
    document.getElementById('edit-fecha').value = formatDateTimeForInput(record.fecha);
    document.getElementById('edit-electricidad_consumo').value = record.electricidad_consumo;
    document.getElementById('edit-electricidad_produccion').value = record.electricidad_produccion;
    document.getElementById('edit-helio_consumo').value = record.helio_consumo;
    document.getElementById('edit-helio_produccion').value = record.helio_produccion;
    openEditEnergyModal();
}

/**
 * Elimina un registro
 */
async function deleteEnergyRecord(id) {
    if (!confirm('¿Estás seguro de que quieres eliminar este registro?')) return;
    try {
        const response = await fetch(`http://localhost:3000/api/deleteEnergy/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Error al eliminar el registro');
        // alert('✅ Registro eliminado correctamente');
        fetchEnergyRecords(); // Recargar la tabla
    } catch (error) {
        console.error('❌ Error al eliminar el registro:', error);
        alert('❌ Ocurrió un error al eliminar el registro');
    }
}

/**
 * Función principal para inicializar la página
 */
function initializeEnergyPage() {
    const energyForm = document.getElementById('energyForm');
    const fechaInput = document.getElementById('fecha');
    // --- Configuración de Fechas (Tarea 1 y 2) ---
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    const fechaActualISO = now.toISOString().slice(0, 16).replace('T', ' ');
    // Establecer la fecha y hora actual en el input del FORMULARIO
    fechaInput.value = fechaActualISO; // YYYY-MM-DD HH:MM
    // alert(`Fecha agregada en caja de texto: ${fechaInput.value}, Valor del actual ISO: ${fechaActualISO}`);
    // Listener para el input de fecha (Tarea 2)
    // Cuando cambie la fecha, recarga la tabla
    fechaInput.addEventListener('change', fetchEnergyRecords);

    // --- Listener para el formulario de INSERCIÓN ---
    energyForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const data = {
            fecha: fechaInput.value.replace('T', ' '), // Usamos el valor del input
            electricidad_consumo: parseFloat(document.getElementById('electricidad_consumo').value),
            electricidad_produccion: parseInt(document.getElementById('electricidad_produccion').value),
            helio_consumo: parseFloat(document.getElementById('helio_consumo').value),
            helio_produccion: parseInt(document.getElementById('helio_produccion').value),
        };
        try {
            const response = await fetch('http://localhost:3000/api/insertEnergy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (!response.ok) throw new Error('Error al guardar el registro');
            
            // alert('✅ Registro de energía guardado correctamente'); // Evitamos demasiadas alertas
            energyForm.reset();
            
            // Resetear fecha y hora del formulario a la actual
            const nowReset = new Date();
            nowReset.setMinutes(nowReset.getMinutes() - nowReset.getTimezoneOffset());
            fechaInput.value = nowReset.toISOString().slice(0, 16);

            fetchEnergyRecords(); // Recargar la tabla
        } catch (error) {
            console.error('❌ Error al guardar:', error);
            alert('❌ Ocurrió un error al guardar el registro');
        }
    });

    // --- Listener para el formulario de MODIFICACIÓN (Tarea 3) ---
    editEnergyForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('edit-energy-id').value;

        const data = {
            // fecha: document.getElementById('edit-fecha').value.replace('T', ' '),
            electricidad_consumo: parseFloat(document.getElementById('edit-electricidad_consumo').value),
            electricidad_produccion: parseInt(document.getElementById('edit-electricidad_produccion').value),
            helio_consumo: parseFloat(document.getElementById('edit-helio_consumo').value),
            helio_produccion: parseInt(document.getElementById('edit-helio_produccion').value),
        };

        try {
            const response = await fetch(`http://localhost:3000/api/updateEnergy/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (!response.ok) throw new Error('Error al actualizar el registro');

            // alert('✅ Registro actualizado correctamente'); // Evitamos demasiadas alertas
            closeEditEnergyModal();
            fetchEnergyRecords(); // Recargar la tabla

        } catch (error) {
            console.error('❌ Error al actualizar:', error);
            alert('❌ Ocurrió un error al actualizar el registro');
        }
    });

    // Cargar los registros existentes al cargar la página (según la fecha)
    fetchEnergyRecords();
}

// Esperar a que el DOM esté completamente cargado para ejecutar el script
document.addEventListener('DOMContentLoaded', initializeEnergyPage);