import mongoose from 'mongoose';
import { Product } from '../models/productModel';

const SELLER_ID = '68aa9221367403cdef66aff4';

// Product data organized by category
const productData = {
  phone: [
    {
      title: 'iPhone 15 Pro Max 256GB',
      price: 129900,
      description:
        'Latest Apple flagship with A17 Pro chip, titanium design, and advanced camera system',
      tags: ['apple', 'iphone', 'smartphone', '5g'],
    },
    {
      title: 'Samsung Galaxy S24 Ultra',
      price: 119900,
      description: 'Premium Android phone with S Pen, 200MP camera, and Galaxy AI features',
      tags: ['samsung', 'galaxy', 'android', '5g'],
    },
    {
      title: 'Google Pixel 8 Pro',
      price: 89900,
      description: 'Pure Android experience with exceptional AI photography and 7 years of updates',
      tags: ['google', 'pixel', 'android', 'ai'],
    },
    {
      title: 'OnePlus 12 5G',
      price: 64999,
      description: 'Flagship killer with Snapdragon 8 Gen 3, Hasselblad cameras, and 100W charging',
      tags: ['oneplus', 'android', '5g', 'fast-charging'],
    },
    {
      title: 'iPhone 14 128GB',
      price: 69900,
      description: 'Powerful A15 Bionic chip with excellent camera and all-day battery life',
      tags: ['apple', 'iphone', 'smartphone'],
    },
    {
      title: 'Samsung Galaxy A54 5G',
      price: 38999,
      description: 'Mid-range champion with great display, camera, and long software support',
      tags: ['samsung', 'galaxy', 'mid-range', '5g'],
    },
    {
      title: 'Xiaomi 14 Ultra',
      price: 99999,
      description: 'Photography powerhouse with Leica optics and variable aperture',
      tags: ['xiaomi', 'leica', 'camera-phone'],
    },
    {
      title: 'Nothing Phone (2)',
      price: 44999,
      description: 'Unique Glyph interface with clean software and transparent design',
      tags: ['nothing', 'unique', 'glyph'],
    },
    {
      title: 'Motorola Edge 50 Pro',
      price: 31999,
      description: 'Curved display, wireless charging, and clean Android experience',
      tags: ['motorola', 'edge', 'curved-display'],
    },
    {
      title: 'Realme GT 5 Pro',
      price: 35999,
      description: 'Gaming-focused phone with Snapdragon 8 Gen 3 and 144Hz display',
      tags: ['realme', 'gaming', 'performance'],
    },
    {
      title: 'Vivo X100 Pro',
      price: 89999,
      description: 'Zeiss optics with exceptional night photography capabilities',
      tags: ['vivo', 'zeiss', 'camera'],
    },
    {
      title: 'OPPO Find X7 Ultra',
      price: 94999,
      description: 'Dual periscope cameras with Hasselblad color science',
      tags: ['oppo', 'hasselblad', 'flagship'],
    },
    {
      title: 'ASUS ROG Phone 8 Pro',
      price: 109999,
      description: 'Ultimate gaming phone with AirTriggers and active cooling',
      tags: ['asus', 'rog', 'gaming', 'performance'],
    },
    {
      title: 'Sony Xperia 1 V',
      price: 119900,
      description: 'Cinema-grade 4K display with professional camera controls',
      tags: ['sony', 'xperia', '4k', 'pro'],
    },
    {
      title: 'iPhone SE (3rd Gen)',
      price: 49900,
      description: 'Compact powerhouse with A15 chip and Touch ID',
      tags: ['apple', 'iphone', 'compact', 'budget'],
    },
    {
      title: 'Samsung Galaxy Z Fold 5',
      price: 154999,
      description: 'Foldable tablet-phone hybrid with S Pen support',
      tags: ['samsung', 'foldable', 'premium'],
    },
    {
      title: 'Samsung Galaxy Z Flip 5',
      price: 99999,
      description: 'Stylish flip phone with larger cover screen',
      tags: ['samsung', 'foldable', 'flip', 'stylish'],
    },
    {
      title: 'Poco F6 Pro',
      price: 29999,
      description: 'Budget flagship with Snapdragon 8 Gen 2 performance',
      tags: ['poco', 'budget', 'flagship-killer'],
    },
    {
      title: 'iQOO 12 5G',
      price: 52999,
      description: 'Gaming beast with excellent thermals and fast charging',
      tags: ['iqoo', 'gaming', '5g'],
    },
    {
      title: 'Honor Magic 6 Pro',
      price: 89999,
      description: 'AI-powered photography with silicon-carbon battery',
      tags: ['honor', 'ai', 'magic'],
    },
  ],
  earphone: [
    {
      title: 'Apple AirPods Pro (2nd Gen)',
      price: 24900,
      description: 'Premium TWS with adaptive audio, conversation awareness, and USB-C',
      tags: ['apple', 'airpods', 'anc', 'tws'],
    },
    {
      title: 'Sony WH-1000XM5',
      price: 29990,
      description: 'Industry-leading noise cancellation with 30-hour battery life',
      tags: ['sony', 'over-ear', 'anc', 'premium'],
    },
    {
      title: 'Samsung Galaxy Buds 2 Pro',
      price: 17999,
      description: '24-bit Hi-Fi sound with intelligent ANC and seamless switching',
      tags: ['samsung', 'tws', 'hi-fi', 'anc'],
    },
    {
      title: 'Bose QuietComfort Ultra Earbuds',
      price: 32900,
      description: 'Immersive spatial audio with world-class noise cancellation',
      tags: ['bose', 'tws', 'spatial-audio', 'anc'],
    },
    {
      title: 'Sony WF-1000XM5',
      price: 26990,
      description: 'Smallest premium TWS with exceptional sound quality',
      tags: ['sony', 'tws', 'compact', 'anc'],
    },
    {
      title: 'Jabra Elite 85t',
      price: 18999,
      description: 'Customizable ANC with semi-open design for comfort',
      tags: ['jabra', 'tws', 'customizable', 'anc'],
    },
    {
      title: 'Sennheiser Momentum 4',
      price: 34990,
      description: 'Audiophile-grade sound with 60-hour battery life',
      tags: ['sennheiser', 'over-ear', 'audiophile'],
    },
    {
      title: 'Nothing Ear (2)',
      price: 9999,
      description: 'Transparent design with personalized ANC and Hi-Res Audio',
      tags: ['nothing', 'tws', 'transparent', 'anc'],
    },
    {
      title: 'OnePlus Buds 3',
      price: 5499,
      description: 'Excellent value TWS with 49dB ANC and spatial audio',
      tags: ['oneplus', 'tws', 'value', 'anc'],
    },
    {
      title: 'JBL Tour Pro 2',
      price: 21999,
      description: 'Smart charging case with touch display and adaptive ANC',
      tags: ['jbl', 'tws', 'smart-case', 'anc'],
    },
    {
      title: 'Apple AirPods Max',
      price: 59900,
      description: 'Premium over-ear headphones with computational audio',
      tags: ['apple', 'over-ear', 'premium', 'anc'],
    },
    {
      title: 'Beats Studio Pro',
      price: 34900,
      description: 'Dynamic head tracking with premium sound and USB-C',
      tags: ['beats', 'over-ear', 'spatial-audio'],
    },
    {
      title: 'Audio-Technica ATH-M50xBT2',
      price: 19900,
      description: 'Studio monitor sound quality in wireless form',
      tags: ['audio-technica', 'studio', 'wireless'],
    },
    {
      title: 'Skullcandy Crusher ANC 2',
      price: 16999,
      description: 'Adjustable sensory bass with personal sound profiles',
      tags: ['skullcandy', 'bass', 'anc'],
    },
    {
      title: 'Marshall Major IV',
      price: 14999,
      description: 'Iconic design with 80+ hours of wireless playtime',
      tags: ['marshall', 'iconic', 'long-battery'],
    },
    {
      title: 'Beyerdynamic Free BYRD',
      price: 24990,
      description: 'German engineering with exceptional sound clarity',
      tags: ['beyerdynamic', 'tws', 'audiophile'],
    },
    {
      title: 'Shure AONIC 50 Gen 2',
      price: 39900,
      description: 'Professional-grade wireless headphones with spatial audio',
      tags: ['shure', 'professional', 'over-ear'],
    },
    {
      title: 'Bang & Olufsen Beoplay EX',
      price: 39990,
      description: 'Luxury TWS with premium materials and sound',
      tags: ['bang-olufsen', 'luxury', 'tws'],
    },
    {
      title: 'Anker Soundcore Liberty 4',
      price: 10999,
      description: 'Heart rate monitoring with LDAC and spatial audio',
      tags: ['anker', 'soundcore', 'health', 'value'],
    },
    {
      title: 'Technics EAH-AZ80',
      price: 29990,
      description: 'Multi-point connection with JustMyVoice technology',
      tags: ['technics', 'tws', 'multi-point'],
    },
  ],
  book: [
    {
      title: 'Clean Code by Robert C. Martin',
      price: 2499,
      description:
        'A handbook of agile software craftsmanship. Learn to write readable, maintainable code',
      tags: ['programming', 'software', 'best-practices'],
    },
    {
      title: 'The Pragmatic Programmer',
      price: 2999,
      description: 'Your journey to mastery. Essential reading for every software developer',
      tags: ['programming', 'career', 'software'],
    },
    {
      title: 'System Design Interview Vol 1',
      price: 1999,
      description: "An insider's guide to system design interviews at top tech companies",
      tags: ['interview', 'system-design', 'tech'],
    },
    {
      title: 'System Design Interview Vol 2',
      price: 2199,
      description: 'Advanced system design concepts and real-world case studies',
      tags: ['interview', 'system-design', 'advanced'],
    },
    {
      title: 'Designing Data-Intensive Applications',
      price: 3499,
      description: 'The big ideas behind reliable, scalable, and maintainable systems',
      tags: ['data', 'distributed-systems', 'architecture'],
    },
    {
      title: 'JavaScript: The Good Parts',
      price: 1499,
      description: 'Discover the beautiful, elegant core of JavaScript',
      tags: ['javascript', 'programming', 'web'],
    },
    {
      title: "You Don't Know JS: Scope & Closures",
      price: 999,
      description: 'Deep dive into JavaScript mechanics and patterns',
      tags: ['javascript', 'advanced', 'web'],
    },
    {
      title: 'Atomic Habits by James Clear',
      price: 599,
      description: 'Tiny changes, remarkable results. Transform your habits and life',
      tags: ['self-help', 'productivity', 'habits'],
    },
    {
      title: 'Deep Work by Cal Newport',
      price: 699,
      description: 'Rules for focused success in a distracted world',
      tags: ['productivity', 'focus', 'career'],
    },
    {
      title: 'The Psychology of Money',
      price: 499,
      description: 'Timeless lessons on wealth, greed, and happiness',
      tags: ['finance', 'psychology', 'investing'],
    },
    {
      title: 'Sapiens: A Brief History',
      price: 799,
      description: "A groundbreaking narrative of humanity's creation and evolution",
      tags: ['history', 'science', 'anthropology'],
    },
    {
      title: 'Thinking, Fast and Slow',
      price: 899,
      description: 'Explore the two systems that drive the way we think',
      tags: ['psychology', 'decision-making', 'science'],
    },
    {
      title: 'The Lean Startup',
      price: 699,
      description: "How today's entrepreneurs use continuous innovation",
      tags: ['startup', 'business', 'entrepreneurship'],
    },
    {
      title: 'Zero to One by Peter Thiel',
      price: 599,
      description: 'Notes on startups, or how to build the future',
      tags: ['startup', 'business', 'innovation'],
    },
    {
      title: 'Cracking the Coding Interview',
      price: 2499,
      description: '189 programming questions and solutions for tech interviews',
      tags: ['interview', 'coding', 'career'],
    },
    {
      title: 'Introduction to Algorithms (CLRS)',
      price: 4999,
      description: 'The comprehensive guide to algorithms and data structures',
      tags: ['algorithms', 'computer-science', 'textbook'],
    },
    {
      title: 'Head First Design Patterns',
      price: 2999,
      description: 'A brain-friendly guide to design patterns in software',
      tags: ['design-patterns', 'programming', 'oop'],
    },
    {
      title: 'The Art of Computer Programming Vol 1',
      price: 5999,
      description: "Donald Knuth's masterpiece on fundamental algorithms",
      tags: ['algorithms', 'classic', 'computer-science'],
    },
    {
      title: 'Refactoring by Martin Fowler',
      price: 2799,
      description: 'Improving the design of existing code systematically',
      tags: ['refactoring', 'programming', 'best-practices'],
    },
    {
      title: 'Domain-Driven Design',
      price: 3299,
      description: 'Tackling complexity in the heart of software',
      tags: ['ddd', 'architecture', 'software-design'],
    },
  ],
  fashions: [
    {
      title: 'Nike Air Max 270 React',
      price: 12995,
      description: 'Iconic comfort meets modern style with React foam cushioning',
      tags: ['nike', 'sneakers', 'sports', 'comfort'],
    },
    {
      title: 'Adidas Ultraboost 23',
      price: 15999,
      description: 'Premium running shoes with responsive Boost technology',
      tags: ['adidas', 'running', 'boost', 'performance'],
    },
    {
      title: "Levi's 501 Original Jeans",
      price: 4999,
      description: 'The original blue jean since 1873, iconic straight fit',
      tags: ['levis', 'jeans', 'denim', 'classic'],
    },
    {
      title: 'Ray-Ban Aviator Classic',
      price: 13990,
      description: 'Timeless aviator sunglasses with polarized lenses',
      tags: ['rayban', 'sunglasses', 'aviator', 'iconic'],
    },
    {
      title: 'Tommy Hilfiger Polo Shirt',
      price: 3999,
      description: 'Classic American cool with signature flag logo',
      tags: ['tommy', 'polo', 'casual', 'preppy'],
    },
    {
      title: 'Calvin Klein Slim Fit Shirt',
      price: 4499,
      description: 'Modern slim fit with premium cotton construction',
      tags: ['calvin-klein', 'formal', 'shirt', 'slim-fit'],
    },
    {
      title: 'Fossil Gen 6 Smartwatch',
      price: 22995,
      description: 'Wear OS smartwatch with classic watch aesthetics',
      tags: ['fossil', 'smartwatch', 'wearos', 'tech'],
    },
    {
      title: 'Michael Kors Leather Wallet',
      price: 7999,
      description: 'Luxurious leather bifold with signature branding',
      tags: ['michael-kors', 'wallet', 'leather', 'luxury'],
    },
    {
      title: 'Coach Crossbody Bag',
      price: 19999,
      description: 'Versatile crossbody in signature canvas with leather trim',
      tags: ['coach', 'bag', 'crossbody', 'designer'],
    },
    {
      title: 'Puma RS-X Reinvention',
      price: 8999,
      description: 'Retro-inspired chunky sneakers with bold colorway',
      tags: ['puma', 'sneakers', 'retro', 'chunky'],
    },
    {
      title: 'H&M Premium Cotton T-Shirt',
      price: 999,
      description: 'Essential wardrobe staple in soft organic cotton',
      tags: ['hm', 'basic', 'cotton', 'sustainable'],
    },
    {
      title: 'Zara Oversized Blazer',
      price: 5990,
      description: 'Contemporary oversized silhouette for modern styling',
      tags: ['zara', 'blazer', 'oversized', 'formal'],
    },
    {
      title: 'Uniqlo Ultra Light Down Jacket',
      price: 3990,
      description: 'Incredibly light and warm packable down jacket',
      tags: ['uniqlo', 'jacket', 'down', 'lightweight'],
    },
    {
      title: 'Gucci GG Belt',
      price: 35000,
      description: 'Iconic double G buckle on premium leather belt',
      tags: ['gucci', 'belt', 'luxury', 'designer'],
    },
    {
      title: 'Casio G-Shock GA-2100',
      price: 10995,
      description: 'CasiOak - iconic octagonal bezel with carbon core',
      tags: ['casio', 'g-shock', 'watch', 'durable'],
    },
    {
      title: 'North Face Puffer Jacket',
      price: 14999,
      description: 'Classic puffer with 700-fill down insulation',
      tags: ['north-face', 'puffer', 'winter', 'outdoor'],
    },
    {
      title: 'Vans Old Skool',
      price: 4499,
      description: 'Classic skate shoe with iconic side stripe',
      tags: ['vans', 'sneakers', 'skate', 'classic'],
    },
    {
      title: 'Converse Chuck Taylor All Star',
      price: 3999,
      description: 'Timeless canvas high-top sneakers',
      tags: ['converse', 'sneakers', 'canvas', 'iconic'],
    },
    {
      title: 'Under Armour Tech Polo',
      price: 2999,
      description: 'Moisture-wicking performance polo for active lifestyle',
      tags: ['under-armour', 'polo', 'sports', 'tech'],
    },
    {
      title: 'Reebok Classic Leather',
      price: 6999,
      description: 'Heritage sneaker with soft leather upper',
      tags: ['reebok', 'classic', 'leather', 'retro'],
    },
  ],
  other: [
    {
      title: 'Apple iPad Pro 12.9" M2',
      price: 112900,
      description: 'Most powerful iPad with M2 chip and Liquid Retina XDR display',
      tags: ['apple', 'ipad', 'tablet', 'pro'],
    },
    {
      title: 'Samsung Galaxy Tab S9 Ultra',
      price: 108999,
      description: 'Massive 14.6" AMOLED display with S Pen included',
      tags: ['samsung', 'tablet', 'android', 'large-screen'],
    },
    {
      title: 'Apple Watch Series 9',
      price: 41900,
      description: 'Advanced health features with double tap gesture',
      tags: ['apple', 'smartwatch', 'health', 'fitness'],
    },
    {
      title: 'Nintendo Switch OLED',
      price: 34999,
      description: 'Vibrant OLED screen with enhanced audio',
      tags: ['nintendo', 'gaming', 'console', 'portable'],
    },
    {
      title: 'PlayStation 5 Console',
      price: 49990,
      description: 'Next-gen gaming with ray tracing and 4K 120fps',
      tags: ['playstation', 'sony', 'gaming', 'console'],
    },
    {
      title: 'Xbox Series X',
      price: 49990,
      description: '12 teraflops of power for true 4K gaming',
      tags: ['xbox', 'microsoft', 'gaming', 'console'],
    },
    {
      title: 'Logitech MX Master 3S',
      price: 10995,
      description: 'Premium wireless mouse with MagSpeed scrolling',
      tags: ['logitech', 'mouse', 'wireless', 'productivity'],
    },
    {
      title: 'Apple Magic Keyboard',
      price: 14900,
      description: 'Wireless keyboard with Touch ID for Mac',
      tags: ['apple', 'keyboard', 'wireless', 'touch-id'],
    },
    {
      title: 'Keychron K2 Mechanical Keyboard',
      price: 7999,
      description: 'Wireless mechanical keyboard with hot-swappable switches',
      tags: ['keychron', 'mechanical', 'keyboard', 'wireless'],
    },
    {
      title: 'Dell UltraSharp U2723QE',
      price: 54999,
      description: '27" 4K USB-C Hub Monitor with IPS Black technology',
      tags: ['dell', 'monitor', '4k', 'usb-c'],
    },
    {
      title: 'LG UltraGear 27GP950',
      price: 79999,
      description: '4K 144Hz Nano IPS gaming monitor with HDMI 2.1',
      tags: ['lg', 'monitor', 'gaming', '4k'],
    },
    {
      title: 'SteelSeries Arctis Nova Pro',
      price: 34999,
      description: 'Premium gaming headset with hot-swap battery system',
      tags: ['steelseries', 'gaming', 'headset', 'wireless'],
    },
    {
      title: 'Razer DeathAdder V3 Pro',
      price: 14999,
      description: 'Ultra-lightweight wireless gaming mouse',
      tags: ['razer', 'gaming', 'mouse', 'esports'],
    },
    {
      title: 'Elgato Stream Deck MK.2',
      price: 14999,
      description: '15 customizable LCD keys for streamers and creators',
      tags: ['elgato', 'streaming', 'productivity', 'creator'],
    },
    {
      title: 'GoPro Hero 12 Black',
      price: 44990,
      description: 'Waterproof action camera with 5.3K video',
      tags: ['gopro', 'action-camera', 'waterproof', 'video'],
    },
    {
      title: 'DJI Mini 3 Pro',
      price: 79999,
      description: 'Compact drone with 4K/60fps and obstacle avoidance',
      tags: ['dji', 'drone', '4k', 'portable'],
    },
    {
      title: 'Kindle Paperwhite (11th Gen)',
      price: 14999,
      description: '6.8" display with adjustable warm light',
      tags: ['kindle', 'e-reader', 'amazon', 'reading'],
    },
    {
      title: 'Anker PowerCore 26800',
      price: 3999,
      description: 'High capacity portable charger with 3 USB ports',
      tags: ['anker', 'powerbank', 'portable', 'charging'],
    },
    {
      title: 'SanDisk Extreme Pro 1TB SSD',
      price: 12999,
      description: 'Portable SSD with read speeds up to 2000MB/s',
      tags: ['sandisk', 'ssd', 'storage', 'portable'],
    },
    {
      title: 'Rode NT-USB Mini',
      price: 9999,
      description: 'Studio-quality USB microphone for podcasting',
      tags: ['rode', 'microphone', 'usb', 'podcast'],
    },
  ],
};

