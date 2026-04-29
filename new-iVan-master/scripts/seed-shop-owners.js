const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Shop owners data
const shopOwners = [
  {
    user: {
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sarah@dailycart.com',
      password: 'password123',
      role: 'shop-owner',
      preferredLocale: 'en'
    },
    shop: {
      name: 'The Daily Cart',
      address1: '123 High Street',
      city: 'London',
      postCode: 'SW1A 1AA',
      latitude: 51.5074,
      longitude: -0.1278
    },
    products: [
      {
        name: 'Organic Milk 1L',
        description: 'Fresh organic whole milk from local farms',
        price: 2.50,
        category: 'Dairy',
        stock: 50,
        weight: 1.0
      },
      {
        name: 'Whole Wheat Bread',
        description: 'Artisan whole wheat bread baked daily',
        price: 3.20,
        category: 'Bakery',
        stock: 30,
        weight: 0.5
      },
      {
        name: 'Free Range Eggs (12 pack)',
        description: 'Fresh free-range eggs from happy hens',
        price: 4.80,
        category: 'Dairy',
        stock: 25,
        weight: 0.7
      },
      {
        name: 'Organic Bananas (1kg)',
        description: 'Ripe organic bananas perfect for snacking',
        price: 2.90,
        category: 'Fruits',
        stock: 40,
        weight: 1.0
      },
      {
        name: 'Greek Yogurt 500g',
        description: 'Creamy Greek yogurt with live cultures',
        price: 3.50,
        category: 'Dairy',
        stock: 35,
        weight: 0.5
      }
    ]
  },
  {
    user: {
      firstName: 'Michael',
      lastName: 'Chen',
      email: 'michael@homeaura.com',
      password: 'password123',
      role: 'shop-owner',
      preferredLocale: 'en'
    },
    shop: {
      name: 'HomeAura',
      address1: '456 Design Lane',
      city: 'Manchester',
      postCode: 'M1 1AA',
      latitude: 53.4808,
      longitude: -2.2426
    },
    products: [
      {
        name: 'Modern Ceramic Vase',
        description: 'Handcrafted ceramic vase in contemporary design',
        price: 45.00,
        category: 'Home Decor',
        stock: 15,
        weight: 2.5
      },
      {
        name: 'Luxury Throw Pillow',
        description: 'Soft velvet throw pillow in navy blue',
        price: 28.00,
        category: 'Textiles',
        stock: 20,
        weight: 0.8
      },
      {
        name: 'LED Table Lamp',
        description: 'Modern LED table lamp with adjustable brightness',
        price: 65.00,
        category: 'Lighting',
        stock: 12,
        weight: 1.2
      },
      {
        name: 'Bamboo Plant Pot',
        description: 'Sustainable bamboo plant pot with drainage',
        price: 22.00,
        category: 'Garden',
        stock: 25,
        weight: 0.6
      },
      {
        name: 'Wall Art Canvas',
        description: 'Abstract wall art canvas 60x40cm',
        price: 85.00,
        category: 'Art',
        stock: 8,
        weight: 1.5
      }
    ]
  },
  {
    user: {
      firstName: 'Emma',
      lastName: 'Williams',
      email: 'emma@sparkstyle.com',
      password: 'password123',
      role: 'shop-owner',
      preferredLocale: 'en'
    },
    shop: {
      name: 'Spark & Style',
      address1: '789 Fashion Avenue',
      city: 'Birmingham',
      postCode: 'B1 1AA',
      latitude: 52.4862,
      longitude: -1.8904
    },
    products: [
      {
        name: 'Gold Statement Necklace',
        description: 'Elegant gold-plated statement necklace',
        price: 89.00,
        category: 'Jewelry',
        stock: 10,
        weight: 0.3
      },
      {
        name: 'Designer Handbag',
        description: 'Premium leather handbag in classic black',
        price: 150.00,
        category: 'Accessories',
        stock: 8,
        weight: 0.8
      },
      {
        name: 'Silk Scarf',
        description: 'Luxury silk scarf with floral pattern',
        price: 45.00,
        category: 'Accessories',
        stock: 15,
        weight: 0.2
      },
      {
        name: 'Pearl Earrings',
        description: 'Classic pearl drop earrings',
        price: 75.00,
        category: 'Jewelry',
        stock: 12,
        weight: 0.1
      },
      {
        name: 'Leather Wallet',
        description: 'Genuine leather bi-fold wallet',
        price: 65.00,
        category: 'Accessories',
        stock: 20,
        weight: 0.4
      }
    ]
  },
  {
    user: {
      firstName: 'David',
      lastName: 'Brown',
      email: 'david@freshlypickd.com',
      password: 'password123',
      role: 'shop-owner',
      preferredLocale: 'en'
    },
    shop: {
      name: 'FreshlyPickd',
      address1: '321 Green Street',
      city: 'Bristol',
      postCode: 'BS1 1AA',
      latitude: 51.4545,
      longitude: -2.5879
    },
    products: [
      {
        name: 'Organic Spinach',
        description: 'Fresh organic spinach leaves, locally grown',
        price: 3.50,
        category: 'Vegetables',
        stock: 30,
        weight: 0.2
      },
      {
        name: 'Avocado (4 pack)',
        description: 'Ripe organic avocados perfect for guacamole',
        price: 6.00,
        category: 'Fruits',
        stock: 25,
        weight: 0.8
      },
      {
        name: 'Quinoa 500g',
        description: 'Premium organic quinoa, perfect for salads',
        price: 8.50,
        category: 'Grains',
        stock: 20,
        weight: 0.5
      },
      {
        name: 'Organic Honey 250g',
        description: 'Raw organic honey from local beekeepers',
        price: 12.00,
        category: 'Pantry',
        stock: 18,
        weight: 0.25
      },
      {
        name: 'Fresh Herbs Bundle',
        description: 'Mixed fresh herbs: basil, parsley, cilantro',
        price: 4.50,
        category: 'Herbs',
        stock: 15,
        weight: 0.1
      }
    ]
  },
  {
    user: {
      firstName: 'Sophie',
      lastName: 'Taylor',
      email: 'sophie@modernessence.com',
      password: 'password123',
      role: 'shop-owner',
      preferredLocale: 'en'
    },
    shop: {
      name: 'Modern Essence',
      address1: '654 Luxury Lane',
      city: 'Edinburgh',
      postCode: 'EH1 1AA',
      latitude: 55.9533,
      longitude: -3.1883
    },
    products: [
      {
        name: 'Premium Eau de Parfum',
        description: 'Luxury fragrance with notes of jasmine and sandalwood',
        price: 120.00,
        category: 'Fragrance',
        stock: 15,
        weight: 0.1
      },
      {
        name: 'Silk Sleep Mask',
        description: 'Luxury silk sleep mask for better rest',
        price: 35.00,
        category: 'Lifestyle',
        stock: 25,
        weight: 0.05
      },
      {
        name: 'Crystal Candle',
        description: 'Hand-poured soy candle with essential oils',
        price: 28.00,
        category: 'Home Fragrance',
        stock: 20,
        weight: 0.4
      },
      {
        name: 'Luxury Bath Salts',
        description: 'Relaxing bath salts with lavender and chamomile',
        price: 22.00,
        category: 'Bath & Body',
        stock: 30,
        weight: 0.3
      },
      {
        name: 'Artisan Soap Set',
        description: 'Handmade soap set with natural ingredients',
        price: 45.00,
        category: 'Bath & Body',
        stock: 18,
        weight: 0.6
      }
    ]
  }
];

