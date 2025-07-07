# :v Faces Mascots' Discord Bot

## Overview

This is a sophisticated Discord bot system featuring dual bot instances with advanced AI integration, multimedia generation capabilities, extensive gaming features, and comprehensive leveling/moderation systems. The application uses Node.js with Discord.js and integrates with PostgreSQL for data persistence, Google's Gemini AI for intelligent responses, and Hugging Face models for content generation.

## System Architecture

### Backend Architecture
- **Runtime**: Node.js with JavaScript
- **Framework**: Discord.js v14 for Discord API integration
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **AI Integration**: Google Gemini API for conversational AI responses
- **Content Generation**: Hugging Face Inference API for image, music, and video generation
- **Web Dashboard**: Express.js server with file upload capabilities

### Database Architecture
- **Database**: Pure PostgreSQL with custom BaseModel abstraction
- **Architecture**: Clean, optimized model system with shared functionality
- **Schema Design**: Structured tables for users, bot configurations, birthdays, AI questions, and more
- **Data Models**: Streamlined model classes in `models/postgres/` using BaseModel inheritance
- **Code Reduction**: Over 80% reduction in duplicate code through BaseModel pattern

### Frontend Architecture
- **Dashboard**: HTML/CSS/JavaScript web interface (`dashboard.html`)
- **Authentication**: Login-based access control
- **File Management**: Multer-based file upload system with memory storage
- **Real-time Updates**: Activity tracking and system monitoring

## Key Components

### Dual Bot System
- **Bot A (Heilos)**: Primary bot instance with configurable personality
- **Bot B (Wisteria)**: Secondary bot instance with independent configuration
- **Shared Commands**: Common command set with bot-specific behavior differentiation
- **Independent Configuration**: Separate database tables for each bot's settings

### AI Response System
- **Context Building**: Comprehensive guild and user context for personalized responses
- **Conversation Memory**: Per-user conversation history tracking
- **Performance Optimization**: Response caching, concurrent request limiting, and timeout handling
- **Web Search Integration**: Real-time web search for current events, weather, news, and factual information using trafilatura

### Content Generation Pipeline
- **Image Generation**: FLUX.1-dev and Stable Diffusion models via Hugging Face
- **Music Generation**: MusicGen models for audio content creation
- **Video Generation**: Text-to-video models for dynamic content
- **Style Options**: Multiple artistic styles and quality presets

### Gaming Module
- **Single Player Games**: 2048, Snake, Hangman, Wordle, Minesweeper, Memory games
- **Multiplayer Games**: Connect4, Tic-Tac-Toe, Rock Paper Scissors
- **Party Games**: Truth/Dare/NHIE/WYR/Paranoia with AI-generated questions
- **Advanced Trivia**: Multiple categories and difficulty levels

### Leveling System
- **XP Tracking**: Message-based experience point accumulation
- **Visual Rank Cards**: Canvacord-generated level progression cards
- **Role Integration**: Automatic role assignment based on levels
- **Leaderboard**: Guild-wide ranking system

### Music System
- **Voice Channel Integration**: Discord.js voice support
- **YouTube Integration**: play-dl for audio streaming
- **Queue Management**: Song queuing and playback controls
- **URL Support**: Direct YouTube link addition to queue

## Data Flow

### Message Processing Pipeline
1. **Message Reception**: Discord.js event handling
2. **Permission Validation**: Channel and user permission checks
3. **Context Building**: Guild, user, and conversation context compilation
4. **AI Processing**: Gemini API request with optimized prompting
5. **Response Delivery**: Formatted message with embeds and attachments

### Command Execution Flow
1. **Slash Command Registration**: Dynamic command loading and Discord API registration
2. **Permission Verification**: Role-based access control
3. **Parameter Validation**: Input sanitization and type checking
4. **Database Operations**: CRUD operations through model abstractions
5. **Response Generation**: Embed-based user feedback

### Content Generation Workflow
1. **Request Initiation**: User command with parameters
2. **Model Selection**: Dynamic AI model routing based on content type
3. **API Communication**: Hugging Face Inference API calls
4. **Content Processing**: Binary data handling and validation
5. **Discord Delivery**: Attachment upload with metadata

## External Dependencies

