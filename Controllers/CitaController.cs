using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Spa.Data;
using Spa.Interfaces;
using Spa.Models;
using Spa.Services;
using System;
using System.Collections.Generic;
using System.Linq;

namespace Spa.Controllers
{
    public class CitaController : Controller
    {
        private readonly ICitaService _citaService;
        private readonly SpaDbContext _context;

        public CitaController(ICitaService citaService, SpaDbContext context)
        {
            _citaService = citaService;
            _context = context;
        }

        [HttpGet]
        public IActionResult Index()
        {
            return RedirectToAction("Crear");
        }

        [HttpGet]
        public IActionResult Crear()
        {
            ViewBag.Promociones = _context.Promociones
                .Where(p => p.Activa)
                .ToList();

            return View("~/Views/Home/cita.cshtml");
        }

        // Mapeo entre el "value" del <select id="servicio"> (cita.cshtml)
        // y el nombre real del servicio guardado en la tabla Servicios.
        private static readonly Dictionary<string, string> MapaServicios = new()
        {
            { "masaje-relajante", "Masaje Relajante" },
            { "masaje-piedras-calientes", "Masaje de Piedras Calientes" },
            { "masaje-descontracturante", "Masaje Descontracturante" },
            { "facial-express", "Facial Express" },
            { "facial-profundo", "Facial Profundo" },
            { "facial-rejuvenecedor", "Facial Rejuvenecedor" },
            { "camara-vapor", "Camara a Vapor" },
            { "camara-seca", "Camara Seca" },
            { "tina-hidromasaje", "Tina de Hidromasajes" }
        };

        // Las promociones no tienen fila propia en Servicios; se asocian a un
        // servicio base existente solo para mantener la integridad referencial,
        // pero el precio final se calcula con el monto de la promoción.
        private static readonly Dictionary<string, (string SlugBase, decimal Precio)> Promociones = new()
        {
            { "promo-mes",          ("masaje-relajante", 160.00m) },
            { "promo-cumple",       ("masaje-relajante", 260.00m) },
            { "promo-ritual-relax", ("masaje-relajante", 320.00m) }
        };

        // Para servicios "Individual" / "Para dos personas" (faciales), la duración
        // que llega del formulario no coincide con la columna Duracion de Servicios
        // (que usa "30 min" / "60 min" o similar). En esos casos buscamos solo por nombre.
        private Servicio? BuscarServicioEnBd(string slugServicio, string duracion)
        {
            if (!MapaServicios.TryGetValue(slugServicio, out var nombreReal))
                return null;

            var candidatos = _context.Servicios
                .Where(s => s.Nombre == nombreReal)
                .ToList();

            if (candidatos.Count == 0)
                return null;

            // Intentar coincidencia exacta por duración (ej: "30 min")
            var exacto = candidatos.FirstOrDefault(s => s.Duracion == duracion);
            if (exacto != null)
                return exacto;

            // Si no hay coincidencia exacta (ej: "Individual"/"Para dos personas"
            // en faciales), tomar el primero como base.
            return candidatos.First();
        }

