import numpy as np
import json
import os

class BinaryECUParser:
    """
    BinaryECUParser
    
    A class that reads actual .bin, .ori, and .mod files, and dynamically extracts map data
    based on external structural definitions.
    """

    def read_binary(self, filepath: str) -> bytes:
        """
        Safely load raw binary ECU files.
        
        Args:
            filepath: Path to the binary file.
            
        Returns:
            Raw bytes of the file.
        """
        try:
            if not os.path.exists(filepath):
                raise FileNotFoundError(f"ECU file not found: {filepath}")
            
            with open(filepath, 'rb') as f:
                return f.read()
        except Exception as e:
            print(f"Error reading binary: {e}")
            raise

    def extract_map_data(self, 
                         binary_data: bytes, 
                         start_address: int, 
                         columns: int, 
                         rows: int, 
                         data_type: str = '16bit_hi_lo', 
                         is_signed: bool = False, 
                         conversion_factor: float = 1.0) -> np.ndarray:
        """
        Parses raw bytes into a 2D numpy array.
        
        Args:
            binary_data: Raw binary data.
            start_address: Starting hex address of the map.
            columns: Number of columns (X-axis).
            rows: Number of rows (Y-axis).
            data_type: '8bit', '16bit_hi_lo' (Big Endian), '16bit_lo_hi' (Little Endian).
            is_signed: Whether to treat values as signed integers.
            conversion_factor: Factor to scale the raw values.
            
        Returns:
            2D numpy array of parsed map data.
        """
        bytes_per_val = 2 if '16bit' in data_type else 1
        total_bytes = columns * rows * bytes_per_val
        
        # Bounds check
        if start_address + total_bytes > len(binary_data):
            raise IndexError(f"Out of bounds: Address 0x{start_address:X} + {total_bytes} bytes exceeds file size {len(binary_data)}")

        # Extract slice
        raw_slice = binary_data[start_address : start_address + total_bytes]
        
        # Determine dtype for numpy
        if data_type == '8bit':
            np_dtype = np.int8 if is_signed else np.uint8
        elif data_type == '16bit_hi_lo':
            # Big Endian
            np_dtype = '>i2' if is_signed else '>u2'
        elif data_type == '16bit_lo_hi':
            # Little Endian
            np_dtype = '<i2' if is_signed else '<u2'
        else:
            raise ValueError(f"Unsupported data_type: {data_type}")

        # Convert to numpy array
        data = np.frombuffer(raw_slice, dtype=np_dtype).astype(float)
        
        # Apply conversion factor
        data *= conversion_factor
        
        # Reshape to 2D
        return data.reshape((rows, columns))

    def load_definitions_from_json(self, json_filepath: str) -> dict:
        """
        Loads map metadata from a JSON file.
        
        Args:
            json_filepath: Path to the JSON definition file.
            
        Returns:
            Dictionary of map definitions.
        """
        try:
            with open(json_filepath, 'r') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading definitions: {e}")
            raise

# Example Usage:
# parser = BinaryECUParser()
# bin_data = parser.read_binary("my_ecu.bin")
# definitions = parser.load_definitions_from_json("bosch_edc17.json")
# for map_info in definitions['maps']:
#     data = parser.extract_map_data(
#         bin_data, 
#         int(map_info['address'], 16), 
#         map_info['cols'], 
#         map_info['rows'],
#         map_info.get('type', '16bit_hi_lo')
#     )
#     print(f"Loaded {map_info['name']}:\n{data}")
