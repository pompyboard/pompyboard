use stm32f4xx_hal::adc::config::SampleTime;

use crate::crc16::crc16_ccitt;
use crate::profiler::PerformanceProfiler;
use crate::sensor::{SENSOR_COUNT, SensorGrid, adc_sampling_label};
use crate::usb::Usb;

pub const PROTOCOL_VERSION: u8 = 0x01;
pub const SYNC_LO: u8 = 0xAA;
pub const SYNC_HI: u8 = 0x55;

pub const SUB_GRID: u8 = 1 << 0;

pub const MSG_GRID: u8 = 0x10;
pub const MSG_CONFIG: u8 = 0x20;
pub const MSG_PERF: u8 = 0x30;

pub const CMD_SUBSCRIBE: u8 = 0x01;
pub const CMD_UNSUBSCRIBE: u8 = 0x04;
pub const CMD_UNSUBSCRIBE_TO: u8 = 0x06;
pub const CMD_SET_MUX_SETTLING: u8 = 0x10;
pub const CMD_SET_ADC_SAMPLING: u8 = 0x11;
pub const CMD_GET_CONFIG: u8 = 0x12;
pub const CMD_SET_ADC_RE_READS: u8 = 0x13;
pub const CMD_SET_ADC_OVERSAMPLE: u8 = 0x14;
pub const CMD_GET_PERF: u8 = 0x15;
pub const CMD_SET_EMA_ALPHA: u8 = 0x16;

/// total size = 6 (header) + 418 (209×u16) + 2 + 2 + 1 + 2 (crc) = 431.
const GRID_FRAME_LEN: usize = 431;
const GRID_FRAME_CRC_OFFSET: usize = 429;

const CONFIG_FRAME_LEN: usize = 16;
const PERF_FRAME_LEN: usize = 40;

/// Grid frames are emitted every Nth tick when subscribed.
const GRID_SEND_EVERY_N_TICKS: u8 = 10;

pub struct Telemetry {
    subscriptions: u8,
    frame_counter: u16,
    grid_tick_counter: u8,
}

impl Telemetry {
    pub const fn new() -> Self {
        Self {
            subscriptions: 0,
            frame_counter: 0,
            grid_tick_counter: 0,
        }
    }

    pub fn is_subscribed(&self, flag: u8) -> bool {
        (self.subscriptions & flag) != 0
    }

    /// Pump the RX path: pull any pending host command and dispatch it.
    pub fn service(
        &mut self,
        usb: &mut Usb,
        grid: &mut SensorGrid,
        profiler: &PerformanceProfiler,
    ) {
        let mut buf = [0u8; 64];
        let n = usb.cdc_rx_pop(&mut buf);
        if n > 0 {
            self.on_command(buf[0], &buf[1..n], usb, grid, profiler);
        }
    }

    fn on_command(
        &mut self,
        cmd: u8,
        data: &[u8],
        usb: &mut Usb,
        grid: &mut SensorGrid,
        profiler: &PerformanceProfiler,
    ) {
        match cmd {
            CMD_SUBSCRIBE => {
                let flags = if !data.is_empty() { data[0] } else { SUB_GRID };
                self.subscriptions |= flags;
                defmt::info!(
                    "CDC: subscribe 0x{:02x} (now=0x{:02x})",
                    flags,
                    self.subscriptions
                );
            }
            CMD_UNSUBSCRIBE => {
                self.subscriptions = 0;
                defmt::info!("CDC: unsubscribe all");
            }
            CMD_UNSUBSCRIBE_TO => {
                if let Some(&flags) = data.first() {
                    self.subscriptions &= !flags;
                    defmt::info!(
                        "CDC: unsubscribe 0x{:02x} (now=0x{:02x})",
                        flags,
                        self.subscriptions
                    );
                }
            }
            CMD_SET_MUX_SETTLING => {
                if data.len() >= 4 {
                    let cycles = u32::from_le_bytes([data[0], data[1], data[2], data[3]]);
                    grid.set_mux_settling(cycles);
                    defmt::info!("CDC: mux_settling={}", cycles);
                }
            }
            CMD_SET_ADC_SAMPLING => {
                if let Some(&idx) = data.first()
                    && idx < 8
                {
                    let s = sampling_from_index(idx);
                    grid.set_adc_sampling(s);
                    defmt::info!("CDC: adc_sampling={}", adc_sampling_label(s));
                }
            }
            CMD_GET_CONFIG => {
                defmt::info!("CDC: get_config requested");
                self.send_config(grid, usb);
            }
            CMD_SET_ADC_RE_READS => {
                if let Some(&count) = data.first() {
                    grid.set_adc_re_reads(count);
                    defmt::info!("CDC: adc_re_reads={}", count);
                }
            }
            CMD_SET_ADC_OVERSAMPLE => {
                if let Some(&v) = data.first() {
                    grid.set_oversample_enabled(v != 0);
                    defmt::info!("CDC: adc_oversample={}", if v != 0 { "on" } else { "off" });
                }
            }
            CMD_GET_PERF => {
                defmt::info!("CDC: get_perf requested");
                self.send_perf(profiler, usb);
            }
            CMD_SET_EMA_ALPHA => {
                if let Some(&raw) = data.first() {
                    let alpha = raw as f32 / 255.0;
                    grid.set_ema_alpha(alpha);
                    let per_mille = (alpha * 1000.0) as u32;
                    defmt::info!("CDC: ema_alpha=0.{:03} (raw={})", per_mille, raw);
                }
            }
            _ => {
                defmt::warn!("CDC: Unknown command!");
            }
        }
    }

