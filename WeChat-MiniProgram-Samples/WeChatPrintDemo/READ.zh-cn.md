## 引言
斑马的ZQ300/ZQ500系列移动打印机、ZD400/ZD600系列台式打印机、以及ZT600系列工业打印机，都具有蓝牙经典和蓝牙低功耗功能（Bluetooth Classic & Low Energy（LE）)。在这里，我们用该WeChatPrintDemo来展示如何从微信小程序打印标签和图像。同时，WeChatPrintDemo还展示了如何对打印机上的蓝牙（BLE）进行扫描、连接、及发送[ZPL](https://www.zebra.com/content/dam/zebra/manuals/en-us/software/zpl-zbi2-pm-en.pdf)。关于如何创建微信小程序，请参阅[微信小程序开发网站](https://mp.weixin.qq.com/)。您可以在上面注册开发者帐户、查看API文档、下载SDK和教程。

若要查询打印机上的蓝牙LE是否开启，可以用[Zebra Setup Utilities](https://www.zebra.com/us/en/products/software/barcode-printers/zebralink/zebra-setup-utility.html)来发送如下[SGD (Set-Get-Do)](https://www.zebra.com/content/dam/zebra/manuals/en-us/software/zpl-zbi2-pm-en.pdf#page=1067)命令:
* [`! U1 getvar "bluetooth.le.controller_mode"`](https://www.zebra.com/content/dam/zebra/manuals/en-us/software/zpl-zbi2-pm-en.pdf#page=1067)

若要开启打印机上的蓝牙LE，可以用[Zebra Setup Utilities](https://www.zebra.com/us/en/products/software/barcode-printers/zebralink/zebra-setup-utility.html)来发送如下[SGD (Set-Get-Do)](https://www.zebra.com/content/dam/zebra/manuals/en-us/software/zpl-zbi2-pm-en.pdf#page=1067)命令:
* [`! U1 setvar "bluetooth.le.controller_mode" "le"`](https://www.zebra.com/content/dam/zebra/manuals/en-us/software/zpl-zbi2-pm-en.pdf#page=1067)
* [`! U1 setvar "bluetooth.le.controller_mode" "both"`](https://www.zebra.com/content/dam/zebra/manuals/en-us/software/zpl-zbi2-pm-en.pdf#page=1067)

## 斑马打印机上的蓝牙LE服务
斑马打印机在蓝牙LE上提供了两种服务：一种是DIS服务(Device Information Service, UUID: `0x180A`)，另一种是解析服务(Parser Service, UUID: `38eb4a80-c570-11e3-9507-0002a5d5c51b`)。这两种服务只能在蓝牙LE连接上以后，才能被发现。

DIS是一种蓝牙的标准服务。中央设备(Central Devices)可以从DIS服务中读回打印机的设备名称、序列号、固件版本等特征值。解析服务是斑马打印机特有的服务，该服务包含两种特征值：从打印机读数据(`"From Printer Data"`)和向打印机写数据(`"To Printer Data"`)。

斑马打印机蓝牙LE服务和特征值的UUID，都已经由[Link-OS Environment Bluetooth Low Energy AppNote](https://www.zebra.com/content/dam/zebra/software/en/application-notes/AppNote-BlueToothLE-v4.pdf)文档定义好了，如下面所示：
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
* [WeChat Mini-Program Software Development Kit](https://mp.weixin.qq.com/), by Tencent
