// Función para obtener los registros de la base de datos y mostrarlos en la tabla
async function fetchEnergyRecords() {
    try {
        const response = await fetch('http://localhost:3000/api/consultaEnergy');
        if (!response.ok) throw new Error('Error al obtener los registros de energía');

        const data = await response.json();
        const tbody = document.querySelector('#energyTable tbody');
        tbody.innerHTML = ''; // Limpiar la tabla antes de llenarla

        data.forEach(record => {
            const row = document.createElement('tr');
            // Calcula los ratios, asegurándote de no dividir por cero
            const kwhPerUnit = record.electricidad_produccion > 0 ? (record.electricidad_consumo / record.electricidad_produccion).toFixed(4) : 'N/A';
            const m3PerUnit = record.helio_produccion > 0 ? (record.helio_consumo / record.helio_produccion).toFixed(4) : 'N/A';

            row.innerHTML = `
                <td>${record.id}</td>
                <td>${record.fecha ? record.fecha.split('T')[0] : ''}</td>
                <td>${record.electricidad_consumo}</td>
                <td>${record.helio_consumo}</td>
                <td>${kwhPerUnit}</td>
                <td>${m3PerUnit}</td>
                <td>
                    <button class="delete-btn" onclick="deleteEnergyRecord(${record.id})">Eliminar</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('❌ Error al cargar los registros de energía:', error);
    }
}

// Función para eliminar un registro
async function deleteEnergyRecord(id) {
    if (!confirm('¿Estás seguro de que quieres eliminar este registro?')) return;
    try {
        const response = await fetch(`http://localhost:3000/api/deleteEnergy/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Error al eliminar el registro');
        alert('✅ Registro eliminado correctamente');
        fetchEnergyRecords(); // Recargar la tabla
    } catch (error) {
        console.error('❌ Error al eliminar el registro:', error);
        alert('❌ Ocurrió un error al eliminar el registro');
    }
}

// Función principal para inicializar la página
function initializeEnergyPage() {
    const energyForm = document.getElementById('energyForm');

    // Establecer la fecha actual en el input de fecha
    document.getElementById('fecha').valueAsDate = new Date();

    energyForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const data = {
            fecha: document.getElementById('fecha').value,
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
            
            alert('✅ Registro de energía guardado correctamente');
            energyForm.reset();
            document.getElementById('fecha').valueAsDate = new Date(); // Resetear fecha
            fetchEnergyRecords(); // Recargar la tabla
        } catch (error) {
            console.error('❌ Error al guardar:', error);
            alert('❌ Ocurrió un error al guardar el registro');
        }
    });

    // Cargar los registros existentes al cargar la página
    fetchEnergyRecords();
}

// Esperar a que el DOM esté completamente cargado para ejecutar el script
document.addEventListener('DOMContentLoaded', initializeEnergyPage);