async function seedShopOwners() {
  try {
    console.log('Starting to seed shop owners...');

    for (const shopOwnerData of shopOwners) {
      console.log(`\nCreating shop owner: ${shopOwnerData.user.firstName} ${shopOwnerData.user.lastName}`);

      // Hash password
      const hashedPassword = await bcrypt.hash(shopOwnerData.user.password, 10);

      // Create user
      const user = await prisma.users.create({
        data: {
          ...shopOwnerData.user,
          password: hashedPassword ,
          isActive: true,
          isFirstTime: false
        }
      });

      console.log(`✓ User created with ID: ${user.id}`);

      // Create shop
      const shop = await prisma.shops.create({
        data: {
          ...shopOwnerData.shop,
          createdById: user.id
        }
      });

      console.log(`✓ Shop created: ${shop.name} with ID: ${shop.id}`);

      // Create products for this shop
      for (const productData of shopOwnerData.products) {
        const product = await prisma.products.create({
          data: {
            ...productData,
            createdById: user.id,
            shopId: shop.id,
            pickupAddress: shop.address1,
            pickupCity: shop.city,
            pickupPostCode: shop.postCode,
            pickupLat: shop.latitude,
            pickupLng: shop.longitude,
            isActive: true
          }
        });

        console.log(`  ✓ Product created: ${product.name} - £${product.price}`);
      }

      console.log(`✓ All products created for ${shop.name}`);
    }

    console.log('\n🎉 All shop owners, shops, and products have been created successfully!');
    
    // Summary
    const totalUsers = await prisma.users.count({ where: { role: 'shop-owner' } });
    const totalShops = await prisma.shops.count();
    const totalProducts = await prisma.products.count();
    
    console.log(`\n📊 Summary:`);
    console.log(`- Shop Owners: ${totalUsers}`);
    console.log(`- Shops: ${totalShops}`);
    console.log(`- Products: ${totalProducts}`);

  } catch (error) {
    console.error('Error seeding shop owners:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
if (require.main === module) {
  seedShopOwners()
    .then(() => {
      console.log('\n✅ Seeding completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedShopOwners };
