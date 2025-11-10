// script-config.js

document.addEventListener('DOMContentLoaded', () => {
    console.log("Página de Configuración cargada.");
    
    // Carga la tabla inicial
    cargarTablaDefectos();

    // 1. Conecta el formulario de AÑADIR
    const formAnadir = document.getElementById('formDefectoAdmin');
    formAnadir.addEventListener('submit', (e) => {
        e.preventDefault();
        guardarNuevoDefecto();
    });

    // 2. [NUEVO] Conecta el formulario de MODIFICAR (el del modal)
    const modal = document.getElementById('editDefectoModal');
    const formModificar = document.getElementById('editDefectoForm');
    const closeModalBtn = document.getElementById('closeDefectoModalBtn');

    formModificar.addEventListener('submit', (e) => {
        e.preventDefault();
        actualizarDefecto();
    });

    // Lógica para cerrar el modal
    closeModalBtn.addEventListener('click', () => modal.style.display = 'none');
    window.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal.style.display === 'flex') modal.style.display = 'none'; });
});

/**
 * Carga todos los defectos desde la BD y los muestra en la tabla
 */
async function cargarTablaDefectos() {
    try {
        const response = await fetch('http://localhost:3000/api/defectosCodigos');
        if (!response.ok) throw new Error('Error al conectar con la API');
        
        const defectos = await response.json();
        
        const tbody = document.querySelector('#tablaDefectosAdmin tbody');
        tbody.innerHTML = ''; 

        if (defectos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4">No hay defectos registrados.</td></tr>';
            return;
        }

        defectos.forEach(defecto => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${defecto.id}</td>
                <td>${defecto.scrapCode}</td>
                <td>${defecto.scrapName}</td>
                <td class="contenedorBotones">
                    <button class="edit-btn" onclick="prepararEdicion(${defecto.id}, '${defecto.scrapCode}', '${defecto.scrapName}')">Modificar</button>
                    <button class="delete-btn" onclick="eliminarDefecto(${defecto.id})">Eliminar</button>
                </td>
            `;
            tbody.appendChild(row);
        });

    } catch (error) {
        console.error('Error al cargar defectos:', error);
        const tbody = document.querySelector('#tablaDefectosAdmin tbody');
        tbody.innerHTML = '<tr><td colspan="4">Error al cargar datos. Recargue la página.</td></tr>';
    }
}

/**
 * Envía los datos del formulario para crear un nuevo defecto
 */
async function guardarNuevoDefecto() {
    // 1. Obtener los valores del formulario
    const scrapCode = document.getElementById('defecto-code').value;
    const scrapName = document.getElementById('defecto-name').value;

    // 2. Validar que no estén vacíos
    if (!scrapCode || !scrapName) {
        alert('Por favor, completa ambos campos.');
        return;
    }

    // 3. Enviar los datos al backend (POST)
    try {
        const response = await fetch('http://localhost:3000/api/defectosCodigos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ scrapCode, scrapName }),
        });

        if (!response.ok) {
            // Si el servidor nos da un error (ej. código duplicado), lo mostramos
            const errorData = await response.text();
            throw new Error(errorData || 'Error al guardar');
        }

        // 4. Si todo salió bien
        // alert('Defecto guardado correctamente');
        document.getElementById('formDefectoAdmin').reset(); // Limpia el formulario
        cargarTablaDefectos(); // Recarga la tabla para mostrar el nuevo registro

    } catch (error) {
        console.error('Error al guardar:', error);
        alert(`Error: ${error.message}`);
    }
}

/**
 * Envía los datos del MODAL para actualizar un defecto (PUT)
 */
async function actualizarDefecto() {
    // 1. Obtener los valores del MODAL
    const id = document.getElementById('edit-defecto-id-hidden').value;
    const scrapCode = document.getElementById('edit-defecto-code').value;
    const scrapName = document.getElementById('edit-defecto-name').value;

    if (!scrapCode || !scrapName) {
        alert('Por favor, completa ambos campos.');
        return;
    }

    // 2. Enviar datos al endpoint PUT
    try {
        const response = await fetch(`http://localhost:3000/api/defectosCodigos/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ scrapCode, scrapName }),
        });

        if (!response.ok) {
            const errorData = await response.text();
            throw new Error(errorData || 'Error al actualizar');
        }

        // 3. Si todo sale bien
        alert('Defecto actualizado correctamente');
        document.getElementById('editDefectoModal').style.display = 'none'; // Cierra el modal
        cargarTablaDefectos(); // Recarga la tabla

    } catch (error) {
        console.error('Error al actualizar:', error);
        alert(`Error: ${error.message}`);
    }
}

/**
 * Prepara el MODAL para editar un defecto
 */
window.prepararEdicion = (id, code, name) => {
    // 1. Rellenar el formulario del MODAL
    document.getElementById('edit-defecto-id-hidden').value = id;
    document.getElementById('edit-defecto-code').value = code;
    document.getElementById('edit-defecto-name').value = name;

    // 2. Mostrar el MODAL
    document.getElementById('editDefectoModal').style.display = 'flex';
};

/**
 * Elimina un defecto de la base de datos
 */
window.eliminarDefecto = async (id) => {
    // 1. Pedir confirmación
    if (!confirm(`¿Estás seguro de que quieres eliminar el defecto seleccionado? Esta acción no se puede deshacer.`)) {
        return; // Si el usuario cancela, no hacemos nada
    }

    // 2. Enviar la petición DELETE al backend
    try {
        const response = await fetch(`http://localhost:3000/api/defectosCodigos/${id}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            const errorData = await response.text();
            throw new Error(errorData || 'Error al eliminar');
        }

        // 3. Si todo salió bien
        // alert('Defecto eliminado correctamente'); // Comentado para evitar demasiadas alertas
        cargarTablaDefectos(); // Recarga la tabla para mostrar los cambios

    } catch (error) {
        console.error('Error al eliminar:', error);
        alert(`Error: ${error.message}`);
    }
}