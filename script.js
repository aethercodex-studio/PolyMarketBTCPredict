// --- LÓGICA DEL HEATMAP ---
const diasSemanas = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const horas = [];
for(let h=0; h<24; h++) {
    for(let m=0; m<60; m+=5) {
        horas.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
    }
}

fetch('datos.json')
    .then(response => response.json())
    .then(datosArray => {
        const datosDict = {};
        datosArray.forEach(item => {
            if (!datosDict[item.diaSemana]) datosDict[item.diaSemana] = {};
            datosDict[item.diaSemana][item.hora] = item.probabilidadUp;
        });
        renderizarTabla(datosDict);
    })
    .catch(e => console.log("Esperando datos.json o error de carga"));

function obtenerColorDinamico(probabilidadUp) {
    const UMBRAL_FUERTE = 0.65; 
    if (probabilidadUp >= UMBRAL_FUERTE) {
        let opacidad = ((probabilidadUp - UMBRAL_FUERTE) / (1 - UMBRAL_FUERTE)) * 0.7 + 0.3;
        return `rgba(0, 255, 0, ${opacidad})`;
    }
    let probabilidadDown = 1 - probabilidadUp;
    if (probabilidadDown >= UMBRAL_FUERTE) {
        let opacidad = ((probabilidadDown - UMBRAL_FUERTE) / (1 - UMBRAL_FUERTE)) * 0.7 + 0.3;
        return `rgba(255, 0, 0, ${opacidad})`;
    }
    return 'transparent';
}

function renderizarTabla(datosDict) {
    const thead = document.getElementById('tableHead');
    const tbody = document.getElementById('tableBody');
    let trHead = document.createElement('tr');
    trHead.innerHTML = `<th class="col-fija header-esquina">Día</th>`;
    horas.forEach(hora => { trHead.innerHTML += `<th>${hora}</th>`; });
    thead.appendChild(trHead);

    diasSemanas.forEach((nombreDia, indiceDia) => {
        let tr = document.createElement('tr');
        tr.innerHTML = `<td class="col-fija">${nombreDia}</td>`;
        horas.forEach(hora => {
            let probabilidadUp = 0.5;
            if(datosDict[indiceDia] && datosDict[indiceDia][hora] !== undefined) {
                probabilidadUp = datosDict[indiceDia][hora];
            }
            let colorFondo = obtenerColorDinamico(probabilidadUp);
            let esMasProbableSubir = probabilidadUp >= 0.5;
            let valorMostrar = esMasProbableSubir ? (probabilidadUp * 100) : ((1 - probabilidadUp) * 100);
            let etiqueta = esMasProbableSubir ? "UP" : "DOWN";
            let colorTexto = colorFondo === 'transparent' ? '#555' : 'white';
            tr.innerHTML += `<td style="background-color: ${colorFondo}; color: ${colorTexto}; border: 1px solid #333;">
                                ${valorMostrar.toFixed(0)}% ${etiqueta}
                             </td>`;
        });
        tbody.appendChild(tr);
    });
}

// --- LÓGICA DEL CONVERSOR DE HORA ---
const inputCET = document.getElementById('horaCET');
const inputET = document.getElementById('horaET');

function actualizarReloj() {
    const ahora = new Date();
    inputCET.value = ahora.getHours().toString().padStart(2, '0') + ":" + ahora.getMinutes().toString().padStart(2, '0');
    convertirHora('CET');
}

function convertirHora(origen) {
    if (origen === 'CET') {
        let [h, m] = inputCET.value.split(':');
        let date = new Date();
        date.setHours(h, m);
        // ET es CET - 6 (Aproximado, depende de horario de verano, pero standard es -6h)
        date.setHours(date.getHours() - 6);
        inputET.value = date.getHours().toString().padStart(2, '0') + ":" + date.getMinutes().toString().padStart(2, '0');
    } else {
        let [h, m] = inputET.value.split(':');
        let date = new Date();
        date.setHours(h, m);
        date.setHours(date.getHours() + 6);
        inputCET.value = date.getHours().toString().padStart(2, '0') + ":" + date.getMinutes().toString().padStart(2, '0');
    }
}

inputCET.addEventListener('input', () => convertirHora('CET'));
inputET.addEventListener('input', () => convertirHora('ET'));
actualizarReloj();