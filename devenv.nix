{ pkgs, lib, ... }:

let
  deps = with pkgs; [
    openssl # firmware build fails without it
  ];
in
{
  packages =
    with pkgs;
    [
      nixd # Nix LSP
      nixfmt-rfc-style # Nix formatter

      probe-rs-tools # for firmware flashing and debugging
      usbutils # lsusb, usb-devices, and usbhid-dump
    ]
    ++ deps;

  scripts.flash.exec = ''
    cd ./firmware && cargo run --release
  '';

  env = {
    LD_LIBRARY_PATH = "$LD_LIBRARY_PATH:${lib.makeLibraryPath deps}";
  };

  languages = {
    # https://devenv.sh/supported-languages/javascript/
    javascript = {
      enable = true;
      package = pkgs.nodejs_24; # latest LTS
      pnpm.enable = true;
    };

    # https://devenv.sh/supported-languages/rust/
    rust = {
      enable = true;
      channel = "stable";
      targets = [ "thumbv7em-none-eabihf" ];
    };
  };
}
