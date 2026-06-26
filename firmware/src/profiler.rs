use cortex_m::peripheral::DWT;

pub const REPORT_INTERVAL_MS: u32 = 2000;

/// Microsecond timings captured
#[derive(Copy, Clone, Default)]
pub struct ScanTiming {
    pub mux_cycles: u32,
    pub single_read_cycles: u32,
    pub tuning_overhead_cycles: u32,
}

pub struct PerformanceProfiler {
    enabled: bool,
    sysclk_hz: u32,

    t_begin: u32,
    t_telemetry_service: u32,
    t_scan: u32,
    t_centroid: u32,
    t_usb: u32,

    tick_start_cycles: u32,
    iterations: u32,
    sum_telemetry_service: u64,
    sum_scan: u64,
    sum_centroid: u64,
    sum_usb: u64,
    sum_cycles: u64,
    sum_mux: u64,
    sum_single_read: u64,
    sum_tuning_overhead: u64,

    last_hz: u32,
    last_telemetry_service_us: u32,
    last_scan_us: u32,
    last_centroid_us: u32,
    last_usb_us: u32,
    last_mux_us: u32,
    last_single_read_us: u32,
    last_tuning_overhead_us: u32,
}

impl PerformanceProfiler {
    pub const fn new(sysclk_hz: u32) -> Self {
        Self {
            enabled: false,
            sysclk_hz,
            t_begin: 0,
            t_telemetry_service: 0,
            t_scan: 0,
            t_centroid: 0,
            t_usb: 0,
            tick_start_cycles: 0,
            iterations: 0,
            sum_telemetry_service: 0,
            sum_scan: 0,
            sum_centroid: 0,
            sum_usb: 0,
            sum_cycles: 0,
            sum_mux: 0,
            sum_single_read: 0,
            sum_tuning_overhead: 0,
            last_hz: 0,
            last_telemetry_service_us: 0,
            last_scan_us: 0,
            last_centroid_us: 0,
            last_usb_us: 0,
            last_mux_us: 0,
            last_single_read_us: 0,
            last_tuning_overhead_us: 0,
        }
    }

    /// Capture the report-interval start timestamp.
    /// Must be called once at startup, *after* the DWT cycle counter has been enabled.
    pub fn init(&mut self) {
        self.tick_start_cycles = DWT::cycle_count();
    }

    /// Enable the profiler. Must be called at the top of each tick.
    pub fn begin(&mut self, enabled: bool) {
        self.enabled = enabled;

        if !enabled {
            return;
        }

        self.t_begin = DWT::cycle_count();
    }

    pub fn mark_telemetry_service(&mut self) {
        if !self.enabled {
            return;
        }
        self.t_telemetry_service = DWT::cycle_count();
    }

    pub fn mark_scan(&mut self) {
        if !self.enabled {
            return;
        }
        self.t_scan = DWT::cycle_count();
    }

    pub fn mark_centroid(&mut self) {
        if !self.enabled {
            return;
        }
        self.t_centroid = DWT::cycle_count();
    }

    pub fn mark_usb(&mut self) {
        if !self.enabled {
            return;
        }
        self.t_usb = DWT::cycle_count();
        self.sum_telemetry_service += self.t_telemetry_service.wrapping_sub(self.t_begin) as u64;
        self.sum_scan += self.t_scan.wrapping_sub(self.t_telemetry_service) as u64;
        self.sum_centroid += self.t_centroid.wrapping_sub(self.t_scan) as u64;
        self.sum_usb += self.t_usb.wrapping_sub(self.t_centroid) as u64;
        self.sum_cycles += self.t_usb.wrapping_sub(self.t_begin) as u64;
        self.iterations += 1;
    }

    pub fn record_scan_details(&mut self, t: &ScanTiming) {
        if !self.enabled {
            return;
        }
        self.sum_mux += t.mux_cycles as u64;
        self.sum_single_read += t.single_read_cycles as u64;
        self.sum_tuning_overhead += t.tuning_overhead_cycles as u64;
    }

