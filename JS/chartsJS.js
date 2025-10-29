Chart.register(ChartDataLabels);
//Funciones de utilidad
function formatearFecha(fecha) {
    const anio = fecha.getFullYear();
    
    // getMonth() es base 0 (Enero=0), por eso se suma 1.
    // .padStart(2, '0') asegura que siempre tenga dos dígitos (ej: 09).
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    
    const dia = fecha.getDate().toString().padStart(2, '0');
    
    return `${anio}-${mes}-${dia}`;
}

//Declaramos los prototipos de los charts para controlar su creación y eliminación
let chartCostoScrap = null;
let chartCostoScrapHistorial = null;

// ------------ CHARTS DE COSTO DE SCRAP PRIMER DIV ------------

// Grafica de indicador rojo
export function generarGraficosScrap(fechaInicio, fechaActual, opcionSeleccionada){
    let fechaInicioFormato = formatearFecha(fechaInicio);
    let fechaActualFormato = formatearFecha(fechaActual);

    let fechaInicioIndicador = fechaInicioFormato; //Variable auxiliar para indicador clave
    if(opcionSeleccionada == "DIARIO"){
        fechaInicioIndicador = fechaActualFormato;
    }
    // alert(`Opcion seleccionada: ${opcionSeleccionada} por lo tanto: ${fechaInicioFormato} y ${fechaActualFormato}`);
    // ---------- CHART INDICADOR CLAVE ----------
    fetch(`http://localhost:3000/api/consultaIndicadorClave?fechaInicio=${fechaInicioIndicador}&fechaActual=${fechaActualFormato}`)
    .then(res => res.json())
    .then(data => {
        if(!data || data.length == 0){
            console.log("No hay datos para el indicador clave.");
            if(chartCostoScrap)
                chartCostoScrap.destroy(); //Limpia el gráfico si no hay datos
            return;
        }
        //Extrayendo datos en forma de arreglo de la tabla materialCosts
        const porcentaje = data.map(item => item.porcentajeReal);
        const porcentajeRedondeado = Math.round(porcentaje * 100) / 100;
        if(chartCostoScrap)
            chartCostoScrap.destroy()
        const ctx = document.getElementById('chartCostoScrap').getContext('2d');
        chartCostoScrap = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Scrap%'],
            datasets: [
            {
                label: 'Scrap% of Material Cost',
                data: [10],
                actualValue: [porcentajeRedondeado],
                backgroundColor: 'rgba(255, 0, 0, 0.6)',
                borderRadius: 10,
                barThickness: 20,
                maxBarThickness: 30
            }
            ]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            scales: {
            x: {
                min: 0,
                max: 12, // límite eje x
                grid: { display: false, drawBorder: false },
                ticks: { display: false }
            },
            y: {
                grid: { display: false, drawBorder: false },
                ticks: { display: false }
            }
            },
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
                    size: 14
                    }
                    }
                },
                tooltip: { enabled: false },
                datalabels: {
                    anchor: 'end',
                    align: 'right',
                    color: '#000',
                    formatter: (value, context) => {
                    //Obtenemos el valor real de nuestro indicador a traves de 'actualValue' para el label derecho
                    const realValue = context.dataset.actualValue[context.datasetIndex];
                    return realValue + '%';
                    }
                }
            }
        },
        plugins: [
            ChartDataLabels,
            {
            // Plugin para dibujar el punto negro como indicador
            id: 'indicator',
            afterDatasetsDraw(chart) {
                const {ctx, scales: {x, y}} = chart;
                const value = chart.data.datasets[0].actualValue;
                const yPos = y.getPixelForValue(0);
                const xPos = x.getPixelForValue(value);
                
                ctx.save();
                ctx.beginPath();
                ctx.arc(xPos, yPos, 6, 0, Math.PI * 2);
                ctx.fillStyle = '#000';
                ctx.fill();
                ctx.restore();
            }
            }
        ]
        });
    })
  .catch(err => {
    console.error("Error al obtener la tabla materialCosts para el indicador clave", err);
  });

  // ---------- CHART HISTORIAL DE SCRAP ----------
  fetch(`http://localhost:3000/api/consultaHistorialScrap-scrapHTML?fechaInicio=${fechaInicioFormato}&fechaActual=${fechaActualFormato}`)
  .then(res => res.json())
  .then(data => {
    if (!data || data.length === 0) {
            console.log("No hay datos para el historial de scrap.");
            if (chartCostoScrapHistorial) chartCostoScrapHistorial.destroy(); // Limpia el gráfico si no hay datos
            return;
        }
    
    //Guardamos los label y los valores con los que vamos a llenar el chart de historial
    const labelsHistorial = data.map(item => {
        const fecha = new Date(item.fecha);
        return `${fecha.getDate().toString().padStart(2, '0')}/${(fecha.getMonth() + 1).toString().padStart(2, '0')}`;
    });
    const valoresHistorial = data.map(item => parseFloat(item.porcentScrap.toFixed(2)));

    // Destruimos el gráfico anterior si existe
    if (chartCostoScrapHistorial) {
        chartCostoScrapHistorial.destroy();
    }

    const ctx1 = document.getElementById("chartCostoScrapHistorial").getContext("2d");
    chartCostoScrapHistorial = new Chart(ctx1, {
    type: 'line',
    data: {
        labels: labelsHistorial,
        datasets: [{
        label: "Scrap % Historial",
        data: valoresHistorial, // 🔹 Valores dinámicos
        borderColor: "lime",   // línea principal
        backgroundColor: "lime",
        tension: 0,             // sin curvatura (recto)
        pointRadius: 0,         // puntos grandes
        //   pointBackgroundColor: "black", 
        //   pointBorderWidth: 1,
        fill: false // Rellena el espacio por debajo del valor de las líneas
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
        legend: { display: false },
        tooltip: { enabled: false }, //Habilitamos o deshabilitamos el tooltip para ver valores
        datalabels: {
            align: "top",
            anchor: "end",
            color: "black",
            font: { weight: "bold" },
            rotation: -90, //Rotamos labels para que esten verticalmente
            formatter: (value) => value + "%"
        },
        annotation: {
            annotations: {
                baseline: {
                    type: "line",
                    yMin: 10,
                    yMax: 10,
                    borderColor: "black",
                    borderWidth: 1
                    }
                }
            }
        },
        scales: {
        y: {
            beginAtZero: true,
            min: 0,
            max: 10,
            grid: { display: false, drawBorder: false },
            ticks: { display: false },
        },
        x: {
            grid: { display: false, drawBorder: true },
            ticks: {display: true}
        }
        }
    },
    plugins: [ChartDataLabels]
    });
  })
  .catch(err => {
    console.error("Error al obtener la tabla materialCosts para el historial de indicadores", err);
  });
    
}


