// La URL base de la API
const API_URL_BASE = 'https://censopoblacion.azurewebsites.net/API/indicadores/2/';

// Datos quemados de la API, ya que la API no proporciona una lista de municipios
const municipios = [
    { codigo: '999', nombre: 'El Progreso (Departamental)' },
    { codigo: '201', nombre: 'Guastatoya' },
    { codigo: '202', nombre: 'Morazán' },
    { codigo: '203', nombre: 'San Agustín Acasaguastlán' },
    { codigo: '204', nombre: 'San Cristóbal Acasaguastlán' },
    { codigo: '205', nombre: 'El Jícaro' },
    { codigo: '206', nombre: 'Sansare' },
    { codigo: '207', nombre: 'Sanarate' },
    { codigo: '208', nombre: 'San Antonio la Paz' }
];

// Selecciona el selector de municipios y el contenedor de datos
const municipioSelector = document.getElementById('municipioSelector');
const datosCensoDiv = document.getElementById('datosCenso');

// Función para cargar el selector de municipios
function cargarMunicipios() {
    municipios.forEach(municipio => {
        const option = document.createElement('option');
        option.value = municipio.codigo;
        option.textContent = municipio.nombre;
        municipioSelector.appendChild(option);
    });
}

// Función asincrónica para obtener los datos de la API
async function obtenerDatosCenso(codigoMunicipio) {
    const url = `${API_URL_BASE}${codigoMunicipio}`;
    datosCensoDiv.innerHTML = '<div class="col-12 text-center p-5"><p>Cargando datos...</p><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Cargando...</span></div></div>';

    try {
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error('No se pudo obtener la información de la API');
        }
        
        let dataText = await response.text();
        dataText = dataText.substring(1, dataText.length - 1).replace(/\\"/g, '"');
        
        let data = JSON.parse(dataText);
        
        if (Array.isArray(data)) {
            data = data[0];
        }
        
        console.log("Datos a usar en la página:", data);

        mostrarDatos(data);
        
        history.pushState(null, '', `?municipio=${codigoMunicipio}`);

    } catch (error) {
        console.error("Error al obtener datos:", error);
        datosCensoDiv.innerHTML = `<div class="col-12"><div class="alert alert-danger" role="alert">
                                      Ocurrió un error al cargar los datos. Intenta de nuevo.
                                  </div></div>`;
    }
}

// --- FUNCIÓN PARA DAR FORMATO A LOS NÚMEROS (FINAL) ---
function formatearValor(key, value) {
    const num = parseFloat(value);
    
    if (isNaN(num)) {
        return value;
    }
    
    // Formato para números enteros grandes (población, hogares, etc.)
    if (key.includes('total') || key.includes('pob_') || key.includes('viviendas') || key.includes('lugares')) {
        // Usamos 'en-US' para el formato de coma de millar y sin decimales
        return Math.round(num).toLocaleString('en-US');
    }
    
    // Formato para porcentajes, promedios e índices (con 2 decimales)
    if (key.includes('porc_') || key.includes('prom_') || key.includes('indice_') || key.includes('edad_')) {
        return num.toFixed(2).toLocaleString('en-US') + '';
    }
    
    return value;
}


