import trafilatura
import json
import sys
import asyncio
from urllib.parse import quote_plus
import re

async def web_search(query):
    """
    Perform web search and extract content using trafilatura
    """
    try:
        # Clean and prepare the search query
        query = query.strip()
        if not query:
            return "No search query provided"
        
        # Use DuckDuckGo for web search (respects robots.txt)
        search_url = f"https://lite.duckduckgo.com/lite/?q={quote_plus(query)}"
        
        # Download the search results page
        downloaded = trafilatura.fetch_url(search_url)
        if not downloaded:
            return "Unable to fetch search results"
        
        # Extract text content
        text = trafilatura.extract(downloaded)
        if not text:
            return "No search results found"
        
        # Clean and summarize the results (first 500 characters)
        clean_text = re.sub(r'\s+', ' ', text).strip()
        summary = clean_text[:500] + "..." if len(clean_text) > 500 else clean_text
        
        return f"Search results for '{query}': {summary}"
        
    except Exception as e:
        return f"Search failed: {str(e)}"

if __name__ == "__main__":
    if len(sys.argv) > 1:
        query = " ".join(sys.argv[1:])
        result = asyncio.run(web_search(query))
        print(result)
    else:
        print("No search query provided")