// ------------ CHART DE DE SCRAP POR PROCESO SEGUNDO DIV ------------
fetch('http://localhost:3000/api/consultaScrapProceso')
    .then(res => res.json())
    .then(data => {
        const chartProcesosLabel = data.map(item => item.nombreProceso);
        const chartProcesosValores = data.map(item => item.amountProceso);
        const ctx2 = document.getElementById('chartScrapPorProcesos').getContext('2d');
        
        const chartScrapPorProcesos = new Chart(ctx2, {
        type: 'bar',
        data: {
            labels: chartProcesosLabel /*['Cels Ensam Final', 'Rotatorias', 'Fabricacion', 'Dobladoras', 'Other Prod']*/,
            datasets: [{
                label: 'PARTE DE SCRAP POR PROCESOS',
                data: chartProcesosValores,
                backgroundColor: [
                    // 'rgba(51, 14, 216, 0.5)',
                    // 'rgba(161, 24, 54, 0.5)',
                    // 'rgba(255, 238, 1, 0.5)',
                    // 'rgba(28, 158, 152, 0.5)',
                    // 'rgba(85, 102, 201, 0.78)'
                    'rgba(135, 206, 235, 0.8)',
                    'rgba(135, 206, 235, 0.8)',
                    'rgba(135, 206, 235, 0.8)',
                    'rgba(135, 206, 235, 0.8)',
                    'rgba(135, 206, 235, 0.8)'
                ],
                borderColor: [
                    'rgba(135, 206, 235, 1)',
                    'rgba(135, 206, 235, 1)',
                    'rgba(135, 206, 235, 1)',
                    'rgba(135, 206, 235, 1)',
                    'rgba(135, 206, 235, 1)'
                ],
                borderWidth: 1,
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                datalabels: {
                formatter: (value) => '$' + value,
                color: '#000',
                font: {
                    weight: 'bold'
                }
                }
            }
        },
        plugins: [ChartDataLabels]
    });
    })
    .catch(err => {
        console.error('Error al obtener scrapProcesos', err);
    });

// ------------ CHART DE TOP DE SCRAP POR DEFECTO TERCER DIV ------------
const ctx3 = document.getElementById('chartTopScrapDefecto').getContext('2d');
const chartTopScrapDefecto = new Chart(ctx3, {
    type: 'bar',
    data: {
        labels: ['CONTAMINADO', 'QUEMADO', 'FUGA', 'GOLPEADO', 'ETC'],
        datasets: [{
            label: 'PARETO DE TOP POR DEFECTO',
            data: [130244, 74075, 56092, 27963, 46],
            backgroundColor: [
                'rgba(233, 210, 108, 0.99)',
                'rgba(84, 206, 94, 1)',
                'rgba(100, 160, 228, 1)',
                'rgba(174, 207, 97, 1)',
                'rgba(236, 186, 91, 1)'
            ],
            borderColor: [
                'rgba(233, 210, 108, 0.99)',
                'rgba(84, 206, 94, 1)',
                'rgba(100, 160, 228, 1)',
                'rgba(174, 207, 97, 1)',
                'rgba(236, 186, 91, 1)'
            ],
            borderWidth: 1,
        }]
    },
    options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                datalabels: {
                formatter: (value) => '$' + value,
                color: '#000',
                font: {
                    weight: 'bold'
                }
                }
            }
        },
        plugins: [ChartDataLabels] 
});

