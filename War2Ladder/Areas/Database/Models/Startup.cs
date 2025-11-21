using Microsoft.EntityFrameworkCore;
using War2Ladder.Areas.Database.Context;

namespace War2Ladder.Areas.Database.Models
{
    public class Startup
    {
        public IConfiguration Configuration { get; }

        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        public void ConfigureServices(IServiceCollection services)
        {
            // Register DbContext with SQL Server
            services.AddDbContext<LadderDbContext>(options =>
                options.UseSqlServer(Configuration.GetConnectionString("DefaultConnection")));

            // Add controllers
            services.AddControllers();

            // Enable CORS for frontend dev server
            services.AddCors(options =>
            {
                options.AddPolicy("AllowFrontend",
                    builder => builder
                        .WithOrigins("http://localhost:5174") // Frontend Vite dev server
                        .AllowAnyHeader()
                        .AllowAnyMethod());
            });
        }

        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }

            app.UseHttpsRedirection();

            app.UseRouting();

            app.UseCors("AllowFrontend");

            app.UseAuthorization();

            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllers();
            });

            // Serve React static files in production
            app.UseDefaultFiles();
            app.UseStaticFiles();
        }
    }

}
