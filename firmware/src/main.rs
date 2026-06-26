#![allow(static_mut_refs)]
#![no_main]
#![no_std]

mod crc16;
mod profiler;
mod sensor;
mod tablet;
mod telemetry;
mod usb;

use defmt_rtt as _;
// See https://defmt.ferrous-systems.com/global-logger for more information
use panic_probe as _; // Print panic message to probe console
use stm32f4xx_hal::{otg_fs, pac, prelude::*, rcc::Config};

const USB_ENUMERATION_DELAY_MS: u32 = 3000;

#[cortex_m_rt::entry]
fn main() -> ! {
    defmt::info!("Hello from Wonkle!");

    let dp = pac::Peripherals::take().unwrap(); // device peripheral
    let mut cp = cortex_m::peripheral::Peripherals::take().unwrap(); // core peripheral
    let mut rcc = dp.RCC.freeze(
        Config::hsi()
            .sysclk(84.MHz()) // HCLK
            .pclk1(42.MHz()) // APB1
            .pclk2(84.MHz()) // APB2
            .require_pll48clk(), // PLL
    );

    profiler::enable_cycle_counter(&mut cp.DCB, &mut cp.DWT);

    let gpioa = dp.GPIOA.split(&mut rcc);
    let gpioc = dp.GPIOC.split(&mut rcc);
    let gpioe = dp.GPIOE.split(&mut rcc);
    let gpiof = dp.GPIOF.split(&mut rcc);

    // sensor input pins
    let _ = gpioa.pa1.into_analog();
    let _ = gpioa.pa2.into_analog();
    let _ = gpioa.pa3.into_analog();
    let _ = gpioa.pa4.into_analog();
    let _ = gpioa.pa6.into_analog();
    let _ = gpioa.pa7.into_analog();
    let _ = gpioc.pc1.into_analog();
    let _ = gpioc.pc2.into_analog();
    let _ = gpioc.pc3.into_analog();
    let _ = gpioc.pc4.into_analog();
    let _ = gpioc.pc5.into_analog();
    let _ = gpiof.pf3.into_analog();
    let _ = gpiof.pf4.into_analog();
    let _ = gpiof.pf5.into_analog();
    let _ = gpiof.pf6.into_analog();
    let _ = gpiof.pf7.into_analog();
    let _ = gpiof.pf8.into_analog();
    let _ = gpiof.pf9.into_analog();
    let _ = gpiof.pf10.into_analog();

    let mux: sensor::MuxSelect = (
        gpioe.pe6.into_push_pull_output(),
        gpioe.pe5.into_push_pull_output(),
        gpioe.pe4.into_push_pull_output(),
        gpioe.pe3.into_push_pull_output(),
    )
        .outport();

    let usb_peripheral = otg_fs::USB::new(
        (dp.OTG_FS_GLOBAL, dp.OTG_FS_DEVICE, dp.OTG_FS_PWRCLK),
        (gpioa.pa11, gpioa.pa12),
        &rcc.clocks,
    );

    defmt::info!(
        "Waiting {}ms for USB enumeration...",
        USB_ENUMERATION_DELAY_MS
    );
    cp.SYST
        .delay(&rcc.clocks)
        .delay_ms(USB_ENUMERATION_DELAY_MS);

    defmt::info!("Initializing...");
    let mut usb_device = usb::build(usb_peripheral);
    let mut sensor_grid = sensor::SensorGrid::new(dp.ADC2, dp.ADC3, mux, &mut rcc);
    let mut profiler = profiler::PerformanceProfiler::new(rcc.clocks.sysclk().raw());
    profiler.init();
    let mut telemetry = telemetry::Telemetry::new();
    let mut tablet = tablet::Tablet::new();
    let mut grid_buffer = [0u16; sensor::SENSOR_COUNT];

    defmt::info!("Initialized!");
    defmt::info!(
        "Config: mux_settling={}, adc_sampling={}, re_reads={}",
        sensor_grid.mux_settling(),
        sensor::adc_sampling_label(sensor_grid.adc_sampling()),
        sensor_grid.adc_re_reads()
    );
    defmt::info!(
        "Filters: ema_alpha_per_mille={}",
        sensor_grid.ema_alpha() * 1000.0
    );

    loop {
        profiler.begin(true);

        // Pump USB first so CDC RX is fresh for the host commands, then dispatch any commands.
        usb_device.poll();
        telemetry.service(&mut usb_device, &mut sensor_grid, &profiler);
        profiler.mark_telemetry_service();

        sensor_grid.scan_grid(&mut grid_buffer);
        profiler.mark_scan();
        profiler.record_scan_details(sensor_grid.last_scan_timing());

        let mut cursor = tablet.find_centroid(&grid_buffer);
        profiler.mark_centroid();

        tablet.update_cursor(&sensor_grid, &mut cursor, &usb_device);
        profiler.mark_usb();
        profiler.report_if_due();

        telemetry.feed_grid(
            &grid_buffer,
            cursor.x,
            cursor.y,
            cursor.valid,
            &mut usb_device,
        );
    }
}
