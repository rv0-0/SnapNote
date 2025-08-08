const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('./src/models/User');
const JournalEntry = require('./src/models/JournalEntry');

const seedData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing data
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await JournalEntry.deleteMany({});

    // Create sample users
    console.log('Creating sample users...');
    
    // Let the User model pre-save hook handle password hashing
    const users = await User.create([
      {
        email: 'demo@snapnote.com',
        password: 'password123', // Plain text - will be hashed by pre-save hook
        isEmailVerified: true,
        preferences: {
          emailReminders: true,
          theme: 'light'
        },
        createdAt: new Date('2024-01-15'),
        lastLogin: new Date()
      },
      {
        email: 'john.doe@example.com',
        password: 'password123', // Plain text - will be hashed by pre-save hook
        isEmailVerified: true,
        preferences: {
          emailReminders: false,
          theme: 'dark'
        },
        createdAt: new Date('2024-02-01'),
        lastLogin: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
      }
    ]);

    console.log(`Created ${users.length} users`);

    // Create sample journal entries for the demo user
    console.log('Creating sample journal entries...');
    
    const demoUser = users[0];
    const johnUser = users[1];

    const sampleEntries = [
      // Recent entries for demo user
      {
        userId: demoUser._id,
        content: "Today was a productive day! I finally finished the project I've been working on for weeks. It feels amazing to cross that off my to-do list. The weather was perfect for a walk in the park during lunch break.",
        wordCount: 41,
        characterCount: 201,
        writingDuration: 58,
        mood: 'happy',
        tags: ['work', 'productivity', 'nature'],
        entryDate: new Date(),
        dateString: new Date().toISOString().split('T')[0],
        createdAt: new Date()
      },
      {
        userId: demoUser._id,
        content: "Feeling a bit overwhelmed with all the tasks on my plate. Need to prioritize better and maybe delegate some work. Taking deep breaths and remembering that everything will work out in the end.",
        wordCount: 35,
        characterCount: 178,
        writingDuration: 52,
        mood: 'neutral',
        tags: ['work', 'stress', 'mindfulness'],
        entryDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
        dateString: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
      },
      {
        userId: demoUser._id,
        content: "Had a wonderful coffee date with an old friend today. We talked for hours about life, dreams, and memories. It's amazing how some friendships never fade no matter how much time passes.",
        wordCount: 37,
        characterCount: 185,
        writingDuration: 59,
        mood: 'very-happy',
        tags: ['friends', 'social', 'gratitude'],
        entryDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        dateString: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        userId: demoUser._id,
        content: "Rainy day today, perfect for staying in and reading. Started a new book about mindfulness and meditation. The first chapter already has me thinking differently about how I approach daily stress.",
        wordCount: 36,
        characterCount: 180,
        writingDuration: 55,
        mood: 'neutral',
        tags: ['reading', 'self-improvement', 'weather'],
        entryDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        dateString: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      },
      {
        userId: demoUser._id,
        content: "Tried cooking a new recipe today - homemade pasta from scratch! It was challenging but so rewarding. The whole family loved it. Maybe I should cook more often instead of ordering takeout.",
        wordCount: 35,
        characterCount: 175,
        writingDuration: 50,
        mood: 'happy',
        tags: ['cooking', 'family', 'learning'],
        entryDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
        dateString: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
      },
      {
        userId: demoUser._id,
        content: "Weekend was too short as always. Spent time gardening and it was surprisingly therapeutic. There's something peaceful about working with plants and soil. My tomatoes are finally starting to grow!",
        wordCount: 35,
        characterCount: 172,
        writingDuration: 48,
        mood: 'happy',
        tags: ['gardening', 'weekend', 'peace'],
        entryDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        dateString: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      },
      {
        userId: demoUser._id,
        content: "Went for an early morning run today. The sunrise was breathtaking! There's something magical about the quiet streets and fresh air. Definitely want to make this a regular habit.",
        wordCount: 32,
        characterCount: 160,
        writingDuration: 45,
        mood: 'very-happy',
        tags: ['exercise', 'morning', 'nature', 'habits'],
        entryDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
        dateString: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
      },

      // A few entries for John Doe
      {
        userId: johnUser._id,
        content: "First day using SnapNote! Heard about this app from a friend. Love the concept of just writing for one minute. No pressure, just quick thoughts and feelings. Let's see how this goes.",
        wordCount: 36,
        characterCount: 175,
        writingDuration: 57,
        mood: 'happy',
        tags: ['first-entry', 'new-app'],
        entryDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Yesterday
        dateString: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      },
      {
        userId: johnUser._id,
        content: "Work was challenging today but I managed to solve a complex problem that had been bugging me for days. Sometimes stepping away and coming back with fresh eyes makes all the difference.",
        wordCount: 35,
        characterCount: 168,
        writingDuration: 53,
        mood: 'happy',
        tags: ['work', 'problem-solving', 'breakthrough'],
        entryDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        dateString: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      }
    ];

    const entries = await JournalEntry.create(sampleEntries);
    console.log(`Created ${entries.length} journal entries`);

    // Update user statistics
    console.log('Updating user statistics...');
    
    // Count entries for each user
    const demoUserEntryCount = await JournalEntry.countDocuments({ userId: demoUser._id });
    const johnUserEntryCount = await JournalEntry.countDocuments({ userId: johnUser._id });

    console.log('✅ Database seeding completed successfully!');
    console.log('📊 Seeded Data Summary:');
    console.log(`   👥 Users: ${users.length}`);
    console.log(`   📝 Journal Entries: ${entries.length}`);
    console.log(`   📈 Demo User (${demoUser.email}): ${demoUserEntryCount} entries`);
    console.log(`   📈 John Doe (${johnUser.email}): ${johnUserEntryCount} entries`);
    console.log('');
    console.log('🔐 Demo Login Credentials:');
    console.log('   Email: demo@snapnote.com');
    console.log('   Password: password123');
    console.log('');
    console.log('   Email: john.doe@example.com');
    console.log('   Password: password123');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the seeding
seedData();
