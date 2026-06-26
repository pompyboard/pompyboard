// https://docs.kernel.org/hid/index.html

use crate::sensor::{self, COLS, ROWS, SENSOR_COUNT, SensorGrid};
use crate::usb::{HID_REPORT_SIZE_BYTES, Usb};

const GRID_TO_HID_SCALE: f32 = 10000.0;

#[derive(Copy, Clone, Default)]
pub struct Cursor {
    pub x: f32,
    pub y: f32,
    pub valid: bool,
}

pub struct Tablet {
    threshold: u16,
    ema_initialized: bool,
    smoothed_x: f32,
    smoothed_y: f32,
}

impl Tablet {
    pub const fn new() -> Self {
        Self {
            threshold: 2200,
            ema_initialized: false,
            smoothed_x: 0.0,
            smoothed_y: 0.0,
        }
    }

    #[allow(dead_code)]
    pub fn set_threshold(&mut self, t: u16) {
        self.threshold = t;
    }

    pub fn find_centroid(&self, grid: &[u16; SENSOR_COUNT]) -> Cursor {
        let cols = COLS;
        let rows = ROWS;
        let threshold = self.threshold;

        let mut sum_x = 0.0_f32;
        let mut sum_y = 0.0_f32;
        let mut total = 0.0_f32;
        let mut clustered_count = 0u32;

        for r in 0..rows {
            for c in 0..cols {
                let raw = grid[r * cols + c];
                if raw > threshold {
                    let has_neighbor = (r > 0 && grid[(r - 1) * cols + c] > threshold)
                        || (r + 1 < rows && grid[(r + 1) * cols + c] > threshold)
                        || (c > 0 && grid[r * cols + c - 1] > threshold)
                        || (c + 1 < cols && grid[r * cols + c + 1] > threshold);

                    if has_neighbor {
                        clustered_count += 1;
                        let val = (raw - threshold) as f32;
                        sum_x += val * c as f32;
                        sum_y += val * r as f32;
                        total += val;
                    }
                }
            }
        }

        if clustered_count >= 3 && total > 0.0 {
            Cursor {
                x: sum_x / total,
                y: sum_y / total,
                valid: true,
            }
        } else {
            Cursor {
                x: 0.0,
                y: 0.0,
                valid: false,
            }
        }
    }

    pub fn update_cursor(&mut self, grid: &SensorGrid, cursor: &mut Cursor, usb: &Usb) {
        let alpha = grid.ema_alpha();

        if alpha > 0.0 {
            if !self.ema_initialized && cursor.valid {
                self.smoothed_x = cursor.x;
                self.smoothed_y = cursor.y;
                self.ema_initialized = true;
            } else if self.ema_initialized {
                self.smoothed_x = alpha * cursor.x + (1.0 - alpha) * self.smoothed_x;
                self.smoothed_y = alpha * cursor.y + (1.0 - alpha) * self.smoothed_y;
            }
            cursor.x = self.smoothed_x;
            cursor.y = self.smoothed_y;
        }

        let mut report = [0u8; HID_REPORT_SIZE_BYTES];
        if cursor.valid {
            let x_usb = (cursor.x * GRID_TO_HID_SCALE / (sensor::COLS - 1) as f32) as u16;
            let y_usb = (cursor.y * GRID_TO_HID_SCALE / (sensor::ROWS - 1) as f32) as u16;
            // report[0] = 0; // buttons
            report[1] = 0x02; // HID "in range" flag
            report[2..4].copy_from_slice(&x_usb.to_le_bytes());
            report[4..6].copy_from_slice(&y_usb.to_le_bytes());
            // report[6..8] = 0; // tip pressure
        } else if alpha > 0.0 {
            self.ema_initialized = false;
        }

        usb.send_hid_report(&report);
    }
}
