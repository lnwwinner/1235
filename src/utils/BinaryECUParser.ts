/**
 * BinaryECUParser (TypeScript Version)
 * 
 * Provides logic for reading and parsing binary ECU files.
 */
export class BinaryECUParser {
  /**
   * Extracts map data from a buffer.
   */
  static extractMapData(
    buffer: Buffer,
    address: number,
    cols: number,
    rows: number,
    type: '8bit' | '16bit_be' | '16bit_le' = '16bit_be',
    isSigned: boolean = false,
    factor: number = 1.0
  ): number[][] {
    const data: number[][] = [];
    const bytesPerVal = type.includes('16bit') ? 2 : 1;
    
    if (address + (cols * rows * bytesPerVal) > buffer.length) {
      throw new Error('Address out of bounds');
    }

    for (let r = 0; r < rows; r++) {
      const row: number[] = [];
      for (let c = 0; c < cols; c++) {
        const offset = address + (r * cols + c) * bytesPerVal;
        let val = 0;

        if (type === '8bit') {
          val = isSigned ? buffer.readInt8(offset) : buffer.readUInt8(offset);
        } else if (type === '16bit_be') {
          val = isSigned ? buffer.readInt16BE(offset) : buffer.readUInt16BE(offset);
        } else if (type === '16bit_le') {
          val = isSigned ? buffer.readInt16LE(offset) : buffer.readUInt16LE(offset);
        }

        row.push(val * factor);
      }
      data.push(row);
    }
    return data;
  }

  /**
   * Simple checksum calculation (placeholder for real ECU algorithms)
   */
  static calculateChecksum(buffer: Buffer): string {
    let sum = 0;
    for (let i = 0; i < buffer.length; i++) {
      sum = (sum + buffer[i]) % 0xFFFFFFFF;
    }
    return '0x' + sum.toString(16).toUpperCase().padStart(8, '0');
  }
}
