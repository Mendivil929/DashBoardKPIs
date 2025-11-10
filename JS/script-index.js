//Importamos la funcion que necesitamos del archivo chartsJS.js
import { generarGraficosScrap } from './chartsJS.js';

//  -------------------- SELECCION DE OPCIONES EN TOPBAR --------------------

procesarSeleccionActual();  //Nos aseguramos de procesar la seleccion por default

const opcionesMenu = document.querySelectorAll('.topbar-menu .opciones');
function seleccionarOpcion(evento) {
  const opcionSeleccionada = evento.currentTarget; //El <li> que fue clickeado
  opcionesMenu.forEach(opcion => {
    opcion.classList.remove('seleccionado');
  });
  opcionSeleccionada.classList.add('seleccionado');

  procesarSeleccionActual();
  const textoOpcion = opcionSeleccionada.textContent;
  console.log(`Has seleccionado: ${textoOpcion}`);
}

opcionesMenu.forEach(opcion => {
  opcion.addEventListener('click', seleccionarOpcion);
});

//Funcion para determinar las fechas de inicio y actuales segun la opcion seleccionada
function procesarSeleccionActual() {
    // Busca el elemento que esta seleccionado o que contiene la clase .seleccionado
    const opcionActiva = document.querySelector('.opciones.seleccionado');

    // Si no se encuentra ninguna opcion seleccionada
    if (!opcionActiva) {
        console.warn("No se encontró ninguna opción seleccionada.");
        return;
    }

    let fechaInicio;
    let identificadorSeleccion;
    const fechaActual = new Date(); // Siempre es la fecha de hoy

    // Usamos .classList.contains() para ver qué opción es
    if (opcionActiva.classList.contains('diario')) {
        console.log("Lógica para: DIARIO");
        // Restamos 5 días hábiles a la fecha actual
        fechaInicio = restarDiasHabiles(new Date(), 5);
        identificadorSeleccion = "DIARIO";
    } else if (opcionActiva.classList.contains('semanal')) {
        console.log("Lógica para: SEMANAL");
        const hoy = new Date();
        const diaDeLaSemana = hoy.getDay(); // 0=Domingo, 1=Lunes, ..., 6=Sábado

        // Calculamos cuántos días han pasado desde el Lunes.
        // Si es Domingo (0), han pasado 6 días desde el lunes anterior.
        // Si es Lunes (1), han pasado 0 días.
        // Si es Martes (2), ha pasado 1 día.
        const diasDesdeLunes = (diaDeLaSemana === 0) ? 6 : diaDeLaSemana - 1;
        
        fechaInicio = new Date();
        fechaInicio.setDate(hoy.getDate() - diasDesdeLunes);
        identificadorSeleccion = "SEMANAL";
    } else if (opcionActiva.classList.contains('mensual')) {
        console.log("Lógica para: MENSUAL");
        // Lógica para mensual: fecha de inicio es el primer día del mes actual
        fechaInicio = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 1);
        identificadorSeleccion = "MENSUAL";
    } // ... puedes agregar más 'else if' para YTD, TURNO, etc.

    // Para visualizar los resultados
    console.log("Fecha de Inicio:", fechaInicio.toLocaleDateString());
    console.log("Fecha Actual:", fechaActual.toLocaleDateString());
    //Actualizamos graficos segun fecha seleccionada
    generarGraficosScrap(fechaInicio, fechaActual, identificadorSeleccion);
}

/**
 * Resta una cantidad de días hábiles (L-V) a una fecha.
 * @param {Date} fecha - La fecha inicial.
 * @param {number} dias - El número de días hábiles a restar.
 * @returns {Date} La nueva fecha.
 */
function restarDiasHabiles(fecha, dias) {
    const fechaCopia = new Date(fecha);
    let diasRestados = 0;

    while (diasRestados < dias) {
        fechaCopia.setDate(fechaCopia.getDate() - 1); // Retrocedemos un día
        const diaSemana = fechaCopia.getDay();
        // Si no es Domingo (0) ni Sábado (6), contamos como día hábil
        if (diaSemana !== 0 && diaSemana !== 6) {
            diasRestados++;
        }
    }
    return fechaCopia;
}

