# Chat Feature Implementation Documentation

## Overview
This document outlines the complete chat feature implementation for the iVan application, including database schema, API endpoints, and frontend components.

## Database Schema

### 1. Chat Tables

#### `chats` Table
```sql
CREATE TABLE chats (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    jobId VARCHAR(36) UNIQUE NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (jobId) REFERENCES jobs(id) ON DELETE CASCADE
);
```

**Purpose**: Main chat container for each job
**Relationships**: 
- One-to-one with `jobs` table
- One-to-many with `chat_participants` table
- One-to-many with `messages` table

#### `chat_participants` Table
```sql
CREATE TABLE chat_participants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    chatId VARCHAR(36) NOT NULL,
    userId INT NOT NULL,
    role VARCHAR(20) NOT NULL, -- 'admin', 'visitor', 'provider'
    joinedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    lastReadAt DATETIME NULL,
    FOREIGN KEY (chatId) REFERENCES chats(id) ON DELETE CASCADE,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_chat_user (chatId, userId)
);
```

**Purpose**: Manages chat participants and their read status
**Key Features**:
- Tracks when user joined the chat
- Tracks last read timestamp for unread message indicators
- Supports different user roles (admin, visitor, provider)

#### `messages` Table
```sql
CREATE TABLE messages (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    chatId VARCHAR(36) NOT NULL,
    senderId INT NOT NULL,
    content TEXT NOT NULL,
    messageType VARCHAR(20) DEFAULT 'text', -- 'text', 'image', 'file', 'system', 'location', 'job_update'
    metadata JSON NULL, -- For file info, location data, etc.
    isRead BOOLEAN DEFAULT FALSE,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (chatId) REFERENCES chats(id) ON DELETE CASCADE,
    FOREIGN KEY (senderId) REFERENCES users(id) ON DELETE CASCADE
);
```

**Purpose**: Stores all chat messages with metadata
**Message Types**:
- `text`: Regular text messages
- `image`: Image files (PNG, JPG, JPEG)
- `file`: Other files (PDF, TXT)
- `system`: System-generated messages
- `location`: Location sharing
- `job_update`: Job status updates

### 2. Updated Existing Tables

#### `users` Table Additions
```sql
ALTER TABLE users ADD COLUMN chatParticipants chat_participants[];
ALTER TABLE users ADD COLUMN sentMessages messages[];
```

#### `jobs` Table Additions
```sql
ALTER TABLE jobs ADD COLUMN chat chats?;
```

## API Endpoints

### 1. Chat Management APIs

#### `POST /api/chats`
**Purpose**: Create a new chat for a job
**Headers**: 
- `user-id`: User ID
- `role`: User role

**Request Body**:
```json
{
    "jobId": "string"
}
```

**Response**:
```json
{
    "id": "chat-uuid",
    "jobId": "job-uuid",
    "participants": [...],
    "createdAt": "datetime"
}
```

**Logic**:
- Validates user access to the job
- Creates chat with appropriate participants based on job creator and acceptor
- Admin + Provider (if job created by admin)
- Admin + Visitor + Provider (if job created by visitor)

#### `GET /api/chats`
**Purpose**: Get all chats for the current user
**Headers**: 
- `user-id`: User ID
- `role`: User role

**Response**:
```json
[
    {
        "id": "chat-uuid",
        "job": {...},
        "lastMessage": {...},
        "unreadCount": 5
    }
]
```

#### `GET /api/chats/[chatId]`
**Purpose**: Get specific chat details
**Headers**: 
- `user-id`: User ID
- `role`: User role

**Response**:
```json
{
    "id": "chat-uuid",
    "job": {...},
    "participants": [...],
    "messages": [...]
}
```

### 2. Message APIs

#### `GET /api/chats/[chatId]/messages`
**Purpose**: Get all messages for a chat
**Headers**: 
- `user-id`: User ID
- `role`: User role

**Response**:
```json
[
    {
        "id": "message-uuid",
        "content": "Hello",
        "messageType": "text",
        "sender": {...},
        "createdAt": "datetime",
        "isRead": false
    }
]
```

