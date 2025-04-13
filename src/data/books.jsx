
const books = [
    // Fiction Books (8)
    {
      id: 1,
      title: "The Great Adventure",
      author: "John Smith",
      category: "Fiction",
      price: 249,
      imageUrl: "./BookImage/img1.jpg",
      rating: 4.5
    },
    {
      id: 2,
      title: "Midnight Dreams",
      author: "Emily Roberts",
      category: "Fiction",
      price: 229,
      imageUrl: "./BookImage/img2.jpeg",
      rating: 4.3
    },
    {
      id: 3,
      title: "The Last Symphony",
      author: "David Chen",
      category: "Fiction",
      price: 269,
      imageUrl: " ./BookImage/img3.jpeg",
      rating: 4.7
    },  
    {
      id: 4,
      title: "Echoes of Tomorrow",
      author: "Sarah Williams",
      category: "Fiction",
      price: 199,
      imageUrl: "./BookImage/img4.jpeg",
      rating: 4.4
    },
    {
      id: 5,
      title: "The Hidden Garden",
      author: "Maria Garcia",
      category: "Fiction",
      price: 219,
      imageUrl: " ./BookImage/img5.png",
      rating: 4.6
    },
    {
      id: 6,
      title: "Whispers in the Wind",
      author: "Thomas Brown",
      category: "Fiction",
      price: 299,
      imageUrl: " ./BookImage/img6.jpeg",
      rating: 4.2
    },
    {
      id: 7,
      title: "The Forgotten Path",
      author: "Lisa Anderson",
      category: "Fiction",
      price: 169,
      imageUrl: " ./BookImage/img7.jpeg",
      rating: 4.8
    },
    {
      id: 8,
      title: "Starlight Memories",
      author: "James Wilson",
      category: "Fiction",
      price: 249,
      imageUrl: " ./BookImage/img8.jpeg",
      rating: 4.5
    },

    // Non-Fiction Books (8)
    {
      id: 9,
      title: "The Art of Cooking",
      author: "Chef David Lee",
      category: "Non-Fiction",
      price: 349,
      imageUrl: "./BookImage/img9.jpeg",
      rating: 4.7
    },
    {
      id: 10,
      title: "Mindful Living",
      author: "Dr. Rachel Green",
      category: "Non-Fiction",
      price: 299,
      imageUrl: "./BookImage/img10.jpeg",
      rating: 4.6
    },
    {
      id: 11,
      title: "The Science of Everything",
      author: "Prof. Alan Baker",
      category: "Non-Fiction",
      price: 329,
      imageUrl: "./BookImage/img11.jpg",
      rating: 4.8
    },
    {
      id: 12,
      title: "Digital Revolution",
      author: "Tech Smith",
      category: "Non-Fiction",
      price: 399,
      imageUrl: "./BookImage/img12.jpeg",
      rating: 4.4
    },
    {
      id: 13,
      title: "Earth's Wonders",
      author: "Nature Explorer",
      category: "Non-Fiction",
      price: 399,
      imageUrl: "./BookImage/img13.jpeg",
      rating: 4.9
    },
    {
      id: 14,
      title: "Modern Architecture",
      author: "Build Master",
      category: "Non-Fiction",
      price: 369,
      imageUrl: "./BookImage/img14.jpg",
      rating: 4.5
    },
    {
      id: 15,
      title: "The Art of Photography",
      author: "Capture Pro",
      category: "Non-Fiction",
      price: 339,
      imageUrl: "./BookImage/img15.jpeg",
      rating: 4.7
    },
    {
      id: 16,
      title: "Space Exploration",
      author: "Star Gazer",
      category: "Non-Fiction",
      price: 35.99,
      imageUrl: "./BookImage/img16.jpeg",
      rating: 4.8
    },

    // Academic Books (8)
    {
      id: 17,
      title: "Understanding Physics",
      author: "Dr. Sarah Johnson",
      category: "Academic",
      price: 399,
      imageUrl: "./BookImage/img17.jpeg",
      rating: 4.8
    },
    {
      id: 18,
      title: "Advanced Mathematics",
      author: "Prof. Number Genius",
      category: "Academic",
      price: 42.99,
      imageUrl: "./BookImage/img18.jpeg",
      rating: 4.7
    },
    {
      id: 19,
      title: "Chemical Reactions",
      author: "Lab Master",
      category: "Academic",
      price: 41.99,
      imageUrl: "./BookImage/img19.jpeg",
      rating: 4.6
    },
    {
      id: 20,
      title: "Biology Essentials",
      author: "Life Scholar",
      category: "Academic",
      price: 38.99,
      imageUrl: "./BookImage/img20.jpeg",
      rating: 4.5
    },
    {
      id: 21,
      title: "Economics 101",
      author: "Money Expert",
      category: "Academic",
      price: 37.99,
      imageUrl: "./BookImage/img21.jpeg",
      rating: 4.4
    },
    {
      id: 22,
      title: "Computer Science Fundamentals",
      author: "Code Master",
      category: "Academic",
      price: 439,
      imageUrl: "./BookImage/img22.jpeg",
      rating: 4.9
    },
    {
      id: 23,
      title: "Psychology Principles",
      author: "Mind Reader",
      category: "Academic",
      price: 409,
      imageUrl: "./BookImage/img23.jpeg",
      rating: 4.7
    },
    {
      id: 24,
      title: "Engineering Basics",
      author: "Build Genius",
      category: "Academic",
      price: 44.99,
      imageUrl: "./BookImage/img24.jpeg",
      rating: 4.8
    },

    // History Books (8)
    {
      id: 25,
      title: "World History: A Complete Guide",
      author: "Michael Brown",
      category: "History",
      price: 29.99,
      imageUrl: "./BookImage/img25.jpeg",
      rating: 4.3
    },
    {
      id: 26,
      title: "Ancient Civilizations",
      author: "Time Traveler",
      category: "History",
      price: 31.99,
      imageUrl: "./BookImage/img26.jpeg",
      rating: 4.6
    },
    {
      id: 27,
      title: "Medieval Times",
      author: "Castle Expert",
      category: "History",
      price: 289,
      imageUrl: "./BookImage/img27.jpeg",
      rating: 4.4
    },
    {
      id: 28,
      title: "The Renaissance Era",
      author: "Art Historian",
      category: "History",
      price: 32.99,
      imageUrl: "./BookImage/img28.jpeg",
      rating: 4.7
    },
    {
      id: 29,
      title: "World War Chronicles",
      author: "War Historian",
      category: "History",
      price: 33.99,
      imageUrl: "./BookImage/img29.jpeg",
      rating: 4.8
    },
    {
      id: 30,
      title: "Industrial Revolution",
      author: "Progress Writer",
      category: "History",
      price: 30.99,
      imageUrl: "./BookImage/img30.jpeg",
      rating: 4.5
    },
    {
      id: 31,
      title: "Ancient Egypt",
      author: "Pyramid Expert",
      category: "History",
      price: 299,
      imageUrl: "./BookImage/img31.jpeg",
      rating: 4.9
    },
    {
      id: 32,
      title: "The Cold War Era",
      author: "Modern Historian",
      category: "History",
      price: 31.99,
      imageUrl: "./BookImage/img32.jpeg",
      rating: 4.6
    },

    // Self-Help Books (8)
    {
      id: 33,
      title: "Self-Discovery Journey",
      author: "Emma Wilson",
      category: "Self-Help Book",
      price: 19.99,
      imageUrl: "./BookImage/img33.jpeg",
      rating: 4.6
    },
    {
      id: 34,
      title: "Mind Mastery",
      author: "Brain Trainer",
      category: "Self-Help Book",
      price: 219,
      imageUrl: "./BookImage/img34.jpeg",
      rating: 4.7
    },
    {
      id: 35,
      title: "Happiness Habits",
      author: "Joy Expert",
      category: "Self-Help Book",
      price: 18.99,
      imageUrl: "./BookImage/img35.jpeg",
      rating: 4.5
    },
    {
      id: 36,
      title: "Productivity Power",
      author: "Time Master",
      category: "Self-Help Book",
      price: 22.99,
      imageUrl: "./BookImage/img36.png",
      rating: 4.8
    },
    {
      id: 37,
      title: "Relationship Success",
      author: "Love Guru",
      category: "Self-Help Book",
      price: 20.99,
      imageUrl: "./BookImage/img37.jpeg",
      rating: 4.4
    },
    {
      id: 38,
      title: "Financial Freedom",
      author: "Wealth Wizard",
      category: "Self-Help Book",
      price: 239,
      imageUrl: "./BookImage/img38.jpeg",
      rating: 4.9
    },
    {
      id: 39,
      title: "Stress Management",
      author: "Peace Finder",
      category: "Self-Help Book",
      price: 199,
      imageUrl: "./BookImage/img39.jpeg",
      rating: 4.6
    },
    {
      id: 40,
      title: "Career Growth",
      author: "Success Coach",
      category: "Self-Help Book",
      price: 219,
      imageUrl: "./BookImage/img40.jpeg",
      rating: 4.7
    }
  ];
  
  export {books};