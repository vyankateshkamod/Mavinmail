
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixUserPreferences() {
    console.log('🔧 Starting user preference fix...');

    const brokenModel = 'google/gemini-2.0-flash-exp:free';
    const validModel = 'meta-llama/llama-3.3-70b-instruct:free';

    // 1. Find users with the broken model
    const users = await prisma.user.findMany({
        where: { preferredModel: brokenModel }
    });

    console.log(`Found ${users.length} users with broken model: ${brokenModel}`);

    // 2. Update them to the valid default
    if (users.length > 0) {
        const result = await prisma.user.updateMany({
            where: { preferredModel: brokenModel },
            data: { preferredModel: validModel } // Set to valid model directly first
        });
        console.log(`✅ Updated ${result.count} users to use: ${validModel}`);
    } else {
        console.log('No users needed fixing.');
    }

    // 3. Force update user ID 1 directly just in case
    try {
        await prisma.user.update({
            where: { id: 1 },
            data: { preferredModel: null } // Set to null to use system default
        });
        console.log('✅ Force-reset User ID 1 to use system default (null)');
    } catch (e) {
        console.log('Could not find User ID 1, skipping force reset.');
    }

    console.log('✨ Fix complete!');
}

fixUserPreferences()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