// Sample product images (placeholder URLs - replace with actual images)
const sampleImages: Record<string, string[]> = {
  phone: [
    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500',
    'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=500',
    'https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=500',
    'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=500',
    'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=500',
  ],
  earphone: [
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
    'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500',
    'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=500',
    'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=500',
    'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=500',
  ],
  book: [
    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500',
    'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=500',
    'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=500',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500',
    'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=500',
  ],
  fashions: [
    'https://images.unsplash.com/photo-1445205170230-053b83016050?w=500',
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
    'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500',
    'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=500',
    'https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?w=500',
  ],
  other: [
    'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500',
    'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=500',
    'https://images.unsplash.com/photo-1606318801954-d46d46d3360a?w=500',
    'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=500',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500',
  ],
};

function getRandomImage(category: string): string {
  const images = sampleImages[category] || sampleImages.other;
  return images[Math.floor(Math.random() * images.length)];
}

function getRandomRating(): number {
  return Number((3.5 + Math.random() * 1.5).toFixed(1));
}

function getRandomQuantity(): number {
  return Math.floor(Math.random() * 100) + 1;
}

export const seedProducts = async () => {
  const products: any[] = [];

  // Flatten all products from all categories
  for (const [category, items] of Object.entries(productData)) {
    for (const item of items) {
      products.push({
        title: item.title,
        price: item.price,
        description: item.description,
        category: category as 'phone' | 'earphone' | 'book' | 'fashions' | 'other',
        tags: item.tags,
        image: getRandomImage(category),
        sellerId: new mongoose.Types.ObjectId(SELLER_ID),
        rating: getRandomRating(),
        quantity: getRandomQuantity(),
      });
    }
  }

  console.log(`📦 Preparing to seed ${products.length} products...`);

  try {
    // Delete existing products for this seller (optional - comment out if you want to keep existing)
    const deleted = await Product.deleteMany({ sellerId: SELLER_ID });
    console.log(`🗑️  Deleted ${deleted.deletedCount} existing products for seller`);

    // Insert all products
    const result = await Product.insertMany(products);
    console.log(`✅ Successfully seeded ${result.length} products!`);

    // Summary by category
    const summary = products.reduce((acc, p) => {
      acc[p.category] = (acc[p.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('\n📊 Products by category:');
    Object.entries(summary).forEach(([cat, count]) => {
      console.log(`   ${cat}: ${count} products`);
    });

    return result;
  } catch (error) {
    console.error('❌ Error seeding products:', error);
    throw error;
  }
};

// Run seed if called directly
const runSeed = async () => {
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/product';

  try {
    await mongoose.connect(MONGO_URI);
    console.log('🔗 Connected to MongoDB');

    await seedProducts();

    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('Failed to seed:', error);
    process.exit(1);
  }
};

// Check if running directly (not imported)
if (require.main === module) {
  runSeed();
}
