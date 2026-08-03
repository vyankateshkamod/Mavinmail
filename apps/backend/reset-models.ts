
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// VERIFIED valid models from OpenRouter API (2026-01-31)
// Using a FAST model as default for responsiveness
const VALID_MODELS = [
    {
        modelId: 'google/gemma-3n-e2b-it:free',
        displayName: 'Gemma 3N E2B (Free) - Fast',
        description: 'Google\'s efficient instruction-tuned model - fast responses',
        isDefault: true,  // FAST model as default
        isActive: true,
    },
    {
        modelId: 'moonshotai/kimi-k2:free',
        displayName: 'Kimi K2 (Free) - Fast',
        description: 'Fast model optimized for agentic capabilities',
        isDefault: false,
        isActive: true,
    },
    {
        modelId: 'nvidia/nemotron-3-nano-30b-a3b:free',
        displayName: 'Nemotron Nano 30B (Free)',
        description: 'NVIDIA MoE model for agentic AI tasks',
        isDefault: false,
        isActive: true,
    },
    {
        modelId: 'qwen/qwen3-coder:free',
        displayName: 'Qwen3 Coder (Free)',
        description: 'Optimized for coding and reasoning tasks',
        isDefault: false,
        isActive: true,
    },
    {
        modelId: 'deepseek/deepseek-r1-0528:free',
        displayName: 'DeepSeek R1 (Free) - Slow Reasoning',
        description: 'High-performance reasoning model - SLOW but very capable',
        isDefault: false,
        isActive: true,
    },
];

async function resetModels() {
    console.log('🧹 Clearing AI models...');

    // 1. Delete ALL existing models
    const deleteResult = await prisma.aIModel.deleteMany({});
    console.log(`   Deleted ${deleteResult.count} old models`);

    // 2. Create fresh models
    console.log('📦 Creating AI models (fast model as default)...');
    for (const model of VALID_MODELS) {
        await prisma.aIModel.create({ data: model });
        console.log(`   ✅ ${model.displayName} (default: ${model.isDefault})`);
    }

    // 3. Verify the default
    const defaultModel = await prisma.aIModel.findFirst({
        where: { isDefault: true }
    });
    console.log(`\n🎯 Default: ${defaultModel?.modelId}`);

    // 4. Reset user preferences
    const userResult = await prisma.user.updateMany({
        data: { preferredModel: null }
    });
    console.log(`👤 Reset ${userResult.count} user preferences`);

    console.log('\n✨ Done!');
}

resetModels()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
