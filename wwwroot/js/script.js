// ==========================================
// CONTADOR DE SÍ/NO EN BIENVENIDA
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    const nombrePagina = window.location.pathname.split("/").pop();
    if (nombrePagina !== "bienvenida.html" && nombrePagina !== "") return;

    const btnSi = document.querySelector("button[aria-label*='discapacidad visual']");
    const btnNo = document.querySelector("button[aria-label*='no padezco']");

    if (!btnSi || !btnNo) return;

    if (!localStorage.getItem("contadorSi")) localStorage.setItem("contadorSi", "0");
    if (!localStorage.getItem("contadorNo")) localStorage.setItem("contadorNo", "0");

    btnSi.addEventListener("click", () => {
        let actual = parseInt(localStorage.getItem("contadorSi"));
        localStorage.setItem("contadorSi", actual + 1);
    });

    btnNo.addEventListener("click", () => {
        let actual = parseInt(localStorage.getItem("contadorNo"));
        localStorage.setItem("contadorNo", actual + 1);
    });
});

// ==========================================
// TOOLTIPS DE EXPERTAS
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    const expertasImgs = document.querySelectorAll(
        ".expertas-galeria .img-cuadro"
    );

    if (expertasImgs.length === 0) return;

    const infoExpertas = [
        "Valeria cuenta con más de 10 años de experiencia en terapias de masaje y bienestar integral. Está especializada en masajes relajantes, descontracturantes, piedras calientes y reflexología. Su enfoque personalizado y su calidez humana hacen que cada sesión sea una experiencia profunda de relajación y renovación.",
        "Camila es una esteticista profesional con amplia trayectoria en tratamientos faciales. Domina técnicas de limpieza profunda, hidratación, rejuvenecimiento y cuidado de piel sensible. Su compromiso con la belleza natural y el bienestar de sus clientes la convierten en una referente en el área estética del spa.",
    ];

    expertasImgs.forEach((img, index) => {
        const wrapper = document.createElement("div");
        wrapper.style.position = "relative";
        wrapper.style.display = "inline-block";

        const tooltip = document.createElement("div");
        tooltip.classList.add("tooltip-info");
        tooltip.textContent = infoExpertas[index];

        img.parentNode.replaceChild(wrapper, img);
        wrapper.appendChild(img);
        wrapper.appendChild(tooltip);

        wrapper.addEventListener("mouseenter", () => {
            tooltip.classList.add("tooltip-visible");
        });

        wrapper.addEventListener("mouseleave", () => {
            tooltip.classList.remove("tooltip-visible");
        });
    });
});