// ----------------------------------------- APARTADO DE MODALES DETALLADOS -----------------------------------------

/* ---------------- Scrap Costos ---------------- */

// Variables para el modal de costos de scrap
let modalScrapCostChart_Indicador = null;
let modalScrapCostChart_Historial = null;
const modalScrapCost = document.getElementById('modalScrapCost');
const closeModalScrapCostBtn = document.getElementById('closeModalScrapCost');
const chartScrapCostModalElement_Indicador = document.getElementById('chartScrapCostModal_Indicador');
const chartScrapCostModalContext_Indicador = chartScrapCostModalElement_Indicador.getContext('2d');
const chartScrapCostModalElement_Historial = document.getElementById('chartScrapCostModal_Historial');
const chartScrapCostModalContext_Historial = chartScrapCostModalElement_Historial.getContext('2d');
const tablaScrapCostContainer = document.getElementById('tablaScrapCostDetalles');

/**
 * Función para ABRIR el modal de Costo de Scrap
*/
async function abrirModalScrapCost() {
    // 1. Obtener las fechas actuales (no cambia)
    const opcionActiva = document.querySelector('.opciones.seleccionado');
    let fechaInicio, fechaActual = new Date();
    
    if (opcionActiva.classList.contains('diario')) {
        fechaInicio = new Date(); 
        fechaInicio = restarDiasHabiles(fechaInicio, 5); // Restamos 5 días hábiles
    } else if (opcionActiva.classList.contains('semanal')) {
        const diasDesdeLunes = (fechaActual.getDay() === 0) ? 6 : fechaActual.getDay() - 1;
        fechaInicio = new Date();
        fechaInicio.setDate(fechaActual.getDate() - diasDesdeLunes);
    } else if (opcionActiva.classList.contains('mensual')) {
        fechaInicio = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 1);
    } else {
        fechaInicio = restarDiasHabiles(new Date(), 5);
    }

    const formatearFechaLocal = (fecha) => {
        const anio = fecha.getFullYear();
        const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
        const dia = fecha.getDate().toString().padStart(2, '0');
        return `${anio}-${mes}-${dia}`;
    }
    
    const fechaInicioFormato = formatearFechaLocal(fechaInicio);
    const fechaActualFormato = formatearFechaLocal(fechaActual);

    // Mostrar el modal
    tablaScrapCostContainer.innerHTML = "<p>Cargando detalles...</p>";
    modalScrapCost.style.display = 'flex';

    // 3. Destruir AMBOS gráficos anteriores del modal
    const chartExistenteIndicador = Chart.getChart(chartScrapCostModalElement_Indicador);
    if (chartExistenteIndicador) { chartExistenteIndicador.destroy(); }

    const chartExistenteHistorial = Chart.getChart(chartScrapCostModalElement_Historial);
    if (chartExistenteHistorial) { chartExistenteHistorial.destroy(); }

    // 4. Renderizar AMBOS gráficos
    const chartOriginalIndicador = Chart.getChart('chartCostoScrap');
    const chartOriginalHistorial = Chart.getChart('chartCostoScrapHistorial');
    
    // Clonar el Indicador (barra roja)
    if (chartOriginalIndicador) {
        // Extraemos el plugin 'indicator' personalizado
        const indicatorPlugin = chartOriginalIndicador.config.plugins.find(p => p.id === 'indicator');
        // Creamos opciones de datalabel limpias
        const cleanDataLabelsIndicador = {
            anchor: 'end', align: 'right', color: '#000',
            formatter: (value, context) => {
                const realValue = context.dataset.actualValue[context.datasetIndex];
                return realValue + '%';
            }
        };

        modalScrapCostChart_Indicador = new Chart(chartScrapCostModalContext_Indicador, {
            type: chartOriginalIndicador.config.type,
            data: chartOriginalIndicador.data,
            options: {
                responsive: true, maintainAspectRatio: false, indexAxis: 'y',
                scales: chartOriginalIndicador.options.scales,
                plugins: {
                    legend: {
                        labels: {
                            usePointStyle: true, // usa punto en lugar de cuadro
                            pointStyle: false,   // con false no dibuja nada
                            boxWidth: 0,  //Ancho de caja de color, con esto quitamos la figura al lado del label en este caso PointStyle
                            generateLabels: function(chart) {
                                const labels = chart.data.datasets.map((dataset, i) => {
                                    return {
                                        text: dataset.label, // solo el texto
                                        fillStyle: "transparent", // quita color
                                        hidden: !chart.isDatasetVisible(i),
                                        datasetIndex: i
                                    };
                                });
                                    return labels;
                            },
                            font: {
                                weight: 'bold',
                                size: 20
                            }
                        }
                    },
                    tooltip: { enabled: false },
                    datalabels: cleanDataLabelsIndicador
                }
            },
            plugins: [ChartDataLabels, indicatorPlugin] // ¡Añadimos ambos plugins!
        });
    }
    
    // Clonar el Historial (línea verde)
    if (chartOriginalHistorial) {
        // Creamos opciones de datalabel limpias
        const cleanDataLabelsHistorial = {
            align: "top", anchor: "end", color: "black",
            font: { weight: "bold" }, rotation: -90,
            formatter: (value) => value + "%"
        };
        
        modalScrapCostChart_Historial = new Chart(chartScrapCostModalContext_Historial, {
            type: chartOriginalHistorial.config.type,
            data: chartOriginalHistorial.data,
            options: {
                responsive: true, maintainAspectRatio: false,
                scales: chartOriginalHistorial.options.scales,
                plugins: {
                    legend: { display: false },
                    datalabels: cleanDataLabelsHistorial,
                    tooltip: {enabled: true}
                },
            },
            plugins: [ChartDataLabels]
        });
    }

    // 5. Hacer fetch para la tabla de detalles (esto ya es correcto)
    try {
        const res = await fetch(`http://localhost:3000/api/consultaHistorialScrap?fechaInicio=${fechaInicioFormato}&fechaActual=${fechaActualFormato}`);
        const dataDetalles = await res.json();
        generarTablaDetallesScrapCost(dataDetalles);
    } catch (err) {
        console.error("Error al cargar detalles de Costo de Scrap:", err);
        tablaScrapCostContainer.innerHTML = "<p>Error al cargar detalles.</p>";
    }
}