**Note**: Does NOT mark messages as read (fixed issue)

#### `POST /api/chats/[chatId]/messages`
**Purpose**: Send a new message
**Headers**: 
- `user-id`: User ID
- `role`: User role

**Request Types**:

**Text Message (JSON)**:
```json
{
    "content": "Hello world",
    "messageType": "text"
}
```

**File Message (FormData)**:
```javascript
const formData = new FormData();
formData.append('content', 'Check this file');
formData.append('files', file1);
formData.append('files', file2);
```

**Response**:
```json
{
    "id": "message-uuid",
    "content": "Hello world",
    "messageType": "text",
    "sender": {...},
    "createdAt": "datetime"
}
```

#### `POST /api/chats/[chatId]/mark-read`
**Purpose**: Mark messages as read when user opens chat
**Headers**: 
- `user-id`: User ID
- `role`: User role

**Response**:
```json
{
    "success": true
}
```

**Logic**:
- Marks all messages from other users as read
- Updates `lastReadAt` timestamp for participant
- Only called when user actually opens chat modal

### 3. File Upload Integration

#### File Upload Process
1. **Frontend**: User selects files → Files shown in preview
2. **Send Message**: FormData with files sent to message API
3. **Backend**: Files uploaded to S3 using `uploadFileToS3()`
4. **Storage**: Files stored in `chat-files/{chatId}/{timestamp}-{random}.{ext}`
5. **Database**: File metadata stored in message `metadata` field

#### Supported File Types
- **Images**: PNG, JPG, JPEG
- **Documents**: PDF, TXT
- **Size Limit**: 10MB per file

#### File Metadata Structure
```json
{
    "files": [
        {
            "fileName": "document.pdf",
            "fileUrl": "https://s3.../chat-files/123/...",
            "fileType": "application/pdf",
            "fileSize": 1024000
        }
    ]
}
```

## Frontend Components

### 1. Core Components

#### `ChatIcon.js`
**Purpose**: Chat icon on job cards
**Features**:
- Shows only for jobs with status "open"
- Red dot indicator for unread messages
- Creates chat if doesn't exist
- Opens chat modal on click

#### `ChatModal.js`
**Purpose**: Main chat interface
**Features**:
- Real-time messaging via WebSocket
- File upload with preview
- Message grouping and timestamps
- Typing indicators
- Auto-scroll to bottom

#### `FilePreview.js`
**Purpose**: File selection and preview
**Features**:
- Shows selected files before sending
- File thumbnails for images
- Remove files before sending
- Download functionality

### 2. WebSocket Integration

#### `lib/socket.js`
**Purpose**: Socket.io server configuration
**Events**:
- `join_chat`: User joins chat room
- `leave_chat`: User leaves chat room
- `send_message`: Send message to chat
- `typing`: Typing indicator
- `stop_typing`: Stop typing indicator

#### `lib/hooks/useSocket.js`
**Purpose**: React hook for WebSocket connection
**Features**:
- Auto-connect/disconnect
- Event handling
- Connection status management

#### `lib/hooks/useChatSocket.js`
**Purpose**: Chat-specific WebSocket hook
**Features**:
- Join/leave chat rooms
- Send messages
- Handle typing indicators
- Real-time message updates

## Business Logic

### 1. Chat Creation Rules

#### When Chat is Created
- **Trigger**: When provider accepts a job (job status becomes "open")
- **Location**: Called from job acceptance API, not separate API call
- **Function**: `handleJobAcceptanceChatCreation()` in `utils/chatService.js`

#### Chat Participants
- **Admin-created jobs**: Admin + Provider
- **Visitor-created jobs**: Admin + Visitor + Provider
- **Draft jobs**: No chat (chat only for "open" status)

### 2. Access Control

#### Chat Access Rules
- **Admin**: Can access all chats
- **Provider**: Can access chats for jobs they accepted
- **Visitor**: Can access chats for jobs they created

#### Message Read Status
- **Own messages**: Never marked as read
- **Other messages**: Marked as read when chat modal is opened
- **Unread indicator**: Red dot shows until messages are actually viewed

