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
- **Web Search Integration**: Dynamic information retrieval for current events

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

## User Preferences

Preferred communication style: Simple, everyday language.