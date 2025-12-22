import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UsersService } from '../users/users.service';
import { PostsService } from '../posts/posts.service';
import { NotificationsService } from '../notifications/notifications.service';
import { UserDocument } from '../users/schemas/user.schema';
import { PostDocument } from '../posts/schemas/post.schema';
import { Types } from 'mongoose';

const dummyUsers = [
  {
    email: 'john.doe@example.com',
    username: 'johndoe',
    password: 'password123',
    profile: {
      name: 'John Doe',
      bio: 'Software developer passionate about creating amazing experiences. Coffee enthusiast ☕',
      avatar: '',
      website: 'https://johndoe.dev',
      gender: 'male',
      location: 'San Francisco, CA',
    },
  },
  {
    email: 'jane.smith@example.com',
    username: 'janesmith',
    password: 'password123',
    profile: {
      name: 'Jane Smith',
      bio: 'Photographer 📸 | Traveler 🌍 | Food lover 🍕',
      avatar: '',
      website: 'https://janesmith.photography',
      gender: 'female',
      location: 'New York, NY',
    },
  },
  {
    email: 'mike.wilson@example.com',
    username: 'mikewilson',
    password: 'password123',
    profile: {
      name: 'Mike Wilson',
      bio: 'Fitness coach 💪 | Motivational speaker | Helping people achieve their goals',
      avatar: '',
      website: '',
      gender: 'male',
      location: 'Los Angeles, CA',
    },
  },
  {
    email: 'sarah.jones@example.com',
    username: 'sarahjones',
    password: 'password123',
    profile: {
      name: 'Sarah Jones',
      bio: 'Artist 🎨 | Creative soul | Making the world more colorful',
      avatar: '',
      website: 'https://sarahjones.art',
      gender: 'female',
      location: 'Portland, OR',
    },
  },
  {
    email: 'alex.brown@example.com',
    username: 'alexbrown',
    password: 'password123',
    profile: {
      name: 'Alex Brown',
      bio: 'Tech entrepreneur | Startup founder | Building the future 🚀',
      avatar: '',
      website: 'https://alexbrown.tech',
      gender: 'other',
      location: 'Austin, TX',
    },
  },
];

const dummyPosts = [
  {
    content: 'Just finished an amazing project! Excited to share it with everyone. #coding #webdev #excited',
    hashtags: ['coding', 'webdev', 'excited'],
  },
  {
    content: 'Beautiful sunset today! 🌅 Nature never fails to amaze me. #photography #nature #sunset',
    hashtags: ['photography', 'nature', 'sunset'],
  },
  {
    content: 'Morning workout complete! 💪 Starting the day right. #fitness #motivation #health',
    hashtags: ['fitness', 'motivation', 'health'],
  },
  {
    content: 'New artwork in progress! Can\'t wait to show you all. #art #creative #painting',
    hashtags: ['art', 'creative', 'painting'],
  },
  {
    content: 'Launch day! 🚀 Our new product is live. Thanks to everyone who supported us! #startup #launch #tech',
    hashtags: ['startup', 'launch', 'tech'],
  },
  {
    content: 'Coffee and code ☕ Perfect combination for a productive day. #coding #coffee #developer',
    hashtags: ['coding', 'coffee', 'developer'],
  },
  {
    content: 'Weekend vibes! Time to relax and recharge. #weekend #relax #selfcare',
    hashtags: ['weekend', 'relax', 'selfcare'],
  },
  {
    content: 'Just learned something new today! Always keep learning. #learning #growth #mindset',
    hashtags: ['learning', 'growth', 'mindset'],
  },
];

const dummyComments = [
  'Great post! Thanks for sharing.',
  'This is amazing! 🔥',
  'Love this! Keep it up.',
  'Inspiring content!',
  'Can\'t wait to see more!',
  'This made my day! 😊',
  'So true! Thanks for the reminder.',
  'Awesome work! 👏',
];

