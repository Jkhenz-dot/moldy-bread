#!/usr/bin/env python3
"""
JSON Logger Script

A command-line script that reads JSON files and logs messages using Python's logging module.
Supports different log levels and handles various JSON message formats.
"""

import json
import logging
import argparse
import sys
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Any, Optional


class JSONLogger:
    """Class to handle JSON file reading and logging operations."""
    
    def __init__(self, log_level: str = "INFO"):
        """
        Initialize the JSON logger with specified log level.
        
        Args:
            log_level (str): Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        """
        self.setup_logging(log_level)
    
    def setup_logging(self, log_level: str) -> None:
        """
        Configure logging with proper format and level.
        
        Args:
            log_level (str): Logging level to set
        """
        # Convert string level to logging constant
        numeric_level = getattr(logging, log_level.upper(), logging.INFO)
        
        # Configure logging format
        logging.basicConfig(
            level=numeric_level,
            format='%(asctime)s - %(levelname)s - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        
        self.logger = logging.getLogger(__name__)
        self.logger.info(f"JSON Logger initialized with level: {log_level.upper()}")
    
    def read_json_file(self, file_path: str) -> Optional[Dict[str, Any]]:
        """
        Read and parse JSON file.
        
        Args:
            file_path (str): Path to the JSON file
            
        Returns:
            Optional[Dict[str, Any]]: Parsed JSON data or None if error
        """
        try:
            path = Path(file_path)
            
            if not path.exists():
                self.logger.error(f"File not found: {file_path}")
                return None
            
            if not path.is_file():
                self.logger.error(f"Path is not a file: {file_path}")
                return None
            
            with open(path, 'r', encoding='utf-8') as file:
                data = json.load(file)
                self.logger.info(f"Successfully loaded JSON file: {file_path}")
                return data
                
        except json.JSONDecodeError as e:
            self.logger.error(f"Invalid JSON format in file {file_path}: {e}")
            return None
        except PermissionError:
            self.logger.error(f"Permission denied reading file: {file_path}")
            return None
        except Exception as e:
            self.logger.error(f"Unexpected error reading file {file_path}: {e}")
            return None
    
    def get_log_level_from_string(self, level_str: str) -> int:
        """
        Convert string log level to logging constant.
        
        Args:
            level_str (str): String representation of log level
            
        Returns:
            int: Logging level constant
        """
        level_map = {
            'debug': logging.DEBUG,
            'info': logging.INFO,
            'warning': logging.WARNING,
            'warn': logging.WARNING,
            'error': logging.ERROR,
            'critical': logging.CRITICAL,
            'fatal': logging.CRITICAL
        }
        
        return level_map.get(level_str.lower(), logging.INFO)
    
    def log_message(self, message: str, level: str = "info", **kwargs) -> None:
        """
        Log a message with specified level and additional context.
        
        Args:
            message (str): Message to log
            level (str): Log level for the message
            **kwargs: Additional context to include in log
        """
        log_level = self.get_log_level_from_string(level)
        
        # Add context information if provided
        context_str = ""
        if kwargs:
            context_parts = [f"{k}={v}" for k, v in kwargs.items()]
            context_str = f" [{', '.join(context_parts)}]"
        
        full_message = f"{message}{context_str}"
        
        # Log with appropriate level
        if log_level == logging.DEBUG:
            self.logger.debug(full_message)
        elif log_level == logging.INFO:
            self.logger.info(full_message)
        elif log_level == logging.WARNING:
            self.logger.warning(full_message)
        elif log_level == logging.ERROR:
            self.logger.error(full_message)
        elif log_level == logging.CRITICAL:
            self.logger.critical(full_message)
    
    def process_json_data(self, data: Dict[str, Any]) -> None:
        """
        Process JSON data and log messages based on content.
        
        Args:
            data (Dict[str, Any]): JSON data to process
        """
        if not data:
            self.logger.warning("Empty JSON data provided")
            return
        
        # Handle different JSON structures
        if isinstance(data, dict):
            if 'messages' in data:
                # Handle format: {"messages": [{"message": "...", "level": "..."}, ...]}
                self._process_messages_array(data['messages'])
            elif 'logs' in data:
                # Handle format: {"logs": [{"text": "...", "severity": "..."}, ...]}
                self._process_logs_array(data['logs'])
            elif 'message' in data:
                # Handle format: {"message": "...", "level": "..."}
                self._process_single_message(data)
            else:
                # Handle generic object - log all key-value pairs
                self._process_generic_object(data)
        elif isinstance(data, list):
            # Handle array of messages
            for item in data:
                if isinstance(item, dict):
                    self._process_single_message(item)
                else:
                    self.logger.info(f"Array item: {item}")
        else:
            self.logger.info(f"JSON content: {data}")
    
    def _process_messages_array(self, messages: List[Dict[str, Any]]) -> None:
        """Process array of message objects."""
        for i, msg in enumerate(messages):
            if isinstance(msg, dict):
                message = msg.get('message', msg.get('text', f"Message {i+1}"))
                level = msg.get('level', msg.get('severity', 'info'))
                timestamp = msg.get('timestamp', msg.get('time'))
                
                # Add timestamp to context if available
                context = {}
                if timestamp:
                    context['timestamp'] = timestamp
                
                self.log_message(message, level, **context)
            else:
                self.logger.info(f"Message {i+1}: {msg}")
    
    def _process_logs_array(self, logs: List[Dict[str, Any]]) -> None:
        """Process array of log objects."""
        for i, log_entry in enumerate(logs):
            if isinstance(log_entry, dict):
                message = log_entry.get('text', log_entry.get('message', f"Log {i+1}"))
                level = log_entry.get('severity', log_entry.get('level', 'info'))
                timestamp = log_entry.get('timestamp', log_entry.get('time'))
                
                # Add timestamp to context if available
                context = {}
                if timestamp:
                    context['timestamp'] = timestamp
                
                self.log_message(message, level, **context)
            else:
                self.logger.info(f"Log {i+1}: {log_entry}")
    
    def _process_single_message(self, data: Dict[str, Any]) -> None:
        """Process a single message object."""
        message = data.get('message', data.get('text', 'No message content'))
        level = data.get('level', data.get('severity', 'info'))
        
        # Extract additional context
        context = {}
        for key, value in data.items():
            if key not in ['message', 'text', 'level', 'severity']:
                context[key] = value
        
        self.log_message(message, level, **context)
    
    def _process_generic_object(self, data: Dict[str, Any]) -> None:
        """Process a generic JSON object."""
        for key, value in data.items():
            if isinstance(value, (dict, list)):
                self.logger.info(f"{key}: {json.dumps(value, indent=2)}")
            else:
                self.logger.info(f"{key}: {value}")


def main():
    """Main function to handle command-line execution."""
    parser = argparse.ArgumentParser(
        description="Read JSON files and log messages using Python's logging module",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s messages.json
  %(prog)s data.json --log-level DEBUG
  %(prog)s logs.json --log-level WARNING
  
Supported JSON formats:
  - {"messages": [{"message": "text", "level": "info"}, ...]}
  - {"logs": [{"text": "content", "severity": "warning"}, ...]}
  - {"message": "single message", "level": "error"}
  - [{"message": "msg1"}, {"message": "msg2"}]
  - {"key1": "value1", "key2": "value2"}
        """
    )
    
    parser.add_argument(
        'file_path',
        help='Path to the JSON file to process'
    )
    
    parser.add_argument(
        '--log-level',
        choices=['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL'],
        default='INFO',
        help='Set the logging level (default: INFO)'
    )
    
    parser.add_argument(
        '--version',
        action='version',
        version='JSON Logger 1.0.0'
    )
    
    args = parser.parse_args()
    
    try:
        # Initialize logger
        json_logger = JSONLogger(args.log_level)
        
        # Read and process JSON file
        data = json_logger.read_json_file(args.file_path)
        
        if data is not None:
            json_logger.process_json_data(data)
            json_logger.logger.info("JSON processing completed successfully")
        else:
            json_logger.logger.error("Failed to process JSON file")
            sys.exit(1)
            
    except KeyboardInterrupt:
        print("\nOperation cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"Unexpected error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
