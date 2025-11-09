use crate::tablet::Report;
use cortex_m::interrupt::free as disable_interrupts;
use stm32f4xx_hal::otg_fs::{USB, UsbBus};
use usb_device::{bus::UsbBusAllocator, prelude::*};
use usbd_hid::{descriptor::generator_prelude::*, hid_class::HIDClass};

// todo: https://pid.codes
const VENDOR_ID: u16 = /***/ 0x1209; // 4617
const PRODUCT_ID: u16 = /**/ 0x02D7; // 727

static mut EP_MEMORY: [u32; 1024] = [0; 1024];
static mut USB_ALLOCATOR: Option<UsbBusAllocator<UsbBus<USB>>> = None;
static mut USB_HID: Option<HIDClass<UsbBus<USB>>> = None;
static mut USB_BUS: Option<UsbDevice<UsbBus<USB>>> = None;

pub fn setup(usb: USB) {
    let bus_allocator = unsafe {
        USB_ALLOCATOR = Some(UsbBus::new(usb, &mut EP_MEMORY));
        USB_ALLOCATOR.as_ref().unwrap()
    };
    unsafe {
        USB_HID = Some(HIDClass::new(&bus_allocator, Report::desc(), 1));
        USB_BUS = Some(
            UsbDeviceBuilder::new(&bus_allocator, UsbVidPid(VENDOR_ID, PRODUCT_ID))
                .strings(&[StringDescriptors::new(LangID::EN)
                    .manufacturer("Wonkle")
                    .product("Wonkle tablet mk1. Lite")])
                .unwrap()
                .build(),
        );
    };
}

pub fn push(report: Report) -> Result<usize, usb_device::UsbError> {
    disable_interrupts(|_| unsafe { USB_HID.as_mut().map(|hid| hid.push_input(&report)) }).unwrap()
}

pub fn poll() {
    unsafe {
        if let (Some(usb_dev), Some(hid)) = (USB_BUS.as_mut(), USB_HID.as_mut()) {
            usb_dev.poll(&mut [hid]);
        }
    };
}
