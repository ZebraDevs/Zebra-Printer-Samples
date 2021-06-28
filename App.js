import React, { Component } from 'react';
import { ActivityIndicator, Platform } from 'react-native';
import { StyleSheet, Button, TouchableOpacity, Text, View, Alert } from 'react-native';
import ZSDKModule from './ZSDKModule.js' // Import ZSDKModule from ./ZSDKModule.js file.

class App extends Component {

  state = { printers: [] }; // Starting with an empty list for the listview

  isDiscovering = false; // Hide or reveal the spinner
  buttonTitle = 'Click to Discover Bluetooth Printers';

  printTestLabel = (printer) => {
    alert(`A test label is printed on ${printer.name}`);

    if (Platform.OS === 'ios') {
      ZSDKModule.zsdkWriteBluetooth(printer.name, ''); // Use friendlyName on iOS

    } else {
      var mac_sn = printer.name.split(', '); // e.g. ["AC:3F:A4:BE:90:93","XXZEJ173500341"]
      var macAddress = mac_sn[0];
      var friendlyName = mac_sn[1];
      ZSDKModule.zsdkWriteBluetooth(macAddress, ''); // Use MAC address on Android
    }
  }

  discoverPrinters = () => {
    // First, clear the listview
    var printersArray = [];
    this.setState({printers: printersArray});
    this.isDiscovering = true;
    this.buttonTitle = 'Scanning for Zebra Printers ...';

    ZSDKModule.zsdkPrinterDiscoveryBluetooth(
       // The callback to be called by the native module after Bluetooth discovery finishes.
       (error, discoveredPrinters) => {
        this.isDiscovering = false; // Disable the spinner
        this.buttonTitle = 'Click to Discover Bluetooth Printers';

        if (error) {
          console.error(`Error found! ${error}`);
        }

        console.log(`Discovered printers are: ${discoveredPrinters}`);

        // Parse the JSON string
        var printersJson = JSON.parse(discoveredPrinters);

        var printersArray = []; // Discovered printer array for listview

        // Traverse the JSON object of printers to compose an array for the listview
        if (Platform.OS === 'ios') {
          // Cannot get printer's MAC address on iOS. Only the friendlyName
          for (var i = 0; i < printersJson.length; i++) {
            printersArray.push({id: i, name: `${printersJson[i].friendlyName}`});
          }
        } else {
          // We have both MAC address and the friendlyName on Android
          for (var i = 0; i < printersJson.length; i++) {
            printersArray.push({id: i, name: `${printersJson[i].address}` + `, ` + `${printersJson[i].friendlyName}`});
          }
        }

        console.log(printersArray);

        // Update the listview
        this.setState({printers: printersArray});

      }
    );
  }

  render() {
    return (
      <View style={{marginTop: 50}}>
        <Text style={styles.headline}>ZSDK RCT Native Module DevDemo</Text>

        <Button
          title={this.buttonTitle}
          color='#841584'
          disabled={this.isDiscovering}
          onPress={this.discoverPrinters}
        />

        {
          this.state.printers.map((printer, index) => (
            <TouchableOpacity
              key = {printer.id}
              style = {styles.container}
              onPress = {() => this.printTestLabel(printer)}>
              <Text style = {styles.text}>
                {printer.name}
              </Text>
            </TouchableOpacity>
          ))
        }

        <View style={{marginTop: 150}}>
          {this.isDiscovering && <ActivityIndicator size='large' color='#0000ff' />}
        </View>
      </View>
    )
  }
}

export default App

const styles = StyleSheet.create({
  container: {
    marginTop: 3,
    padding: 10,
    backgroundColor: '#d9f9b1',
    alignItems: 'center',
    justifyContent: 'center',
  },

  text: {
      color: '#4f603c'
  },

  headline: {
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 17,
    marginTop: 0,
  },

});