// ==========================================
// AGENDA TU CITA
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    const formCita = document.getElementById("formCita");
    if (!formCita) return; // esta página no es la de cita

    const selectServicio = document.getElementById("servicio");
    const selectDuracion = document.getElementById("duracion");
    const campoPersonas = document.getElementById("campoPersonas");
    const inputPersonas = document.getElementById("personas");
    const precioFinal = document.getElementById("precioFinal");
    const inputFecha = document.getElementById("fecha");
    const inputHora = document.getElementById("hora");
    const inputDni = document.getElementById("dni");
    const errorDni = document.getElementById("errorDni");

    // ---- Validación del DNI en tiempo real ----
    if (inputDni) {
        inputDni.addEventListener("input", () => {
            // Elimina cualquier carácter que no sea un número
            inputDni.value = inputDni.value
                .replace(/\D/g, "")
                .slice(0, 8);

            if (inputDni.value.length === 0) {
                errorDni.textContent = "";
                inputDni.setCustomValidity("");
            } else if (inputDni.value.length !== 8) {
                const mensaje = "El DNI debe contener exactamente 8 números.";
                errorDni.textContent = mensaje;
                inputDni.setCustomValidity(mensaje);
            } else {
                errorDni.textContent = "";
                inputDni.setCustomValidity("");
            }
        });
    }

    // ---- Horario laboral permitido ----
    const HORA_APERTURA = "10:00";
    const HORA_CIERRE = "21:00";

    // ---- Fecha mínima = hoy (no permite seleccionar fechas pasadas) ----
    const hoy = new Date().toISOString().split("T")[0];
    if (inputFecha) {
        inputFecha.setAttribute("min", hoy);
    }

    if (inputHora) {
        inputHora.setAttribute("min", HORA_APERTURA);
        inputHora.setAttribute("max", HORA_CIERRE);
    }

    const duracionesPorServicio = {
        "masaje-relajante": ["30 min", "60 min"],
        "masaje-piedras-calientes": ["30 min", "60 min"],
        "masaje-descontracturante": ["30 min", "60 min"],

        "facial-express": ["Individual", "Para dos"],
        "facial-profundo": ["Individual", "Para dos"],
        "facial-rejuvenecedor": ["Individual", "Para dos"],

        "camara-vapor": ["30 min", "60 min"],
        "camara-seca": ["30 min", "60 min"],
        "tina-hidromasaje": ["30 min", "60 min"],

        "promo-mes": ["-"],
        "promo-cumple": ["-"],
        "promo-ritual-relax": ["-"]
    };

    const preciosPorServicio = {
        "masaje-relajante": {
            "30 min": 50,
            "60 min": 90
        },
        "masaje-piedras-calientes": {
            "30 min": 65,
            "60 min": 95
        },
        "masaje-descontracturante": {
            "30 min": 60,
            "60 min": 80
        },

        "facial-express": {
            "Individual": 89,
            "Para dos": 158
        },
        "facial-profundo": {
            "Individual": 90,
            "Para dos": 160
        },
        "facial-rejuvenecedor": {
            "Individual": 190,
            "Para dos": 360
        },

        "camara-vapor": {
            "30 min": 70,
            "60 min": 130
        },
        "camara-seca": {
            "30 min": 70,
            "60 min": 130
        },
        "tina-hidromasaje": {
            "30 min": 80,
            "60 min": 150
        },

        "promo-mes": 160,
        "promo-cumple": 260,
        "promo-ritual-relax": 320
    };
   

    function actualizarUIPrecioYPersonas() {
        const servicio = selectServicio.value;
        const duracion = selectDuracion.value;
        const personas = parseInt(inputPersonas.value) || 1;
        let total = 0;
        if (servicio.startsWith("promo-db-")) {
            campoPersonas.style.display = "block";

            const opcionSeleccionada = selectServicio.options[selectServicio.selectedIndex];
            const precioPromo = parseFloat(opcionSeleccionada.dataset.precio) || 0;

            total = precioPromo * personas;

            precioFinal.textContent = `Precio total: S/ ${total.toFixed(2)}`;
            return;
        }

        if (servicio === "promo-cumple" || servicio === "promo-ritual-relax") {
            campoPersonas.style.display = "block";
            total = preciosPorServicio[servicio] * personas;
            precioFinal.textContent = `Precio total: S/ ${total.toFixed(2)}`;
            return;
        }

        if (servicio === "promo-mes") {
            campoPersonas.style.display = "none";
            inputPersonas.value = 1;
            precioFinal.textContent = `Precio: S/ ${preciosPorServicio[servicio].toFixed(2)}`;
            return;
        }

        campoPersonas.style.display = "none";
        inputPersonas.value = 1;

        if (preciosPorServicio[servicio] && preciosPorServicio[servicio][duracion]) {
            total = preciosPorServicio[servicio][duracion];
            precioFinal.textContent = `Precio: S/ ${total.toFixed(2)}`;
        } else {
            precioFinal.textContent = "";
        }
    }

    function actualizarDuraciones() {
        const servicio = selectServicio.value;

        selectDuracion.innerHTML = "";

        if (servicio.startsWith("promo-db-")) {
            const option = document.createElement("option");
            option.value = "90 min";
            option.textContent = "90 min";
            option.selected = true;

            selectDuracion.appendChild(option);

            actualizarUIPrecioYPersonas();
            return;
        }

        const duraciones = duracionesPorServicio[servicio] || [];

        duraciones.forEach((dur) => {
            const option = document.createElement("option");
            option.value = dur;
            option.textContent = dur;
            selectDuracion.appendChild(option);
        });

        actualizarUIPrecioYPersonas();
    }

    if (selectServicio) {
        selectServicio.addEventListener("change", actualizarDuraciones);
    }

    if (selectDuracion) {
        selectDuracion.addEventListener("change", actualizarUIPrecioYPersonas);
    }

    if (inputPersonas) {
        inputPersonas.addEventListener("input", () => {
            const valor = inputPersonas.value;

            if (valor === "") {
                actualizarUIPrecioYPersonas();
                return;
            }

            if (parseInt(valor) > 20) {
                inputPersonas.value = 20;
            }

            actualizarUIPrecioYPersonas();
        });

        inputPersonas.addEventListener("blur", () => {
            if (inputPersonas.value === "" || parseInt(inputPersonas.value) < 1) {
                inputPersonas.value = 1;
            }

            actualizarUIPrecioYPersonas();
        });
    }

    // ---- Validación de fecha en tiempo real ----
    if (inputFecha) {
        inputFecha.addEventListener("change", () => {
            if (inputFecha.value && inputFecha.value < hoy) {
                alert("La fecha seleccionada ya pasó. Por favor elige una fecha actual o futura.");
                inputFecha.value = "";
            }
        });
    }

    // ---- Validación de hora en tiempo real ----
    if (inputHora) {
        inputHora.addEventListener("change", () => {
            if (inputHora.value && (inputHora.value < HORA_APERTURA || inputHora.value > HORA_CIERRE)) {
                alert("Nuestro horario de atención es de 10:00 am a 9:00 pm. Por favor elige una hora dentro de ese rango.");
                inputHora.value = "";
            }
        });
    }

    // ---- Preselección de servicio desde la URL (?servicio=...) ----
    function obtenerParametroURL(nombre) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(nombre);
    }

    function preseleccionarServicio() {
        const servicioSeleccionado = obtenerParametroURL("servicio");

        if (servicioSeleccionado && selectServicio) {
            const opcionExiste = Array.from(selectServicio.options)
                .some(o => o.value === servicioSeleccionado);

            if (opcionExiste) {
                selectServicio.value = servicioSeleccionado;
                actualizarDuraciones();
            }
        }
    }

    // ---- Envío del formulario ----
    formCita.addEventListener("submit", function (e) {
        const formData = new FormData(this);
        const datos = Object.fromEntries(formData);

        if (!datos.nombre || !datos.apellido || !datos.fecha || !datos.hora || !datos.servicio || !datos.duracion) {
            e.preventDefault();
            alert("Por favor, completa todos los campos.");
            return;
        }

        if (datos.fecha < hoy) {
            e.preventDefault();
            alert("La fecha seleccionada ya pasó. Elige una fecha actual o futura.");
            return;
        }

        if (datos.hora < HORA_APERTURA || datos.hora > HORA_CIERRE) {
            e.preventDefault();
            alert("Nuestro horario de atención es de 10:00 am a 9:00 pm. Por favor elige una hora dentro de ese rango.");
            return;
        }

        // Si todas las validaciones pasan, el formulario continúa su envío normal (POST al servidor)
    });

    // Inicialización
    preseleccionarServicio();
    actualizarUIPrecioYPersonas();
});

// ==========================================
// ATAJO ALT + R PARA ABRIR ADMIN
// ==========================================
document.addEventListener("keydown", function (e) {
    if (e.altKey && e.key.toLowerCase() === "r") {
        e.preventDefault();
        window.location.href = "/Administrador/Login";
    }
});