// --- FUNCIÓN PARA MOSTRAR LOS DATOS (CORREGIDA) ---
function mostrarDatos(data) {
    datosCensoDiv.innerHTML = ''; 

    if (!data) {
        datosCensoDiv.innerHTML = `<div class="col-12"><p class="text-center text-muted">No se encontraron datos para este municipio.</p></div>`;
        return;
    }
    
    const ubicacion = data["nombre"]; 
    
    const gruposDeDatos = {
        "Población": {
            "Población total": formatearValor('pob_total', data["pob_total"]),
            "Población masculina": formatearValor('total_sexo_hombre', data["total_sexo_hombre"]),
            "Población femenina": formatearValor('total_sexo_mujeres', data["total_sexo_mujeres"]),
            "Porcentaje de hombres": formatearValor('porc_sexo_hombre', data["porc_sexo_hombre"]),
            "Porcentaje de mujeres": formatearValor('porc_sexo_mujeres', data["porc_sexo_mujeres"])
        },
        "Demografía y Edad": {
            "Edad promedio": formatearValor('edad_promedio', data["edad_promedio"]),
            "Índice de dependencia": formatearValor('indice_dependencia', data["indice_dependencia"]),
            "Población < 15 años": formatearValor('pob_edad_014', data["pob_edad_014"]),
            "Población 15-64 años": formatearValor('pob_edad_1564', data["pob_edad_1564"]),
            "Población > 65 años": formatearValor('pob_edad_65', data["pob_edad_65"])
        },
        "Educación y Empleo": {
            "Años promedio de estudio": formatearValor('anios_prom_estudio', data["anios_prom_estudio"]),
            "Alfabetismo (%)": formatearValor('alfabetismo', data["alfabetismo"]),
        },
        "Vivienda": {
            "Total de viviendas particulares": formatearValor('viviendas_part', data["viviendas_part"]),
            "Total de hogares": formatearValor('total_hogares', data["total_hogares"]),
            "Promedio de personas por hogar": formatearValor('prom_personas_hogar', data["prom_personas_hogar"]),
            "Hogares con jefatura femenina": formatearValor('total_jefas_hogar', data["total_jefas_hogar"])
        },
        "Etnia y Procedencia": {
             "Población Maya": formatearValor('pob_pueblo_maya', data["pob_pueblo_maya"]),
             "Población Garífuna": formatearValor('pob_pueblo_garifuna', data["pob_pueblo_garifuna"]),
             "Población Xinca": formatearValor('pob_pueblo_xinca', data["pob_pueblo_xinca"]),
             "Población Afrodescendiente": formatearValor('pob_pueblo_afrodescendiente', data["pob_pueblo_afrodescendiente"]),
             "Población Ladina": formatearValor('pob_pueblo_ladino', data["pob_pueblo_ladino"]),
             "Población Extranjera": formatearValor('pob_pueblo_extranjero', data["pob_pueblo_extranjero"])
        }
    };

    let htmlContent = `
        <div class="col-12 mb-4">
            <h3 class="text-primary">${ubicacion}</h3>
        </div>
    `;

    for (const grupo in gruposDeDatos) {
        if (Object.keys(gruposDeDatos[grupo]).length > 0) {
            htmlContent += `<div class="col-12 mt-3"><h4>${grupo}</h4><hr></div>`;
            for (const [key, value] of Object.entries(gruposDeDatos[grupo])) {
                htmlContent += `
                    <div class="col-md-6 col-lg-4 mb-3">
                        <div class="card h-100 shadow-sm">
                            <div class="card-body">
                                <h6 class="card-title text-secondary">${key}</h6>
                                <p class="card-text fs-4 fw-bold text-primary">${value}</p>
                            </div>
                        </div>
                    </div>
                `;
            }
        }
    }
    
    datosCensoDiv.innerHTML = htmlContent;
}

// Agrega un listener para detectar cambios en el selector
municipioSelector.addEventListener('change', (event) => {
    const codigoSeleccionado = event.target.value;
    obtenerDatosCenso(codigoSeleccionado);
});

// Llama a la función al cargar la página para:
// 1. Cargar el selector con los municipios
// 2. Verificar si hay un parámetro en la URL al cargar la página.
// 3. Si no lo hay, carga el valor por defecto.
document.addEventListener('DOMContentLoaded', () => {
    cargarMunicipios();
    const urlParams = new URLSearchParams(window.location.search);
    const municipioURL = urlParams.get('municipio');
    if (municipioURL) {
        municipioSelector.value = municipioURL;
        obtenerDatosCenso(municipioURL);
    } else {
        obtenerDatosCenso(municipioSelector.value);
    }
});


// =========================================================
//           CÓDIGO DEL BANNER DINÁMICO
// =========================================================
const h1 = document.querySelector('header h1');
const h2 = document.querySelector('header h2');
const p = document.querySelector('header p');

const infoOriginal = {
    h1: "Censo Nacional de Población y Vivienda",
    h2: "Departamento de El Progreso",
    p: "Explora los datos del censo de 2018 por municipio."
};

const infoPersonal = {
    h1: "Engelber Venceslav Cifuentes Moran",
    h2: "Carné: 1890-22-15397",
    p: ""
};

let mostrandoInfoOriginal = true;

function alternarBanner() {
    if (mostrandoInfoOriginal) {
        // Muestra la información personal
        h1.textContent = infoPersonal.h1;
        h2.textContent = infoPersonal.h2;
        p.textContent = infoPersonal.p;
    } else {
        // Muestra la información original
        h1.textContent = infoOriginal.h1;
        h2.textContent = infoOriginal.h2;
        p.textContent = infoOriginal.p;
    }
    mostrandoInfoOriginal = !mostrandoInfoOriginal;
}

// Inicia el cambio de banner cada 5 segundos (5000 milisegundos)
setInterval(alternarBanner, 5000);