### 3. File Upload Rules

#### File Validation
- **Types**: PNG, JPG, JPEG, PDF, TXT only
- **Size**: Maximum 10MB per file
- **Multiple files**: Supported in single message

#### Storage Organization
- **Path structure**: `chat-files/{chatId}/{timestamp}-{random}.{ext}`
- **S3 integration**: Uses existing `uploadFileToS3()` function
- **Base URL**: Consistent with document upload system

## Environment Variables

### Required Environment Variables
```env
# S3 Configuration (existing)
S3_BUCKET=your-bucket-name
S3_KEY=your-access-key
S3_SECRET=your-secret-key
S3_REGION=your-region
NEXT_PUBLIC_AWS_BASE_URL=https://your-bucket.s3.region.amazonaws.com/

# WebSocket Configuration
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
```

## Integration Points

### 1. Job Acceptance Flow
```javascript
// In job acceptance API
const updatedJob = await prisma.jobs.update({...});
await handleJobAcceptanceChatCreation(updatedJob.id, userId);
```

### 2. Chat Icon Integration
- **Provider Dashboard**: Shows on job cards for "open" jobs
- **Admin Jobs Page**: Shows in jobs table
- **Visitor Jobs Page**: Shows on job cards

### 3. Real-time Updates
- **New messages**: Appear instantly via WebSocket
- **Typing indicators**: Show when users are typing
- **Read status**: Updates in real-time
- **File uploads**: Progress indicators and instant display

## Security Considerations

### 1. Access Control
- **User validation**: All APIs validate user ID and role
- **Chat participation**: Users can only access chats they're part of
- **File uploads**: Validated file types and sizes

### 2. Data Protection
- **Message encryption**: Consider for sensitive data
- **File access**: S3 signed URLs for secure file access
- **User privacy**: Messages deleted when chat is deleted

## Performance Optimizations

### 1. Database
- **Indexes**: On chatId, senderId, createdAt
- **Pagination**: For large message histories
- **Cleanup**: Old messages archiving strategy

### 2. Frontend
- **Message grouping**: Reduces DOM elements
- **Lazy loading**: For file previews
- **Debounced typing**: Reduces WebSocket events

## Future Enhancements

### 1. Planned Features
- **Message reactions**: Like, love, etc.
- **Message editing**: Edit sent messages
- **Message deletion**: Delete messages
- **Voice messages**: Audio file support
- **Video calls**: Integration with WebRTC

### 2. Scalability
- **Message pagination**: Load messages in chunks
- **File compression**: Optimize image uploads
- **CDN integration**: Faster file delivery
- **Message search**: Full-text search capability

## Testing Strategy

### 1. Unit Tests
- **API endpoints**: Test all CRUD operations
- **File upload**: Test validation and S3 integration
- **WebSocket events**: Test real-time functionality

### 2. Integration Tests
- **Chat creation**: Test job acceptance flow
- **Message flow**: Test end-to-end messaging
- **File sharing**: Test file upload and download

### 3. User Acceptance Tests
- **Chat interface**: Test user experience
- **File upload**: Test file selection and preview
- **Real-time updates**: Test WebSocket functionality

## Deployment Notes

### 1. Database Migration
```bash
# Run Prisma migration
npx prisma migrate deploy
```

### 2. Environment Setup
- Ensure all environment variables are set
- S3 bucket permissions configured
- WebSocket server running

### 3. Monitoring
- **Message delivery**: Monitor WebSocket connections
- **File uploads**: Monitor S3 upload success rates
- **Performance**: Monitor API response times

---

## Summary

The chat feature provides a complete real-time messaging system with:
- ✅ **Database schema** for chats, participants, and messages
- ✅ **RESTful APIs** for chat and message management
- ✅ **WebSocket integration** for real-time communication
- ✅ **File upload support** with S3 integration
- ✅ **Proper access control** and security
- ✅ **User-friendly interface** with modern UX
- ✅ **Scalable architecture** for future enhancements

The implementation follows best practices and integrates seamlessly with the existing iVan application architecture.