// ------------ CHART DE ENERGY CUARTO DIV (DINÁMICO) ------------
async function createEnergyChart() {
    try {
        const response = await fetch('http://localhost:3000/api/consultaEnergy?limit=30'); // Pide los últimos 30 registros
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();

        // Ordenar los datos por fecha, del más antiguo al más reciente
        const sortedData = data.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

        const labels = sortedData.map(item => item.fecha.split('T')[0]);
        
        // Calcular los ratios kWh/unidad, si la producción es 0, el valor será 0 para la gráfica
        const electricityData = sortedData.map(item => 
            item.electricidad_produccion > 0 ? parseFloat((item.electricidad_consumo / item.electricidad_produccion).toFixed(4)) : 0
        );

        // Calcular los ratios m³/unidad
        const heliumData = sortedData.map(item => 
            item.helio_produccion > 0 ? parseFloat((item.helio_consumo / item.helio_produccion).toFixed(4)) : 0
        );

        const ctx4 = document.getElementById('chartEnergy').getContext('2d');
        new Chart(ctx4, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'ELECTRICIDAD (kWh/Unidad)',
                    data: electricityData,
                    borderColor: 'rgb(54, 162, 235)', // Color azul
                    backgroundColor: 'rgba(54, 162, 235, 0.5)',
                    fill: false,
                    tension: 0.1,
                    pointRadius: 3
                }, {
                    label: 'HELIO (m³/Unidad)',
                    data: heliumData,
                    borderColor: 'rgb(255, 159, 64)', // Color naranja
                    backgroundColor: 'rgba(255, 159, 64, 0.5)',
                    fill: false,
                    tension: 0.1,
                    pointRadius: 3
                }]
            },
            options: {
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
            }
        });
    } catch (error) {
        console.error("Error al crear la gráfica de energía:", error);
        // Opcional: Mostrar un mensaje de error en el canvas si falla la carga
        const ctx4 = document.getElementById('chartEnergy').getContext('2d');
        ctx4.font = '16px Arial';
        ctx4.fillStyle = 'red';
        ctx4.textAlign = 'center';
        ctx4.fillText('No se pudieron cargar los datos.', 150, 100);
    }
}
createEnergyChart();

