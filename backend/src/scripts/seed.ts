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
    const createdUsers: { username: string; id: string }[] = [];

    for (const userData of testUsers) {
        // Check if user already exists
        const existing = await userRepo.findOne({
            where: [{ email: userData.email }, { username: userData.username }],
        });

        if (existing) {
            console.log(`⏭️  User ${userData.username} already exists, skipping...`);
            createdUsers.push({ username: userData.username, id: existing.id });
            continue;
        }

        const passwordHash = await bcrypt.hash(userData.password, 12);

        const result = await dataSource.query(
            `INSERT INTO users (username, email, password_hash, displayName, bio, is_online, two_factor_enabled)
             VALUES ($1, $2, $3, $4, $5, false, false) RETURNING id`,
            [userData.username, userData.email, passwordHash, userData.displayName, userData.bio]
        );

        console.log(`✅ Created user: ${userData.username}`);
        createdUsers.push({ username: userData.username, id: result[0].id });
    }

    // Create follow relationships and conversations
    console.log("\n👥 Creating friendships...\n");

    // Define friendship pairs: alice <-> bob, bob <-> charlie, charlie <-> diana, diana <-> eve, eve <-> alice
    const friendshipPairs = [
        { user1: "alice", user2: "bob" },
        { user1: "bob", user2: "charlie" },
        { user1: "charlie", user2: "diana" },
        { user1: "diana", user2: "eve" },
        { user1: "eve", user2: "alice" },
    ];

    for (const pair of friendshipPairs) {
        const user1 = createdUsers.find(u => u.username === pair.user1);
        const user2 = createdUsers.find(u => u.username === pair.user2);

        if (!user1 || !user2) continue;

        // Create mutual follows
        await dataSource.query(
            `INSERT INTO follows (follower_id, following_id, created_at)
             VALUES ($1, $2, NOW()) ON CONFLICT DO NOTHING`,
            [user1.id, user2.id]
        );

        await dataSource.query(
            `INSERT INTO follows (follower_id, following_id, created_at)
             VALUES ($1, $2, NOW()) ON CONFLICT DO NOTHING`,
            [user2.id, user1.id]
        );

        // Create conversation
        const convResult = await dataSource.query(
            `INSERT INTO conversations (user1_id, user2_id, is_group, created_at, updated_at)
             VALUES ($1, $2, false, NOW(), NOW()) ON CONFLICT DO NOTHING RETURNING id`,
            [user1.id, user2.id]
        );

        if (convResult.length > 0) {
            const conversationId = convResult[0].id;

            // Create an initial message from user1 to user2
            const greetings = [
                `Hey ${pair.user2}! How are you doing? 😊`,
                `Hi ${pair.user2}! Great to connect with you! 👋`,
                `Hello ${pair.user2}! Nice to meet you! ✨`,
                `What's up ${pair.user2}? Let's chat! 🎉`,
            ];

            const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];

            await dataSource.query(
                `INSERT INTO direct_messages (content, sender_id, receiver_id, conversation_id, read, created_at)
                 VALUES ($1, $2, $3, $4, false, NOW())`,
                [randomGreeting, user1.id, user2.id, conversationId]
            );

            // Update conversation with last message
            await dataSource.query(
                `UPDATE conversations SET last_message = $1, last_message_at = NOW() WHERE id = $2`,
                [randomGreeting, conversationId]
            );

            console.log(`✅ ${pair.user1} ↔ ${pair.user2} are now friends with a conversation`);
        }
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

    console.log("\n👥 Friendships created:");
    console.log("─".repeat(50));
    for (const pair of friendshipPairs) {
        console.log(`| ${pair.user1.padEnd(15)} ↔ ${pair.user2.padEnd(15)} |`);
    }
    console.log("─".repeat(50));

    await dataSource.destroy();
}

seed().catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
});
