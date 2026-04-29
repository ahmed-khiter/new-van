# Subscription Feature Implementation

## Overview
This document outlines the complete implementation of the subscription feature for service providers in the iVan platform. The system allows providers to subscribe to different plans to access job acceptance capabilities.

## Database Schema

### Plans Table
```sql
INSERT INTO plans (name, description, price, created_at, updated_at) VALUES 
('Monthly Access', '1-month access for service providers to accept and manage jobs.', 19.99, NOW(), NOW()),
('Half-Year Access', '6-month access with discounted pricing for service providers to accept jobs.', 99.99, NOW(), NOW()),
('Yearly Access', '12-month full access for service providers to accept unlimited jobs at the best value.', 179.99, NOW(), NOW());
```

### Subscriptions Table
- `id`: Primary key
- `user_id`: Foreign key to users table
- `plan_id`: Foreign key to plans table
- `start_date`: Subscription start date
- `end_date`: Subscription end date
- `amount_charged`: Amount paid for subscription
- `type`: Subscription type (monthly, half-year, yearly)
- `status`: Subscription status (active, expired, cancelled, upgraded)
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp

### Transactions Table
- `transaction_id`: Stripe payment intent ID
- `amount`: Transaction amount
- `customer_profile_id`: Customer email or identifier
- `user_id`: Foreign key to users table
- `plan_id`: Foreign key to plans table

## Core Architecture

### 1. Subscription Service (`utils/subscriptionService.js`)
Centralized business logic for all subscription-related operations.

#### Key Functions:

**`isSubscriptionActive(subscription)`**
- Checks if subscription is valid and not expired
- Considers both `active` and `cancelled` statuses as valid if within end date
- Returns `true` if subscription is within valid period

**`getSubscriptionStatus(userId)`**
- Fetches most recent subscription for user
- Automatically updates expired subscriptions to "expired" status
- Returns subscription with plan details included

**`canSubscribeToPlan(currentSubscription, newPlanId)`**
- Implements upgrade/downgrade rules
- Allows upgrades to higher-tier plans
- Prevents downgrades and same-plan subscriptions
- Handles cancelled but valid subscriptions

**`validateSubscriptionForJob(userId)`**
- Validates subscription for job acceptance
- Considers both active and cancelled subscriptions if within end date
- Returns detailed error messages for different scenarios

**`getPlanById(planId)`**
- Fetches plan details by plan ID
- Used across multiple APIs for consistency

### 2. API Endpoints

#### Subscription Status API (`/api/subscription/status`)
- **Method**: GET
- **Headers**: `user-id` required
- **Function**: Returns current subscription status with automatic expiration handling
- **Response**: Subscription object with plan details

#### Create Session API (`/api/subscription/create-session`)
- **Method**: POST
- **Headers**: `user-id` required
- **Body**: `{ planId: number }`
- **Function**: Creates Stripe checkout session with subscription validation
- **Business Rules**: 
  - Prevents downgrades
  - Allows upgrades
  - Handles expired/cancelled subscriptions

#### Webhook API (`/api/subscription/webhook`)
- **Method**: POST
- **Function**: Processes Stripe webhook events
- **Key Features**:
  - Creates new subscription records
  - Marks previous active subscriptions as "upgraded"
  - **Adds remaining days** from previous subscription to new one
  - Creates transaction records
  - Handles plan duration calculations

#### Job Acceptance API (`/api/jobs/accept`)
- **Method**: POST
- **Headers**: `user-id` required
- **Function**: Validates subscription before allowing job acceptance
- **Validation**: Uses `validateSubscriptionForJob` service function

### 3. Frontend Components

#### Pricing Page (`app/[locale]/(provider)/pricing/page.js`)
- **Location**: Provider layout (not public)
- **Features**:
  - Displays all available plans
  - Shows current subscription status
  - Handles different subscription states (active, expired, cancelled)
  - Implements upgrade/downgrade button logic
  - Auto-refreshes subscription status every 10 minutes

#### Subscription Profile Component (`components/subscription/Subscription.js`)
- **Features**:
  - Displays current subscription details
  - Shows plan information, dates, and amounts
  - Handles different status displays with appropriate styling
  - Provides renewal buttons for expired/cancelled subscriptions
  - Uses 6-6 column layout with profile card

## Business Logic

### Subscription Status Flow

#### 1. Active Subscription
- **Status**: `"active"`
- **Access**: Full access to job acceptance
- **Upgrade**: Allowed to higher-tier plans
- **Downgrade**: Not allowed
- **Expiration**: Automatically updated to "expired" when end date passes

#### 2. Cancelled Subscription
- **Status**: `"cancelled"`
- **Access**: 
  - ✅ **Valid**: Can accept jobs until end date
  - ❌ **Expired**: Cannot accept jobs after end date
- **New Subscription**: Allowed to any plan
- **Business Rule**: Users get what they paid for even after cancellation

#### 3. Expired Subscription
- **Status**: `"expired"`
- **Access**: Cannot accept jobs
- **New Subscription**: Allowed to any plan
- **Action Required**: User must renew to continue