// ------------ CHART DE BTS QUINTO DIV ------------
const ctx6 = document.getElementById('chartLowPerformance').getContext('2d');
const chartLowPerformance = new Chart(ctx6, {
    type: 'bar',
    data: {
        labels: ['Scrap%'],
        datasets: [
        {
            label: 'Low Performance',
            data: [8], // valor actual
            backgroundColor: 'rgba(255, 0, 0, 0.6)',
            borderRadius: 10,
            barThickness: 20,
            maxBarThickness: 30
        }
        ]
  },
  options: {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        min: 0,
        max: 10, // límite eje x
        grid: { display: false, drawBorder: false },
        ticks: { display: false }
      },
      y: {
        grid: { display: false, drawBorder: false },
        ticks: { display: false }
      }
    },
    plugins: {
      legend: {
        labels: {
            usePointStyle: true, // usa punto en lugar de cuadro
            pointStyle: false,   // con false no dibuja nada
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
                }
            }
        },
        tooltip: { enabled: false },
        datalabels: {
            anchor: 'end',
            align: 'right',
            color: '#000',
            formatter: (value) => value + '%'
        }
    }
  },
  plugins: [
    ChartDataLabels,
    {
      // Plugin para dibujar el punto negro como indicador
      id: 'indicator',
      afterDatasetsDraw(chart) {
        const {ctx, scales: {x, y}} = chart;
        const value = /*chart.data.datasets[0].data[0];*/ 4.0;
        const yPos = y.getPixelForValue(0);
        const xPos = x.getPixelForValue(value);
        
        ctx.save();
        ctx.beginPath();
        ctx.arc(xPos, yPos, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#000';
        ctx.fill();
        ctx.restore();
      }
    }
  ]
});

const ctx7 = document.getElementById('chartBtsLineas').getContext('2d');
const myChart7 = new Chart(ctx7, {
    type: 'bar',
    data: {
        labels: ['LINEA 1', 'LINEA 2', 'LINEA 3', 'LINEA 4', 'LINEA 5'],
        datasets: [{
            label: 'PARETO DE TOP POR DEFECTO',
            data: [130244, 74075, 56092, 27963, 46],
            backgroundColor: [
                'rgba(100, 160, 228, 1)',
                'rgba(100, 160, 228, 1)',
                'rgba(100, 160, 228, 1)',
                'rgba(100, 160, 228, 1)',
                'rgba(100, 160, 228, 1)'
            ],
            borderColor: [
                'rgba(100, 160, 228, 1)',
                'rgba(100, 160, 228, 1)',
                'rgba(100, 160, 228, 1)',
                'rgba(100, 160, 228, 1)',
                'rgba(100, 160, 228, 1)'
            ],
            borderWidth: 1,
        }]
    },
    options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {display: false},
                datalabels: {
                formatter: (value) => '$' + value,
                color: '#000',
                font: {
                    weight: 'bold'
                }
                }
            }
        },
        plugins: [ChartDataLabels] 
});

