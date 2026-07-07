using Microsoft.AspNetCore.Mvc;
using Spa.Data;
using Spa.Models;
using System.Diagnostics;

namespace Spa.Controllers
{
    public class HomeController : Controller
    {
        private readonly SpaDbContext _context;

        public HomeController(SpaDbContext context)
        {
            _context = context;
        }
        // Redirige a Views/Home/index.cshtml
        public IActionResult Index()
        {
            return View();
        }

        // Redirige a Views/Home/bienvenida.cshtml
        public IActionResult Bienvenida()
        {
            return View("bienvenida"); // Al llamarse igual que el método, busca automáticamente 'bienvenida.cshtml' en Views/Home
        }

        // Redirige a Views/Home/nosotros.cshtml
        public IActionResult Nosotros()
        {
            return View();
        }

        // Redirige a Views/Home/promocinoes.cshtml (Usa el nombre exacto que tiene tu archivo físico)
        public IActionResult Promociones()
        {
            return View("promociones");
        }

        // Redirige a Views/Home/servicios.cshtml
        public IActionResult Servicios()
        {
            return View();
        }

        public IActionResult Privacy()
        {
            return View();
        }

       /* [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }
       */
        
    }
}