        // SRP: Requerimiento01: Solo recibe los datos de la web, elige la estrategia y delega el agendamiento.
        [HttpPost]
        [ValidateAntiForgeryToken]
        public IActionResult Crear(
            string dni,
            string nombre,
            string apellido,
            string? tipoCliente,
            string servicio,
            string duracion,
            string fecha,
            string hora,
            int cantidadPersonas = 1)
        {
            if (string.IsNullOrWhiteSpace(dni) ||
                dni.Length != 8 ||
                !dni.All(char.IsDigit))
            {
                ModelState.AddModelError(
                    "dni",
                    "El DNI debe contener exactamente 8 números."
                );

                return View("~/Views/Home/cita.cshtml");
            }
            if (string.IsNullOrWhiteSpace(servicio))
            {
                ModelState.AddModelError("servicio", "Debe seleccionar un servicio.");
                return View("~/Views/Home/cita.cshtml");
            }

            // Combinar la fecha y la hora del formulario
            if (!DateTime.TryParse($"{fecha} {hora}", out var fechaHora))
            {
                ModelState.AddModelError(
                    "fecha",
                    "Debe seleccionar una fecha válida."
                );

                ModelState.AddModelError(
                    "hora",
                    "Debe seleccionar una hora válida."
                );

                return View("~/Views/Home/cita.cshtml");
            }

            // No permitir citas en fechas u horas pasadas
            if (fechaHora < DateTime.Now)
            {
                ModelState.AddModelError(
                    "fecha",
                    "La fecha y la hora de la cita no pueden estar en el pasado."
                );

                return View("~/Views/Home/cita.cshtml");
            }

            // Horario de atención del spa
            var horaApertura = new TimeSpan(10, 0, 0);
            var horaCierre = new TimeSpan(21, 0, 0);

            if (fechaHora.TimeOfDay < horaApertura ||
                fechaHora.TimeOfDay > horaCierre)
            {
                ModelState.AddModelError(
                    "hora",
                    "El horario de atención es de 10:00 a. m. a 9:00 p. m."
                );

                return View("~/Views/Home/cita.cshtml");
            }

            Servicio? servicioSeleccionado;
            decimal? precioPromocion = null;

            if (servicio.StartsWith("promo-db-"))
            {
                var idTexto = servicio.Replace("promo-db-", "");

                if (int.TryParse(idTexto, out int promoId))
                {
                    var promocion = _context.Promociones
                        .FirstOrDefault(p => p.Id == promoId && p.Activa);

                    if (promocion != null)
                    {
                        servicioSeleccionado = _context.Servicios
                            .FirstOrDefault(s => s.Nombre == promocion.Nombre);

                        if (servicioSeleccionado == null)
                        {
                            servicioSeleccionado = new Servicio
                            {
                                Nombre = promocion.Nombre,
                                PrecioBase = promocion.Precio,
                                Duracion = "90 min"
                            };

                            _context.Servicios.Add(servicioSeleccionado);
                            _context.SaveChanges();
                        }

                        precioPromocion = promocion.Precio;
                    }
                    else
                    {
                        ModelState.AddModelError("servicio", "La promoción seleccionada no está disponible.");
                        return View("~/Views/Home/cita.cshtml");
                    }
                }
                else
                {
                    ModelState.AddModelError("servicio", "Promoción inválida.");
                    return View("~/Views/Home/cita.cshtml");
                }
            }


            else if (Promociones.TryGetValue(servicio, out var promo))
            {
                servicioSeleccionado = BuscarServicioEnBd(promo.SlugBase, "60 min");
                precioPromocion = promo.Precio;
            }
            else
            {
                servicioSeleccionado = BuscarServicioEnBd(servicio, duracion);
            }

            if (servicioSeleccionado == null)
            {
                ModelState.AddModelError("servicio", "El servicio seleccionado no está disponible.");
                return View("~/Views/Home/cita.cshtml");
            }

            // Comprobar que el mismo servicio no esté reservado
            // en la fecha y hora seleccionadas
            bool existeCitaDuplicada = _context.Citas.Any(c =>
                c.FechaHora == fechaHora &&
                c.ServicioId == servicioSeleccionado.Id &&
                c.Confirmada
            );

            if (existeCitaDuplicada)
            {
                ModelState.AddModelError(
                    "hora",
                    "Ya existe una cita para este servicio en la fecha y hora seleccionadas. Elige otro horario."
                );

                return View("~/Views/Home/cita.cshtml");
            }

            // Si es una promoción, se usa el precio fijo de la promo como PrecioBase
            // (clon para no alterar el registro original de la BD).
            if (precioPromocion.HasValue)
            {
                servicioSeleccionado = new Servicio
                {
                    Id = servicioSeleccionado.Id,
                    Nombre = servicioSeleccionado.Nombre,
                    Duracion = servicioSeleccionado.Duracion,
                    PrecioBase = precioPromocion.Value
                };
            }

            // Si hay sesión de cliente activa, usar sus datos reales (con tipo VIP)
            // En caso contrario, usar los datos ingresados en el formulario como invitado
            var clienteIdSesion = HttpContext.Session.GetInt32("ClienteId");
            Cliente cliente;

            if (clienteIdSesion.HasValue)
            {
                var clienteSesion = _context.Clientes.Find(clienteIdSesion.Value);
                if (clienteSesion != null)
                {
                    // Cliente registrado: actualizar datos si cambió algo
                    cliente = clienteSesion;
                }
                else
                {
                    cliente = new Cliente
                    {
                        Dni = dni,
                        Nombre = nombre,
                        Apellido = apellido,
                        TipoCliente = "Regular"
                    };
                }
            }
            else
            {
                // Invitado: crear o recuperar por DNI
                cliente = new Cliente
                {
                    Dni = dni,
                    Nombre = nombre,
                    Apellido = apellido,
                    TipoCliente = string.IsNullOrWhiteSpace(tipoCliente) ? "Regular" : tipoCliente
                };
            }

            // OCP: Permite cambiar o asignar la estrategia de descuento (VIP o Sin Descuento) usando polimorfismo sin alterar el flujo principal
            ICalculadorDescuento estrategia = cliente.TipoCliente == "VIP"
                ? new DescuentoVIP()
                : new SinDescuento();

            // RF1, RF2 y RF3 ejecutados aquí de forma limpia
            _citaService.AgendarCita(
            cliente,
            servicioSeleccionado,
            fechaHora,
            cantidadPersonas,
            estrategia
        );

        TempData["MensajeExito"] = "¡Cita registrada con éxito!";

        return RedirectToAction("Crear", "Cita");
        }
    }
}