// ------------ CHART DE COST SAVINGS SEXTO DIV ------------
const ctx8 = document.getElementById('chartCostSavings').getContext('2d');
const chartCostSavings = new Chart(ctx8, {
    type: 'doughnut',
    data: {
        labels: ['FUGAS FALSAS', 'RECHAZOS', 'MAL FORMADO'],
        datasets: [{
            label: 'Scrap Costs',
            data: [1200, 1800, 2000],
            backgroundColor: [
                'rgba(51, 14, 216, 0.5)',
                'rgba(161, 24, 54, 0.5)',
                'rgba(255, 238, 1, 0.5)'
            ],
            borderColor: [
                'rgba(51, 14, 216, 1)',
                'rgba(161, 24, 54, 1)',
                'rgba(255, 238, 1, 1)'
            ],
            borderWidth: 1,
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false
    } 
});

// ------------ CHART DE OEE SEPTIMO DIV ------------
const ctx9 = document.getElementById('chartIndicadorOEE').getContext('2d');
const chartOEE = new Chart(ctx9, {
    type: 'bar',
    data: {
        labels: ['Scrap%'],
        datasets: [
        {
            label: 'OEE',
            data: [8], // valor actual
            backgroundColor: 'rgba(255, 0, 0, 0.6)',
            borderRadius: 10,
            barThickness: 20,
            maxBarThickness: 30
        }
        ]
  },
  options: {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        min: 0,
        max: 10, // límite eje x
        grid: { display: false, drawBorder: false },
        ticks: { display: false }
      },
      y: {
        grid: { display: false, drawBorder: false },
        ticks: { display: false }
      }
    },
    plugins: {
      legend: {
        labels: {
            usePointStyle: true, // usa punto en lugar de cuadro
            pointStyle: false,   // con false no dibuja nada
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
                }
            }
        },
        tooltip: { enabled: false },
        datalabels: {
            anchor: 'end',
            align: 'right',
            color: '#000',
            formatter: (value) => value + '%'
        }
    }
  },
  plugins: [
    ChartDataLabels,
    {
      // Plugin para dibujar el punto negro como indicador
      id: 'indicator',
      afterDatasetsDraw(chart) {
        const {ctx, scales: {x, y}} = chart;
        const value = /*chart.data.datasets[0].data[0];*/ 4.0;
        const yPos = y.getPixelForValue(0);
        const xPos = x.getPixelForValue(value);
        
        ctx.save();
        ctx.beginPath();
        ctx.arc(xPos, yPos, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#000';
        ctx.fill();
        ctx.restore();
      }
    }
  ]
});

const ctx10 = document.getElementById('chartOEEAreas').getContext('2d');
const myChart10 = new Chart(ctx10, {
    type: 'bar',
    data: {
        labels: ['CONTAMINADO', 'QUEMADO', 'FUGA', 'GOLPEADO', 'ETC'],
        datasets: [{
            label: 'PARETO DE TOP POR DEFECTO',
            data: [130244, 74075, 56092, 27963, 46],
            backgroundColor: [
                'rgba(100, 160, 228, 1)',
                'rgba(100, 160, 228, 1)',
                'rgba(100, 160, 228, 1)',
                'rgba(100, 160, 228, 1)',
                'rgba(100, 160, 228, 1)'
            ],
            borderColor: [
                'rgba(100, 160, 228, 1)',
                'rgba(100, 160, 228, 1)',
                'rgba(100, 160, 228, 1)',
                'rgba(100, 160, 228, 1)',
                'rgba(100, 160, 228, 1)'
            ],
            borderWidth: 1,
        }]
    },
    options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {display: false},
                datalabels: {
                formatter: (value) => '$' + value,
                color: '#000',
                font: {
                    weight: 'bold'
                }
                }
            }
        },
        plugins: [ChartDataLabels] 
});