    pub fn report_if_due(&mut self) {
        if !self.enabled {
            return;
        }
        let now = DWT::cycle_count();
        let cycles_per_ms = self.sysclk_hz / 1000;
        let elapsed_ms = now.wrapping_sub(self.tick_start_cycles) / cycles_per_ms.max(1);
        if elapsed_ms < REPORT_INTERVAL_MS {
            return;
        }

        let iterations = self.iterations.max(1) as u64;
        let clk = self.sysclk_hz as u64;

        let hz = if elapsed_ms > 0 {
            (self.iterations as u64 * 1000) / elapsed_ms as u64
        } else {
            0
        };
        let us_total = (self.sum_cycles * 1_000_000) / (iterations * clk);
        let us_telemetry_service = (self.sum_telemetry_service * 1_000_000) / (iterations * clk);
        let us_scan = (self.sum_scan * 1_000_000) / (iterations * clk);
        let us_centroid = (self.sum_centroid * 1_000_000) / (iterations * clk);
        let us_usb = (self.sum_usb * 1_000_000) / (iterations * clk);
        let us_mux = (self.sum_mux * 1_000_000) / (iterations * clk);
        let us_single_read = (self.sum_single_read * 1_000_000) / (iterations * clk);
        let us_tuning_overhead = (self.sum_tuning_overhead * 1_000_000) / (iterations * clk);

        self.last_hz = hz as u32;
        self.last_telemetry_service_us = us_telemetry_service as u32;
        self.last_scan_us = us_scan as u32;
        self.last_centroid_us = us_centroid as u32;
        self.last_usb_us = us_usb as u32;
        self.last_mux_us = us_mux as u32;
        self.last_single_read_us = us_single_read as u32;
        self.last_tuning_overhead_us = us_tuning_overhead as u32;

        // Percentages reported as per mille (x1000) for one-decimal output.
        let pct_telemetry_service = if self.sum_cycles > 0 {
            (self.sum_telemetry_service * 1000) / self.sum_cycles
        } else {
            0
        };
        let pct_scan = if self.sum_cycles > 0 {
            (self.sum_scan * 1000) / self.sum_cycles
        } else {
            0
        };
        let pct_centroid = if self.sum_cycles > 0 {
            (self.sum_centroid * 1000) / self.sum_cycles
        } else {
            0
        };
        let pct_usb = if self.sum_cycles > 0 {
            (self.sum_usb * 1000) / self.sum_cycles
        } else {
            0
        };

        defmt::info!(
            "{}Hz  {}us/frame  (telemetry: {}.{}%  scan: {}.{}%  centroid: {}.{}%  usb: {}.{}%)",
            hz as u32,
            us_total as u32,
            pct_telemetry_service as u32 / 10,
            pct_telemetry_service as u32 % 10,
            pct_scan as u32 / 10,
            pct_scan as u32 % 10,
            pct_centroid as u32 / 10,
            pct_centroid as u32 % 10,
            pct_usb as u32 / 10,
            pct_usb as u32 % 10,
        );
        defmt::info!(
            "         scan details: mux={}us  read={}us  oversample={}",
            us_mux as u32,
            us_single_read as u32,
            us_tuning_overhead as u32,
        );

        self.tick_start_cycles = DWT::cycle_count();
        self.iterations = 0;
        self.sum_telemetry_service = 0;
        self.sum_scan = 0;
        self.sum_centroid = 0;
        self.sum_usb = 0;
        self.sum_cycles = 0;
        self.sum_mux = 0;
        self.sum_single_read = 0;
        self.sum_tuning_overhead = 0;
    }

    pub fn last_hz(&self) -> u32 {
        self.last_hz
    }
    pub fn last_telemetry_service_us(&self) -> u32 {
        self.last_telemetry_service_us
    }
    pub fn last_scan_us(&self) -> u32 {
        self.last_scan_us
    }
    pub fn last_centroid_us(&self) -> u32 {
        self.last_centroid_us
    }
    pub fn last_usb_us(&self) -> u32 {
        self.last_usb_us
    }
    pub fn last_mux_us(&self) -> u32 {
        self.last_mux_us
    }
    pub fn last_single_read_us(&self) -> u32 {
        self.last_single_read_us
    }
    pub fn last_tuning_overhead_us(&self) -> u32 {
        self.last_tuning_overhead_us
    }
}

/// Enable the DWT cycle counter once at startup.
/// The counter is then readable from any context via `DWT::cycle_count()`.
pub fn enable_cycle_counter(dcb: &mut cortex_m::peripheral::DCB, dwt: &mut DWT) {
    dcb.enable_trace();
    dwt.enable_cycle_counter();
}