/**
 * Función para CERRAR el modal de Costo de Scrap
*/
function cerrarModalScrapCost() {
    // Destruimos AMBOS gráficos
    if (modalScrapCostChart_Indicador) {
        modalScrapCostChart_Indicador.destroy();
        modalScrapCostChart_Indicador = null;
    }
    if (modalScrapCostChart_Historial) {
        modalScrapCostChart_Historial.destroy();
        modalScrapCostChart_Historial = null;
    }
    modalScrapCost.style.display = 'none';
}

/**
 * Función auxiliar para construir la tabla de detalles de Costo de Scrap
*/
function generarTablaDetallesScrapCost(data) {
    if (data.length === 0) {
        tablaScrapCostContainer.innerHTML = "<p>No hay datos detallados para este período.</p>";
        return;
    }

    let tablaHTML = '<table>';
    // Creamos la tabla con todas las columnas que pediste
    tablaHTML += '<thead><tr><th>Fecha</th><th>Cost EndItem</th><th>Cost Scrap</th><th>Scrap %</th></tr></thead>';
    tablaHTML += '<tbody>';

    data.forEach(item => {
        const fechaFormateada = item.fecha ? item.fecha.slice(0, 16).replace('T', ' ') : 'N/A';
        tablaHTML += `<tr>
            <td>${fechaFormateada}</td>
            <td>$${item.costEndItem.toFixed(2)}</td>
            <td>$${item.costScrap.toFixed(2)}</td>
            <td>${item.porcentScrap.toFixed(2)}%</td>
        </tr>`;
    });

    tablaHTML += '</tbody></table>';
    tablaScrapCostContainer.innerHTML = tablaHTML;
}

/* ---------------- Scrap Procesos ---------------- */ 

// Variable global para guardar la instancia del gráfico del modal
let modalScrapProcesoChart = null;

// Obtenemos los elementos del DOM
const modalScrapProceso = document.getElementById('modalScrapProceso');
const closeModalScrapProcesoBtn = document.getElementById('closeModalScrapProceso');
const chartModalCanvasElement = document.getElementById('chartScrapProcesoModal'); // <-- El elemento HTML
const chartModalCanvasContext = chartModalCanvasElement.getContext('2d'); // <-- El contexto 2D
const tablaDetallesContainer = document.getElementById('tablaScrapProcesoDetalles');

