"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("../app.module");
const users_service_1 = require("../users/users.service");
const posts_service_1 = require("../posts/posts.service");
const notifications_service_1 = require("../notifications/notifications.service");
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
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const usersService = app.get(users_service_1.UsersService);
    const postsService = app.get(posts_service_1.PostsService);
    const notificationsService = app.get(notifications_service_1.NotificationsService);
    console.log('🌱 Starting dummy data seeding...\n');
    try {
        console.log('👥 Creating users...');
        const createdUsers = [];
        for (const userData of dummyUsers) {
            try {
                const existing = await usersService.findByEmailOrUsername(userData.email);
                if (existing) {
                    console.log(`   ⏭️  User ${userData.username} already exists, skipping...`);
                    createdUsers.push(existing);
                    continue;
                }
                const user = await usersService.create(userData);
                createdUsers.push(user);
                console.log(`   ✅ Created user: ${userData.username}`);
            }
            catch (error) {
                if (error.message?.includes('already exists')) {
                    console.log(`   ⏭️  User ${userData.username} already exists, skipping...`);
                }
                else {
                    console.error(`   ❌ Failed to create user ${userData.username}:`, error.message);
                }
            }
        }
        console.log(`\n✅ Created ${createdUsers.length} users\n`);
        console.log('📝 Creating posts...');
        let postCount = 0;
        for (let i = 0; i < createdUsers.length; i++) {
            const user = createdUsers[i];
            const postsPerUser = Math.floor(Math.random() * 3) + 2;
            for (let j = 0; j < postsPerUser; j++) {
                try {
                    const postData = dummyPosts[Math.floor(Math.random() * dummyPosts.length)];
                    const userId = user._id.toString();
                    const post = await postsService.createPost(userId, {
                        content: postData.content,
                        hashtags: postData.hashtags,
                        visibility: 'public',
                    });
                    postCount++;
                    const username = user.username || 'unknown';
                    console.log(`   ✅ Created post ${postCount} for ${username}`);
                    const commentCount = Math.floor(Math.random() * 3);
                    for (let k = 0; k < commentCount; k++) {
                        const commenter = createdUsers[Math.floor(Math.random() * createdUsers.length)];
                        const commenterId = commenter._id.toString();
                        const userIdStr = user._id.toString();
                        if (commenterId !== userIdStr) {
                            const comment = dummyComments[Math.floor(Math.random() * dummyComments.length)];
                            try {
                                const postId = post._id.toString();
                                await postsService.addComment(postId, commenterId, {
                                    content: comment,
                                });
                            }
                            catch (error) {
                            }
                        }
                    }
                    const likeCount = Math.floor(Math.random() * 5);
                    const userIdStr = user._id.toString();
                    const likers = createdUsers
                        .filter(u => u._id.toString() !== userIdStr)
                        .sort(() => Math.random() - 0.5)
                        .slice(0, likeCount);
                    for (const liker of likers) {
                        try {
                            const postId = post._id.toString();
                            const likerId = liker._id.toString();
                            await postsService.toggleLike(postId, likerId);
                        }
                        catch (error) {
                        }
                    }
                }
                catch (error) {
                    console.error(`   ❌ Failed to create post:`, error.message);
                }
            }
        }
        console.log(`\n✅ Created ${postCount} posts\n`);
        console.log('👥 Creating follow relationships...');
        let followCount = 0;
        for (let i = 0; i < createdUsers.length; i++) {
            const user = createdUsers[i];
            const followCountPerUser = Math.floor(Math.random() * 3) + 1;
            for (let j = 0; j < followCountPerUser; j++) {
                const targetUser = createdUsers[Math.floor(Math.random() * createdUsers.length)];
                const userId = user._id.toString();
                const targetUserId = targetUser._id.toString();
                if (targetUserId !== userId) {
                    try {
                        await usersService.followUser(userId, targetUserId);
                        followCount++;
                    }
                    catch (error) {
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
    }
    catch (error) {
        console.error('❌ Error seeding dummy data:', error);
    }
    finally {
        await app.close();
    }
}
seedDummyData();
//# sourceMappingURL=seed-dummy-data.js.map