    /// Emit a grid frame every N ticks, if subscribed.
    pub fn feed_grid(
        &mut self,
        grid_buffer: &[u16; SENSOR_COUNT],
        cx: f32,
        cy: f32,
        valid: bool,
        usb: &mut Usb,
    ) {
        self.grid_tick_counter = self.grid_tick_counter.wrapping_add(1);
        if self.grid_tick_counter < GRID_SEND_EVERY_N_TICKS {
            return;
        }
        self.grid_tick_counter = 0;

        if !self.is_subscribed(SUB_GRID) {
            return;
        }

        let mut frame = [0u8; GRID_FRAME_LEN];
        // Header
        frame[0] = SYNC_LO;
        frame[1] = SYNC_HI;
        frame[2] = PROTOCOL_VERSION;
        frame[3] = MSG_GRID;
        frame[4..6].copy_from_slice(&self.frame_counter.to_le_bytes());
        // values[209]
        for (i, &v) in grid_buffer.iter().enumerate() {
            let base = 6 + i * 2;
            frame[base..base + 2].copy_from_slice(&v.to_le_bytes());
        }
        // cursor (scaled x100)
        let cursor_x = (cx * 100.0) as i16;
        let cursor_y = (cy * 100.0) as i16;
        frame[424..426].copy_from_slice(&cursor_x.to_le_bytes());
        frame[426..428].copy_from_slice(&cursor_y.to_le_bytes());
        frame[428] = if valid { 1 } else { 0 };
        // CRC over (header + payload)
        let crc = crc16_ccitt(&frame[..GRID_FRAME_CRC_OFFSET]);
        frame[GRID_FRAME_CRC_OFFSET..GRID_FRAME_CRC_OFFSET + 2].copy_from_slice(&crc.to_le_bytes());

        if self.frame_counter < 3 {
            defmt::info!(
                "GRID#{} subs=0x{:02x}",
                self.frame_counter,
                self.subscriptions
            );
        }

        let _ = usb.cdc_send_frame(&frame);
        self.frame_counter = self.frame_counter.wrapping_add(1);
    }

    fn send_config(&self, grid: &SensorGrid, usb: &mut Usb) {
        let mut resp = [0u8; CONFIG_FRAME_LEN];
        resp[0] = SYNC_LO;
        resp[1] = SYNC_HI;
        resp[2] = PROTOCOL_VERSION;
        resp[3] = MSG_CONFIG;
        // seq = 0
        resp[6..10].copy_from_slice(&grid.mux_settling().to_le_bytes());
        resp[10] = grid.adc_sampling() as u8;
        resp[11] = grid.adc_re_reads();
        resp[12] = if grid.oversample_enabled() { 1 } else { 0 };
        resp[13] = (grid.ema_alpha() * 255.0) as u8;
        let crc = crc16_ccitt(&resp[..14]);
        resp[14..16].copy_from_slice(&crc.to_le_bytes());
        let _ = usb.cdc_send_frame(&resp);
    }

    fn send_perf(&self, profiler: &PerformanceProfiler, usb: &mut Usb) {
        let fields: [u32; 8] = [
            profiler.last_hz(),
            profiler.last_telemetry_service_us(),
            profiler.last_scan_us(),
            profiler.last_centroid_us(),
            profiler.last_usb_us(),
            profiler.last_mux_us(),
            profiler.last_single_read_us(),
            profiler.last_tuning_overhead_us(),
        ];
        let mut resp = [0u8; PERF_FRAME_LEN];
        resp[0] = SYNC_LO;
        resp[1] = SYNC_HI;
        resp[2] = PROTOCOL_VERSION;
        resp[3] = MSG_PERF;
        // seq = 0
        for (i, &f) in fields.iter().enumerate() {
            let base = 6 + i * 4;
            resp[base..base + 4].copy_from_slice(&f.to_le_bytes());
        }
        let crc = crc16_ccitt(&resp[..38]);
        resp[38..40].copy_from_slice(&crc.to_le_bytes());
        let _ = usb.cdc_send_frame(&resp);
    }
}

fn sampling_from_index(idx: u8) -> SampleTime {
    match idx {
        0 => SampleTime::Cycles_3,
        1 => SampleTime::Cycles_15,
        2 => SampleTime::Cycles_28,
        3 => SampleTime::Cycles_56,
        4 => SampleTime::Cycles_84,
        5 => SampleTime::Cycles_112,
        6 => SampleTime::Cycles_144,
        _ => SampleTime::Cycles_480,
    }
}
