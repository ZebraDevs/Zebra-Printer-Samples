using System;
using System.IO;
using System.Collections.Generic;
using System.Net.Http;
using System.Linq;

public class ZebraSftpMpBodyPublisher
{
    private List<String> serialNumberList = new List<String>(); // At least to have one printer SN
    private string zplFilePath = null; // Must have one zplFilePath to build the multipart request body.

    public ZebraSftpMpBodyPublisher()
    {
    }

    public MultipartFormDataContent Build()
    {
        if (serialNumberList.Count == 0) {
            throw new ArgumentOutOfRangeException("Must have at least one printer serial number in order to build multipart form data.");
        }

        if (zplFilePath == null) {
            throw new ArgumentNullException("Must have a ZPL file in order to build multipart form data.");
        } else if (!File.Exists(zplFilePath)) {
            throw new ArgumentException("The specified ZPL file does not exist.");
        }

        // Compose the multipart form data content
        var form = new MultipartFormDataContent();

        // Remove the quotes around the boundary
        var boundary = form.Headers.ContentType.Parameters.First(o => o.Name == "boundary");
        boundary.Value = boundary.Value.Replace("\"", String.Empty);

        // Add printer serial number(s)
        foreach (string sn in serialNumberList) {
            form.Add(new StringContent(sn), "\"sn\""); // Extra double quotes around "sn" are needed
        }

        FileStream zplFileStream = new FileStream(zplFilePath, FileMode.Open);
        form.Add(new StreamContent(zplFileStream), "zpl_file", Path.GetFileName(zplFilePath));

        return form;
    }

    // Add a printer serial number. You can add the serial number multiple times,
    // or add multiple serial numbers.
    public ZebraSftpMpBodyPublisher AddSn(string serialNumber)
    {
        serialNumberList.Add(serialNumber);
        return this;
    }

    // You can have only one ZPL file at a time.
    public ZebraSftpMpBodyPublisher SetZplFilePath(string zplFilePath)
    {
        this.zplFilePath = zplFilePath;
        return this;
    }
}