/**
 * Función para abrir el modal de procesos de scrap
*/
async function abrirModalScrapProceso() {
    // 1. Obtener las fechas actuales (reutilizando la lógica de 'procesarSeleccionActual')
    const opcionActiva = document.querySelector('.opciones.seleccionado');
    let fechaInicio, fechaActual = new Date();
    
    // Simplificamos la lógica solo para obtener las fechas
    if (opcionActiva.classList.contains('diario')) {
        fechaInicio = new Date(); // Para el endpoint de detalles, 'diario' usa solo el día actual
    } else if (opcionActiva.classList.contains('semanal')) {
        const diasDesdeLunes = (fechaActual.getDay() === 0) ? 6 : fechaActual.getDay() - 1;
        fechaInicio = new Date();
        fechaInicio.setDate(fechaActual.getDate() - diasDesdeLunes);
    } else if (opcionActiva.classList.contains('mensual')) {
        fechaInicio = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 1);
    } else {
        fechaInicio = restarDiasHabiles(new Date(), 5); // Default a 'diario' (5 días)
    }

    // Usamos la función de formateo de chartsJS.js (debemos asegurarnos que esté disponible)
    // O la redefinimos aquí por seguridad:
    const formatearFechaLocal = (fecha) => {
        const anio = fecha.getFullYear();
        const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
        const dia = fecha.getDate().toString().padStart(2, '0');
        return `${anio}-${mes}-${dia}`;
    }
    
    const fechaInicioFormato = formatearFechaLocal(fechaInicio);
    const fechaActualFormato = formatearFechaLocal(fechaActual);

    // 2. Mostrar el modal (podemos mostrar un "cargando..." aquí)
    tablaDetallesContainer.innerHTML = "<p>Cargando detalles...</p>";
    modalScrapProceso.style.display = 'flex';

    // Destruir CUALQUIER gráfico existente en ese canvas
    const chartExistente = Chart.getChart(chartModalCanvasElement); // <-- Usamos el elemento
    if (chartExistente) {
        chartExistente.destroy();
    }

    // Renderizamos el gráfico grande (clonando el original)
    const chartOriginal = Chart.getChart('chartScrapPorProcesos'); 
        
    
    if (chartOriginal) {

        // Creamos un objeto de datalabels NUEVO y LIMPIO.
        // NO copiamos el de chartOriginal, ¡esa es la causa de la recursión!
        const cleanDatalabelOptions = {
            formatter: (value) => '$' + value,
            color: '#000',
            font: {
                weight: 'bold'
            }
        };

        // Ahora que el canvas está 100% libre, creamos el nuevo
        modalScrapProcesoChart = new Chart(chartModalCanvasContext, { 
            type: chartOriginal.config.type, // Clonar el tipo
            data: chartOriginal.data,        // Clonar los datos
            options: { 
                responsive: true,
                maintainAspectRatio: false, 
                indexAxis: 'y', 
                plugins: {
                    datalabels: cleanDatalabelOptions // <-- Usamos el objeto limpio
                }
            },
            plugins: [ChartDataLabels] // Volvemos a registrar el plugin
        });
    }

    // 4. Hacer fetch al NUEVO endpoint para obtener los detalles de la tabla
    try {
        const res = await fetch(`http://localhost:3000/api/consultaScrapProcesoDetalles?fechaInicio=${fechaInicioFormato}&fechaActual=${fechaActualFormato}`);
        const dataDetalles = await res.json();
        
        // 5. Generar y mostrar la tabla de detalles
        generarTablaDetalles(dataDetalles);
        
    } catch (err) {
        console.error("Error al cargar detalles:", err);
        tablaDetallesContainer.innerHTML = "<p>Error al cargar detalles.</p>";
    }
}

/**
 * Función para cerrar el modal de procesos de scrap
*/
function cerrarModalScrapProceso() {
    if (modalScrapProcesoChart) {
        modalScrapProcesoChart.destroy(); // ¡Muy importante destruir el gráfico!
        modalScrapProcesoChart = null;
    }
    modalScrapProceso.style.display = 'none';
}

