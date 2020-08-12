var serialNumber = ""; // Printer Serial Number
var apiKey = ""; // Zebra Data Services API Key
var tenant = ""; // Tenant ID, obtained from https://api.zebra.com/v2/mytenant

var counter = 0; // Starting with zero additional printer by default
var additionalPrinterSnMap = new Map();

let endpoint_prod = "https://api.zebra.com/v2/devices/printers/send";
let endpoint_stage = "TBD"; // The endpoint on the staging envrionment

// Populate the serial number and apiKey;
window.onload = () => {
	document.getElementById("printerSN").value = serialNumber;
	document.getElementById("apiKey").value = apiKey;	
	document.getElementById("tenant").value = tenant;

	// Setup endpoints of prod & stage
	document.getElementById('endpoint').options[0].innerHTML = endpoint_prod;	
	document.getElementById('endpoint').options[1].innerHTML = endpoint_stage;
}

// Add a printer
function addPrinter(divName) {
	var newdiv = document.createElement('div');
	newdiv.id = "div" + counter;
	var printerSnInputID = "sn" + counter;

    newdiv.innerHTML = "<label for='printerSN'>Printer Serial Number:</label>" +
    				   "<input class='serial_number' type='text' id='" + printerSnInputID + "' placeholder='Printer SN here'>" +
    				   "<button class='delete' onclick=\"delPrinter('" + newdiv.id + "')\">X</button>" +
    				   "<br><br>";

	document.getElementById(divName).appendChild(newdiv);

	// Update the map and the counter
	additionalPrinterSnMap.set(newdiv.id, printerSnInputID);
    counter++; // Peg the counter
}

// Delete a printer
function delPrinter(divId) {
	document.getElementById(divId).parentNode.removeChild(document.getElementById(divId));

	// Update the map
	additionalPrinterSnMap.delete(divId);
}

// Get an array of printer serial numbers from additionalPrinterSnMap.
function printerSNArray() {
	var printerSnArray = [];

	// Get the very first SN
	var sn = document.getElementById("printerSN").value.trim();
	if (sn) {
		printerSnArray.push(sn);		
	}

	for (let [key, value] of additionalPrinterSnMap) {
		sn = document.getElementById(value).value.trim();
		
		if (sn) {
			printerSnArray.push(sn);
		}
	}

	return printerSnArray;
} 

// Get the url of the endpoint of the API
function getEndpoint() {
	if (document.getElementById('endpoint').value == 'prod') {
		return endpoint_prod;
	} else if (document.getElementById('endpoint').value == 'stage') {
		return endpoint_stage;
	} else {
		return null;
	}
}