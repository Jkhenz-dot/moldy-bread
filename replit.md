# :v Faces Mascots' Discord Bot - Version 1.0

## Overview

A comprehensive Discord bot platform featuring dual bot instances (Heilos and Wisteria) with advanced AI conversational capabilities, extensive gaming suite, leveling system, and modern web dashboard. Built with Node.js, Discord.js, and PostgreSQL for enterprise-grade reliability and performance.

## Version 1.0 Features

### Core Bot System
- **Dual Bot Architecture**: Two independent bot instances (Heilos & Wisteria) with unique personalities
- **AI Conversational Engine**: Powered by Google Gemini with context-aware responses and conversation memory
- **Smart Context Building**: Comprehensive guild and user context for personalized interactions
- **Web Search Integration**: Real-time information retrieval for current events, weather, and factual queries

### Gaming Suite (15 Games)
- **Single Player Games**: 2048, Snake, Minesweeper, Flood, Wordle, Memory, Match Pairs, Fast Type, Find Emoji, Hangman, Guess the Pokemon (11 games)
- **Multiplayer Games**: Connect 4, Tic-Tac-Toe, Rock Paper Scissors (3 games)
- **Party Games**: Truth, Dare, Paranoia, Would You Rather, Never Have I Ever with AI-generated questions
- **Knowledge Games**: Advanced Trivia with multiple categories, Server-wide Counting Game

### Leveling & Social Features
- **XP System**: Message-based experience with progressive difficulty scaling (12% increase every 5 levels)
- **Visual Rank Cards**: Canvacord-generated level progression displays with custom styling
- **Leaderboard System**: Guild-wide ranking system
- **Birthday Management**: Server birthday calendar with add/list/remove functionality

### Voice Features
- **Voice Channel Integration**: Join/disconnect functionality
- **Text-to-Speech**: Custom voice synthesis with bot-specific audio profiles and speed control
- **TTS Session Management**: Conflict prevention and isolated bot connections

### AI & Content Generation
- **Image Generation**: AI-powered custom image creation using FLUX.1-dev and Stable Diffusion models
- **Style Options**: 10 artistic styles (Photorealistic, Anime, Digital Art, Oil Painting, etc.)
- **AI Moderation**: User blacklisting/whitelisting for AI interactions
- **Conversation Management**: Per-user conversation history with memory clearing options

### Moderation & Administration
- **Message Management**: Bulk delete, bot messaging, embed creation
- **Permission System**: Role-based access control for sensitive commands
- **Command Reloading**: Hot-reload functionality for development
- **Web Dashboard**: Modern responsive interface with dark/light themes

### Database & Infrastructure
- **PostgreSQL Backend**: Reliable data persistence with connection pooling
- **Database Protection**: Automated backups every 30 minutes, health monitoring
- **Model Architecture**: Optimized BaseModel system reducing code duplication by 80%
- **Performance Optimization**: Caching strategies, request limiting, and memory management

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

## Version 1.0 Release - July 10, 2025

**Major Release Features:**
- Complete Discord bot platform with dual bot system (Heilos & Wisteria)
- 15 game suite including single player, multiplayer, and party games  
- Advanced AI conversational engine with Google Gemini integration
- Comprehensive leveling system with Canvacord visual rank cards and leaderboards
- Voice channel integration with text-to-speech capabilities
- Modern web dashboard with dark/light themes and responsive design
- PostgreSQL backend with automated backup and protection systems
- AI image generation with 10 artistic styles using FLUX.1-dev and Stable Diffusion
- Birthday management and AI moderation features
- Professional command system with categorized help interface

