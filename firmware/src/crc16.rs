//! CRC-16-CCITT XModem, poly 0x1021, init 0x0000, no final xor, MSB-first, no reflection.

const POLY: u16 = 0x1021;

const fn table_entry(index: u16) -> u16 {
    let mut crc = index << 8;
    let mut i = 0;
    while i < 8 {
        if crc & 0x8000 != 0 {
            crc = (crc << 1) ^ POLY;
        } else {
            crc <<= 1;
        }
        i += 1;
    }
    crc
}

const fn build_table() -> [u16; 256] {
    let mut t = [0u16; 256];
    let mut i = 0;
    while i < 256 {
        t[i] = table_entry(i as u16);
        i += 1;
    }
    t
}

const CRC16_TABLE: [u16; 256] = build_table();

pub fn crc16_ccitt(data: &[u8]) -> u16 {
    let mut crc: u16 = 0;

    for &b in data {
        let idx = (((crc >> 8) as u8) ^ b) as usize;
        crc = (crc << 8) ^ CRC16_TABLE[idx];
    }

    crc
}
