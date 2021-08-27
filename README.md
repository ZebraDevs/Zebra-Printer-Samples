# A Convienent Utility Class for SendFileToPrinter in C#
This [```ZebraSftpMpBodyPublisher.cs```](https://github.com/ZebraDevs/Zebra-Printer-Samples/blob/ZebraSftpMpBodyPublisher-C%23/ZebraSftpMpBodyPublisher.cs) is a utility class to help C# developers quickly to get hands on [SendFileToPrinter API](https://developer.zebra.com/apis/sendfiletoprinter-model#/default/SendFiletoPrinter) in .NET program.

## Overview
The ```ZebraSftpMpBodyPublisher``` contains the following methods.
- ```AddSn()``` adds the printer serial number. It can be called multiple times.
- ```SetZplFilePath()``` sets the ZPL file path
- ```Build()``` generates the object of MultipartFormDataContent.

## Example
```csharp
string sftpPostUrl = "https://api.zebra.com/v2/devices/printers/send";
string apikey = "z2GI9d7UAlMLMDMEE7qA6RVK1GAigRJJ";         // Replace it with your apikey
string tenant = "695315b271dd374c76fad074e6b1f8cf";         // Replace it with your tenant ID
string sn = "XXZJJ174600912";                               // Replace it with your printer serial number
string zplFilePath = @"/Users/john/Desktop/HelloWorld.txt"; // Replace it with your ZPL file path

HttpClient httpClient = new HttpClient();
httpClient.DefaultRequestHeaders.Add("apikey", apikey); // Add the apikey to the header
httpClient.DefaultRequestHeaders.Add("tenant", tenant); // Add the tenant ID to the header

// Use ZebraSftpMpBodyPublisher to compose the form data
MultipartFormDataContent formData = new ZebraSftpMpBodyPublisher().AddSn(sn).AddSn(sn).SetZplFilePath(zplFilePath).Build();

// Post the form data
HttpResponseMessage response = await httpClient.PostAsync(sftpPostUrl, formData);

response.EnsureSuccessStatusCode();
httpClient.Dispose();
string description = response.Content.ReadAsStringAsync().Result;

```
