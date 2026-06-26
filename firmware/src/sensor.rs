use cortex_m::asm;
use cortex_m::peripheral::DWT;

use stm32f4xx_hal::adc::config::SampleTime;
use stm32f4xx_hal::gpio::outport::OutPort4;
use stm32f4xx_hal::pac;
use stm32f4xx_hal::pac::adc1::RegisterBlock;
use stm32f4xx_hal::rcc::{Enable, Rcc, Reset};

use crate::profiler::ScanTiming;

pub const ROWS: usize = 11;
pub const COLS: usize = 19;
pub const SENSOR_COUNT: usize = ROWS * COLS;

pub const SENSOR_ROW_TO_MUX_CHANNEL: [u8; ROWS] = [10, 9, 8, 0, 1, 2, 3, 4, 5, 6, 7];

#[derive(Copy, Clone, Debug)]
pub enum Adc {
    // Adc1, // unused
    Adc2,
    Adc3,
}

#[derive(Copy, Clone, Debug)]
pub struct Column {
    pub adc: Adc,
    pub adc_channel: u8,
}

impl Column {
    pub const fn new(adc: Adc, adc_channel: u8) -> Self {
        Self { adc, adc_channel }
    }
}

pub const SENSOR_COLUMN_TO_ADC: [Column; COLS] = [
    Column::new(Adc::Adc3, 9),
    Column::new(Adc::Adc3, 14),
    Column::new(Adc::Adc3, 15),
    Column::new(Adc::Adc3, 4),
    Column::new(Adc::Adc3, 5),
    Column::new(Adc::Adc3, 6),
    Column::new(Adc::Adc3, 7),
    Column::new(Adc::Adc3, 8),
    Column::new(Adc::Adc2, 11),
    Column::new(Adc::Adc2, 12),
    Column::new(Adc::Adc2, 13),
    Column::new(Adc::Adc2, 1),
    Column::new(Adc::Adc2, 2),
    Column::new(Adc::Adc2, 3),
    Column::new(Adc::Adc2, 4),
    Column::new(Adc::Adc2, 6),
    Column::new(Adc::Adc2, 7),
    Column::new(Adc::Adc2, 14),
    Column::new(Adc::Adc2, 15),
];

pub const ADC_SAMPLING_COUNT: u8 = 8;

pub fn adc_sampling_label(s: SampleTime) -> &'static str {
    match s {
        SampleTime::Cycles_3 => "3 cyc",
        SampleTime::Cycles_15 => "15 cyc",
        SampleTime::Cycles_28 => "28 cyc",
        SampleTime::Cycles_56 => "56 cyc",
        SampleTime::Cycles_84 => "84 cyc",
        SampleTime::Cycles_112 => "112 cyc",
        SampleTime::Cycles_144 => "144 cyc",
        SampleTime::Cycles_480 => "480 cyc",
    }
}

pub type MuxSelect = OutPort4<'E', 6, 5, 4, 3>;

pub struct SensorGrid {
    adc2: pac::ADC2,
    adc3: pac::ADC3,
    mux: MuxSelect,

    mux_settling: u32,
    adc_sampling: SampleTime,
    adc_re_reads: u8,
    oversample_enabled: bool,
    ema_alpha: f32,

    last_scan_timing: ScanTiming,
}

impl SensorGrid {
    pub fn new(adc2: pac::ADC2, adc3: pac::ADC3, mux: MuxSelect, rcc: &mut Rcc) -> Self {
        pac::ADC1::enable(rcc);
        pac::ADC2::enable(rcc);
        pac::ADC3::enable(rcc);
        pac::ADC2::reset(rcc);

        Self::configure_adc(&adc2);
        Self::configure_adc(&adc3);

        let mut grid = Self {
            adc2,
            adc3,
            mux,
            mux_settling: 4000,
            adc_sampling: SampleTime::Cycles_3,
            adc_re_reads: 3,
            oversample_enabled: true,
            ema_alpha: 0.0,
            last_scan_timing: ScanTiming::default(),
        };
        grid.apply_adc_sampling(grid.adc_sampling);

        grid.adc2.cr2().modify(|_, w| w.adon().set_bit());
        grid.adc3.cr2().modify(|_, w| w.adon().set_bit());

        grid
    }

    fn configure_adc(adc: &RegisterBlock) {
        adc.cr1()
            .modify(|_, w| unsafe { w.res().bits(0).scan().clear_bit().eocie().clear_bit() });

        adc.cr2().modify(|_, w| unsafe {
            w.align()
                .clear_bit() // right-aligned data
                .cont()
                .clear_bit() // single conversion
                .dma()
                .clear_bit() // no DMA
                .eocs()
                .clear_bit() // EOC raised after each conversion
                .exten()
                .bits(0) // software trigger (EXTEN = disabled)
        });

        adc.sqr1().modify(|_, w| unsafe { w.l().bits(0) }); // L = 0 => 1 conversion per sequence.
    }

    /// Program `SMPR` sample-time bits for a single channel on the given ADC.
    fn set_sample_time(adc: &RegisterBlock, ch: u8, st: u8) {
        if ch <= 9 {
            adc.smpr2().modify(|_, w| unsafe { w.smp(ch).bits(st) });
        } else {
            adc.smpr1()
                .modify(|_, w| unsafe { w.smp(ch - 10).bits(st) });
        }
    }

