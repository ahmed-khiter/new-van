# Dynamic Pricing System

## Overview
The new pricing system uses database-driven service pricing with category-specific calculation logic. This replaces the static pricing in `helper.js` with a flexible, maintainable system.

## Database Schema
The `services` table contains:
- `id` - Primary key
- `name` - Service name (e.g., "Courier", "Professional Cleaning")
- `description` - Service description
- `price` - Base price for the service
- `isActive` - Whether the service is available
- `createdAt` / `updatedAt` - Timestamps

## Service Categories & Pricing Logic

### 1. Distance-Based Services
**Van, Recovery, Click & Collect**
- Base price from database
- Distance multiplier (per mile)
- Additional service charges

**Van Service:**
- Base price + (distance × £2.50/mile)
- Van size multiplier (small: 1.0x, medium: 1.2x, large: 1.5x)
- Two men service: +£20
- No help loading: +£15

**Recovery Service:**
- Base price + (distance × £3.00/mile)
- Luxury vehicle surcharge: +£50
- Car doesn't turn on: +£30

**Click & Collect:**
- Base price + (distance × £1.50/mile)

### 2. Room-Based Services
**Cleaning**
- Base price + (rooms × £15) + (hours × £25)
- Commercial property: +30%
- No cleaning products: +£20

### 3. Item-Based Services
**Removals**
- Base price + (items × £10)

### 4. Fixed Services
**Locksmith**
- Base price + complexity charges
- Security key: +£30
- Electronic lock: +£50

**Car Key Replacement**
- Base price + vehicle complexity + documentation
- Luxury vehicle: +£100
- No log book: +£50
- No existing key: +£75

## Usage

### In Job Creation API
```javascript
import { calculateJobPrice } from '@/utils/pricingService';

const price = await calculateJobPrice(category, {
  distance: 15,
  howManyRooms: 4,
  vanSize: 'large',
  isTwoMenRequired: true,
  // ... other job data
});
```

### In Frontend
```javascript
import { calculateJobPrice } from '@/utils/pricingService';

// Calculate price for display
const price = await calculateJobPrice('Van', {
  distance: formData.distance,
  vanSize: formData.vanSize,
  isTwoMenRequired: formData.isTwoMenRequired
});
```

## Migration from Old System

1. **Database Update**: Run the services schema update script
2. **API Update**: Job creation now uses `calculateJobPrice()`
3. **Frontend Update**: Booking page uses new pricing service
4. **Backward Compatibility**: Old `calculatePrice()` function still works

## Admin Management

Admins can now:
- View all services in `/services` page
- Update base prices for each service
- Enable/disable services
- See real-time pricing calculations

## Benefits

1. **Flexible Pricing**: Easy to adjust rates per service
2. **Category-Specific Logic**: Different calculation methods per service type
3. **Database-Driven**: No code changes needed for price updates
4. **Maintainable**: Clear separation of pricing logic
5. **Scalable**: Easy to add new services or pricing rules

## Future Enhancements

- Time-based pricing (peak hours, weekends)
- Location-based pricing (urban vs rural)
- Customer tier pricing (regular vs premium)
- Seasonal pricing adjustments
- Bulk discount calculations
