# A Convienent Utility Class for SendFileToPrinter in Java
This [```ZebraSftpMpBodyPublisher.java```](https://github.com/ZebraDevs/Zebra-Printer-Samples/blob/ZebraSftpMpBodyPublisher-Java/ZebraSftpMpBodyPublisher.java) is a utility class to help Java developers quickly get hands on [SendFileToPrinter API](https://developer.zebra.com/apis/sendfiletoprinter-model#/default/SendFiletoPrinter) in a Java program. It builds a Multipart Form Data as required by the SendFileToPrinter request in Java. This class is implemented with ```java.net.http```.

## Overview
The ```ZebraSftpMpBodyPublisher``` class contains the following methods.
- ```addSn()``` adds a printer serial number. It can be called multiple times for the same printer or for different printers.
- ```setZplFilePath()``` sets the ZPL file path
- ```build()``` generates the multipart body that complies with the format below, so that the request can be parsed correctly by the backend.
```
          --203fab52-5a95-4e51-9e5c-53248aae2256
          Content-Disposition: form-data; name="sn"

          XXZJJ174600912
          --203fab52-5a95-4e51-9e5c-53248aae2256
          Content-Disposition: form-data; name="zpl_file"; filename="HelloWorld.txt"
          Content-Type: text/plain

          ^XA^FO50,50^ADN,36,20^FDHello World!^FS^XZ
          --203fab52-5a95-4e51-9e5c-53248aae2256--
```
- ```getBoundary()``` returns the boundary to be used in the HTTPS request header 

## Example
```java
// Create URI from the URL of SendFileToPrinter API
URI uri = URI.create("https://api.zebra.com/v2/devices/printers/send");

String apikey = "z2GI9d7UAlMLMDMEE7qA6RVK1GAigRJJ"; // Replace it with your apikey
String tenant = "695315b271dd374c76fad074e6b1f8cf"; // Replace it with your tenant ID
String sn = "XXZJJ174600912";                       // Replace it with your printer serial number

// Example ZPL file containing - "^XA ^FO50,50^ADN,36,20^FDHello World^FS ^XZ"
Path zplFilePath = Paths.get("C:\\Users\\john\\HelloWorld.txt"); // Replace it with your ZPL file path

// Use ZebraSftpMpBodyPublisher.java
ZebraSftpMpBodyPublisher publisher 
                    = new ZebraSftpMpBodyPublisher().addSn(sn).addSn(sn).addSn(sn).setZplFilePath(zplFilePath);

HttpRequest request = HttpRequest.newBuilder().uri(uri).header("apikey", apikey).header("tenant", tenant)
                      .header("Content-Type", "multipart/form-data; boundary=" + publisher.getBoundary())
                      .POST(publisher.build()).build();

HttpClient httpclient = HttpClient.newBuilder().build();
HttpResponse response = httpclient.send(request, BodyHandlers.ofString());

System.out.println(response.body());
```