    fn apply_adc_sampling(&mut self, sampling: SampleTime) {
        let st = sampling as u8;

        for &col in SENSOR_COLUMN_TO_ADC.iter() {
            Self::set_sample_time(
                match col.adc {
                    Adc::Adc2 => &self.adc2,
                    Adc::Adc3 => &self.adc3,
                },
                col.adc_channel,
                st,
            );
        }
    }

    fn select_row(&mut self, row: u8) {
        let ch = SENSOR_ROW_TO_MUX_CHANNEL[row as usize];
        self.mux.write(ch as u32);
    }

    pub fn scan_grid(&mut self, out: &mut [u16; SENSOR_COUNT]) {
        let mut mux_total: u32 = 0;
        let mut read_total: u32 = 0;
        let mut read_count: u32 = 0;
        let mut per_sensor_total: u32 = 0;

        for row in 0..ROWS {
            self.select_row(row as u8);

            {
                let before = DWT::cycle_count();
                for _ in 0..self.mux_settling {
                    asm::nop();
                }
                mux_total = mux_total.wrapping_add(DWT::cycle_count().wrapping_sub(before));
            }

            if !self.oversample_enabled && self.adc_re_reads > 0 {
                let ch_adc2 = SENSOR_COLUMN_TO_ADC[0].adc_channel;
                let ch_adc3 = SENSOR_COLUMN_TO_ADC[7].adc_channel;
                for _ in 0..self.adc_re_reads {
                    let a2 = &self.adc2;
                    unsafe { a2.sqr3().write(|w| w.sq1().bits(ch_adc2)) };
                    a2.cr2().modify(|_, w| w.swstart().set_bit());
                    while a2.sr().read().eoc().bit_is_clear() {}
                    let _ = a2.dr().read();

                    let a3 = &self.adc3;
                    unsafe { a3.sqr3().write(|w| w.sq1().bits(ch_adc3)) };
                    a3.cr2().modify(|_, w| w.swstart().set_bit());
                    while a3.sr().read().eoc().bit_is_clear() {}
                    let _ = a3.dr().read();
                }
            }

            for col in 0..COLS {
                let c = SENSOR_COLUMN_TO_ADC[col];
                let adc: &RegisterBlock = match c.adc {
                    Adc::Adc2 => &self.adc2,
                    Adc::Adc3 => &self.adc3,
                };

                let before = DWT::cycle_count();

                if self.oversample_enabled {
                    let total_reads = (self.adc_re_reads as u32) + 1;
                    let mut acc: u32 = 0;
                    for _ in 0..total_reads {
                        unsafe { adc.sqr3().write(|w| w.sq1().bits(c.adc_channel)) };
                        adc.cr2().modify(|_, w| w.swstart().set_bit());
                        while adc.sr().read().eoc().bit_is_clear() {}
                        acc += adc.dr().read().data().bits() as u32;
                    }
                    out[row * COLS + col] = (acc / total_reads) as u16;
                } else {
                    unsafe { adc.sqr3().write(|w| w.sq1().bits(c.adc_channel)) };
                    adc.cr2().modify(|_, w| w.swstart().set_bit());
                    while adc.sr().read().eoc().bit_is_clear() {}
                    out[row * COLS + col] = adc.dr().read().data().bits();

                    read_total = read_total.wrapping_add(DWT::cycle_count().wrapping_sub(before));
                    read_count += 1;
                }

                per_sensor_total =
                    per_sensor_total.wrapping_add(DWT::cycle_count().wrapping_sub(before));
            }
        }

        let total_sensors = SENSOR_COUNT as u32;
        self.last_scan_timing.mux_cycles = mux_total / (ROWS as u32);
        self.last_scan_timing.single_read_cycles = if read_count > 0 {
            read_total / read_count
        } else {
            0
        };
        self.last_scan_timing.tuning_overhead_cycles = per_sensor_total / total_sensors;
    }

    pub fn last_scan_timing(&self) -> &ScanTiming {
        &self.last_scan_timing
    }

    pub fn mux_settling(&self) -> u32 {
        self.mux_settling
    }
    pub fn set_mux_settling(&mut self, cycles: u32) {
        self.mux_settling = cycles;
    }

    pub fn adc_sampling(&self) -> SampleTime {
        self.adc_sampling
    }
    pub fn set_adc_sampling(&mut self, s: SampleTime) {
        if (s as u8) >= ADC_SAMPLING_COUNT {
            return;
        }
        self.adc_sampling = s;
        self.apply_adc_sampling(s);
    }

    pub fn adc_re_reads(&self) -> u8 {
        self.adc_re_reads
    }
    pub fn set_adc_re_reads(&mut self, count: u8) {
        if count > 10 {
            return;
        }
        self.adc_re_reads = count;
    }

    pub fn oversample_enabled(&self) -> bool {
        self.oversample_enabled
    }
    pub fn set_oversample_enabled(&mut self, enabled: bool) {
        self.oversample_enabled = enabled;
    }

    pub fn ema_alpha(&self) -> f32 {
        self.ema_alpha
    }
    pub fn set_ema_alpha(&mut self, alpha: f32) {
        self.ema_alpha = alpha;
    }
}