### Core Dependencies
- **discord.js**: Discord API integration and bot functionality
- **@discordjs/voice**: Voice channel support for music features
- **drizzle-orm**: Type-safe database operations
- **pg**: PostgreSQL database driver
- **express**: Web server for dashboard functionality

### AI and Content Generation
- **@google/generative-ai**: Google Gemini API client
- **node-fetch**: HTTP requests for external APIs
- **multer**: File upload handling for dashboard

### Gaming and Visualization
- **discord-gamecord**: Pre-built Discord game implementations
- **canvacord**: Image generation for rank cards and visual content
- **play-dl**: YouTube audio streaming capabilities

### Utility Libraries
- **dotenv**: Environment variable management
- **mongoose**: MongoDB compatibility layer (legacy support)
- **ytdl-core**: YouTube data extraction

## Deployment Strategy

### Production Configuration
- **Entry Point**: `start.js` for deployment platforms
- **Environment Variables**: Database URLs, API keys, and configuration tokens
- **Process Management**: Graceful shutdown handling and error recovery
- **SSL Configuration**: Production-ready database connections

### Development Setup
- **Main Entry**: `index.js` for local development
- **Hot Reloading**: Command reload functionality for development
- **Debug Tools**: JSON logging utilities and database inspection tools
- **Local Database**: Optional local PostgreSQL setup

### Scalability Considerations
- **Connection Pooling**: PostgreSQL connection management
- **Caching Strategy**: In-memory caching for AI responses and context data
- **Request Limiting**: Concurrent AI request management
- **Error Handling**: Comprehensive error recovery and logging

