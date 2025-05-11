import { PrismaClient, Role } from '@prisma/client';
import * as argon2 from 'argon2';  // Import argon2 instead of bcrypt
import * as readline from 'readline';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Secret key that only you know - store this securely in .env file
const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY;

if (!ADMIN_SECRET_KEY) {
    console.error('Error: ADMIN_SECRET_KEY not set in environment variables');
    process.exit(1);
}

function question(query: string): Promise<string> {
    return new Promise((resolve) => {
        rl.question(query, resolve);
    });
}

async function createAdminUser() {
    try {
        console.log('\n=== ADMIN USER CREATION TOOL ===');
        console.log('This tool creates an admin user with full system privileges.');
        console.log('Only authorized personnel should use this tool.\n');

        // Verify admin secret key
        const providedKey = await question('Enter admin secret key: ');

        if (providedKey !== ADMIN_SECRET_KEY) {
            console.error('ERROR: Invalid admin secret key. Access denied.');
            process.exit(1);
        }

        // Get admin user details
        const email = await question('Enter admin email: ');
        const password = await question('Enter admin password (min 8 characters): ');
        const firstName = await question('Enter admin first name: ');
        const lastName = await question('Enter admin last name: ');

        // Validate input
        if (password.length < 8) {
            console.error('Error: Password must be at least 8 characters');
            process.exit(1);
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            // Update existing user to admin
            console.log(`User ${email} already exists. Updating to admin role...`);

            const hashedPassword = await argon2.hash(password);  // Hash password using argon2

            const updatedUser = await prisma.user.update({
                where: { email },
                data: {
                    password: hashedPassword,
                    firstName,
                    lastName,
                    role: Role.ADMIN,
                    isVerified: true,
                    status: 'ACTIVE'
                }
            });

            console.log(`\nSUCCESS: User ${email} updated with ADMIN role.`);
            return;
        }

        // Create new admin user
        const hashedPassword = await argon2.hash(password);  // Hash password using argon2

        const newAdmin = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                firstName,
                lastName,
                role: Role.ADMIN,
                isVerified: true,
                status: 'ACTIVE'
            }
        });

        console.log(`\nSUCCESS: Admin user created successfully!`);
        console.log(`Email: ${newAdmin.email}`);
        console.log(`Role: ${newAdmin.role}`);
        console.log(`ID: ${newAdmin.id}`);

    } catch (error) {
        console.error('Error creating admin user:', error);
    } finally {
        rl.close();
        await prisma.$disconnect();
    }
}

createAdminUser();


// npx ts - node scripts / create - admin.ts

