import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create default allergies
  const allergies = [
    { name: "Gluten", description: "Cereales con gluten (trigo, cebada, centeno, avena)" },
    { name: "Crustáceos", description: "Crustáceos y productos a base de crustáceos" },
    { name: "Huevos", description: "Huevos y productos a base de huevos" },
    { name: "Pescado", description: "Pescado y productos a base de pescado" },
    { name: "Cacahuetes", description: "Cacahuetes y productos a base de cacahuetes" },
    { name: "Soja", description: "Soja y productos a base de soja" },
    { name: "Lácteos", description: "Leche y sus derivados (incluida la lactosa)" },
    { name: "Frutos secos", description: "Almendras, avellanas, nueces, anacardos, etc." },
    { name: "Apio", description: "Apio y productos derivados" },
    { name: "Mostaza", description: "Mostaza y productos derivados" },
    { name: "Sésamo", description: "Granos de sésamo y productos a base de sésamo" },
    { name: "Sulfitos", description: "Dióxido de azufre y sulfitos" },
    { name: "Altramuces", description: "Altramuces y productos a base de altramuces" },
    { name: "Moluscos", description: "Moluscos y productos a base de moluscos" },
  ];

  for (const allergy of allergies) {
    await prisma.allergy.upsert({
      where: { name: allergy.name },
      update: {},
      create: allergy,
    });
  }

  console.log("Created allergies");

  // Create admin user if not exists
  const adminEmail = "admin@smarttabula.com";
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash("admin123", 12);
    await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        name: "Administrador",
        role: "ADMIN",
        department: "Administración",
      },
    });
    console.log("Created admin user: admin@smarttabula.com / admin123");
  }

  // Create sample dishes
  const dishes = [
    { name: "Ensalada César", category: "STARTER", price: 8.5, description: "Lechuga romana, pollo, parmesano, croutons y salsa césar" },
    { name: "Gazpacho andaluz", category: "STARTER", price: 6.0, description: "Sopa fría de tomate, pepino, pimiento y ajo" },
    { name: "Croquetas de jamón", category: "STARTER", price: 7.5, description: "Croquetas caseras de jamón ibérico" },
    { name: "Pollo al horno con patatas", category: "MAIN", price: 12.0, description: "Pollo de corral asado con patatas panadera" },
    { name: "Salmón a la plancha", category: "MAIN", price: 14.0, description: "Salmón noruego con verduras salteadas" },
    { name: "Pasta carbonara", category: "MAIN", price: 10.5, description: "Espaguetis con bacon, huevo, parmesano y pimienta" },
    { name: "Lentejas estofadas", category: "MAIN", price: 9.0, description: "Lentejas con chorizo, morcilla y verduras" },
    { name: "Hamburguesa gourmet", category: "MAIN", price: 13.0, description: "Carne de vacuno, queso cheddar, bacon y salsa especial" },
    { name: "Arroz con verduras", category: "SIDE", price: 5.0, description: "Arroz salteado con verduras de temporada" },
    { name: "Patatas fritas", category: "SIDE", price: 4.0, description: "Patatas fritas crujientes" },
    { name: "Ensalada mixta", category: "SIDE", price: 4.5, description: "Lechuga, tomate, cebolla y zanahoria" },
    { name: "Tarta de chocolate", category: "DESSERT", price: 5.5, description: "Tarta de chocolate belga con nata" },
    { name: "Fruta de temporada", category: "DESSERT", price: 3.5, description: "Selección de frutas frescas" },
    { name: "Yogur natural", category: "DESSERT", price: 2.5, description: "Yogur natural con miel opcional" },
    { name: "Agua mineral", category: "DRINK", price: 1.5, description: "Agua mineral natural 50cl" },
    { name: "Refresco", category: "DRINK", price: 2.0, description: "Coca-Cola, Fanta o Aquarius" },
    { name: "Café", category: "DRINK", price: 1.5, description: "Café solo, cortado o con leche" },
  ];

  for (const dish of dishes) {
    const existingDish = await prisma.dish.findFirst({
      where: { name: dish.name },
    });

    if (!existingDish) {
      await prisma.dish.create({
        data: dish,
      });
    }
  }

  console.log("Created sample dishes");

  // Create system config
  await prisma.systemConfig.upsert({
    where: { key: "company_name" },
    update: {},
    create: { key: "company_name", value: "Mi Empresa" },
  });

  await prisma.systemConfig.upsert({
    where: { key: "order_deadline" },
    update: {},
    create: { key: "order_deadline", value: "10:00" },
  });

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