## Changelog
- July 06, 2025: Initial setup
- July 07, 2025: Fixed duplicate key constraint violation error in user creation system
- July 07, 2025: Added proper error handling for PostgreSQL unique constraint violations  
- July 07, 2025: Implemented upsert pattern to prevent user creation conflicts
- July 07, 2025: Enhanced XP system with null checks to prevent runtime errors
- July 07, 2025: Enhanced XP system with attachment multiplier (1.5x) and emoji-only penalty (-1 XP)
- July 07, 2025: Messages with attachments now earn 1.5x XP, emoji-only messages earn -1 XP (minimum 1)
- July 07, 2025: Comprehensive application optimization - enhanced caching, database connection pooling, and memory management
- July 07, 2025: Optimized Discord client configuration with improved sweepers and rate limiting
- July 07, 2025: Enhanced AI handler with concurrent request management and extended cache timeouts
- July 07, 2025: Improved Express server with compression, caching headers, and request timeouts
- July 07, 2025: Added automatic cleanup intervals for all cache systems to prevent memory leaks
- July 07, 2025: Enhanced database connection handling with graceful reconnection for Neon database terminations
- July 07, 2025: Added robust retry logic and error handling for PostgreSQL connection issues
- July 07, 2025: Implemented force connection release and automatic reconnection on database errors
- July 06, 2025: Fixed database field name mismatches for allowed channels functionality
- July 06, 2025: Implemented proper parsing of allowed_channels from string to array format
- July 06, 2025: Resolved dashboard data loading issues and PostgreSQL connectivity
- July 06, 2025: Cleaned up Python JSON converter files and workflows (removed non-Discord bot components)
- July 06, 2025: Fixed generateAIResponse function loading issue causing bot crashes
- July 06, 2025: Successfully configured both bots with allowed channels set to "1"
- July 06, 2025: Fixed deprecated "ephemeral" warnings across all commands by updating to MessageFlags.Ephemeral
- July 06, 2025: Added Hugging Face API token for AI image generation functionality
- July 06, 2025: Verified AI image generation system working with FLUX.1-dev and Stable Diffusion models
- July 06, 2025: Fixed ai-wack command database operations for PostgreSQL compatibility
- July 06, 2025: Enhanced ai-gen-image command with improved error handling and API integration
- July 06, 2025: Verified both AI commands working properly with live API connections
- July 06, 2025: Major codebase cleanup - removed all MongoDB dependencies and code
- July 06, 2025: Created BaseModel class to eliminate code duplication across all models
- July 06, 2025: Optimized all PostgreSQL model files, reducing code by over 80%
- July 06, 2025: Removed unnecessary TypeScript/Drizzle dependencies and configuration files
- July 06, 2025: Streamlined project structure and eliminated duplicate code patterns
- July 06, 2025: Fixed conversation history database saving with proper JSON handling for PostgreSQL
- July 06, 2025: Resolved database field mapping issues (level_roles column name fix)
- July 06, 2025: Replaced all hardcoded "Bot 1" references with dynamic bot names from database
- July 06, 2025: Enhanced ai-wack command to display actual bot names instead of generic labels
- July 06, 2025: Fixed AIQuestions module import error by updating model exports
- July 06, 2025: Updated ai-wack command to clear all conversation memory for all bots per user
- July 06, 2025: Cleaned up Bot 2 references and reduced hardcoded bot names in error messages
- July 06, 2025: Completely removed AIQuestions module and dependencies from all game commands
- July 06, 2025: Fixed ai-wack command to clear conversation memory per specific bot (not all bots)
- July 06, 2025: Enhanced conversation history system to maintain 20 messages max per bot separately
- July 06, 2025: Improved conversation storage logic with proper bot-specific message filtering and timestamps
- July 06, 2025: Fixed PostgreSQL JSONB conversation_history field storage (was double-stringifying data)
- July 06, 2025: Cleaned up duplicate BotA database entries (removed 2 duplicate rows)
- July 06, 2025: Conversation history now properly stores and retrieves chat messages for memory functionality
- July 06, 2025: Fixed database import issue in conversation history saving - corrected to use singleton DatabaseManager instance
- July 06, 2025: Resolved user_id null constraint violation by using message.author.id directly in SQL queries
- July 06, 2025: Successfully verified conversation history system working with proper JSON storage in PostgreSQL JSONB fields
- July 06, 2025: Conversation memory system fully operational - maintains 20 messages per bot with proper timestamp sorting
- July 06, 2025: Implemented automatic cleanup of orphaned reaction role sets when Discord messages are not found
- July 06, 2025: Added deleteBySetId method to ReactionRole model for efficient set removal
- July 06, 2025: Enhanced reaction role initialization to detect and remove sets from deleted/inaccessible messages
- July 06, 2025: Removed login requirement from dashboard - now opens directly without authentication
- July 06, 2025: Added GUILD_ID environment variable for proper guild targeting
- July 06, 2025: Fixed PostgreSQL connection issues by removing old database utility dependencies
- July 06, 2025: Updated all database operations to use consistent BaseModel system
- July 06, 2025: Fixed AI personality data loading - dashboard settings now properly connect to bot responses
- July 06, 2025: Enhanced bot data API to return actual configuration instead of hardcoded defaults
- July 06, 2025: Fixed database column name conflicts (updatedAt vs updated_at) in conversation history
- July 06, 2025: Added debugging system to track what personality data is loaded for AI responses
- July 06, 2025: Fixed AI personality loading - now loads fresh bot configuration from database for each conversation
- July 06, 2025: Enhanced personality context to include all fields (age, personality, likes, dislikes, appearance, backstory, others)
- July 06, 2025: Replaced cached botConfig with dynamic database queries for real-time personality updates
- July 06, 2025: Fixed empty personality context issue - populated database with sample personality data for both bots
- July 06, 2025: Fixed SQL syntax errors in BaseModel class for UPDATE queries with empty WHERE clauses
- July 06, 2025: Made database tab visible by default instead of requiring 10 clicks to unlock
- July 06, 2025: Verified personality context system working correctly with populated database data
- July 06, 2025: Tested empty personality fields - system handles gracefully without errors
- July 06, 2025: Renamed "Others" field to "To Do" in dashboard and AI responses
- July 06, 2025: Adjusted "To Do" field height to 120px for better usability
- July 06, 2025: Removed server/channel context line from AI prompts for cleaner responses
- July 06, 2025: Removed debug logs from aiHandler.js for cleaner console output
- July 06, 2025: Improved loading screen accuracy - waits until all data is loaded before showing dashboard
- July 06, 2025: Optimized index.js with memory cleanup and better performance monitoring
- July 06, 2025: Optimized server.js with compression middleware and improved static file serving
- July 07, 2025: Updated dashboard title to ":v Faces Mascots Dashboard" with proper emoticon formatting
- July 06, 2025: Hidden database tab by default - now only shows after clicking dashboard title 5 times
- July 06, 2025: Fixed data loading issue by correcting API endpoint and adding debugging logs
- July 06, 2025: Enhanced web search capabilities with trafilatura-based real-time information retrieval
- July 06, 2025: Added comprehensive keyword detection for web searches (weather, news, current events, etc.)
- July 06, 2025: Integrated web search results directly into AI response context for informed conversations
- July 06, 2025: Increased conversation history limit from 20 to 30 messages per bot
- July 06, 2025: Implemented progressive XP difficulty system - returns to 100 XP base with +15% difficulty every 5 levels
- July 06, 2025: XP tiers: Levels 1-5 (1.0x), 6-10 (1.15x), 11-15 (1.30x), 16-20 (1.45x) multipliers
- July 06, 2025: Fixed Level 2 XP requirement to exactly 100 XP, progressive scaling for higher levels
- July 06, 2025: Fixed database connection issues - added proper SSL configuration for production DATABASE_URL
- July 06, 2025: Resolved deprecated ephemeral warnings by upgrading to MessageFlags.Ephemeral syntax
- July 06, 2025: Both Discord bots (Heilos and Wisteria) now running successfully with all commands operational
- July 06, 2025: Fixed autoreact system - implemented missing loadForumAutoReactSettings function for proper data loading
- July 06, 2025: Enhanced dashboard form field population to handle forum channels and emoji lists correctly
- July 06, 2025: Autoreact settings now properly populate from database and save successfully
- July 07, 2025: Fixed level system to start users at level 0 instead of level 1
- July 07, 2025: Users now properly level up to level 1 when they first gain enough XP  
- July 07, 2025: Updated calculateLevel function and xpForLevel function to use 0-based level system
- July 07, 2025: Fixed user creation logic to initialize new users at level 0
- July 07, 2025: Updated XP system - users now get 2-8 XP per message (instead of 0-5)
- July 07, 2025: Level 1 now requires only 1 XP - users reach level 1 on their first message
- July 07, 2025: Users start at level 0 and immediately level up to 1 when they send their first message
- July 07, 2025: Updated tier multiplier from 15% to 12% increase every 5 levels for more balanced progression
- July 07, 2025: Fixed critical bug - new users were being created at level 1 instead of level 0
- July 07, 2025: New users now properly start at level 0 and get level announcement when reaching level 1
- July 07, 2025: Added comprehensive Discord reconnection handling with automatic retry logic
- July 07, 2025: Enhanced error handling for connection failures, shard disconnections, and login retries
- July 07, 2025: Implemented exponential backoff for Discord login attempts and graceful error recovery
- July 07, 2025: Created production-ready deployment system for Render.com with keep-alive mechanism
- July 07, 2025: Added SIGTERM handling to prevent forced shutdowns and maintain bot connectivity
- July 07, 2025: Implemented self-ping system (every 14 minutes) to prevent free tier service sleeping
- July 07, 2025: Added health endpoint (/health) for monitoring bot status and uptime
- July 07, 2025: Created start.js production entry point with enhanced error recovery and memory monitoring
- July 07, 2025: Fixed duplicate level-up announcements by implementing announcement tracking system
- July 07, 2025: Added 30-second prevention window to stop multiple announcements for same user/level
- July 07, 2025: Enhanced XP system to only process through Bot 1 to prevent race conditions
- July 07, 2025: Implemented robust database reconnection system for Neon PostgreSQL terminations
- July 07, 2025: Added forceReconnect method to handle administrator connection terminations (code 57P01)
- July 07, 2025: Enhanced query retry logic with automatic reconnection on database failures
- July 07, 2025: Fixed keep-alive system to use native Node.js HTTP module instead of node-fetch
- July 07, 2025: Added comprehensive error handling for Neon database sleep/wake cycles
- July 07, 2025: Implemented mutex-like processing locks to prevent concurrent XP processing for same user
- July 07, 2025: Extended level-up announcement prevention timeout from 60 to 120 seconds
- July 07, 2025: Added comprehensive logging for level-up announcement tracking and debugging
- July 07, 2025: Fixed duplicate level-up announcements with concurrent processing prevention system
- July 07, 2025: Added +2 XP bonus for messages that mention either bot (Heilos or Wisteria)

## User Preferences

Preferred communication style: Simple, everyday language.