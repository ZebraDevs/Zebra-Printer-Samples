## Introduction
Zebra printers of ZQ300 & ZQ500 series mobile printers, ZD400 & ZD600 series desktop printers, and ZT600 series industrial printers have both Bluetooth Classic and Low Energy (LE) capabilities. This WeChatPrintDemo demonstrates how to scan, connect, send ZPL to a BLE enabled Zebra printer from WeChat Mini-Program to print labels and images. For details on how to create WeChat Mini-Program, please refer to [WeChat Mini-Program Developer](https://mp.weixin.qq.com/) site, where you can register a developer account, check out the API documentation, download SDK and tutorials.

To query if Bluetooth LE is enabled or not on a printer, use Zebra SGD command below with [Zebra Setup Utilities](https://www.zebra.com/us/en/products/software/barcode-printers/zebralink/zebra-setup-utility.html):
* `! U1 getvar "bluetooth.le.controller_mode"`

To enable Bluetooth LE on a printer, use one of the following Zebra SGD commands to enable the BLE on the printer with [Zebra Setup Utilities](https://www.zebra.com/us/en/products/software/barcode-printers/zebralink/zebra-setup-utility.html):
* `! U1 setvar "bluetooth.le.controller_mode" "le"`
* `! U1 setvar "bluetooth.le.controller_mode" "both"`

## Services on Zebra printers
The Zebra Bluetooth LE enabled printers offer two services, i.e. Device Information Service (DIS, UUID is `0x180A`) and Parser Service (UUID is `38eb4a80-c570-11e3-9507-0002a5d5c51b`). These services cannot be discovered unless the central device has connected to the printer.

The DIS is a standard service that includes the characteristics of Device Name, Serial Number, Firmware Revision, etc. that can be read back. The Parser Service offers two characteristics for getting data from printer (named as `"From Printer Data"`) and for sending data to printer (named as `"To Printer Data"`). 

As defined in [Link-OS Environment Bluetooth Low Energy AppNote](https://www.zebra.com/content/dam/zebra/software/en/application-notes/AppNote-BlueToothLE-v4.pdf) document by Zebra, the UUIDs of the services and characteristics of Zebra BLE enabled printers are defined in pages/index/index.js file as below.
```javascript
// Zebra Bluetooth LE services and characteristics UUIDs
const ZPRINTER_DIS_SERVICE_UUID = "0000180A-0000-1000-8000-00805F9B34FB" // Or "180A". Device Information Services UUID
const ZPRINTER_SERVICE_UUID="38EB4A80-C570-11E3-9507-0002A5D5C51B"       // Zebra Bluetooth LE Parser Service
const READ_FROM_ZPRINTER_CHARACTERISTIC_UUID = "38EB4A81-C570-11E3-9507-0002A5D5C51B" // Read from printer characteristic
const WRITE_TO_ZPRINTER_CHARACTERISTIC_UUID  = "38EB4A82-C570-11E3-9507-0002A5D5C51B" // Write to printer characteristic
```

## Write to characteristic
Each write to the characteristic operation is limited to a number of bytes in BLE. We need to break the ZPL or image data into small chunks and write a chunk of bytes a time to the characteristic. On iOS, the wx.writeBLECharacteristicValue() has no issues when writing each chunk one after another. On Android, however, we must provide a delay between the writes of chunks. Following code illustrates how to break the ZPL or image data into chunks and how the delay is implemented for Android. Both the maxChunk and the delay in setTimeout() should be tuned to fit a particular Android device and performance. Currently, the delay is 250ms for each write.
```javascript
  // Write printer language string to the printer
  writeStringToPrinter: function (str) {

    var that = this

    var maxChunk = 20 // Default is 20 bytes per write to characteristic

    if (app.getPlatform() == 'ios') {
      maxChunk = 300 // 300 bytes per write to characteristic works for iOS
    } else if (app.getPlatform() == 'android') {
      var maxChunk = 300 // Adjusting for Android      
    }

    if (str.length <= maxChunk) {
      writeStrToCharacteristic(str)
    } else {
      // Need to partion the string and write one chunk at a time.
      var j = 0
      for (var i = 0; i < str.length; i += maxChunk) {
        if (i + maxChunk <= str.length) {
          var subStr = str.substring(i, i + maxChunk)
        } else {
          var subStr = str.substring(i, str.length)
        }

        if (app.getPlatform() == 'ios') {
          writeStrToCharacteristic(subStr) // iOS doesn't need the delay during each write
        } else {
          // Android needs delay during each write.
          setTimeout(writeStrToCharacteristic, 250 * j, subStr) // Adjust the delay if needed
          j++
        }
      }
    }

    function writeStrToCharacteristic (str) {
      // Convert str to ArrayBuff and write to printer
      let buffer = new ArrayBuffer(str.length)
      let dataView = new DataView(buffer)
      for (var i = 0; i < str.length; i++) {
        dataView.setUint8(i, str.charAt(i).charCodeAt())
      }

      // Write buffer to printer
      wx.writeBLECharacteristicValue({
        deviceId: that.data.connectedDeviceId,
        serviceId: ZPRINTER_SERVICE_UUID,
        characteristicId: WRITE_TO_ZPRINTER_CHARACTERISTIC_UUID,
        value: buffer,
        success: function (res) {
          wx.showToast({
            title: 'Sent ZPL to printer successfully',
            icon: 'success',
            duration: 1000,
          })
        },
        fail: function (res) {
          console.log("ssi - Failed to send ZPL to printer:", res)
          wx.showToast({
            title: 'Failed to send ZPL',
            icon: 'none',
            duration: 1000,
          })
        }
      })
    }
  },
```

## Screenshot and printout
###### A screenshot of the mini-program
<img src="https://github.com/Zebra/Zebra-Printer-Samples/blob/master/WeChat-MiniProgram-Samples/WeChatPrintDemo/WeChatPrintDemo.jpg" width="400">

###### Printouts of a barcode and a logo image on a 2" wide label from Zebra ZD410 desktop printer
<img src="https://github.com/Zebra/Zebra-Printer-Samples/blob/master/WeChat-MiniProgram-Samples/WeChatPrintDemo/PrintoutOfWeChatPrintDem.jpg" width="400">

## Notes
1. On Android, the WeChat app should be granted with access permission to location service first. in order for this mini-program to scan for and connect to a Bluetooth LE device. Otherwise, this mini-program won't be able to find any BLE devices during the scan operation. To grant location permission to WeChat app, go to Settings -> Apps -> WeChat -> Permissions.
2. On Android, the sequential execution of wx.writeBLECharacteristicValue() without delay in between will cause the write operation to fail. In this example, we give 250ms delay in between. This delay can be adjusted if needed.

## References
This ZebraPrinterBLEDemo uses or refers to the following materials:
* [Link-OS Environment Bluetooth Low Energy AppNote](https://www.zebra.com/content/dam/zebra/software/en/application-notes/AppNote-BlueToothLE-v4.pdf), by Zebra
* [WeChat Mini-Program Software Developer Kit](https://mp.weixin.qq.com/), by Tencent
