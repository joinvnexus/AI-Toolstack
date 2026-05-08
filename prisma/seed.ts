import { config } from 'dotenv';
config({ path: '.env.local' });

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const rawConnectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!rawConnectionString) {
  throw new Error('Missing DATABASE_URL or DIRECT_URL environment variable');
}

// Add uselibpqcompat for Supabase TLS compatibility (mirrors src/lib/prisma/index.ts)
const connectionUrl = new URL(rawConnectionString);
if (!connectionUrl.searchParams.has('uselibpqcompat')) {
  connectionUrl.searchParams.set('uselibpqcompat', 'true');
}
const connectionString = connectionUrl.toString();

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter, log: ['error'] });

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@toolstack.ai' },
    update: {},
    create: {
      email: 'admin@toolstack.ai',
      name: 'Admin User',
      role: 'ADMIN',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    },
  });

  // Create regular user
  const user = await prisma.user.upsert({
    where: { email: 'john@example.com' },
    update: {},
    create: {
      email: 'john@example.com',
      name: 'John Doe',
      role: 'USER',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john',
    },
  });

  console.log('✅ Users created:', { admin: admin.email, user: user.email });

  // Create categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'text-generators' },
      update: {},
      create: {
        name: 'Text Generators',
        slug: 'text-generators',
        description: 'AI tools for generating and writing text content',
        icon: '✍️',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'image-generators' },
      update: {},
      create: {
        name: 'Image Generators',
        slug: 'image-generators',
        description: 'Create stunning images with AI',
        icon: '🎨',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'code-assistants' },
      update: {},
      create: {
        name: 'Code Assistants',
        slug: 'code-assistants',
        description: 'AI-powered coding helpers and autocomplete tools',
        icon: '💻',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'video-editors' },
      update: {},
      create: {
        name: 'Video Editors',
        slug: 'video-editors',
        description: 'AI-enhanced video editing and creation tools',
        icon: '🎬',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'voice-synthesis' },
      update: {},
      create: {
        name: 'Voice Synthesis',
        slug: 'voice-synthesis',
        description: 'Text-to-speech and voice cloning tools',
        icon: '🎤',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'marketing-tools' },
      update: {},
      create: {
        name: 'Marketing Tools',
        slug: 'marketing-tools',
        description: 'AI tools for marketing automation and content',
        icon: '📈',
      },
    }),
  ]);

  console.log('✅ Categories created:', categories.map(c => c.name));

  // Create tools
  const chatgpt = await prisma.tool.upsert({
    where: { slug: 'chatgpt' },
    update: {},
    create: {
      name: 'ChatGPT',
      slug: 'chatgpt',
      description: 'Advanced AI chatbot for natural conversations and task assistance',
      longDescription: 'ChatGPT is a large language model developed by OpenAI that can engage in natural conversations, answer questions, write content, and assist with various tasks. It uses advanced deep learning techniques to understand and generate human-like text.',
      overview: 'The most advanced conversational AI assistant for brainstorming, writing, coding, and analysis.',
      features: ['Natural language understanding', 'Multi-language support', 'Code generation', 'Knowledge cutoff: 2024', 'Custom GPTs'],
      pros: ['Highly intelligent', 'Versatile use cases', 'Good at coding', 'Large knowledge base'],
      cons: ['Can be verbose', 'No real-time data', 'Premium features require subscription'],
      pricingModel: 'FREEMIUM',
      priceRange: 'Free - $20/month',
      websiteUrl: 'https://chat.openai.com',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/ChatGPT_logo.svg/1024px-ChatGPT_logo.svg.png',
      categoryId: categories[0].id,
      pricingDetails: 'Free tier with GPT-3.5, ChatGPT Plus ($20/month) for GPT-4, GPT-4o, and advanced features.',
    },
  });

  const midjourney = await prisma.tool.upsert({
    where: { slug: 'midjourney' },
    update: {},
    create: {
      name: 'Midjourney',
      slug: 'midjourney',
      description: 'Generate stunning artwork and images from text descriptions',
      longDescription: 'Midjourney is an AI image generation tool that creates high-quality, artistic images from text prompts. It is known for its distinctive artistic style and ability to generate visually stunning, creative imagery.',
      overview: 'Create beautiful, artistic AI-generated images with a unique aesthetic.',
      features: ['Text-to-image generation', 'Artistic style control', 'Image upscaling', 'Variations', 'Aspect ratio control'],
      pros: ['High-quality outputs', 'Unique artistic style', 'Active community', 'Regular updates'],
      cons: ['Discord-based interface', 'Limited free credits', 'No API yet'],
      pricingModel: 'PAID',
      priceRange: '$10 - $60/month',
      websiteUrl: 'https://midjourney.com',
      logoUrl: 'https://cdn.statuspage.com/favicons/favicon_midjourney.svg',
      categoryId: categories[1].id,
      pricingDetails: 'Basic: $10/mo (200 GPU mins), Standard: $30/mo (15 GPU hrs), Pro: $60/mo (30 GPU hrs)',
    },
  });

  const githubCopilot = await prisma.tool.upsert({
    where: { slug: 'github-copilot' },
    update: {},
    create: {
      name: 'GitHub Copilot',
      slug: 'github-copilot',
      description: 'AI pair programmer that suggests code completions in your IDE',
      longDescription: 'GitHub Copilot is an AI coding assistant that helps you write code faster by suggesting whole lines or blocks of code as you type. Powered by OpenAI Codex, it understands context in dozens of programming languages.',
      overview: 'Your AI pair programmer that autocompletes code in your editor.',
      features: ['Real-time code suggestions', 'Multi-language support', 'IDE integration', 'Chat interface', 'CLI tool'],
      pros: ['Saves coding time', 'Supports many languages', 'Integrated in popular IDEs', 'Learning from your code'],
      cons: ['Subscription cost', 'Can suggest outdated code', 'Occasional incorrect suggestions'],
      pricingModel: 'PAID',
      priceRange: '$10 - $19/month',
      websiteUrl: 'https://github.com/features/copilot',
      logoUrl: 'https://github.githubassets.com/images/modules/site/copilot/copilot-logo.svg',
      categoryId: categories[2].id,
      pricingDetails: 'Copilot: $10/mo, Copilot Business: $19/user/mo, Copilot Enterprise: $39/user/mo',
    },
  });

  const runway = await prisma.tool.upsert({
    where: { slug: 'runway' },
    update: {},
    create: {
      name: 'Runway',
      slug: 'runway',
      description: 'AI-powered video editing and generation platform',
      longDescription: 'Runway is an AI video generation and editing platform that enables creators to produce professional videos using text-to-video, image-to-video, and advanced editing tools powered by artificial intelligence.',
      overview: 'Create and edit professional videos with AI-powered tools.',
      features: ['Text-to-video', 'Image-to-video', 'Green screen removal', 'Motion tracking', 'Style transfer'],
      pros: ['Innovative AI features', 'Professional results', 'Cloud-based', 'Collaboration tools'],
      cons: ['Learning curve', 'Watermarked free tier', 'Credit-based system'],
      pricingModel: 'FREEMIUM',
      priceRange: 'Free - $75/month',
      websiteUrl: 'https://runwayml.com',
      logoUrl: 'https://runwayml.com/favicon.ico',
      categoryId: categories[3].id,
      pricingDetails: 'Free: 125 credits, Standard: $12/user/mo, Pro: $28/user/mo, Unlimited: $75/user/mo',
    },
  });

  const elevenLabs = await prisma.tool.upsert({
    where: { slug: 'elevenlabs' },
    update: {},
    create: {
      name: 'ElevenLabs',
      slug: 'elevenlabs',
      description: 'Industry-leading AI voice synthesis and cloning platform',
      longDescription: 'ElevenLabs provides realistic AI voice synthesis, voice cloning, and text-to-speech capabilities. It is widely used for creating voiceovers, audiobooks, and personalized voice assistants.',
      overview: 'Generate ultra-realistic voices and clone your own with AI.',
      features: ['Voice cloning', 'Text-to-speech', 'Voice library', 'Dubbing studio', 'API access'],
      pros: ['Exceptional voice quality', 'Easy voice cloning', 'Multiple languages', 'Emotion control'],
      cons: ['Expensive for high usage', 'Ethical concerns with cloning'],
      pricingModel: 'FREEMIUM',
      priceRange: 'Free - $330/month',
      websiteUrl: 'https://elevenlabs.io',
      logoUrl: 'https://elevenlabs.io/favicon-32x32.png',
      categoryId: categories[4].id,
      pricingDetails: 'Free: 10k chars/mo, Starter: $5/mo, Creator: $22/mo, Pro: $99/mo, Scale: $330/mo',
    },
  });

  const copyAI = await prisma.tool.upsert({
    where: { slug: 'copyai' },
    update: {},
    create: {
      name: 'Copy.ai',
      slug: 'copyai',
      description: 'AI copywriting tool for marketing content and blogs',
      longDescription: 'Copy.ai is an AI-powered copywriting tool that helps marketers, entrepreneurs, and businesses create high-quality marketing copy, blog posts, social media content, and more in seconds.',
      overview: 'Generate marketing copy, blog posts, and social media content with AI.',
      features: ['80+ templates', 'Tone adjustment', 'Multiple languages', 'Team collaboration', 'API access'],
      pros: ['Easy to use', 'Good for ideation', 'Affordable', 'Quick content generation'],
      cons: ['Requires editing', 'Sometimes generic', 'Limited long-form quality'],
      pricingModel: 'FREEMIUM',
      priceRange: 'Free - $36/month',
      websiteUrl: 'https://copy.ai',
      logoUrl: 'https://copy.ai/favicon.ico',
      categoryId: categories[5].id,
      pricingDetails: 'Free: 2,000 words/mo, Pro: $36/mo, Team: $186/mo, Enterprise: Custom',
    },
  });

  const tools = [chatgpt, midjourney, githubCopilot, runway, elevenLabs, copyAI];
  console.log('✅ Tools created:', tools.map(t => t.name));

  // Create reviews
  await prisma.review.upsert({
    where: { userId_toolId: { userId: user.id, toolId: chatgpt.id } },
    update: {},
    create: {
      userId: user.id,
      toolId: chatgpt.id,
      rating: 5,
      content: 'ChatGPT is incredibly versatile. I use it daily for brainstorming ideas, drafting emails, and even debugging code. The GPT-4 version is especially powerful for complex reasoning tasks. Highly recommended!',
    },
  });

  await prisma.review.upsert({
    where: { userId_toolId: { userId: user.id, toolId: midjourney.id } },
    update: {},
    create: {
      userId: user.id,
      toolId: midjourney.id,
      rating: 5,
      content: 'Midjourney produces stunning artwork. The level of detail and creativity is unmatched. I use it for concept art, marketing visuals, and even UI design inspiration. Worth every penny!',
    },
  });

  await prisma.review.upsert({
    where: { userId_toolId: { userId: user.id, toolId: githubCopilot.id } },
    update: {},
    create: {
      userId: user.id,
      toolId: githubCopilot.id,
      rating: 4,
      content: 'GitHub Copilot has significantly improved my coding speed. It understands context well and suggests accurate completions. Sometimes it suggests outdated APIs, so I always review the suggestions carefully.',
    },
  });

  await prisma.review.upsert({
    where: { userId_toolId: { userId: user.id, toolId: runway.id } },
    update: {},
    create: {
      userId: user.id,
      toolId: runway.id,
      rating: 4,
      content: 'Runway is revolutionary for video editing. The green screen removal and motion tracking are production-quality. The credit system can be limiting for heavy users, but the results speak for themselves.',
    },
  });

  await prisma.review.upsert({
    where: { userId_toolId: { userId: user.id, toolId: elevenLabs.id } },
    update: {},
    create: {
      userId: user.id,
      toolId: elevenLabs.id,
      rating: 5,
      content: 'ElevenLabs has the best voice synthesis quality I have heard. The voice cloning is eerily accurate and the emotion control adds so much character. Perfect for creating voiceovers and audiobooks.',
    },
  });

  await prisma.review.upsert({
    where: { userId_toolId: { userId: user.id, toolId: copyAI.id } },
    update: {},
    create: {
      userId: user.id,
      toolId: copyAI.id,
      rating: 4,
      content: 'Copy.ai is great for overcoming writer s block. The variety of templates is impressive and it generates good social media copy. For long-form content, it works best as an ideation assistant rather than final copy.',
    },
  });

  console.log('✅ Reviews created');

  // Create bookmarks
  await prisma.bookmark.createMany({
    data: [
      { userId: user.id, toolId: chatgpt.id },
      { userId: user.id, toolId: midjourney.id },
      { userId: user.id, toolId: githubCopilot.id },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Bookmarks created');

  // Create blog posts
  const post1 = await prisma.blogPost.upsert({
    where: { slug: 'best-ai-tools-2025' },
    update: {},
    create: {
      title: 'Best AI Tools for Developers in 2025',
      slug: 'best-ai-tools-2025',
      excerpt: 'Discover the most powerful AI tools that every developer should have in their toolkit for 2025.',
      content: `<p>Artificial Intelligence has transformed software development. In this comprehensive guide, we explore the top AI tools that every developer should consider in 2025.</p>

<h2>1. ChatGPT - The All-Purpose Assistant</h2>
<p>ChatGPT remains the go-to AI assistant for developers. Whether you need help debugging, writing documentation, or brainstorming architecture decisions, ChatGPT excels at code understanding and explanation.</p>

<h2>2. GitHub Copilot - Your Pair Programmer</h2>
<p>Integrated directly into your IDE, GitHub Copilot speeds up development by suggesting entire lines or blocks of code as you type. It understands context, making it invaluable for repetitive coding tasks.</p>

<h2>3. Cursor - AI-First Code Editor</h2>
<p>Cursor is an IDE built around AI from the ground up. It offers deep codebase understanding and can make edits across multiple files with simple natural language commands.</p>

<h2>Conclusion</h2>
<p>The AI tools landscape continues to evolve rapidly. These tools represent the cutting edge of AI-assisted development and are worth exploring to boost your productivity.</p>`,
      readTime: 5,
      published: true,
      publishedAt: new Date(),
      authorId: admin.id,
      categories: { connect: [{ id: categories[2].id }] },
    },
  });

  const post2 = await prisma.blogPost.upsert({
    where: { slug: 'ai-image-generation-comparison' },
    update: {},
    create: {
      title: 'Midjourney vs DALL-E vs Stable Diffusion: Which AI Image Generator is Best?',
      slug: 'ai-image-generation-comparison',
      excerpt: 'A detailed comparison of the top AI image generation tools to help you choose the right one.',
      content: `<p>AI image generation has exploded in popularity. With so many options available, choosing the right tool can be challenging. Let's compare the top contenders.</p>

<h2>Midjourney: The Artist's Choice</h2>
<p>Midjourney produces beautiful, artistic images with unparalleled aesthetic quality. Its strength lies in generating coherent artistic styles and stunning compositions.</p>

<h2>DALL-E 3: The All-Rounder</h2>
<p>DALL-E 3, integrated with ChatGPT, excels at following detailed prompts accurately. It's great for generating specific, controlled images with text rendering that actually works.</p>

<h2>Stable Diffusion: The Customizable Powerhouse</h2>
<p>Stable Diffusion offers maximum control and customizability. Run locally or through various services, it supports fine-tuning, LoRAs, and ControlNet for precise image generation.</p>

<h2>Verdict</h2>
<p>Choose Midjourney for artistic vision, DALL-E for prompt accuracy, and Stable Diffusion for customization and control.</p>`,
      readTime: 7,
      published: true,
      publishedAt: new Date(),
      authorId: admin.id,
      categories: { connect: [{ id: categories[1].id }] },
    },
  });

  const post3 = await prisma.blogPost.upsert({
    where: { slug: 'voice-ai-future' },
    update: {},
    create: {
      title: 'The Future of Voice AI: From Synthesis to Emotional Intelligence',
      slug: 'voice-ai-future',
      excerpt: 'Exploring how voice synthesis technology is advancing toward emotional and contextual understanding.',
      content: `<p>Voice AI has come a long way from robotic text-to-speech systems. Today's voice synthesis tools like ElevenLabs produce near-human quality speech with emotional nuance.</p>

<h2>The Current State</h2>
<p>Modern TTS systems can clone voices with just a few seconds of audio, support multiple languages, and even convey emotions like excitement, sadness, or urgency through careful prosody modeling.</p>

<h2>What's Coming Next</h2>
<p>The next frontier is contextual understanding - AI voices that adapt their tone based on content, real-time translation with voice preservation, and interactive voice agents that can handle complex conversations.</p>

<h2>Ethical Considerations</h2>
<p>As voice cloning becomes more accessible, we need robust ethical frameworks to prevent misuse while enabling creative and accessibility applications.</p>`,
      readTime: 6,
      published: true,
      publishedAt: new Date(),
      authorId: admin.id,
      categories: { connect: [{ id: categories[4].id }] },
    },
  });

  const post4 = await prisma.blogPost.upsert({
    where: { slug: 'ai-marketing-automation' },
    update: {},
    create: {
      title: 'How AI is Revolutionizing Marketing Automation',
      slug: 'ai-marketing-automation',
      excerpt: 'Learn how AI tools are transforming marketing workflows and helping teams scale content production.',
      content: `<p>Marketing teams are increasingly turning to AI to scale content production, personalize campaigns, and analyze customer data. This transformation is reshaping how businesses connect with their audience.</p>

<h2>Content Generation at Scale</h2>
<p>Tools like Copy.ai and Jasper enable marketing teams to produce dozens of content variations in the time it once took to write one. From email campaigns to social media posts, AI assists with ideation and drafting.</p>

<h2>Personalization and Segmentation</h2>
<p>AI analyzes customer behavior to deliver personalized content and product recommendations. This level of customization was previously only possible for huge enterprises with dedicated data science teams.</p>

<h2>Predictive Analytics</h2>
<p>Modern marketing platforms use AI to predict campaign performance, optimize budgets, and identify high-value customer segments before campaigns even launch.</p>

<h2>The Human-AI Collaboration</h2>
<p>The most successful marketing teams use AI as an amplifier - generating first drafts and insights that human strategists refine and guide.</p>`,
      readTime: 8,
      published: true,
      publishedAt: new Date(),
      authorId: admin.id,
      categories: { connect: [{ id: categories[5].id }] },
    },
  });

  console.log('✅ Blog posts created');

  // Create blog comments
  await prisma.blogComment.upsert({
    where: { id: 'comment-1' },
    update: {},
    create: {
      id: 'comment-1',
      content: 'Excellent comparison! I have been using Midjourney for 6 months and completely agree with your assessment.',
      userId: user.id,
      blogPostId: post2.id,
    },
  });

  console.log('✅ Blog comments created');

  console.log('🎉 Database seeding complete!');
  console.log('\n📊 Summary:');
  console.log('  - 2 Users (1 admin, 1 regular)');
  console.log('  - 6 Categories');
  console.log('  - 6 Tools (ChatGPT, Midjourney, GitHub Copilot, Runway, ElevenLabs, Copy.ai)');
  console.log('  - 6 Reviews (1 per tool)');
  console.log('  - 4 Blog posts (across categories)');
  console.log('  - 3 Bookmarks');
  console.log('  - 1 Blog comment');
  console.log('\n💡 To view data in Prisma Studio: npm run prisma:studio');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
