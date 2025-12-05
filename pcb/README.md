# PCB

Designed with [KiCad][kicad].

## Manufacturing

Both prototype and production PCB is manufactured by [JLCPCB][jlcpcb].

### Steps

1. Install [KiCad][kicad].
2. Install the [Fabrication Toolkit][fab-toolkit] plugin.
3. "Generate" production files using the plugin with default settings.
4. Go to [jlcpcb.com][jlcpcb] and click "Add gerber file"
5. Select `pcb/production/wonkle.zip`
6. Configure PCB (you will get 5 pcb of which 2 have components soldered)
   - PCB Specifications
     - PCB Thickness - 1.0mm
     - Surface Finish - LeadFree HASL (health is important boiz)
   - High-spec Options
     - Confirm Production file - Yes
     - Mark on PCB - Order Number(Specify Position)
   - PCB Assembly
     - PCBA Qty - minimum is 2
     - Confirm Parts Placement - Yes
     - Advanced
       - Board Cleaning - Yes
7. Press "NEXT"
8. Inspect PCB and press "NEXT" again
9. Upload and process `pcb/production/bom.csv` and `pcb/production/positions.csv`
10. Review the parts and press "NEXT"
11. Fix component placement
    - only J2 (1x4 pin) needs manual edit
12. Select `Research\Education\DIY\Entertainment > DIY Hobby Circuit Board - HS Code 902300` in Quote & Order section. The total price is 137.13 USD as of writing.
13. Press "SAVE TO CART"
14. Select both PCB and PCBA then click "Secure Checkout"
15. Enter shipping info and follow JLCPCB's instruction (e.g. production file confirmation)
16. Wait for a week and you'll receive your very own board!

[kicad]: https://www.kicad.org/
[jlcpcb]: https://jlcpcb.com/
[fab-toolkit]: https://github.com/bennymeg/Fabrication-Toolkit