// ------------ CHART DE FTT NOVENO DIV ------------
const ctx11 = document.getElementById('chartIndicadorFTT').getContext('2d');
const chartIndicadorFTT = new Chart(ctx11, {
    type: 'bar',
    data: {
        labels: ['Scrap%'],
        datasets: [
        {
            label: 'FTT',
            data: [8], // valor actual
            backgroundColor: 'rgba(255, 0, 0, 0.6)',
            borderRadius: 10,
            barThickness: 20,
            maxBarThickness: 30
        }
        ]
  },
  options: {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        min: 0,
        max: 10, // límite eje x
        grid: { display: false, drawBorder: false },
        ticks: { display: false }
      },
      y: {
        grid: { display: false, drawBorder: false },
        ticks: { display: false }
      }
    },
    plugins: {
      legend: {
        labels: {
            usePointStyle: true, // usa punto en lugar de cuadro
            pointStyle: false,   // con false no dibuja nada
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
                }
            }
        },
        tooltip: { enabled: false },
        datalabels: {
            anchor: 'end',
            align: 'right',
            color: '#000',
            formatter: (value) => value + '%'
        }
    }
  },
  plugins: [
    ChartDataLabels,
    {
      // Plugin para dibujar el punto negro como indicador
      id: 'indicator',
      afterDatasetsDraw(chart) {
        const {ctx, scales: {x, y}} = chart;
        const value = /*chart.data.datasets[0].data[0];*/ 4.0;
        const yPos = y.getPixelForValue(0);
        const xPos = x.getPixelForValue(value);
        
        ctx.save();
        ctx.beginPath();
        ctx.arc(xPos, yPos, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#000';
        ctx.fill();
        ctx.restore();
      }
    }
  ]
});

const ctx12 = document.getElementById('chartBarrasFTT').getContext('2d');
const chartBarrasFTT = new Chart(ctx12, {
    type: 'bar',
    data: {
        labels: ['CONTAMINADO', 'QUEMADO', 'FUGA', 'GOLPEADO', 'ETC'],
        datasets: [{
            label: 'PARETO DE TOP POR DEFECTO',
            data: [130244, 74075, 56092, 27963, 46],
            backgroundColor: [
                'rgba(100, 160, 228, 1)',
                'rgba(100, 160, 228, 1)',
                'rgba(100, 160, 228, 1)',
                'rgba(100, 160, 228, 1)',
                'rgba(100, 160, 228, 1)'
            ],
            borderColor: [
                'rgba(100, 160, 228, 1)',
                'rgba(100, 160, 228, 1)',
                'rgba(100, 160, 228, 1)',
                'rgba(100, 160, 228, 1)',
                'rgba(100, 160, 228, 1)'
            ],
            borderWidth: 1,
        }]
    },
    options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {display: false},
                datalabels: {
                formatter: (value) => '$' + value,
                color: '#000',
                font: {
                    weight: 'bold'
                }
                }
            }
        },
        plugins: [ChartDataLabels]  
});


// ------------ CHART DE TOP DE FTT DECIMO DIV ------------
const ctx13 = document.getElementById('TopFTT').getContext('2d');
const TopFTT = new Chart(ctx13, {
    type: 'bar',
    data: {
        labels: ['CONTAMINADO', 'QUEMADO', 'FUGA', 'GOLPEADO', 'ETC'],
        datasets: [{
            label: 'PARETO DE TOP POR DEFECTO FTT',
            data: [130244, 74075, 56092, 27963, 46],
            backgroundColor: [
                'rgba(100, 160, 228, 1)',
                'rgba(100, 160, 228, 1)',
                'rgba(100, 160, 228, 1)',
                'rgba(100, 160, 228, 1)',
                'rgba(100, 160, 228, 1)'
            ],
            borderColor: [
                'rgba(100, 160, 228, 1)',
                'rgba(100, 160, 228, 1)',
                'rgba(100, 160, 228, 1)',
                'rgba(100, 160, 228, 1)',
                'rgba(100, 160, 228, 1)'
            ],
            borderWidth: 1,
        }]
    },
    options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {display: true},
                datalabels: {
                formatter: (value) => '$' + value,
                color: '#000',
                font: {
                    weight: 'bold'
                }
                }
            }
        },
        plugins: [ChartDataLabels]  
});