#### 4. Upgraded Subscription
- **Status**: `"upgraded"`
- **Purpose**: Historical record of previous subscription
- **Access**: No access (old subscription)
- **Business Rule**: Only set when user upgrades to new plan

### Upgrade Logic

#### Remaining Days Handling
When a user upgrades their subscription:
1. **Calculate remaining days** from current active subscription
2. **Add remaining days** to new plan duration
3. **Mark previous subscription** as "upgraded"
4. **Create new subscription** with extended end date

**Example**:
- Current: Monthly plan with 15 days remaining
- Upgrade: To Half-Year plan (180 days)
- Result: New subscription for 195 days (180 + 15)

#### Upgrade Rules
- ✅ **Higher Tier**: Always allowed
- ❌ **Same Tier**: Not allowed
- ❌ **Lower Tier**: Not allowed
- ✅ **Expired/Cancelled**: Can subscribe to any plan

### Job Acceptance Validation

#### Valid Subscription Criteria
A user can accept jobs if they have:
1. **Active subscription** within end date, OR
2. **Cancelled subscription** within end date

#### Invalid Subscription Scenarios
- No subscription found
- Expired subscription
- Cancelled subscription past end date

## UI/UX Features

### Pricing Page
- **Plan Cards**: Three-tier pricing structure
- **Status Alerts**: 
  - Green: Active subscription with expiration date
  - Red: Expired subscription requiring renewal
  - Yellow: Cancelled subscription status
- **Button States**:
  - Success: Current plan (disabled)
  - Warning: Upgrade plan (enabled)
  - Secondary: Downgrade not allowed (disabled)
  - Primary: Subscribe now (enabled)

### Profile Subscription Card
- **Layout**: 6-6 column grid with profile information
- **Status Badges**: Color-coded by subscription status
- **Information Display**: Plan name, amount, type, dates
- **Status Messages**: Contextual alerts with icons
- **Action Buttons**: Renew subscription for expired/cancelled

## Security & Validation

### API Security
- **User Authentication**: All endpoints require valid session
- **User ID Validation**: Headers must include `user-id`
- **Stripe Webhook**: Signature verification for payment events
- **Input Validation**: Plan ID validation and type checking

### Business Rule Enforcement
- **Upgrade/Downgrade**: Server-side validation prevents rule violations
- **Subscription Status**: Automatic updates prevent expired access
- **Job Acceptance**: Subscription validation before job assignment
- **Payment Processing**: Secure Stripe integration with webhook handling

## Error Handling

### Common Error Scenarios
1. **No Subscription**: Clear message to subscribe
2. **Expired Subscription**: Renewal instructions
3. **Downgrade Attempt**: Explanation of upgrade-only policy
4. **Same Plan**: Already subscribed message
5. **Invalid Plan**: Plan not found error

### User Feedback
- **Toast Notifications**: For subscription actions
- **Status Alerts**: Visual indicators of subscription state
- **Button States**: Clear indication of available actions
- **Loading States**: Spinner indicators during processing

## Performance & Monitoring

### Subscription Status Updates
- **Auto-refresh**: Every 10 minutes on pricing page
- **Real-time Updates**: Webhook-driven database updates
- **Caching**: Session-based subscription state management

### Logging & Monitoring
- **Webhook Processing**: Detailed logs for subscription creation
- **Error Tracking**: Comprehensive error logging across APIs
- **User Actions**: Subscription upgrade/downgrade tracking

## Future Enhancements

### Potential Improvements
1. **Subscription History**: View all past subscriptions
2. **Auto-renewal**: Automatic subscription renewal
3. **Payment Methods**: Multiple payment option support
4. **Usage Analytics**: Subscription usage tracking
5. **Trial Periods**: Free trial for new users

### Scalability Considerations
1. **Database Indexing**: Optimized queries for subscription lookups
2. **Caching Strategy**: Redis caching for subscription status
3. **Webhook Processing**: Queue-based webhook handling
4. **Monitoring**: Subscription metrics and alerting

## Testing Scenarios

### Core Functionality Tests
1. **New Subscription**: First-time subscription creation
2. **Upgrade Flow**: Active subscription upgrade with remaining days
3. **Expiration Handling**: Automatic status updates
4. **Job Acceptance**: Subscription validation for job access
5. **Cancellation Handling**: Cancelled but valid subscription access

### Edge Cases
1. **Multiple Upgrades**: Handling consecutive upgrades
2. **Expired Upgrades**: Upgrading expired subscriptions
3. **Plan Changes**: Switching between different plan types
4. **Payment Failures**: Handling failed payment scenarios

## Deployment Notes

### Environment Variables
- `STRIPE_SECRET_KEY`: Stripe API secret key
- `STRIPE_WEBHOOK_SECRET`: Webhook signature verification
- `NEXTAUTH_URL`: Base URL for success/cancel redirects

### Database Migrations
- Ensure `plans` table is populated with subscription tiers
- Verify `subscriptions` table structure matches schema
- Check `transactions` table for payment tracking

### Monitoring Setup
- Stripe webhook endpoint monitoring
- Subscription status API performance tracking
- Error rate monitoring for subscription operations

---

*This document reflects the current implementation as of the latest updates. For any modifications or questions, refer to the development team.*
