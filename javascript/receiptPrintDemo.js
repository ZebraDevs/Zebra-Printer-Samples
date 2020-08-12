// To hold the ZPL content of the template file
var receiptTemplateZPL = "";
var storedRecall = {}; // {headerStored, headerRecall, bodyStored, bodyRecall, footerStored, footerRecall}

// To hold the variables extracted from the header, body & footer
var headerVariableList = "";
var bodyVariableList   = "";
var footerVariableList = "";

// Count the additional items being added, starting from 1.
// 0 is reserved for the very first item.
var itemCounter = 1;
var itemMap = new Map();


// Read the template file from a local storage
function handleFile()
{
	// Clear template
	receiptTemplateZPL = "";
	storedRecall = {};

	headerVariableList = "";
	bodyVariableList   = "";
	footerVariableList = "";
	
	// Hide both receiptPrint_btn & addItem_btn
	document.getElementById("receiptPrint_btn").style.display="none";
	document.getElementById("addItem_btn").style.display="none";

	// Remove all variable input fields in Header section. Start from the 3rd item.
	var varInputDiv = document.getElementById("headerVariableInputDiv");
	while (varInputDiv.childNodes[2]) {
		varInputDiv.removeChild(varInputDiv.childNodes[2]);
	}
	varInputDiv.style.display = "none";

	// Remove all variable input fields in Body section. Start from the 3rd item.
	varInputDiv = document.getElementById("bodyVariableInputDiv");
	while (varInputDiv.childNodes[2]) {
		varInputDiv.removeChild(varInputDiv.childNodes[2]);
	}
	varInputDiv.style.display = "none";

	// Remove all variable input fields in Footer section. Start from the 3rd item.
	varInputDiv = document.getElementById("footerVariableInputDiv");
	while (varInputDiv.childNodes[2]) {
		varInputDiv.removeChild(varInputDiv.childNodes[2]);
	}
	varInputDiv.style.display = "none";

	// Parse the newly selected template
	var selectedFile = document.getElementById("input_receipt_template").files[0];

	if (selectedFile != undefined) {
		var reader = new FileReader();
	   	reader.readAsText(selectedFile,'UTF-8');

	   	// Dump the content once the reader completes successfully.
	   	reader.onload = readerEvent => {
	    	receiptTemplateZPL = readerEvent.target.result; // Get the file content!

	      	parseReceiptTemplate(receiptTemplateZPL);
	   	}
    }
}