async function seedDummyData() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);
  const postsService = app.get(PostsService);
  const notificationsService = app.get(NotificationsService);

  console.log('🌱 Starting dummy data seeding...\n');

  try {
    // Create users
    console.log('👥 Creating users...');
    const createdUsers: UserDocument[] = [];
    
    for (const userData of dummyUsers) {
      try {
        // Check if user already exists
        const existing = await usersService.findByEmailOrUsername(userData.email);
        if (existing) {
          console.log(`   ⏭️  User ${userData.username} already exists, skipping...`);
          createdUsers.push(existing);
          continue;
        }

        const user = await usersService.create(userData);
        createdUsers.push(user);
        console.log(`   ✅ Created user: ${userData.username}`);
      } catch (error: any) {
        if (error.message?.includes('already exists')) {
          console.log(`   ⏭️  User ${userData.username} already exists, skipping...`);
        } else {
          console.error(`   ❌ Failed to create user ${userData.username}:`, error.message);
        }
      }
    }

    console.log(`\n✅ Created ${createdUsers.length} users\n`);

    // Create posts with comments
    console.log('📝 Creating posts...');
    let postCount = 0;

    for (let i = 0; i < createdUsers.length; i++) {
      const user = createdUsers[i];
      const postsPerUser = Math.floor(Math.random() * 3) + 2; // 2-4 posts per user

      for (let j = 0; j < postsPerUser; j++) {
        try {
          const postData = dummyPosts[Math.floor(Math.random() * dummyPosts.length)];
          const userId = (user._id as Types.ObjectId).toString();
          const post = await postsService.createPost(userId, {
            content: postData.content,
            hashtags: postData.hashtags,
            visibility: 'public',
          }) as PostDocument;

          postCount++;
          const username = (user as any).username || 'unknown';
          console.log(`   ✅ Created post ${postCount} for ${username}`);

          // Add comments from other users
          const commentCount = Math.floor(Math.random() * 3); // 0-2 comments
          for (let k = 0; k < commentCount; k++) {
            const commenter = createdUsers[Math.floor(Math.random() * createdUsers.length)];
            const commenterId = (commenter._id as Types.ObjectId).toString();
            const userIdStr = (user._id as Types.ObjectId).toString();
            if (commenterId !== userIdStr) {
              const comment = dummyComments[Math.floor(Math.random() * dummyComments.length)];
              try {
                const postId = (post._id as Types.ObjectId).toString();
                await postsService.addComment(postId, commenterId, {
                  content: comment,
                });
              } catch (error) {
                // Ignore comment errors
              }
            }
          }

          // Add likes from random users
          const likeCount = Math.floor(Math.random() * 5); // 0-4 likes
          const userIdStr = (user._id as Types.ObjectId).toString();
          const likers = createdUsers
            .filter(u => (u._id as Types.ObjectId).toString() !== userIdStr)
            .sort(() => Math.random() - 0.5)
            .slice(0, likeCount);

          for (const liker of likers) {
            try {
              const postId = (post._id as Types.ObjectId).toString();
              const likerId = (liker._id as Types.ObjectId).toString();
              await postsService.toggleLike(postId, likerId);
            } catch (error) {
              // Ignore like errors
            }
          }
        } catch (error: any) {
          console.error(`   ❌ Failed to create post:`, error.message);
        }
      }
    }

    console.log(`\n✅ Created ${postCount} posts\n`);

    // Create follow relationships
    console.log('👥 Creating follow relationships...');
    let followCount = 0;

    for (let i = 0; i < createdUsers.length; i++) {
      const user = createdUsers[i];
      const followCountPerUser = Math.floor(Math.random() * 3) + 1; // 1-3 follows per user

      for (let j = 0; j < followCountPerUser; j++) {
        const targetUser = createdUsers[Math.floor(Math.random() * createdUsers.length)];
        const userId = (user._id as Types.ObjectId).toString();
        const targetUserId = (targetUser._id as Types.ObjectId).toString();
        if (targetUserId !== userId) {
          try {
            await usersService.followUser(userId, targetUserId);
            followCount++;
          } catch (error: any) {
            // Ignore if already following
          }
        }
      }
    }

    console.log(`\n✅ Created ${followCount} follow relationships\n`);

    console.log('🎉 Dummy data seeding completed successfully!');
    console.log(`\n📊 Summary:`);
    console.log(`   - Users: ${createdUsers.length}`);
    console.log(`   - Posts: ${postCount}`);
    console.log(`   - Follows: ${followCount}`);

  } catch (error) {
    console.error('❌ Error seeding dummy data:', error);
  } finally {
    await app.close();
  }
}

seedDummyData();

