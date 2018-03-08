## Introduction
Zebra printers of ZQ300 & ZQ500 series mobile printers, ZD400 & ZD600 series desktop printers, and ZT600 series industrial printers have both Bluetooth Classic and Low Energy (LE) capabilities. This WeChatPrintDemo demonstrates how to scan, connect, send ZPL to a BLE enabled Zebra printer from WeCha Mini-Program to print labels and images. For details on how to creat WeChat Mini-Program, please refer to [WeChat Mini-Program Developer](https://mp.weixin.qq.com/) site, where you can register a developer account, check out the API documentation, download SDK and tutorials.

To query if Bluetooth LE is enabled or not on a printer, use Zebra SGD command below with [Zebra Setup Utilities](https://www.zebra.com/us/en/products/software/barcode-printers/zebralink/zebra-setup-utility.html):
* `! U1 getvar "bluetooth.le.controller_mode"`

To enable Bluetooth LE on a printer, use one of the following Zebra SGD commands to enable the BLE on the printer with [Zebra Setup Utilities](https://www.zebra.com/us/en/products/software/barcode-printers/zebralink/zebra-setup-utility.html):
* `! U1 setvar "bluetooth.le.controller_mode" "le"`
* `! U1 setvar "bluetooth.le.controller_mode" "both"`

## Code overview
`ZPrinterLEService.h` defines the UUID of services and characteristics as specified in [Link-OS Environment Bluetooth Low Energy AppNote](https://www.zebra.com/content/dam/zebra/software/en/application-notes/AppNote-BlueToothLE-v4.pdf). The `ScanBLEZPrinterTableViewController.m` handles scanning, discovering and connecting. The Apple iOS Bluetooth LE framework uses asynchronous callbacks to notify the application when a peripheral is found, a service or a characteristic is discovered. `ScanBLEZPrinterTableViewController.m` calls iOS Bluetooth LE framework to initiate scan, discover and connect, and it implements the corresponding callbacks too.

`ConnectBLEZPrinterViewController.m` handles the UI in `Connected` view. `ScanBLEZPrinterTableViewController.m` communicates to `ConnectBLEZPrinterViewController.m` via Notification Center when the value of a characteristic has been updated. There are three types of notifications, `WriteNotification, ReadNotification & DISNotification`, which are all defined in `ZPrinterLEService.h`. The `viewDidLoad` in `ConnedtBLEPrinterViewController.m` registers for these notifications.

## Services on Zebra printer
The Zebra Bluetooth LE enabled printers offer two services, i.e. Device Information Service (DIS, UUID is `0x180A`) and Parser Service (UUID is `38eb4a80-c570-11e3-9507-0002a5d5c51b`). These services cannot be discovered unless the central device has connected to the printer.

The DIS is a standard service that includes the characteristics of Device Name, Serial Number, Firmware Revision, etc. that can be read back. The Parser Service offers two characteristics for getting data from printer (named as `"From Printer Data"`) and for sending data to printer (named as `"To Printer Data"`). 

## Discover BLE enabled Zebra printers
The Bluetooth LE on Zebra printer acts as a peripheral. As a peripheral, the printer advertises its device name through the advertisements. The printer does not advertise any other services. The central device needs to connect to the printer in order to discover services, and then to discover characteristics. 

The central device (an iOS device in our case) initiates a scan to find the peripheral by calling the following in `(void)centralManagerDidUpdateState:(nonnull CBCentralManager *)central`.
```Objective-C
[self.centralManager scanForPeripheralsWithServices:nil options:@{ CBCentralManagerScanOptionAllowDuplicatesKey : @YES }];
```
Once a peripheral is discovered, the iOS Bluetooth LE framework invokes
```Objective-C
(void)centralManager:(CBCentralManager *)central didDiscoverPeripheral:(CBPeripheral *)peripheral advertisementData:(NSDictionary *)advertisementData RSSI:(NSNumber *)RSSI
```
callback, in which we build a list of the discovered peripherals based on the RSSI values that fall into the specified range. From here, we let the user to select a specific printer on the list to connect to.

## Connect to a BLE enabled Zebra printer
In `viewDidLoad` method in `ConnectBLEZPrinterViewController.m`, we call the following to stop scanning and to connect the selected printer.
```Objective-C
// Stop scanning
[[self.scanBLEZPrinterTVC centralManager] stopScan];

// Connect to the selected printer.
[[self.scanBLEZPrinterTVC centralManager] connectPeripheral:_selectedPrinter options:nil];
```

## Discover services and characteristics
Once connected, the iOS BLE framework invokes `(void)centralManager:(CBCentralManager *)central didConnectPeripheral:(CBPeripheral *)peripheral`, where we call the following to discover the `ZPRINTER_SERVICE_UUID` and `ZPRINTER_DIS_SERVICE` services:
```Objective-C
// Search only for services that match the UUID of Zebra Printer Service and the UUID of Device Information Service
[peripheral discoverServices:@[[CBUUID UUIDWithString:ZPRINTER_SERVICE_UUID], [CBUUID UUIDWithString:ZPRINTER_DIS_SERVICE]]];
```
Then we call the following to discover the characteristics in `didDiscoverServices` callback:
```Objective-C
// Discover the characteristics of Write-To-Printer and Read-From-Printer.
// Loop through the newly filled peripheral.services array, just in case there's more than one service.
for (CBService *service in peripheral.services) {
    // Discover the characteristics of read from and write to printer
    if ([service.UUID isEqual:[CBUUID UUIDWithString:ZPRINTER_SERVICE_UUID]]) {
        [peripheral discoverCharacteristics:@[[CBUUID UUIDWithString:WRITE_TO_ZPRINTER_CHARACTERISTIC_UUID],
                                              [CBUUID UUIDWithString:READ_FROM_ZPRINTER_CHARACTERISTIC_UUID]] forService:service];
    } else if ([service.UUID isEqual:[CBUUID UUIDWithString:ZPRINTER_DIS_SERVICE]]) {
        // Discover the characteristics of Device Information Service (DIS)
        [peripheral discoverCharacteristics:@[[CBUUID UUIDWithString:ZPRINTER_DIS_CHARAC_MODEL_NAME],
                                              [CBUUID UUIDWithString:ZPRINTER_DIS_CHARAC_SERIAL_NUMBER],
                                              [CBUUID UUIDWithString:ZPRINTER_DIS_CHARAC_FIRMWARE_REVISION],
                                              [CBUUID UUIDWithString:ZPRINTER_DIS_CHARAC_HARDWARE_REVISION],
                                              [CBUUID UUIDWithString:ZPRINTER_DIS_CHARAC_SOFTWARE_REVISION],
                                              [CBUUID UUIDWithString:ZPRINTER_DIS_CHARAC_MANUFACTURER_NAME]] forService:service];
    }
}
```
Once the characteristics are discovered, we need either to read the characteristics for read-only characteristics (DIS) or subscribe to the characteristics for value updates. This is done through the `didDiscoverCharacteristicsForService` callback below.

```Objective-C
// The characteristics of Zebra Printer Service was discovered. Then we want to subscribe to the characteristics.
// This lets the peripheral know we want the data it contains.
- (void)peripheral:(CBPeripheral *)peripheral didDiscoverCharacteristicsForService:(CBService *)service error:(NSError *)error
{
    // Deal with errors (if any)
    if (error) {
        [self cleanup];
        return;
    }
    
    // Again, we loop through the array, as there might be multiple characteristics in service.
    for (CBCharacteristic *characteristic in service.characteristics) {
        
        // And check if it's the right one
        if ([characteristic.UUID isEqual:[CBUUID UUIDWithString:WRITE_TO_ZPRINTER_CHARACTERISTIC_UUID]]) {
            
            // WRITE_TO_ZPRINTER_CHARACTERISTIC_UUID is a write-only characteristic
            
            // Notify that Write Characteristic has been discovered through the Notification Center
            [[NSNotificationCenter defaultCenter] postNotificationName:ZPRINTER_WRITE_NOTIFICATION object:self userInfo:@{@"Characteristic":characteristic}];
            
        } else if ([characteristic.UUID isEqual:[CBUUID UUIDWithString:READ_FROM_ZPRINTER_CHARACTERISTIC_UUID]]) {

            // Set up notification for value update on "From Printer Data" characteristic, i.e. READ_FROM_ZPRINTER_CHARACTERISTIC_UUID.
            [peripheral setNotifyValue:YES forCharacteristic:characteristic];

        } else if ([characteristic.UUID isEqual:[CBUUID UUIDWithString:ZPRINTER_DIS_CHARAC_MODEL_NAME]] ||
                   [characteristic.UUID isEqual:[CBUUID UUIDWithString:ZPRINTER_DIS_CHARAC_SERIAL_NUMBER]] ||
                   [characteristic.UUID isEqual:[CBUUID UUIDWithString:ZPRINTER_DIS_CHARAC_FIRMWARE_REVISION]] ||
                   [characteristic.UUID isEqual:[CBUUID UUIDWithString:ZPRINTER_DIS_CHARAC_HARDWARE_REVISION]] ||
                   [characteristic.UUID isEqual:[CBUUID UUIDWithString:ZPRINTER_DIS_CHARAC_SOFTWARE_REVISION]] ||
                   [characteristic.UUID isEqual:[CBUUID UUIDWithString:ZPRINTER_DIS_CHARAC_MANUFACTURER_NAME]]) {
            
            // These characteristics are read-only characteristics.
            // Read value for these DIS characteristics
            [self.selectedPrinter readValueForCharacteristic:characteristic];
        }
    }
    
    // Once this is complete, we just need to wait for the data to come in or to send ZPL to printer.
}
```

## Screenshot of the demo
![Screenshot of the demo](https://github.com/Zebra/LinkOS-iOS-Samples/blob/ZebraPrinterBLEDemo/ZebraPrinterBLEDemo/ZebraPrinterBLEDemo.png)


## References
This ZebraPrinterBLEDemo uses or refers to the following materials:
* [Link-OS Environment Bluetooth Low Energy AppNote](https://www.zebra.com/content/dam/zebra/software/en/application-notes/AppNote-BlueToothLE-v4.pdf), by Zebra
* [Bluetooth Low Energy Printing - iOS](https://km.zebra.com/resources/sites/ZEBRA/content/live/WHITE_PAPERS/0/WH146/en_US/BluetoothLowEnergyPrinting_iOS.pdf), by Zebra
* [BTLE Central Peripheral Transfer](https://developer.apple.com/library/content/samplecode/BTLE_Transfer/Introduction/Intro.html#//apple_ref/doc/uid/DTS40012927-Intro-DontLinkElementID_2), by Apple Bluetooth for Developers.