// Parse the template, extract & display the variables and their input fields.
function parseReceiptTemplate(template) {
	// Extract formats into {headerStored, headerRecall, bodyStored, bodyRecall, footerStored, footerRecall}
	storedRecall = extractStoredRecallFormats(template);

	if (storedRecall == undefined || Object.keys(storedRecall).length != 6) {
		// Clear the file selection
		document.getElementById("input_receipt_template").value = "";

		// Pop up "Not a receipt template" msg
		alert("It's not a receipt template");
		return;
	}

	// Variable pattern in ZPL template
	let pattFN = /\^FN[1-9][0-9]*.*\"\^FS/ig;

	// Search for ^FN occurances to extract variables from header
	var zplVariables = storedRecall.headerStored.match(pattFN);

	if (zplVariables !== null && zplVariables.length != 0) {
		// Remove the duplicates from the zplVariables array
		zplVariables = zplVariables.filter((a, b) => zplVariables.indexOf(a) === b);

		// Create variable & input text fields for each variable in zplVariable array
		var varInput = document.getElementById("headerVariableInputDiv");

		//Create rows of variable and text input fields for each variable
		for (var r = 0; r < zplVariables.length; r++) {
			var lbl = document.createElement("label");
			lbl.setAttribute("class", "variableInput");
			lbl.setAttribute("for", zplVariables[r]);
			lbl.innerHTML = zplVariables[r].split("\"")[1] + ":"; // Show the variable name with ":" only

			var input = document.createElement("input");
			input.setAttribute("class", "variableInput");
			input.setAttribute("type", "text");
			input.setAttribute("id", zplVariables[r]);

			// Prepupulated with the default value from the recall format
			var fnHeaderStored = zplVariables[r].match(/^\^FN\d{1,}/);
			var fnHeaderRecall = storedRecall.headerRecall.match("\\" + fnHeaderStored + ".+\\^FS");
			var fdValue = fnHeaderRecall[0].match("\\^FD.+\\^FS");
			input.setAttribute("value", fdValue[0].replace("^FD", '').replace("^FS", ''));

			var pageBreak = document.createElement("br");
			varInput.appendChild(lbl);
			varInput.appendChild(input);
			varInput.appendChild(pageBreak);
		}
		varInput.style.display = "block"; // Reveal the variabl & input fields.

		headerVariableList = zplVariables;
	}

	// Search for ^FN occurances to extract variables from body
	var zplVariables = storedRecall.bodyStored.match(pattFN);

	if (zplVariables !== null && zplVariables.length != 0) {
		// Remove the duplicates from the zplVariables array
		zplVariables = zplVariables.filter((a, b) => zplVariables.indexOf(a) === b);

		// Create variable & input text fields for each variable in zplVariable array
		var varInput = document.getElementById("bodyVariableInputDiv");

		var itemDiv = document.createElement('div');
		itemDiv.id = "item0";

		//Create rows of variable and text input fields for each variable
		for (var r = 0; r < zplVariables.length; r++) {
			var lbl = document.createElement("label");
			lbl.setAttribute("class", "variableInput");
			lbl.setAttribute("for", zplVariables[r]);
			lbl.innerHTML = zplVariables[r].split("\"")[1] + ":"; // Show the variable name with ":" only

			var input = document.createElement("input");
			input.setAttribute("class", "variableInput");
			input.setAttribute("type", "text");
			input.setAttribute("id", zplVariables[r].split("\"")[1]);

			// Prepupulated with the default value from the recall format
			var fnBodyStored = zplVariables[r].match(/^\^FN\d{1,}/);
			var fnBodyRecall = storedRecall.bodyRecall.match("\\" + fnBodyStored + ".+\\^FS");
			var fdValue = fnBodyRecall[0].match("\\^FD.+\\^FS");
			input.setAttribute("value", fdValue[0].replace("^FD", '').replace("^FS", ''));

			itemDiv.appendChild(lbl);
			itemDiv.appendChild(input);

			// Add two <br> at the end of each item
			if (r == zplVariables.length - 1) {
				var pageBreak = document.createElement("br");
				itemDiv.appendChild(pageBreak);
				var pageBreak = document.createElement("br");
				itemDiv.appendChild(pageBreak);
			}
		}

		varInput.appendChild(itemDiv);
		varInput.style.display = "block"; // Reveal the variabl & input fields.

		bodyVariableList = zplVariables;

		itemMap.set(itemDiv.id, bodyVariableList);

		// Reveal the addItem button
		document.getElementById("addItem_btn").style.display = ""; // Reveal the addItem_btn
	}

	// Search for ^FN occurances to extract variables from footer
	var zplVariables = storedRecall.footerStored.match(pattFN);

	if (zplVariables !== null && zplVariables.length != 0) {
		// Remove the duplicates from the zplVariables array
		zplVariables = zplVariables.filter((a, b) => zplVariables.indexOf(a) === b);

		// Create variable & input text fields for each variable in zplVariable array
		var varInput = document.getElementById("footerVariableInputDiv");

		//Create rows of variable and text input fields for each variable
		for (var r = 0; r < zplVariables.length; r++) {
			var lbl = document.createElement("label");
			lbl.setAttribute("class", "variableInput");
			lbl.setAttribute("for", zplVariables[r]);
			lbl.innerHTML = zplVariables[r].split("\"")[1] + ":"; // Show the variable name with ":" only

			var input = document.createElement("input");
			input.setAttribute("class", "variableInput");
			input.setAttribute("type", "text");
			input.setAttribute("id", zplVariables[r]);

			// Prepupulated with the default value from the recall format
			var fnFooterStored = zplVariables[r].match(/^\^FN\d{1,}/);
			var fnFooterRecall = storedRecall.footerRecall.match("\\" + fnFooterStored + ".+\\^FS");
			var fdValue = fnFooterRecall[0].match("\\^FD.+\\^FS");
			input.setAttribute("value", fdValue[0].replace("^FD", '').replace("^FS", ''));

			var pageBreak = document.createElement("br");
			varInput.appendChild(lbl);
			varInput.appendChild(input);
			varInput.appendChild(pageBreak);
		}
		varInput.style.display = "block"; // Reveal the variabl & input fields.

		footerVariableList = zplVariables;

		document.getElementById("receiptPrint_btn").style.display=""; // Reveal the receiptPrint_btn
	}
}

