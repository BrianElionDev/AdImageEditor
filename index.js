import { writeFile } from 'fs/promises';
import { generateAdImage } from './Style2.js';

const buffer = await generateAdImage({
  imageUrl: 'https://xcgwtnvjxzrlhcjwqtmo.supabase.co/storage/v1/object/public/meta/adimages/file.png',
  logoUrl: 'https://c8.alamy.com/comp/2EMG4XH/vector-logo-of-a-meat-shop-and-restaurant-2EMG4XH.jpg',
  headline: '🥩 Fresh Meat Frenzy! Premium Cuts, Farm Fresh, Unbeatable Price!',
  subtext: 'Get 37% OFF — Only This Week. Hurry before stock runs out!',
  cta: 'Shop Now',
});

await writeFile('Style.jpg', buffer);
console.log('🔥 Your pro ad is ready: ad_final.jpg');
