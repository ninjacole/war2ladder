using Microsoft.EntityFrameworkCore;
using War2Ladder.Areas.Database.Models;

namespace War2Ladder.Areas.Database.Context
{
    public class LadderDbContext : DbContext
    {
        public LadderDbContext(DbContextOptions<LadderDbContext> options) : base(options) { }

        public DbSet<User> Users { get; set; }
    }
}