// Extract the stored & recall formats and return them as an object of
// {headerStored, headerRecall, bodyStored, bodyRecall, footerStored, footerRecall}.
function extractStoredRecallFormats(zplTemplate) {
	// Separate the receipt template into Header, Body & Footer
	let headerId = /\^FX\s+HEADER\s+\^FS/ig;
	let bodyId   = /\^FX\s+BODY\s+\^FS/ig;
	let footerId = /\^FX\s+FOOTER\s+\^FS/ig;
	let storedId = /\^DF[ER]:\S+\^FS/i;

	if (zplTemplate.match(headerId) && zplTemplate.match(bodyId) && zplTemplate.match(footerId)) {
		var temp = zplTemplate.replace(/\^XZ/ig, "^XZReceiptDemoEnd"); // Add "ReceiptDemoEnd" as temporary new delimiter
		var tempSplits = temp.split(/ReceiptDemoEnd/, 6); // Split at the new delimiter to preserve "^XZ"
		
		if (tempSplits.length == 6) {

			for (var i = 0; i < 6; i++) {
				if (tempSplits[i].match(headerId)) {
					// Process header
					var headerStored = tempSplits[i];

					// Extract header recall
					var hStoredId = headerStored.match(storedId);
					var hRecallId = hStoredId[0].replace(/\^DF/i, "^XF").replace(/\^/g, "\\^");
					for (var j = i + 1; j < 6; j++) {
						if (tempSplits[j].match(hRecallId)) {
							var headerRecall = tempSplits[j];
							break; // Exit the loop, as we have found the header recall.
						}
					}
				} else if (tempSplits[i].match(bodyId)) {
					// Process body
					var bodyStored = tempSplits[i];

					// Extract body recall
					var bStoredId = bodyStored.match(storedId);
					var bRecallId = bStoredId[0].replace(/\^DF/i, "^XF").replace(/\^/g, "\\^");
					for (var j = i + 1; j < 6; j++) {
						if (tempSplits[j].match(bRecallId)) {
							var bodyRecall = tempSplits[j];
							break; // Exit the loop, as we have found the body recall.
						}
					}
				} else if (tempSplits[i].match(footerId)) {
					// Process footer
					var footerStored = tempSplits[i];

					// Extract footer recall
					var fStoredId = footerStored.match(storedId);
					var fRecallId = fStoredId[0].replace(/\^DF/i, "^XF").replace(/\^/g, "\\^");
					for (var j = i + 1; j < 6; j++) {
						if (tempSplits[j].match(fRecallId)) {
							var footerRecall = tempSplits[j];
							break; // Exit the loop, as we have found the footer recall.
						}
					}
				}
			}
			
			return {headerStored, headerRecall, bodyStored, bodyRecall, footerStored, footerRecall};
		}
	}
}

