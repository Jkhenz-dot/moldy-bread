"""
AI Utilities for Hugging Face Integration
Handles music and video generation using Hugging Face Inference API
"""

import asyncio
import aiohttp
import os
from typing import Optional, Dict, Any

class HuggingFaceAPI:
    def __init__(self):
        self.api_key = os.getenv('HF_TOKEN') or os.getenv('HUGGINGFACE_API_KEY')
        self.base_url = "https://api-inference.huggingface.co/models"
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
    
    async def _make_request(self, model: str, payload: Dict[str, Any], timeout: int = 120) -> Optional[bytes]:
        """Make async request to Hugging Face API"""
        if not self.api_key:
            raise Exception("HF_TOKEN not found in environment")
        
        url = f"{self.base_url}/{model}"
        
        async with aiohttp.ClientSession() as session:
            try:
                async with session.post(url, json=payload, headers=self.headers, timeout=timeout) as response:
                    if response.status == 200:
                        return await response.read()
                    elif response.status == 503:
                        # Model is loading, wait and retry
                        await asyncio.sleep(20)
                        async with session.post(url, json=payload, headers=self.headers, timeout=timeout) as retry_response:
                            if retry_response.status == 200:
                                return await retry_response.read()
                            else:
                                error_text = await retry_response.text()
                                raise Exception(f"API Error {retry_response.status}: {error_text}")
                    else:
                        error_text = await response.text()
                        raise Exception(f"API Error {response.status}: {error_text}")
            except asyncio.TimeoutError:
                raise Exception("Request timeout - model took too long to respond")
            except Exception as e:
                raise Exception(f"Request failed: {str(e)}")
    
    async def generate_music(self, prompt: str, model: str = "facebook/musicgen-small") -> Optional[bytes]:
        """Generate music from text prompt"""
        payload = {
            "inputs": prompt,
            "parameters": {
                "max_new_tokens": 512,
                "temperature": 0.8,
                "do_sample": True,
                "guidance_scale": 3.0
            }
        }
        
        try:
            result = await self._make_request(model, payload, timeout=240)  # Increased timeout
            if result and len(result) > 5000:  # Higher threshold for valid audio
                return result
            else:
                print(f"Generated content too small: {len(result) if result else 0} bytes")
                return None
        except Exception as e:
            print(f"Music generation error: {e}")
            return None
    
    async def generate_video(self, prompt: str, model: str = "damo-vilab/text-to-video-ms-1.7b") -> Optional[bytes]:
        """Generate video from text prompt"""
        payload = {
            "inputs": prompt,
            "parameters": {
                "num_frames": 24,
                "height": 320,
                "width": 576
            }
        }
        
        try:
            result = await self._make_request(model, payload, timeout=300)
            if result and len(result) > 10000:  # Basic validation for video
                return result
            return None
        except Exception as e:
            print(f"Video generation error: {e}")
            return None

# Global instance
hf_api = HuggingFaceAPI()

if __name__ == "__main__":
    async def test():
        # Test music generation
        result = await hf_api.generate_music("upbeat electronic dance music")
        print(f"Music generation result: {'Success' if result else 'Failed'}")
        
        # Test video generation
        result = await hf_api.generate_video("a cat playing with a ball")
        print(f"Video generation result: {'Success' if result else 'Failed'}")
    
    asyncio.run(test())