/**
 * Función auxiliar para construir el HTML de la tabla de detalles de procesos de scrap
 */
function generarTablaDetalles(data) {
    if (data.length === 0) {
        tablaDetallesContainer.innerHTML = "<p>No hay datos detallados para este período.</p>";
        return;
    }

    let tablaHTML = '<table>';
    tablaHTML += '<thead><tr><th>Fecha</th><th>Proceso</th><th>Amount</th></tr></thead>';
    tablaHTML += '<tbody>';

    data.forEach(item => {
      const fechaFormateada = item.Fecha ? item.Fecha.slice(0, 16).replace('T', ' ') : 'N/A';
      tablaHTML += `<tr>
        <td>${fechaFormateada}</td>
        <td>${item.nombreProceso}</td>
        <td>$${item.amountProceso.toFixed(2)}</td>
      </tr>`;
    });

    tablaHTML += '</tbody></table>';
    tablaDetallesContainer.innerHTML = tablaHTML;
}

/* ---------------- Top Defectos ---------------- */

let modalTopDefectosChart = null;
const modalTopDefectos = document.getElementById('modalTopDefectos');
const closeModalTopDefectosBtn = document.getElementById('closeModalTopDefectos');
const chartModalCanvasElement_Defectos = document.getElementById('chartTopDefectosModal');
const chartModalCanvasContext_Defectos = chartModalCanvasElement_Defectos.getContext('2d');
const tablaDetallesContainer_Defectos = document.getElementById('tablaTopDefectosDetalles');

/**
 * Función para abrir el modal de Top Defectos
*/
async function abrirModalTopDefectos() {
    // 1. Obtener las fechas
    const opcionActiva = document.querySelector('.opciones.seleccionado');
    let fechaInicio, fechaActual = new Date();

    // [FIX] Lógica de fecha corregida para este modal
    if (opcionActiva.classList.contains('diario')) {
        fechaInicio = new Date(); // "Diario" para defectos es HOY
    } else if (opcionActiva.classList.contains('semanal')) {
        const diasDesdeLunes = (fechaActual.getDay() === 0) ? 6 : fechaActual.getDay() - 1;
        fechaInicio = new Date();
        fechaInicio.setDate(fechaActual.getDate() - diasDesdeLunes);
    } else if (opcionActiva.classList.contains('mensual')) {
        fechaInicio = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 1);
    } else {
        fechaInicio = restarDiasHabiles(new Date(), 5); // Default
    }
    // [FIN DEL FIX]

    // Función de formateo (necesaria aquí dentro)
    const formatearFechaLocal = (fecha) => {
        const anio = fecha.getFullYear();
        const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
        const dia = fecha.getDate().toString().padStart(2, '0');
        return `${anio}-${mes}-${dia}`;
    }

    const fechaInicioFormato = formatearFechaLocal(fechaInicio);
    const fechaActualFormato = formatearFechaLocal(fechaActual);

    // 2. Mostrar el modal
    tablaDetallesContainer_Defectos.innerHTML = "<p>Cargando detalles...</p>";
    modalTopDefectos.style.display = 'flex';

    // 3. Destruir gráfico anterior
    const chartExistente = Chart.getChart(chartModalCanvasElement_Defectos);
    if (chartExistente) { chartExistente.destroy(); }

    // 4. Clonar el gráfico principal
    const chartOriginal = Chart.getChart('chartTopScrapDefecto');
    if (chartOriginal) {
        const cleanDatalabelOptions = {
            formatter: (value) => '$' + value,
            color: '#000', // Forzamos negro en el modal
            font: { weight: 'bold' }
        };

        modalTopDefectosChart = new Chart(chartModalCanvasContext_Defectos, { 
            type: chartOriginal.config.type,
            data: chartOriginal.data,
            options: { 
                responsive: true,
                maintainAspectRatio: false, 
                indexAxis: 'y', 
                plugins: {
                    datalabels: cleanDatalabelOptions
                }
            },
            plugins: [ChartDataLabels]
        });
    }

    // 5. Hacer fetch al endpoint de DETALLES
    try {
        const res = await fetch(`http://localhost:3000/api/consultaDefectosDetalles?fechaInicio=${fechaInicioFormato}&fechaActual=${fechaActualFormato}`);
        const dataDetalles = await res.json();
        generarTablaDetallesDefectos(dataDetalles);
    } catch (err) {
        console.error("Error al cargar detalles de Defectos:", err);
        tablaDetallesContainer_Defectos.innerHTML = "<p>Error al cargar detalles.</p>";
    }
}