// Add additional item
function addItem(divName) {
	var newdiv = document.createElement('div');
	newdiv.id = "item" + itemCounter;

	newdiv.innerHTML = "<br>";

	for (var i = 0; i < bodyVariableList.length; i++) {
		newdiv.innerHTML += "<label for='" + bodyVariableList[i] + "'>" + bodyVariableList[i].split("\"")[1] + ":</label>" +
    				   	 "<input class='variableInput' type='text' id='" + bodyVariableList[i].split("\"")[1] + "' value='" + bodyVariableList[i].split("\"")[1] + "'>";
 		if (i == 0) {   	
    		newdiv.innerHTML += "<button class='delete' onclick=\"delItem('" + newdiv.id + "')\">X</button>"; // Only add the delete button at the beginning.
		}
	}

	newdiv.innerHTML += "<br><br>";

	document.getElementById(divName).appendChild(newdiv);

	itemMap.set(newdiv.id, bodyVariableList);
    itemCounter++; // Peg the itemCounter
}

// Delete a printer
function delItem(divId) {
	document.getElementById(divId).parentNode.removeChild(document.getElementById(divId));

	// Update the map
	itemMap.delete(divId);
}

// Replace the variables with the values from the corresponding input fields.
// Prepare the content to be sent to the printer.
function receiptPrint() {

	// Put header, body & footer stored formats together
	var sendFile = storedRecall.headerStored + storedRecall.bodyStored + storedRecall.footerStored;

	/////////////////////// Header /////////////////////// 
	// Get the variable values from the input fields of the header
	var headerVariableValueList = headerVariableList.map(v => document.getElementById(v).value);

	// Populate the variables with the values in the header recall formats, and append it to the sendFile
	sendFile += populateRecallValues(storedRecall.headerRecall, headerVariableList, headerVariableValueList);

	/////////////////////// Body /////////////////////// 
	// Populate the variables with the values in the body recall format for each item, including additonal items.
	for (let [key, itemValueArray] of itemMap) {
		var itemVariableValueList = [];

		itemValueArray.forEach(function (aValue) {
			itemVariableValueList.push(document.getElementById(key).querySelector("#" + aValue.split("\"")[1]).value);
		});

 		// Append the body recall format of each item to the sendFile
		sendFile += populateRecallValues(storedRecall.bodyRecall, bodyVariableList, itemVariableValueList);
	}

	/////////////////////// Footer /////////////////////// 
	// Get the variable values from the input fields of the footer
	var footerVariableValueList = footerVariableList.map(v => document.getElementById(v).value);

	// Populate the variables with the values in the footer recall format, and append it to the sendFile
	sendFile += populateRecallValues(storedRecall.footerRecall, footerVariableList, footerVariableValueList);

    var serialNumbers = printerSNArray();
	apiKey = document.getElementById("apiKey").value;	
	tenant = document.getElementById("tenant").value;	

	sendZplToPrinter(apiKey, tenant, sendFile, serialNumbers); // Print the populated zpl
}


// Populate the variables with the values in the recall format
function populateRecallValues(recallFormat, variableList, valueList) {
	valueList.forEach(function (aValue, index) {
		var storedFN = variableList[index].match(/^\^FN\d{1,}/);
		var recallFN = recallFormat.match("\\" + storedFN + ".+\\^FS");
		var valueFD  = recallFN[0].match("\\^FD.+\\^FS");
		recallFormat = recallFormat.split(recallFN).join(recallFN[0].replace(valueFD, "^FD" + aValue + "^FS"));		
	});	

	return recallFormat;
}


// Call the SendFileToPrinter API to send the content as a file to the printer(s)
function sendZplToPrinter(apiKey, tenant, zpl, serialNumbers) {

	var http = new XMLHttpRequest();
	let url = getEndpoint();
	http.open("POST", url, true);

	// Set the proper header information for the request, including the API Key.
	// Do not specify the Content-Type header here, as it is implied in 
	http.setRequestHeader("apikey", apiKey); // Add API key to the header
	http.setRequestHeader("tenant", tenant); // Add tenant ID

	http.onreadystatechange = () => { // Call a function when the state changes.
    	if(http.readyState == 4 || http.status == 1) {
        	alert(http.responseText);
    	}
	}

	fd = new FormData();
	fd.append("zpl_file", new Blob([zpl], {type: 'text/plain'})); // Create a blob as file to send.

	// Append the printer serial numbers
	serialNumbers.forEach(function(item, index, array) {
		fd.append("sn", item);
	})

	http.send(fd);
}
