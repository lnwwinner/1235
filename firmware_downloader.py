import os
import requests
import json
from typing import List, Dict, Optional

class FirmwareDownloader:
    """
    FirmwareDownloader
    
    A module to search, validate, and download ECU firmware files.
    """
    
    def __init__(self, download_dir: str = "uploads/online_firmware/"):
        self.download_dir = download_dir
        if not os.path.exists(self.download_dir):
            os.makedirs(self.download_dir)

    def validate_file_size(self, file_size_bytes: int, expected_sizes_kb: List[int]) -> bool:
        """
        Validates if the file size matches standard ECU memory sizes.
        Common sizes: 512KB, 1024KB (1MB), 2048KB (2MB), 4096KB (4MB).
        """
        file_size_kb = file_size_bytes / 1024
        # Allow a small margin for headers or padding (e.g., 1%)
        for expected in expected_sizes_kb:
            if abs(file_size_kb - expected) < (expected * 0.05):
                return True
        return False

    def download_firmware(self, url: str, filename: str, expected_sizes_kb: Optional[List[int]] = None) -> Dict:
        """
        Downloads a firmware file from a URL with validation.
        """
        try:
            response = requests.get(url, stream=True, timeout=30)
            response.raise_for_status()
            
            content_length = response.headers.get('content-length')
            if content_length:
                size = int(content_length)
                if expected_sizes_kb and not self.validate_file_size(size, expected_sizes_kb):
                    return {"status": "error", "message": f"Invalid file size: {size/1024:.2f}KB"}

            file_path = os.path.join(self.download_dir, filename)
            
            with open(file_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            
            actual_size = os.path.getsize(file_path)
            if expected_sizes_kb and not self.validate_file_size(actual_size, expected_sizes_kb):
                os.remove(file_path)
                return {"status": "error", "message": "Downloaded file failed size validation."}

            return {
                "status": "success",
                "path": file_path,
                "size": actual_size,
                "filename": filename
            }
            
        except Exception as e:
            return {"status": "error", "message": str(e)}

# This script can be called from Node.js or used as a standalone module.
