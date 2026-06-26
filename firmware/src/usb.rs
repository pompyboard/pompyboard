use core::mem::MaybeUninit;

use stm32f4xx_hal::otg_fs::{USB, UsbBus, UsbBusType};
use usb_device::{
    LangID,
    bus::UsbBusAllocator,
    device::{StringDescriptors, UsbDevice, UsbDeviceBuilder, UsbDeviceState, UsbVidPid},
};
use usbd_hid::hid_class::HIDClass;
use usbd_serial::SerialPort;

// todo: https://pid.codes
const VENDOR_ID: u16 = /***/ 0x1209; // 4617
const PRODUCT_ID: u16 = /**/ 0x02D7; // 727 WYSFI

pub const HID_REPORT_SIZE_BYTES: usize = 8;

/// Endpoint memory size for the OTG-FS peripheral in 32-bit words.
/// Generous for HID + CDC.
const EP_MEMORY_WORDS: usize = 1024;

// Endpoint memory
static mut EP_MEMORY: [u32; EP_MEMORY_WORDS] = [0; EP_MEMORY_WORDS];

static mut USB_BUS: MaybeUninit<UsbBusAllocator<UsbBusType>> = MaybeUninit::uninit();

/// HID report descriptor
/// - a digitizer (Stylus)
/// - 3 buttons
/// - 16-bit X/Y in 0..=10000
/// - 16-bit tip-pressure in 0..=2047
pub const HID_DESCRIPTOR: [u8; 76] = [
    0x05, 0x0D, //       Usage Page (Digitizer)
    0x09, 0x01, //       Usage (Digitizer)
    0xA1, 0x01, //       Collection (Application)
    0x09, 0x20, //         Usage (Stylus)
    0xA1, 0x00, //         Collection (Physical)
    0x75, 0x08, //           Report Size (8)
    0x95, 0x01, //           Report Count (1)
    0x81, 0x03, //           Input (Cnst,Var,Abs) ; byte 0 unused
    0x05, 0x09, //           Usage Page (Button)
    0x19, 0x01, //           Usage Minimum (1)
    0x29, 0x03, //           Usage Maximum (3)
    0x15, 0x00, //           Logical Minimum (0)
    0x25, 0x01, //           Logical Maximum (1)
    0x75, 0x01, //           Report Size (1)
    0x95, 0x03, //           Report Count (3)
    0x81, 0x02, //           Input (Data,Var,Abs) ; buttons
    0x75, 0x05, //           Report Size (5)
    0x95, 0x01, //           Report Count (1)
    0x81, 0x03, //           Input (Cnst,Var,Abs) ; padding
    0x05, 0x01, //           Usage Page (Generic Desktop)
    0x09, 0x30, //           Usage (X)
    0x16, 0x00, 0x00, // Logical Minimum (0)
    0x26, 0x10, 0x27, // Logical Maximum (10000)
    0x75, 0x10, //           Report Size (16)
    0x95, 0x01, //           Report Count (1)
    0x81, 0x02, //           Input (Data,Var,Abs) ; X
    0x09, 0x31, //           Usage (Y)
    0x81, 0x02, //           Input (Data,Var,Abs) ; Y
    0x05, 0x0D, //           Usage Page (Digitizer)
    0x09, 0x30, //           Usage (Tip Pressure)
    0x16, 0x00, 0x00, // Logical Minimum (0)
    0x26, 0xFF, 0x07, // Logical Maximum (2047)
    0x75, 0x10, //           Report Size (16)
    0x95, 0x01, //           Report Count (1)
    0x81, 0x02, //           Input (Data,Var,Abs) ; pressure
    0xC0, //               End Collection
    0xC0, //             End Collection
];

pub struct Usb {
    device: UsbDevice<'static, UsbBusType>,
    serial_port: SerialPort<'static, UsbBusType>,
    hid: HIDClass<'static, UsbBusType>,
}

pub fn build(usb_peripheral: USB) -> Usb {
    let ep_mem: &'static mut [u32; EP_MEMORY_WORDS] = unsafe { &mut EP_MEMORY };
    let bus_allocator: &'static mut usb_device::bus::UsbBusAllocator<UsbBusType> =
        unsafe { USB_BUS.write(UsbBus::new(usb_peripheral, ep_mem)) };

    let serial_port = SerialPort::new(bus_allocator);
    let hid = HIDClass::new_ep_in(bus_allocator, &HID_DESCRIPTOR[..], 1);
    let device = UsbDeviceBuilder::new(bus_allocator, UsbVidPid(VENDOR_ID, PRODUCT_ID))
        .strings(&[StringDescriptors::new(LangID::EN)
            .manufacturer("Wonkle")
            .product("Wonkleboard mk.1 Pro")])
        .unwrap()
        .composite_with_iads()
        .max_power(500) // mA
        .unwrap()
        .build();

    Usb {
        device,
        serial_port,
        hid,
    }
}

impl Usb {
    pub fn poll(&mut self) -> bool {
        self.device
            .poll(&mut [&mut self.serial_port, &mut self.hid])
    }

    pub fn configured(&self) -> bool {
        matches!(self.device.state(), UsbDeviceState::Configured)
    }

    pub fn send_hid_report(&self, data: &[u8]) -> bool {
        if !self.configured() {
            return false;
        }
        self.hid.push_raw_input(data).is_ok()
    }

    pub fn cdc_send_frame(&mut self, data: &[u8]) -> bool {
        if !self.configured() {
            return false;
        }

        let mut offset = 0;
        let mut idle = 0;

        while offset < data.len() {
            match self.serial_port.write(&data[offset..]) {
                Ok(n) if n > 0 => {
                    offset += n;
                    idle = 0;
                }
                Ok(_) => idle += 1,
                Err(usb_device::UsbError::WouldBlock) => idle += 1,
                Err(_) => return false,
            }
            if idle >= 200 {
                return false;
            }
            self.device
                .poll(&mut [&mut self.serial_port, &mut self.hid]);
        }

        true
    }

    pub fn cdc_rx_pop(&mut self, buf: &mut [u8]) -> usize {
        self.serial_port.read(buf).unwrap_or_default()
    }
}