/**
 * Función para cerrar el modal de Top Defectos
*/
function cerrarModalTopDefectos() {
    if (modalTopDefectosChart) {
        modalTopDefectosChart.destroy();
        modalTopDefectosChart = null;
    }
    modalTopDefectos.style.display = 'none';
}

/**
 * Función auxiliar para construir la tabla de Top Defectos
 */
function generarTablaDetallesDefectos(data) {
    if (data.length === 0) {
        tablaDetallesContainer_Defectos.innerHTML = "<p>No hay datos detallados para este período.</p>";
        return;
    }

    let tablaHTML = '<table>';
    tablaHTML += '<thead><tr><th>Fecha</th><th>Nombre Defecto</th><th>Costo</th></tr></thead>';
    tablaHTML += '<tbody>';

    data.forEach(item => {
      const fechaFormateada = item.fecha ? item.fecha.slice(0, 16).replace('T', ' ') : 'N/A';
      tablaHTML += `<tr>
        <td>${fechaFormateada}</td>
        <td>${item.scrapName}</td>
        <td>$${item.costo.toFixed(2)}</td>
      </tr>`;
    });

    tablaHTML += '</tbody></table>';
    tablaDetallesContainer_Defectos.innerHTML = tablaHTML;
}

/* ---------------- Eficiencia Energética ---------------- */
let modalEnergyChart = null;
const modalEnergy = document.getElementById('modalEnergy');
const closeModalEnergyBtn = document.getElementById('closeModalEnergy');
const chartModalCanvasElement_Energy = document.getElementById('chartEnergyModal');
const chartModalCanvasContext_Energy = chartModalCanvasElement_Energy.getContext('2d');
const tablaDetallesContainer_Energy = document.getElementById('tablaEnergyDetalles');

/**
 * Función para abrir el modal de Energía
*/
async function abrirModalEnergy() {
    // 1. Obtener las fechas (Esta parte ya la habíamos corregido)
    const opcionActiva = document.querySelector('.opciones.seleccionado');
    let fechaInicio, fechaActual = new Date();

    if (opcionActiva.classList.contains('diario')) {
        fechaInicio = restarDiasHabiles(new Date(), 5); 
    } else if (opcionActiva.classList.contains('semanal')) {
        const diasDesdeLunes = (fechaActual.getDay() === 0) ? 6 : fechaActual.getDay() - 1;
        fechaInicio = new Date();
        fechaInicio.setDate(fechaActual.getDate() - diasDesdeLunes);
    } else if (opcionActiva.classList.contains('mensual')) {
        fechaInicio = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 1);
    } else {
        fechaInicio = restarDiasHabiles(new Date(), 5); // Default
    }

    const formatearFechaLocal = (fecha) => {
        const anio = fecha.getFullYear();
        const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
        const dia = fecha.getDate().toString().padStart(2, '0');
        return `${anio}-${mes}-${dia}`;
    }
    
    const fechaInicioFormato = formatearFechaLocal(fechaInicio);
    const fechaActualFormato = formatearFechaLocal(fechaActual);

    // 2. Mostrar el modal
    tablaDetallesContainer_Energy.innerHTML = "<p>Cargando detalles...</p>";
    modalEnergy.style.display = 'flex';

    // 3. Destruir gráfico anterior
    const chartExistente = Chart.getChart(chartModalCanvasElement_Energy);
    if (chartExistente) { chartExistente.destroy(); }

    // 4. Clonar el gráfico principal (chartEnergy de chartsJS.js)
    const chartOriginal = Chart.getChart('chartEnergy');
    if (chartOriginal) {
        
        // [INICIO DE LA CORRECCIÓN]
        // Definimos un objeto de opciones "limpio", copiado de chartsJS.js
        const cleanOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Eficiencia Energética por Unidad Producida'
                },
                legend: {
                    position: 'bottom',
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Consumo por Unidad'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Fecha'
                    }
                }
            }
        };
        // [FIN DE LA CORRECCIÓN]

        // Clonamos la configuración completa
        modalEnergyChart = new Chart(chartModalCanvasContext_Energy, { 
            type: chartOriginal.config.type,
            data: chartOriginal.data,
            options: cleanOptions // <-- USAMOS EL OBJETO LIMPIO
        });
    }

    // 5. Hacer fetch al NUEVO endpoint de DETALLES
    try {
        const res = await fetch(`http://localhost:3000/api/consultaEnergyDetalles?fechaInicio=${fechaInicioFormato}&fechaActual=${fechaActualFormato}`);
        const dataDetalles = await res.json();
        generarTablaDetallesEnergy(dataDetalles);
    } catch (err) {
        console.error("Error al cargar detalles de Energía:", err);
        tablaDetallesContainer_Energy.innerHTML = "<p>Error al cargar detalles.</p>";
    }
}

