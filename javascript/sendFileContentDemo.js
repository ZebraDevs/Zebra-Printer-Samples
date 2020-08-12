// The selected ZPL file to be sent
var fileToSend = "";

// Select a ZPL file from the local storage
function handleZPLFile()
{
	// Clear the fileToSend
	fileToSend = "";
	document.getElementById("sendFile_btn").disabled=true;

	// Parse the newly selected template
	fileToSend = document.getElementById("input_zpl").files[0];
	if (fileToSend != null) {
		document.getElementById("sendFile_btn").disabled=false;
	}
}

// Get the API Key, Tenant ID & Printer Serial Numbers from the input fields, then call the API
function sendFile() {
    var serialNumbers = printerSNArray();
	apiKey = document.getElementById("apiKey").value;	
	tenant = document.getElementById("tenant").value;	

	// Send the selected file to the printer(s)
	sendFileToPrinter(apiKey, tenant, fileToSend, serialNumbers)
}

// Call the SendFileToPrinter API to send the file
function sendFileToPrinter(apiKey, tenant, fileToSend, serialNumbers) {

	var http = new XMLHttpRequest();
	let url = getEndpoint();
	http.open("POST", url, true);

	// Set the proper header information for the request, including the API Key.
	// Do not specify the Content-Type header here, as it is implied in 
	http.setRequestHeader("apikey", apiKey); // Add API key to the header
	http.setRequestHeader("tenant", tenant); // Add tenant ID


	// http.setRequestHeader("Access-Control-Allow-Origin", url);

	http.onreadystatechange = () => { // Call a function when the state changes.
    	// if((http.readyState == 4 || http.readyState == 1) && (http.status == 200 || http.status == 500) ) {
    	if((http.readyState == 4 || http.readyState == 1) ) {
        	 alert(http.responseText);
    	}
	}

	fd = new FormData();
	fd.append("zpl_file", fileToSend); // Attach the file to be sent.

	// Append the printer serial numbers
	serialNumbers.forEach(function(item, index, array) {
		fd.append("sn", item);
	})

	http.send(fd);
}
