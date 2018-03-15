其他语言版本：[English](https://github.com/Zebra/Zebra-Printer-Samples/blob/master/WeChat-MiniProgram-Samples/WeChatPrintDemo/README.md)
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

## 向特征值写数据
在每次向BLE特征值写数据时，数据的字节数是有限制的。因此，我们必须把ZPL或图像数据先分成小块，再写进特征值。在iOS上，可以连续调用wx.writeBLECharacteristicValue()来写入特征值，是没有问题的。但在Android上，连续调用wx.writeBLECharacteristicValue()会出错，必须在每次调用之间加入延迟。以下的代码展示了如何将ZPL和图像数据分块、以及如何在Android上实现延迟。maxChunk值的大小和setTimeout()中的延迟大小都应该根据实际情况进行调整。目前，maxChunk值暂定为300字节，setTimeout()的延迟暂定为250毫秒。
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

## 截图和打印输出
###### 以下是该微信小程序的截图
<img src="https://github.com/Zebra/Zebra-Printer-Samples/blob/master/WeChat-MiniProgram-Samples/WeChatPrintDemo/WeChatPrintDemo.jpg" width="400">

###### 以下是由斑马ZD410桌面打印机，在2英寸宽标签纸上打出的印条形码和徽标图像
<img src="https://github.com/Zebra/Zebra-Printer-Samples/blob/master/WeChat-MiniProgram-Samples/WeChatPrintDemo/PrintoutOfWeChatPrintDem.jpg" width="400">

## 注意事项
1. 在Android上，必须首先授予微信应用程序访问位置服务的权限，以便小程序扫描并连接到蓝牙LE设备。 否则，小程序将无法在扫描、连接操作过程中找到任何BLE设备。请通过“设置->应用->微信->权限”路径，对微信应用程序授予位置权限。
2. 在Android上，如果在多次调用wx.writeBLECharacteristicValue()之间没有延迟，将导致写入操作失败。 在本例子中，我们给出了250ms的延迟。 如果需要，可以对该延迟进行调整。

## 参考文献
本WeChatPrintDemo参照了如下文献:
* 斑马：[Link-OS Environment Bluetooth Low Energy AppNote](https://www.zebra.com/content/dam/zebra/software/en/application-notes/AppNote-BlueToothLE-v4.pdf)
* 腾讯：[微信小程序软件开发环境和工具](https://mp.weixin.qq.com/)