/**
 * Función para cerrar el modal de Energía
*/
function cerrarModalEnergy() {
    if (modalEnergyChart) {
        modalEnergyChart.destroy();
        modalEnergyChart = null;
    }
    modalEnergy.style.display = 'none';
}

/**
 * Función auxiliar para construir la tabla de Energía
 */
function generarTablaDetallesEnergy(data) {
    if (data.length === 0) {
        tablaDetallesContainer_Energy.innerHTML = "<p>No hay datos detallados para este período.</p>";
        return;
    }

    let tablaHTML = '<table>';
    tablaHTML += '<thead><tr><th>Fecha</th><th>Elec. (kWh)</th><th>Prod. (E)</th><th>Helio (m³)</th><th>Prod. (H)</th><th>kWh/Un</th><th>m³/Un</th></tr></thead>';
    tablaHTML += '<tbody>';

    data.forEach(item => {
        const kwhPerUnit = item.electricidad_produccion > 0 ? (item.electricidad_consumo / item.electricidad_produccion).toFixed(4) : 'N/A';
        const m3PerUnit = item.helio_produccion > 0 ? (item.helio_consumo / item.helio_produccion).toFixed(4) : 'N/A';
        // Formateo simple de fecha (puedes ajustarlo si usas datetime)
        const fechaFormateada = item.fecha ? item.fecha.split('T')[0] : 'N/A';

        tablaHTML += `<tr>
            <td>${fechaFormateada}</td>
            <td>${item.electricidad_consumo}</td>
            <td>${item.electricidad_produccion}</td>
            <td>${item.helio_consumo}</td>
            <td>${item.helio_produccion}</td>
            <td>${kwhPerUnit}</td>
            <td>${m3PerUnit}</td>
        </tr>`;
    });

    tablaHTML += '</tbody></table>';
    tablaDetallesContainer_Energy.innerHTML = tablaHTML;
}

//  -------------------- TABLA PRODUCTIVIDAD --------------------

const tablaMini = document.getElementById("tabla-mini");
const modal = document.getElementById("modal");
const closeBtn = document.getElementById("closeBtn");

// abrir modal al hacer click en tabla
tablaMini.addEventListener("click", () => {
  modal.style.display = "flex";
});

// cerrar modal al hacer click en (x)
closeBtn.addEventListener("click", () => {
  modal.style.display = "none";
});

// cerrar modal con tecla ESC
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    modal.style.display = "none";
  }
});

// cerrar modal si se hace click fuera del contenido
modal.addEventListener("click", (e) => {
  if (e.target === modal) {
    modal.style.display = "none";
  }
});

//  -------------------- EVENTOS PARA EXPANSION DE DASHBOARD --------------------
const openBtn = document.getElementById("openDashboardBtn");
const closeBtnDashboard = document.getElementById("closeDashboardBtn");
const modalDashboard = document.getElementById("dashboardModal");
const dashboardContent = document.getElementById("dashboardContent");
const dashboardContainer = document.getElementById("dashboard-container"); // Original parent
const dashboardCloneContainer = document.getElementById("dashboardClone"); //Target in modal

