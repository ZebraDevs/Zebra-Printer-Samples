//
//  RCTZSDKModule.m
//  ZSDKRCTDevDemo
//

#import <React/RCTLog.h>
#import "RCTZSDKModule.h"
#import "MfiBtPrinterConnection.h"
#import "ZebraPrinter.h" 
#import "SGD.h"

@implementation RCTZSDKModule

// To export a module named RCTZSDKModule
RCT_EXPORT_MODULE(ZSDKModule);

RCT_EXPORT_METHOD(zsdkPrinterDiscoveryBluetooth:(RCTResponseSenderBlock)callback ){
  NSArray* connectedAccessories = nil;
  EAAccessoryManager* accessoryManager = [EAAccessoryManager sharedAccessoryManager];
  if (accessoryManager)
  {
    connectedAccessories = [accessoryManager connectedAccessories];
    
    // Zebra printer array
    NSMutableArray *printers = [NSMutableArray new];
    // Traverse the connected accessories
    for (EAAccessory *accessory in connectedAccessories) {
      // Only interested in Zebra printers
      if ([accessory.protocolStrings containsObject:@"com.zebra.rawport"]) {
        NSDictionary *jsonDictionary = [NSDictionary dictionaryWithObjectsAndKeys:
                                        accessory.name, @"friendlyName", nil];
        [printers addObject:jsonDictionary];
      }
    }

    NSError *error;
    NSData *jsonData = [NSJSONSerialization dataWithJSONObject:printers options:NSJSONWritingPrettyPrinted error:&error];
    NSString *jsonString = [[NSString alloc] initWithData:jsonData encoding:NSUTF8StringEncoding];

    // Invoke the callback to pass the JSON string of printers to React Native
    callback(@[[NSNull null], jsonString]);
  }
  else
  {
    NSLog(@"No accessoryManager");
  }
}

RCT_EXPORT_METHOD(zsdkWriteBluetooth: (NSString *)printerSerialNumber data:(NSString *)data) {
  RCTLogInfo(@"Going to print a test label on BT connection");
  id<ZebraPrinterConnection, NSObject> connection = nil;
  connection = [[MfiBtPrinterConnection alloc] initWithSerialNumber:printerSerialNumber];

  BOOL isOpen = [connection open];
  
  if (isOpen) {
    NSError *error = nil;

    PrinterLanguage language;
    NSString *deviceLanguage = [SGD GET:@"device.languages" withPrinterConnection:connection error:&error];

    if ([deviceLanguage isEqualToString:@"line_print"]) {
      language = PRINTER_LANGUAGE_CPCL;
    } else {
      language = PRINTER_LANGUAGE_ZPL;
    }
    
    NSString *testLabel = [self getTestLabel:language];
    NSData *data = [NSData dataWithBytes:[testLabel UTF8String] length:[testLabel length]];
    [connection write:data error:&error];

    [connection close];
  }
}
  
/*
 * Returns the command for a test label depending on the printer control language
 * The test label is a box with the word "TEST" inside of it
 *
 * _________________________
 * |                       |
 * |                       |
 * |        TEST           |
 * |                       |
 * |                       |
 * |_______________________|
 *
 *
 */
-(NSString *) getTestLabel:(PrinterLanguage) language {
  NSString *testLabel = nil;
  if (language == PRINTER_LANGUAGE_ZPL) {
    testLabel = @"^XA^FO17,16^GB379,371,8^FS^FT65,255^A0N,135,134^FDTEST^FS^XZ";
  } else if (language == PRINTER_LANGUAGE_CPCL) {
    testLabel = @"! 0 200 200 406 1\r\nON-FEED IGNORE\r\nBOX 20 20 380 380 8\r\nT 0 6 137 177 TEST\r\nPRINT\r\n";
  }

  return testLabel;
}

-(NSArray *) getConnectedPrinters {
  NSArray* connectedPrinters = nil;
  EAAccessoryManager* accessoryManager = [EAAccessoryManager sharedAccessoryManager];
  if (accessoryManager)
  {
    connectedPrinters = [accessoryManager connectedAccessories];
    NSLog(@"ConnectedPrinters = %@", connectedPrinters);
  }
  else
  {
    NSLog(@"No accessoryManager");
  }
  return connectedPrinters;
}
@end
