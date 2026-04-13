import { DataSource } from "typeorm";
import * as bcrypt from "bcrypt";
import * as dotenv from "dotenv";

dotenv.config();

const dataSource = new DataSource({
    type: "postgres",
    url: process.env.DATABASE_URL,
    entities: [__dirname + "/../entities/*.entity{.ts,.js}"],
    synchronize: false,
    logging: true,
});

interface SeedUser {
    username: string;
    email: string;
    password: string;
    displayName: string;
    bio: string;
}

const testUsers: SeedUser[] = [
    {
        username: "alice",
        email: "alice@test.com",
        password: "Test123!",
        displayName: "Alice Wonder",
        bio: "Love playing pong and making friends!",
    },
    {
        username: "bob",
        email: "bob@test.com",
        password: "Test123!",
        displayName: "Bob Builder",
        bio: "Can we fix it? Yes we can!",
    },
    {
        username: "charlie",
        email: "charlie@test.com",
        password: "Test123!",
        displayName: "Charlie Brown",
        bio: "Good grief!",
    },
    {
        username: "diana",
        email: "diana@test.com",
        password: "Test123!",
        displayName: "Diana Prince",
        bio: "Truth and justice.",
    },
    {
        username: "eve",
        email: "eve@test.com",
        password: "Test123!",
        displayName: "Eve Online",
        bio: "Always watching the network.",
    },
];

async function seed() {
    console.log("🌱 Starting database seed...\n");

    await dataSource.initialize();
    console.log("✅ Database connected\n");

    const userRepo = dataSource.getRepository("users");

    for (const userData of testUsers) {
        // Check if user already exists
        const existing = await userRepo.findOne({
            where: [{ email: userData.email }, { username: userData.username }],
        });

        if (existing) {
            console.log(`⏭️  User ${userData.username} already exists, skipping...`);
            continue;
        }

        const passwordHash = await bcrypt.hash(userData.password, 12);

        await dataSource.query(
            `INSERT INTO users (username, email, password_hash, displayName, bio, is_online, two_factor_enabled)
             VALUES ($1, $2, $3, $4, $5, false, false)`,
            [userData.username, userData.email, passwordHash, userData.displayName, userData.bio]
        );

        console.log(`✅ Created user: ${userData.username}`);
    }

    console.log("\n Seed completed!\n");
    console.log("Test accounts created:");
    console.log("─".repeat(50));
    console.log("| Email              | Username  | Password  |");
    console.log("─".repeat(50));
    for (const u of testUsers) {
        console.log(`| ${u.email.padEnd(18)} | ${u.username.padEnd(9)} | ${u.password.padEnd(9)} |`);
    }
    console.log("─".repeat(50));

    await dataSource.destroy();
}

seed().catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
});