const openDashboardModal = () => {
  // Move the actual dashboard content into the modal
  dashboardCloneContainer.appendChild(dashboardContent);
  modalDashboard.style.display = "flex";

  // IMPORTANT: Tell Chart.js to resize all charts to fit the new container size
  // We loop through all active chart instances and call the resize() method.
  Object.values(Chart.instances).forEach(chart => {
    chart.resize();
  });
};

const closeDashboardModal = () => {
  // Move the dashboard content back to its original container
  dashboardContainer.appendChild(dashboardContent);
  modalDashboard.style.display = "none";

  // IMPORTANT: Resize the charts again to fit the original layout
  Object.values(Chart.instances).forEach(chart => {
    chart.resize();
  });
};

// abrir modal al click
openBtn.addEventListener("click", openDashboardModal);

// Cerrar modal con X
closeBtnDashboard.addEventListener("click", closeDashboardModal);


// --------------------- EVENTOS DEL DOM CONTENT LOADED ---------------------

document.addEventListener('DOMContentLoaded', () => {
    // Listeners para el modal de Costo de Scrap
    const canvasCostoScrap = document.getElementById('chartCostoScrap');
    const canvasCostoScrapHistorial = document.getElementById('chartCostoScrapHistorial');
    
    if (canvasCostoScrap) {
        canvasCostoScrap.style.cursor = 'pointer';
        canvasCostoScrap.addEventListener('click', abrirModalScrapCost);
    }
    if (canvasCostoScrapHistorial) {
        canvasCostoScrapHistorial.style.cursor = 'pointer';
        canvasCostoScrapHistorial.addEventListener('click', abrirModalScrapCost);
    }
    closeModalScrapCostBtn.addEventListener('click', cerrarModalScrapCost);

    // Listener para el modal de Scrap por Proceso
    const canvasScrapProceso = document.getElementById('chartScrapPorProcesos');
    if (canvasScrapProceso) {
        canvasScrapProceso.style.cursor = 'pointer';
        canvasScrapProceso.addEventListener('click', abrirModalScrapProceso);
    }
    closeModalScrapProcesoBtn.addEventListener('click', cerrarModalScrapProceso);

    // Listeners para el modal de Top Defectos
    const canvasTopDefectos = document.getElementById('chartTopScrapDefecto');
    if (canvasTopDefectos) {
        canvasTopDefectos.style.cursor = 'pointer';
        canvasTopDefectos.addEventListener('click', abrirModalTopDefectos);
    }
    closeModalTopDefectosBtn.addEventListener('click', cerrarModalTopDefectos);

    // Listeners para el modal de energía
    const canvasEnergy = document.getElementById('chartEnergy');
    if (canvasEnergy) {
        canvasEnergy.style.cursor = 'pointer';
        canvasEnergy.addEventListener('click', abrirModalEnergy);
    }
    closeModalEnergyBtn.addEventListener('click', cerrarModalEnergy);

    // Aseguramos que los colores de los charts coincidan con el modo actual al cargar la página
    actualizarColoresCharts(document.body.classList.contains('dark'));
});

// cerrar modal clic afuera
window.addEventListener("click", (e) => {
  if (e.target === modalScrapCost) {
    cerrarModalScrapCost();
  }
  if (e.target === modalScrapProceso) {
    cerrarModalScrapProceso();
  }
  if (e.target === modalTopDefectos) {
    cerrarModalTopDefectos();
  }
  if (e.target === modalDashboard) {
    closeDashboardModal();
  }
  if (e.target === modalEnergy) {
    cerrarModalEnergy();
  }
});


// cerrar modal con ESC
document.addEventListener("keydown", (e) => {
if (e.key === "Escape" && modalScrapCost.style.display === "flex") {
    cerrarModalScrapCost();
  }
  if (e.key === "Escape" && modalScrapProceso.style.display === "flex") {
    cerrarModalScrapProceso();
  }
  if (e.key === "Escape" && modalTopDefectos.style.display === "flex") {
    cerrarModalTopDefectos();
  }
  if (e.key === "Escape" && modalDashboard.style.display === "flex") {
    modalDashboard.style.display = "none";
    closeDashboardModal();
  }
  if (e.key === "Escape" && modalEnergy.style.display === "flex") { // <-- AÑADIR
    cerrarModalEnergy();
  }
});

