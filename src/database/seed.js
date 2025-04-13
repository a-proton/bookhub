// src/database/seed.js
const { connectDB, models } = require('./index');

const seedDatabase = async () => {
  try {
    await connectDB();
    
    // Check if memberships already exist
    const existingMemberships = await models.Membership.find();
    if (existingMemberships.length > 0) {
      console.log('Database already seeded');
      process.exit(0);
    }
    
    // Create membership plans
    const membershipPlans = [
      {
        name: 'Basic Plan',
        description: 'Access to our basic collection with 1 book at a time',
        pricePerMonth: 99,
        currency: 'Rs',
        maxBooks: 1,
        durationDays: 14,
        benefits: ['1 book at a time', '14-day borrowing period']
      },
      {
        name: 'Standard Plan',
        description: 'Access to our entire collection with 3 books at a time',
        pricePerMonth: 199,
        currency: 'Rs',
        maxBooks: 3,
        durationDays: 21,
        benefits: ['3 books at a time', '21-day borrowing period', 'Access to exclusive events']
      },
      {
        name: 'Premium Plan',
        description: 'Unlimited access to our entire collection',
        pricePerMonth: 299,
        currency: 'Rs',
        maxBooks: 5,
        durationDays: 30,
        benefits: ['5 books at a time', '30-day borrowing period', 'Free home delivery', 'Priority reservations']
      }
    ];
    
    await models.Membership.insertMany(membershipPlans);
    console.log('Database seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();