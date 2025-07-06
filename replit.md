# JSON Logger

## Overview

JSON Logger is a Python command-line application that reads JSON files and logs messages using Python's built-in logging module. The application provides a simple interface for processing JSON message files and outputting structured logs with timestamps and configurable log levels.

## System Architecture

The application follows a simple, single-tier architecture:

- **Language**: Python 3
- **Architecture Pattern**: Class-based object-oriented design
- **Interface**: Command-line interface (CLI)
- **Dependencies**: Standard Python library only (no external dependencies)

## Key Components

### Core Components

1. **JSONLogger Class**
   - Main application class handling JSON file operations and logging
   - Encapsulates logging configuration and file reading logic
   - Provides configurable log levels (DEBUG, INFO, WARNING, ERROR, CRITICAL)

2. **Command-Line Interface**
   - Uses argparse for command-line argument parsing
   - Accepts input file path as primary argument
   - Supports log level configuration

3. **Logging System**
   - Built on Python's standard logging module
   - Configurable log levels with timestamp formatting
   - Console output with structured message format

### File Structure

```
├── README.md           # Project documentation
├── json_logger.py      # Main application script
└── replit.md          # This architecture documentation
```

## Data Flow

1. **Input Processing**: Command-line arguments are parsed to extract file path and optional log level
2. **File Reading**: JSON file is read and parsed using Python's json module
3. **Message Processing**: JSON data is processed to extract message information
4. **Logging Output**: Messages are logged using configured log level with timestamps
5. **Error Handling**: File reading errors and JSON parsing errors are handled gracefully

## External Dependencies

The application is designed to use only Python standard library modules:

- `json` - JSON file parsing
- `logging` - Message logging functionality
- `argparse` - Command-line argument parsing
- `sys` - System-specific parameters and functions
- `pathlib` - Object-oriented filesystem paths
- `datetime` - Date and time handling
- `typing` - Type hints for better code documentation

## Deployment Strategy

**Local Execution**: The application is designed for local command-line execution:
- Single Python script deployment
- No external dependencies to install
- Cross-platform compatibility (Windows, macOS, Linux)
- Executable script with shebang for Unix-like systems

**Distribution**: Can be distributed as a standalone Python script or packaged using standard Python packaging tools.

## Changelog

```
Changelog:
- July 06, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```

## Development Notes

- The application uses type hints for better code documentation and IDE support
- Error handling is implemented for file operations and JSON parsing
- The logging configuration is centralized in the JSONLogger class
- The script is designed to be both importable as a module and executable as a script
- Future enhancements could include output file logging, configuration file support, and batch processing capabilities