//index.js
//获取应用实例
const app = getApp()

// Zebra Bluetooth LE services and characteristics UUIDs
const ZPRINTER_DIS_SERVICE_UUID = "0000180A-0000-1000-8000-00805F9B34FB" // Or "180A". Device Information Services UUID
const ZPRINTER_SERVICE_UUID="38EB4A80-C570-11E3-9507-0002A5D5C51B"
const READ_FROM_ZPRINTER_CHARACTERISTIC_UUID = "38EB4A81-C570-11E3-9507-0002A5D5C51B"
const WRITE_TO_ZPRINTER_CHARACTERISTIC_UUID  = "38EB4A82-C570-11E3-9507-0002A5D5C51B"

const ZPL_TEST_LABEL = "~hi^XA^FO20,20^BY3^B3N,N,150,Y,N^FDHello WeChat!^FS^XZ\r\n"

const ZPL_TEST_IMAGE = "^XA^LT4^LS-4^PON^MNA^LH0,6~DYR:IMG,P,P,1858,40,:B64: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:6efb^FO0,0,0^XGR:IMG.PNG,1,1^FS~SD20^PQ1^PR14,,^XZ\r\n"

Page({
  data: {
    motto: 'By Zebra ISV Team',
    userInfo: {},
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    // text: 'Steven Si',

    devicesArray: [],
    isScanning: false,
    infoLog: '',
    isConnected: false,
    connectedDeviceId: {},
    deviceServices: {},
    deviceCharacteristics: {},
    isBTAdapterOpen: false,
    isConnectBtnTapped: false,
  },

  devicesHash: {}, // Store the scanned BT devices

  updateDevicesHash: function (dev) {
    console.log(JSON.stringify(dev))

    var devices = this.devicesHash // Transfer ref to local var

    var deviceId = dev["deviceId"]
    
    // Ignore any where the RSSI is outside reasonable range &
    // ignore these that do not have a device name
    // if ((dev["RSSI"] >= -70 && dev["RSSI"] <= -15) &&
    if ((dev["RSSI"] >= -100 && dev["RSSI"] <= -15) &&
        (typeof(dev["name"]) != undefined && dev["name"]) ) {
      if (!devices[deviceId]) {
        devices[deviceId] = {}

        devices[deviceId]["deviceId"] = deviceId
        devices[deviceId]["name"] = dev["name"]
        devices[deviceId]["localName"] = dev["localName"]
        devices[deviceId]["RSSI"] = dev["RSSI"]
        devices[deviceId]["advertisData"] = dev["advertisData"]
        devices[deviceId]["advertisServiceUUIDs"] = dev["advertisServiceUUIDs"]
        devices[deviceId]["serviceData"] = dev["serviceData"]

        devices[deviceId]["counter"] = 1
      } else {
        devices[deviceId]["counter"] += 1
        console.log("--- found existing", devices[deviceId]["counter"])
      }
      devices[deviceId]["timestamp"] = Date.now()
    }
  },

  clearDevicesHash: function () {
    console.log('ssi - clearDevicesHash')
    for (var k in this.devicesHash) delete this.devicesHash[k];
    this.setData({
      devicesArray: [{ deviceId: "Device ID", RSSI: "RSSI", counter: "Counter", name: "Device Name" }],
    })
  },

  //事件处理函数
  bindViewTap: function() {
    wx.navigateTo({
      url: '../logs/logs'
    })
  },

  onLoad: function () {
    console.log('ssi - onload')
    console.log("ssi - Const = " + ZPRINTER_SERVICE_UUID)
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true
      })
    } else if (this.data.canIUse){
      // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
      // 所以此处加入 callback 以防止这种情况
      console.log("ssi - app.userInfoReadyCallback = res =>"),
      app.userInfoReadyCallback = res => {
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
      }
    } else {
      // 在没有 open-type=getUserInfo 版本的兼容处理
      console.log("ssi - wx.getUserInfo"),
      wx.getUserInfo({
        success: res => {
          app.globalData.userInfo = res.userInfo
          this.setData({
            userInfo: res.userInfo,
            hasUserInfo: true
          })
        }
      })
    }

    /////////////////////////
    //// Bluetooth stuff ////
    /////////////////////////
    var that = this // Preserve this pointer

    // Monitor BLE adapter state change
    wx.onBluetoothAdapterStateChange(function (res) {
      console.log("ssi - onBluetoothAdapterStateChange: ", res)
      if (res.available == true) {
        that.setData({
          isBTAdapterOpen: true
        })
      } else {
        that.setData({
          isBTAdapterOpen: false
        })
      }
      // that.setData({infoLog: res})
    })

    // Monitor BLE connection state change
    wx.onBLEConnectionStateChange(function (res) {
      console.log("ssi - onBLEConnectionStateChange: ", res)
      if (res.connected == false && that.data.isConnected == true) {
        that.setData({
          isConnected: false
        })
        // that.setData({infoLog: 'BLE disconnected'})
        wx.showToast({
          title: 'BLE Disconnected',
          icon: 'none',
          duration: 1000,
        })
      } else if (res.connected == true && that.data.isConnected == false) {
        that.setData({
          isConnected: true
        })
        // that.setData({ infoLog: 'BLE connected' })
        wx.showToast({
          title: 'BLE Connected',
          icon: 'none',
          duration: 1000,
        })    
      }
    })

    that.clearDevicesHash() // Clear the BT device list

    // Callback when a BT device is found
    wx.onBluetoothDeviceFound(function (res) {
      // console.log('onBluetoothDeviceFound: new device list has founded')
      console.log(JSON.stringify(res))

      if (app.getPlatform() == "android" || app.getPlatform() == "ios") {
        // On iOS or Android: variable 'res' is an object with a key "devices", which is an array
        for (var i in res["devices"]) { that.updateDevicesHash(res["devices"][i]) }
      } else if (app.getPlatform() == "devtools") {
        // ON Mac Devtools: variable 'res' is an array
        for (var i in res) { that.updateDevicesHash(res[i]) }
      }
      // A hash to sorted array for UI displaying
      var devices = []
      for (var k in that.devicesHash) {
        devices.push(that.devicesHash[k])
      }
      devices.sort(function (a, b) { // Sort by device names
        return a["name"].localeCompare(b["name"]);
      })
      that.setData({ devicesArray: devices })
    })
  },

  onUnload: function () {
    console.log("ssi - onUnload is invoked")
    this.setData ({
      isScanning: false,
    })
    this.toggleSanning()
  },

  // Start Scanning/Stop Scanning button is tapped
  bindViewTapStartStop: function (e) {

    var that = this

    // Only turn on Bluetooth Adapter once.
    if (!this.data.isBTAdapterOpen) {
      wx.openBluetoothAdapter({ // Open the BT Adapter
        success: function (res) {
          console.log("ssi - openBluetoothAdapter:success", res)
          that.setData({
            isBTAdapterOpen: true
          })
          that.toggleScanning(e)
        },
        fail: function (res) {
          console.log("ssi - openBluetoothAdapter:fail", res)

          that.setData({infoLog: res["errMsg"] })
        }
      })
    } else {
      this.toggleScanning(e)      
    }
  },

  // Toggle the scanning based on isScanning true/false
  toggleScanning: function(e) {
    var that = this // Save this pinter

    // To call this function after the Bluetooth adapter is open
    function turnOnScanning() { // Function to turn on BT scanning
      wx.startBluetoothDevicesDiscovery({
        success: function (res) {
          console.log("ssi - startBluetoothDevicesDiscovery:success:", res)

          that.setData({ isScanning: true, infoLog: 'Scanning for BLE devices' })
        },
        fail: function (res) {
          console.log("ssi - startBluetoothDevicesDiscovery:fail:", res)

          // that.setData({infoLog:'fail to start discovering'})
          that.setData({ infoLog: res["errMsg"] })
        }
      })
    }

    // Stop the scanning, but leave the Bluetooth adapter open
    function turnOffScanning() {
      wx.stopBluetoothDevicesDiscovery({
        success: function (res) {
          console.log("ssi - stopBluetoothDevicesDiscovery:success", res)
          that.setData({ isScanning: false, infoLog: 'Scanning is turned off' })
        },
        fail: function (res) {
          console.log("ssi - stopBluetoothDevicesDiscovery:fail:", res)

          // that.setData({infoLog:'fail to stop discovering'})
          that.setData({infoLog: res["errMsg"]})
        }
      })
    }

    if (that.data.isScanning  == false) {
      turnOnScanning()
    } else if (that.data.isScanning == true) {
      turnOffScanning()
    }
  },

  // Connect button is tapped
  bindViewTapConnect: function (e) {
    var that = this

    //////////// For TESTING ONLY///////////////////
    this.setData({
      isConnectBtnTapped: true,
      infoLog: '',
    })

    // if (that.data.deviceconnected) {
    //   wx.notifyBLECharacteristicValueChanged({
    //     state: false, // Use notify feature
    //     deviceId: that.data.connectedDeviceId,
    //     serviceId: serviceId,
    //     characteristicId: characteristicId,
    //     success: function (res) {
    //       console.log("Stop notify feature")
    //     }
    //   })
    //   wx.closeBLEConnection({
    //     deviceId: e.currentTarget.id,
    //     complete: function (res) {
    //       console.log("Disconnecting BLE connection")
    //       console.log(res)
    //       that.setData({
    //         deviceconnected: false,
    //         connectedDeviceId: "",
    //         receivedata: ""
    //       })
    //     }
    //   })
    // } else {
    
    // Stop scanning before connect,
    if (that.data.isScanning == true) {
      wx.stopBluetoothDevicesDiscovery({
        success: function (res) {
          console.log("ssi - stopBluetoothDevicesDiscovery:success", res)
          that.setData({ isScanning: false, infoLog: 'Scanning is turned off' })
        },
        fail: function (res) {
          console.log("stopBluetoothDevicesDiscovery:fail:", res)

          // that.setData({infoLog:'fail to stop discovering'})
          that.setData({ infoLog: res["errMsg"] })
        }
      })      
    }

    wx.showLoading({
      title: "Connecting to " + that.devicesHash[e.currentTarget.id]["name"]
    })
    wx.createBLEConnection({
      deviceId: e.currentTarget.id,
      success: function (res) {
        wx.hideLoading()
        wx.showToast({
          title: 'Connected',
          icon: 'success',
          duration: 1000
        })
        console.log("Successfully connected to " + that.devicesHash[e.currentTarget.id]["name"])
        console.log(res)
        that.setData({
          isConnected: true,
          connectedDeviceId: e.currentTarget.id
        })

        wx.getBLEDeviceServices({ // Get BLE services
          deviceId: that.data.connectedDeviceId,
          success: function (res) {
            // Search for ZPRINTER_SERVICE_UUID and ZPRINTER_DIS_SERVICE_UUID services only
            // If either one of the above services is missing, then disconnect the connection
            var serviceStr = JSON.stringify(res.services)
            if (serviceStr.indexOf(ZPRINTER_SERVICE_UUID) != -1 && serviceStr.indexOf(ZPRINTER_DIS_SERVICE_UUID) != -1) {
              // Found both services.
              that.setData({
                deviceServices: res.services
              })

              // Get all characteristics before any attempt of read from or write to characteristics.
              wx.getBLEDeviceCharacteristics({
                deviceId: that.data.connectedDeviceId,
                serviceId: ZPRINTER_SERVICE_UUID,
                success: function(res) {
                  console.log('ssi - getBLEDeviceCharacteristics:', res.characteristics)
                  console.log(res)
                  that.setData({
                    deviceCharacteristics: res.characteristics
                  })
                },
                fail: function (res) {
                  console.log('ssi - getBLEDeviceCharacteristics:', res.characteristics)
                  console.log(res)
                  wx.showToast({
                    title: 'Failed to get characteristics',
                    icon: 'none',
                    duration: 1000,
                  })
                }
              })
            } else {
              // The services are not what we want
              // Disconnect the connection.
              wx.showToast({
                title: 'Imcompatible Printer',
                icon: 'none',
                duration: 1000,
              })
              wx.closeBLEConnection({
                deviceId: that.data.connectedDeviceId,
                success: function(res) {
                  wx.showToast({
                    title: 'Disconnected ' + that.devicesHash[that.data.connectedDeviceId]["name"],
                    icon: 'success',
                    duration: 1000,
                  })
                  that.setData({
                    isConnected: false,
                    connectedDeviceId: {},
                    deviceServices: {},
                  })
                },
              })
            }

            console.log('device services:', res.services)
            console.log("ssi - getBLEDeviceServices = " + ZPRINTER_SERVICE_UUID)
            // that.setData({
            //   deviceServices: res.services
            // })
          },
          fail: function(res) {
            console.log("ssi - Failed to get services from " + that.data.devicesHash[that.data.connectedDeviceId]["name"])
            wx.showToast({
              title: 'Failed to get services from ' + that.data.devicesHash[that.data.connectedDeviceId]["name"],
              icon: 'success',
              duration: 1000
            })
          }
        })

        // wx.notifyBLECharacteristicValueChanged({
        //   state: true, // 启用 notify 功能
        //   deviceId: that.data.connectedDeviceId,
        //   serviceId: serviceId,
        //   characteristicId: characteristicId,
        //   success: function (res) {
        //     console.log("启用notify")
        //   }
        // })
      },
      fail: function (res) {
        wx.hideLoading()
        wx.showToast({
          title: 'Failed to connect',
          icon: 'none',
          duration: 1000
        })
        console.log("ssi - Failed to connect with " + that.devicesHash[e.currentTarget.id]["name"])
        console.log(res)
        that.setData({
          isConnected: false,
          infoLog: 'Failed to connect with ' + that.devicesHash[e.currentTarget.id]["name"] + " The error: " + JSON.stringify(res)
        })
      }
    })
  },

  // Clear button is tapped
  bindViewTapClear: function (e) {
    var that = this

    // Disconnect first if BLE is connected
    if (this.data.isConnected) {
      this.bindViewTapDisconnect()
    }

    // Stop BT discovery
    if (this.data.isScanning) {
      wx.stopBluetoothDevicesDiscovery({
        success: function (res) {
          consloe.log(res)
        }
      })
    }

    // Close BT adapter
    if (this.data.isBTAdapterOpen) {
      wx.closeBluetoothAdapter({
        success: function (res) {
          console.log(res)
        }
      })
    }

    // Reset data
    this.setData({
      devicesArray: [],
      isScanning: false,
      isBTAdapterOpen: false,
      infoLog: '',
      isConnected: false,
      connectedDeviceId: {},
      deviceServices: {},
      deviceCharacteristics: {},
    })
    this.clearDevicesHash()
  },

  // Print Test Label is tapped
  bindViewTapPrintTestLabel: function (str) {
    this.writeStringToPrinter(ZPL_TEST_LABEL)
  },

  // Print Test Image is tapped
  bindViewTapPrintTestImage: function (str) {
    this.writeStringToPrinter(ZPL_TEST_IMAGE)
  },

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

  // Disconnect is tapped
  bindViewTapDisconnect: function (str) {
    var that = this

    wx.showToast({
      title: 'Disconnecting ' + that.devicesHash[that.data.connectedDeviceId]["name"],
      icon: 'none',
      duration: 1000,
    })
    wx.closeBLEConnection({
      deviceId: that.data.connectedDeviceId,
      success: function (res) {
        wx.showToast({
          title: 'Disconnected ' + that.devicesHash[that.data.connectedDeviceId]["name"],
          icon: 'success',
          duration: 1000,
        })
        that.setData({
          isConnected: false,
          connectedDeviceId: {},
          deviceServices: {},
        })
      },
    })
  },

  /////////////////////////////
  //// Bluetooth stuff End ////
  /////////////////////////////

  getUserInfo: function(e) {
    console.log("ssi - getUserInfo: function(e)")
    console.log(e)
    app.globalData.userInfo = e.detail.userInfo
    this.setData({
      userInfo: e.detail.userInfo,
      hasUserInfo: true
    })
  }

})