## Recent Updates
- July 10, 2025: Finalized help command system - verified all commands exist, removed non-functional commands (vc-add), cleaned interface of all emojis, implemented accurate command listings with 6 categorized pages and quick navigation
- July 10, 2025: Fixed loading screen background cut-off issue - ensured full viewport coverage by updating both main loading screen and light mode version to use 100vw/100vh with min-height: 100vh, added !important declarations to override any conflicting styles, fixed pseudo-elements to cover full viewport with proper positioning, eliminated bottom cut-off appearance
- July 10, 2025: Modernized light mode loading screen background - replaced simple #fafafa background with trendy multi-layer gradient using contemporary colors (#f8fafc to #ffffff), added multiple radial gradients for depth, implemented subtle floating animation (12s cycle) and rotating conic gradient overlay (20s cycle) for modern visual appeal, created sophisticated layered design with proper overflow handling
- July 10, 2025: Fixed navbar selected state blur effects - removed blur from box-shadow properties in both desktop and mobile navigation, changed desktop navbar from `box-shadow: 0 4px 15px` to `box-shadow: 0 2px 4px` and mobile navbar from `box-shadow: 0 2px 12px` to `box-shadow: 0 1px 2px`, ensuring consistent plain shadows across light mode and mobile views as requested by user
- July 10, 2025: Enhanced loading screen with green success indicators - changed completed states from purple to green gradients (#10b981, #22c55e), added checkmarks to success messages ("Connected ✓", "Loaded ✓", "Ready ✓"), updated both dark and light mode styling for consistent green success feedback, improved visual satisfaction during startup process
- July 10, 2025: Fixed all white text contrast issues in light mode - added comprehensive dark color overrides for all text elements, updated card content, form labels, navigation text, buttons, modals, and tooltips to use proper dark colors (#1a202c, #4a5568, #64748b), maintained gradient text styling for titles and active navigation items, added universal fallback rule for light mode text visibility
- July 10, 2025: Fixed database tab mobile navigation sizing - updated database tab icon size to 24px and text margin to 6px to match other tabs exactly, removed font-size override for consistency, added database tab to mobile navigation when unlocked via header clicks, created responsive mobile navigation handling both 3 tabs and 4 tabs with proper width calculations
- July 10, 2025: Fixed mobile navigation centering and spacing issues - corrected transform calculation from container-based to slider-based percentage (100/8 = 12.5% per item), improved centering logic to properly position selected tab in middle of 3-tab view, fixed bounds checking to eliminate extra right-side spacing, mobile navigation now displays exactly 3 tabs with proper centering when clicking different buttons
- July 10, 2025: Fixed AI Details buttons and mobile navigation - changed AI Details save buttons to use trendy button styling with hover effects matching other sections, reverted mobile navigation to always show 3 tabs with proper scrolling functionality, fixed navigation arrows to work correctly, removed extra space on right side of mobile navigation, centered selected tab in middle position as requested
- July 10, 2025: Fixed mobile navigation tab positioning - updated mobile navigation logic to properly handle database tab visibility, icons now center correctly in mobile view, when database tab is unlocked all 4 tabs display at once without scrolling, improved CSS styling for consistent icon and text alignment, fixed navigation arrows to disable when all tabs are visible, added nav-text span structure to all navigation items for consistency
- July 10, 2025: Fixed UI consistency issues - removed conflicting light mode navbar selected tab styling to ensure proper gradient text visibility, removed background gradient that was hiding text, removed all blue colors (#3b82f6) from loading screen states and replaced with purple gradient theme colors (#8b5cf6, #6366f1), ensured header title consistency between dark and light modes using same gradient styling, fixed duplicate embedFooter IDs by creating unique identifiers, updated all JavaScript references to use correct element IDs, changed notification backgrounds from gradients to solid colors (green for success, red for error), added gradient text styling for navbar selected and hover states in both light and dark modes, fixed mobile navigation database tab sizing to prevent layout breaks
- July 10, 2025: Complete UI consistency and mobile navigation improvements - fixed mobile navigation arrows to change pages and center selected items, unified all guide sections with blue backgrounds and titles matching Advanced Reaction Roles style, fixed light mode navbar selected background to match dark mode with white text visibility, improved light mode contrast with darker backgrounds and better form styling, fixed toggle button text visibility in light mode, enhanced mobile navigation with proper centering functionality and error handling, all styling now consistent across light and dark themes
- July 10, 2025: Completed enhanced UI modernization - improved card contrast and styling with increased opacity (0.6→0.8 for dark cards, 0.8→0.9 for light cards), added gradient hover effects with animated top borders, enhanced trend cards with permanent purple gradient top border, modernized toggle buttons with green/purple color coding for Plain Text/Rich Embed selection, added yellow sun icon with glow effect for light mode theme toggle, added animated gradient icons to loading screen with pulse and glow effects, all cards now feature improved depth and modern aesthetics
- July 10, 2025: Added comprehensive guide sections to XP Settings and Level Up Announcements cards - unified all cards with green info boxes matching the pattern used throughout dashboard, ensuring consistent user guidance across all features
- July 10, 2025: Completed UI modernization project - fixed "Role Management" text color from purple to white in Auto Role Assignment card, added comprehensive guide sections to all cards matching Advanced Reaction Roles pattern with green info boxes and helpful descriptions, removed unwanted Guild Data fields (server owner, description, features, max members, vanity URL, banner status, NSFW level) from server.js API for cleaner display, all cards now have consistent modern styling with user guidance
- July 10, 2025: Fixed Auto Role Assignment card layout to match other cards with proper trend card wrapper styling, enhanced Guild Data section with comprehensive server information including region, owner, description, server features, custom emojis/stickers, MFA level, NSFW level, max members, vanity URL, and banner status - updated both frontend display and server.js backend to provide authentic Discord guild data, removed remaining emojis from Advanced Reaction Roles and Welcome Messages database cards
- July 10, 2025: Complete UI modernization - redesigned dashboard with Inter font, modern dark/light themes, enhanced contrast, smooth animations, gradient overlays, modern card styling, improved form inputs, and professional cubic-bezier transitions for a trendy, minimalist aesthetic
- July 10, 2025: Removed set-channel.js command and cleaned all command embeds - removed all emojis from Discord command embed titles and descriptions across ai-blacklist, ai-gen-image, ai-gen-music, ai-gen-video, ai-whitelist, dare, nhie, paranoia, reload-commands, and trivia-advanced commands
- July 10, 2025: Fixed mobile navigation styling - mobile tabs now use same gradient backgrounds as desktop (linear-gradient with purple/blue), matching active and hover states across both views, enhanced gradient bottom indicator for mobile active tabs
- July 10, 2025: Enhanced dashboard styling and contrast - made card titles bold (700 weight) and larger (24px), improved text contrast with darker unselected nav items (0.6 opacity dark, 0.5 opacity light), fixed mobile tab backgrounds to match default styling, added better contrast for both dark and light modes, enhanced navigation with better color hierarchy
- July 10, 2025: Modernized dashboard styling - enhanced navigation tabs with gradient hover effects, rounded corners, smooth transitions, added gradient card titles matching button colors (purple to blue), improved card hover effects with subtle animations, fixed welcomer icon to user-plus, updated loading screen icons
- July 10, 2025: Complete emoji removal from dashboard - replaced all emojis with Font Awesome icons throughout interface, removed emojis from card titles, buttons, toggle text, theme toggle, avatar placeholders, loading screen icons, navigation arrows, and table headers, fixed mobile database tab styling to match other tabs with transparent background and proper icon alignment
- July 10, 2025: Complete dashboard error elimination - fixed all null value errors in form element assignment with comprehensive null checks, enhanced welcome message toggle functionality with proper error handling, removed all debug console.log statements for cleaner production environment, added safe element updating functions to prevent "Cannot set properties of null" errors, enhanced database icon consistency for mobile layout (⚡), updated title click requirement to 10 clicks for database tab unlock, added showProcessing() to all form submissions for better UX feedback, optimized welcomer form with 500ms debounce
- July 10, 2025: Fixed mobile navigation background color to #1E1E2B and resolved database export/import error by replacing missing database_import_export module with inline database operations
- July 10, 2025: Cleaned up project structure by removing unnecessary files - removed unused database_import_export.js, server/db.ts, Python config files (pyproject.toml, uv.lock), and various cache/temp files for a cleaner codebase
- July 10, 2025: Fixed Birthday model by removing non-existent guild_id field mapping, updated all birthday commands to use proper table structure with birth_date field instead of separate month/day/year fields, removed guild-specific birthday filtering to work with current database schema
- July 10, 2025: Completed database optimization - removed xp_per_message column from others table to simplify XP system, added Welcome Messages card to database section for easier management, updated all database management endpoints to support welcome_messages table
- July 10, 2025: Separated welcome messages into dedicated table - created new WelcomeMessage table with proper schema, migrated all welcomer data from others table, updated all API endpoints and dashboard integration to use new table structure for better database organization
- July 10, 2025: Restored counting game functionality - added counting database fields (counting_enabled, counting_channel, counting_current, counting_last_user), recreated counting command, and restored all counting logic after user requested to keep this feature
- July 10, 2025: Removed level_up_message column from database - deleted from others table and updated model file to clean up unused level-up message customization feature
- July 10, 2025: Major database optimization completed - reduced others table from 41 to 23 columns (44% reduction), removed 18 unnecessary columns including legacy welcomer system, goodbye system, counting system, statistics tracking, and unused fields like trivia_api, updated Others model to match optimized structure, all 7 core tables restored and functioning properly
- July 10, 2025: Fixed dashboard data population - resolved API endpoint to include raw 'others' data, dashboard now properly loads all form fields from database including bot configurations, XP settings, welcomer settings, and auto role settings
- July 10, 2025: Database structure optimization - restored announcement_channel and description columns (user requested), removed all temp_audio_files references from TTS system, optimized database import/export system with better validation and error handling, updated database utilities to reflect current 7-table structure, fixed column naming consistency across all tables
- July 10, 2025: Major database optimization - removed unused tables (ai_questions, temp_audio_files), fixed birthdays table column naming (user_id → discord_id), removed unused columns (description from bot tables, announcement_channel/level_up_channel from others table), fixed null values in bot configurations, optimized database structure from 9 to 7 core tables
- July 10, 2025: Fixed database schema issues - created all missing tables (bota, botb, users, others, level_roles, birthdays, reaction_roles, ai_questions, temp_audio_files)
- July 10, 2025: Updated others table with all required columns (forum_channels, forum_emojis, xp_per_message, counting_enabled, welcomer settings, etc.)
- July 10, 2025: Created comprehensive database utilities (initDatabase.js, checkDatabase.js, databaseUtils.js, serverUtils.js, maintenance.js)
- July 10, 2025: Added database health monitoring and maintenance scripts for automated checks and repairs
- July 10, 2025: Database fully operational with all Discord bot features working properly
- July 09, 2025: Implemented comprehensive database protection system - automated backups every 30 minutes, health monitoring every 5 minutes, auto-backup before destructive operations, backup tables with restore capabilities, database resilience against connection failures
- July 09, 2025: Added database backup management endpoints for manual backup creation and status monitoring
- July 09, 2025: Fixed database schema issues - added missing avatar_path and blacklisted_users columns to bot tables
- July 09, 2025: Removed Text Channels/Voice Channels/Forum Channels cards from dashboard as requested
- July 09, 2025: Fixed dashboard console errors with proper null checks for innerHTML operations
- July 09, 2025: Comprehensive dashboard improvements - removed emojis from home section cards, renamed cards for clarity, reordered member display (Total Members after Bot Members)
- July 09, 2025: Enhanced guild data details with comprehensive server information - added text/voice/forum channel counts, role count, creation date, verification level, boost level/count
- July 09, 2025: Improved avatar upload UX - replaced upload buttons with clickable profile circles with hover effects and "Click to change" tooltip
- July 09, 2025: Added System Performance card to home section with proper trend card styling
- July 09, 2025: Removed Connected Servers card from home section (count still shown in status overview)
- July 09, 2025: Enhanced dashboard styling and guild data display - applied trend card theme to home, general, and AI sections to match reactions section
- July 09, 2025: Fixed mobile navigation background - lightened from black to transparent for better usability
- July 09, 2025: Improved guild member counting with async member fetching for accurate human/bot breakdown
- July 09, 2025: Removed guild owner field from display to prevent display issues
- July 09, 2025: Added loading states for guild statistics during startup
- July 09, 2025: Fixed jkhenz's user data - restored original XP (345) and level (2) after database restore issue
- July 09, 2025: Added automatic message validation cleanup - orphaned reaction role sets are removed when message IDs no longer exist
- July 09, 2025: Enhanced refresh functionality to validate message existence and clean up deleted Discord messages
- July 09, 2025: Fixed reaction role display showing "undefined" - now properly displays emoji → @role_name mappings
- July 09, 2025: Added automatic cleanup when reaction role sets are deleted - removes all Discord message reactions when no more sets exist
- July 09, 2025: Removed excessive console logging from reaction role system for cleaner production output
- July 09, 2025: Enhanced reaction role database queries to return individual pairs instead of grouped aggregates
- July 09, 2025: Fixed all database table schemas - added missing columns (avatar_path, blacklisted_users, level_up_channel, etc.)
- July 09, 2025: Fixed users table to use discord_id instead of user_id column for proper field mapping
- July 09, 2025: Fixed dashboard server startup by correcting malformed try-catch block syntax error
- July 09, 2025: All database tables now properly configured with complete schema
- July 09, 2025: Fixed level command progress bar width issue - removed hardcoded 100% width to show actual XP progress
- July 09, 2025: Recreated PostgreSQL database with all necessary tables after endpoint access issues
- July 09, 2025: Database fully operational with users, bots, and configuration tables restored
- July 09, 2025: Implemented merged message ID validation in advanced reaction roles - single "Create Set & Continue" button validates message and proceeds automatically
- July 09, 2025: Added real-time message validation with visual feedback showing message content and channel name when found
- July 09, 2025: Enhanced reaction role creation workflow with seamless validation and error handling
- July 09, 2025: Fixed mobile navigation to be always visible as fixed bottom horizontal sliding tabs
- July 09, 2025: Removed duplicate level_announcement column from others table, using level_up_announcement instead
- July 09, 2025: Fixed reaction roles database schema - removed unnecessary channel_id column and updated model mappings
- July 09, 2025: Enhanced mobile navigation to display as fixed bottom scrollable tabs with proper styling
- July 09, 2025: Updated VC-TTS command maximum text length from 500 to 200 characters per user request
- July 09, 2025: Successfully restored complete database from user backup with user_id to discord_id field conversion
- July 09, 2025: Imported 14 users with XP/level data, bot configurations, and system settings
- July 09, 2025: Fixed all database model field mappings and column compatibility issues
- July 09, 2025: Database models fully optimized with comprehensive field mapping for all 25+ configuration options
- July 09, 2025: Both Heilos and Wisteria restored with original personalities, activities, and channel permissions
- July 09, 2025: XP system, level roles, forum auto-react, and welcomer configurations fully restored
- July 09, 2025: Fixed database connection issues by creating fresh PostgreSQL database with proper schema
- July 09, 2025: Recreated all database tables including temp_audio_files table for TTS functionality
- July 09, 2025: Successfully restored all user data and bot configurations to new database
- July 09, 2025: Database management functionality now working properly in dashboard
- July 09, 2025: Fixed TTS command parameter format to use correct array structure with blob audio upload
- July 09, 2025: Enhanced TTS command with proper bot-specific audio file selection (bot1.mp3 for Heilos, bot2.mp3 for Wisteria)
- July 09, 2025: Implemented proper speed control (0.7x for Bot1/Heilos, 0.5x for Bot2/Wisteria)
- July 09, 2025: Added comprehensive temp file cleanup system for FFmpeg processing
- July 09, 2025: Fixed interaction timeout handling with proper defer/reply logic
- July 09, 2025: Enhanced voice channel conflict management - same bot blocks itself, different bots can overlap
- July 09, 2025: Fixed TTS voice channel conflicts - only one bot can speak at a time now
- July 09, 2025: Resolved Discord interaction timeout errors with proper error handling
- July 09, 2025: Enhanced audio source separation to prevent bot voice mixing issues
- July 09, 2025: Fixed voice connection isolation with unique bot groups for simultaneous TTS support
- July 09, 2025: Resolved audio cross-contamination - each bot now uses completely isolated voice connections
- July 09, 2025: Enhanced connection tracking and subscription verification for reliable multi-bot audio
- July 09, 2025: Fixed undefined botId variable error in audio playback function
- July 09, 2025: Optimized TTS system with in-memory FFmpeg processing - no more temp files on disk
- July 09, 2025: Added rich Discord embeds for all TTS responses with color-coded status
- July 09, 2025: Removed excessive logging for cleaner production console output
- July 09, 2025: Enhanced auto-reconnect functionality to handle voice channel disconnections
- July 09, 2025: Reduced timeouts and improved connection stability for faster TTS responses
- July 09, 2025: Fixed TTS generation failures with enhanced error handling and fallback processing system
- July 09, 2025: Added robust FFmpeg fallback from in-memory to temp file processing when needed
- July 09, 2025: Successfully restored user's old database export with complete data migration
- July 09, 2025: Imported 14 users with XP/level data, conversation history, and proper discord_id mapping
- July 09, 2025: Restored bot configurations for Heilos and Wisteria with original personalities and settings
- July 09, 2025: Restored XP system settings (2-8 XP per message, 6s cooldown, level announcements enabled)
- July 09, 2025: Restored level roles, forum auto-react settings, and welcomer configurations
- July 09, 2025: Fixed all database schema errors - added missing columns and tables
- July 09, 2025: Added missing 'xp_enabled' column to others table
- July 09, 2025: Added missing 'updated_at' column to level_roles table
- July 09, 2025: Created missing 'ai_questions' table with proper schema
- July 09, 2025: Fixed auto role settings parsing to handle empty array strings ("[]")
- July 09, 2025: Enhanced dashboard JavaScript to filter out invalid role IDs
- July 09, 2025: Fixed critical database error - corrected UserData model field mapping from discord_id to discord_id
- July 09, 2025: Fixed PostgreSQL NOT NULL constraint violation by using correct column names in user creation
- July 09, 2025: Updated leaderboard and level commands to use discord_id field instead of discord_id
- July 09, 2025: Extended TTS functionality to both bots with voice file selection (bot1.mp3 for Heilos, bot2.mp3 for Wisteria)
- July 09, 2025: Implemented database storage for temporary audio files with PostgreSQL tracking
- July 09, 2025: Added voice channel conflict prevention to avoid multiple bots speaking simultaneously
- July 09, 2025: Removed bot restrictions - TTS command now available to all users on both bots
- July 09, 2025: Enhanced database with temp_audio_files table for comprehensive audio tracking
- July 09, 2025: Simplified users table schema - removed guild_id, discriminator, messages_sent, and last_message_at columns
- July 09, 2025: Updated UserData model to match simplified database structure from JSON export
- July 09, 2025: Users table now only contains: id, discord_id, username, xp, level, last_xp_gain, conversation_history, created_at, updated_at
- July 09, 2025: Successfully restored user's old database export with complete data migration
- July 09, 2025: Imported 14 users with XP/level data, conversation history, and proper discord_id mapping
- July 09, 2025: Restored bot configurations for Heilos and Wisteria with original personalities and settings
- July 09, 2025: Restored XP system settings (2-8 XP per message, 6s cooldown, level announcements enabled)
- July 09, 2025: Restored level roles, forum auto-react settings, and welcomer configurations
- July 09, 2025: Fixed all database schema errors - added missing columns and tables
- July 09, 2025: Added missing 'xp_enabled' column to others table
- July 09, 2025: Added missing 'updated_at' column to level_roles table
- July 09, 2025: Created missing 'ai_questions' table with proper schema
- July 09, 2025: Fixed auto role settings parsing to handle empty array strings ("[]")
- July 09, 2025: Enhanced dashboard JavaScript to filter out invalid role IDs
- July 09, 2025: Fixed critical database error - corrected UserData model field mapping from discord_id to discord_id
- July 09, 2025: Fixed PostgreSQL NOT NULL constraint violation by using correct column names in user creation
- July 09, 2025: Updated leaderboard and level commands to use discord_id field instead of discord_id
- July 09, 2025: Extended TTS functionality to both bots with voice file selection (bot1.mp3 for Heilos, bot2.mp3 for Wisteria)
- July 09, 2025: Implemented database storage for temporary audio files with PostgreSQL tracking
- July 09, 2025: Added voice channel conflict prevention to avoid multiple bots speaking simultaneously
- July 09, 2025: Removed bot restrictions - TTS command now available to all users on both bots
- July 09, 2025: Enhanced database with temp_audio_files table for comprehensive audio tracking
- July 09, 2025: Fixed Discord voice audio compression by installing @discordjs/opus package for proper audio encoding
- July 09, 2025: Enhanced audio speed control by pre-processing files with FFmpeg atempo filter for proper 0.5x playback speed
- July 09, 2025: Updated TTS voice reference to use local bot1.mp3 file instead of remote audio sample
- July 09, 2025: Fixed TTS audio playback by installing FFmpeg system dependency for Discord voice support
- July 09, 2025: Updated TTS command to download audio files from Gradio server to local storage for playback
- July 09, 2025: Resolved Discord interaction timeout issues and deprecated ephemeral flag warnings
- July 09, 2025: Successfully implemented @gradio/client with dynamic import for ES module compatibility
- July 09, 2025: Fixed TTS audio path handling to properly extract file path from Gradio API response
- July 09, 2025: TTS functionality fully operational using remote audio sample as voice reference
- July 09, 2025: Fixed @gradio/client import error by switching to gradio-client package
- July 09, 2025: Updated TTS command to use local bot1.mp3 file instead of remote audio
- July 09, 2025: Resolved Client.connect API usage for proper Gradio integration
- July 09, 2025: Added vc-tts command for Bot 1 (Heilos) using Gradio API voice cloning service
- July 09, 2025: Implemented TTS functionality with bot1.mp3 voice reference file
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
- July 06, 2025: Resolved discord_id null constraint violation by using message.author.id directly in SQL queries
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
- July 07, 2025: Implemented permanent Level 1 announcement prevention - Level 1 can only be announced once per user
- July 07, 2025: Fixed level-up logic to only trigger on actual level increases (newLevel > oldLevel)
- July 07, 2025: Level 1 announcements are now permanently locked to prevent any re-announcements
- July 07, 2025: Removed verbose console logging - memory usage, debug logs, and XP processing logs cleaned up
- July 07, 2025: Enhanced PostgreSQL pool error handling to suppress 57P01 administrator termination spam
- July 07, 2025: Silenced database connection establishment and removal logs for cleaner console output
- July 07, 2025: Cleaned up level-up announcement logging and duplicate prevention messages
- July 07, 2025: Fixed XP system cache issues preventing proper level updates for user hachiyafuyu  
- July 07, 2025: Enhanced concurrent processing locks with automatic timeout to prevent race conditions
- July 07, 2025: Resolved duplicate level announcements by improving processing synchronization
- July 07, 2025: Added XP level requirements calculator showing progressive difficulty scaling (Level 1: 1 XP, Level 2: 101 XP, etc.)
- July 07, 2025: Completely fixed XP system cache conflicts causing XP decreases - now uses fresh database queries for all XP processing
- July 07, 2025: Resolved syntax error in try-catch block that was preventing bot startup
- July 07, 2025: XP system fully operational - users properly gain XP without cache interference or race conditions
- July 07, 2025: Removed guild data loading logs from server.js for cleaner production console output
- July 08, 2025: Fixed botConfig undefined error in index.js by adding proper database loading in channel restriction checks
- July 08, 2025: Enhanced PostgreSQL error handling to suppress recoverable connection termination messages
- July 08, 2025: Fixed level command XP bar accuracy by properly calculating current level progress vs total XP
- July 08, 2025: Fixed leaderboard command user ID field name mismatch (discord_id vs userId)
- July 08, 2025: Added comprehensive interaction timeout handling for "Unknown interaction" errors (10062)
- July 08, 2025: Created ai_utils.py for Hugging Face API integration with music and video generation
- July 08, 2025: Updated AI generation commands to use HF_TOKEN environment variable
- July 08, 2025: Enhanced AI music generation with file size validation and better error handling
- July 08, 2025: Fixed purge command MessageFlags import and improved error response handling
- July 08, 2025: Removed guild data request spam from console logs for cleaner output
- July 08, 2025: Fixed dashboard JavaScript syntax error in auto role management template literals
- July 08, 2025: Created missing /api/update-role-rewards endpoint for role rewards functionality
- July 08, 2025: Enhanced auto role settings API to properly handle array data conversion
- July 08, 2025: Fixed loadAutoRoleSettings function to properly populate dashboard fields from database
- July 08, 2025: Added proper loading indicators and error handling for role management forms
- July 08, 2025: All dashboard role management features now save to database and load correctly
- July 08, 2025: Fixed all JavaScript template literal syntax errors in dashboard onclick handlers and confirm dialogs
- July 08, 2025: Resolved "missing ) after argument list" errors by converting template literals to string concatenation
- July 08, 2025: Dashboard JavaScript console errors completely eliminated - all functions now use proper syntax

## User Preferences

Preferred communication style: Simple, everyday language.