// ------------ CHART DE EXPENSES UNDECIMO DIV ------------
const ctx14 = document.getElementById('chartExpenses').getContext('2d');
const chartExpenses = new Chart(ctx14, {
    type: 'bar',
    data: {
        labels: ['CONTAMINADO', 'QUEMADO', 'FUGA', 'GOLPEADO', 'ETC'],
        datasets: [{
            label: 'EXPENSES',
            data: [130244, 74075, 56092, 27963, 46],
            backgroundColor: [
                'rgba(238, 108, 57, 1)',
                'rgba(238, 108, 57, 1)',
                'rgba(238, 108, 57, 1)',
                'rgba(238, 108, 57, 1)',
                'rgba(238, 108, 57, 1)'
            ],
            borderColor: [
                'rgba(238, 108, 57, 1)',
                'rgba(238, 108, 57, 1)',
                'rgba(238, 108, 57, 1)',
                'rgba(238, 108, 57, 1)',
                'rgba(238, 108, 57, 1)'
            ],
            borderWidth: 1,
        }]
    },
    options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {display: true},
                datalabels: {
                formatter: (value) => '$' + value,
                color: '#000',
                font: {
                    weight: 'bold'
                }
                }
            }
        },
        plugins: [ChartDataLabels]  
});

// ------------ CHART DE EXPENSES DUODECIMO DIV ------------
const ctx15 = document.getElementById('chartTopExpenses').getContext('2d');
const chartTopExpenses = new Chart(ctx15, {
    type: 'bar',
    data: {
        labels: ['CONTAMINADO', 'QUEMADO', 'FUGA', 'GOLPEADO', 'ETC'],
        datasets: [{
            label: 'PARETO DE TOP EXPENSES',
            data: [130244, 74075, 56092, 27963, 46],
            backgroundColor: [
                'rgba(238, 108, 57, 1)',
                'rgba(238, 108, 57, 1)',
                'rgba(238, 108, 57, 1)',
                'rgba(238, 108, 57, 1)',
                'rgba(238, 108, 57, 1)'
            ],
            borderColor: [
                'rgba(238, 108, 57, 1)',
                'rgba(238, 108, 57, 1)',
                'rgba(238, 108, 57, 1)',
                'rgba(238, 108, 57, 1)',
                'rgba(238, 108, 57, 1)'
            ],
            borderWidth: 1,
        }]
    },
    options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {display: true},
                datalabels: {
                formatter: (value) => '$' + value,
                color: '#000',
                font: {
                    weight: 'bold'
                }
                }
            }
        },
        plugins: [ChartDataLabels]  
});

// ------------ CHART DE EXPENSES DUODECIMO DIV ------------

const ctx16 = document.getElementById('chartTopOEE').getContext('2d');
const chartTopOEE = new Chart(ctx16, {
    type: 'bar',
    data: {
        labels: ['CONTAMINADO', 'QUEMADO', 'FUGA', 'GOLPEADO', 'ETC'],
        datasets: [{
            label: 'PARETO DE TOP EXPENSES',
            data: [130244, 74075, 56092, 27963, 46],
            backgroundColor: [
                'rgba(238, 108, 57, 1)',
                'rgba(238, 108, 57, 1)',
                'rgba(238, 108, 57, 1)',
                'rgba(238, 108, 57, 1)',
                'rgba(238, 108, 57, 1)'
            ],
            borderColor: [
                'rgba(238, 108, 57, 1)',
                'rgba(238, 108, 57, 1)',
                'rgba(238, 108, 57, 1)',
                'rgba(238, 108, 57, 1)',
                'rgba(238, 108, 57, 1)'
            ],
            borderWidth: 1,
        }]
    },
    options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {display: true},
                datalabels: {
                formatter: (value) => '$' + value,
                color: '#000',
                font: {
                    weight: 'bold'
                }
                }
            }
        },
        plugins: [ChartDataLabels]  
});