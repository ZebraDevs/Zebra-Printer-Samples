// To hold the ZPL content of the template file
var templateZPL = "";

// To hold the variables extracted from the template file
var templateVariableList = "";

// Read the template file from a local storage
function handleFile()
{
	// Clear template
	templateZPL = "";
	document.getElementById("templatePrint_btn").disabled=true;

	// Remove all variable input fields. Start from the 3rd item.
	var varInputDiv = document.getElementById("variableInputDiv");
	while (varInputDiv.childNodes[2]) {
		varInputDiv.removeChild(varInputDiv.childNodes[2]);
	}
	varInputDiv.style.display = "none";

	// Parse the newly selected template
	var selectedFile = document.getElementById("input_template").files[0];

	if (selectedFile != undefined) {
		var reader = new FileReader();
	   	reader.readAsText(selectedFile,'UTF-8');

	   	// Dump the content once the reader completes successfully.
	   	reader.onload = readerEvent => {
	    	templateZPL = readerEvent.target.result; // Get the file content!

	      	parseTemplate(templateZPL);
	   	}
    }
}

// Parse the template, extract & display the variables and their input fields.
function parseTemplate(template) {

	// Search for ^FN occurances to extract variables
	var pattFN = /\^FN[1-9][0-9]*.*\"\^FS/ig;
	var zplVariables = template.match(pattFN);

	if (zplVariables !== null && zplVariables.length != 0) {
		// Remove the duplicates from the zplVariables array
		zplVariables = zplVariables.filter((a, b) => zplVariables.indexOf(a) === b);

		// Create variable & input text fields for each variable in zplVariable array
		var varInput = document.getElementById("variableInputDiv");

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
			input.setAttribute("value", zplVariables[r].split("\"")[1]); // Prepupulated with the variable name for value

			var pageBreak = document.createElement("br");
			varInput.appendChild(lbl);
			varInput.appendChild(input);
			varInput.appendChild(pageBreak);
		}
		varInput.style.display = "block"; // Reveal the variabl & input fields.

		templateVariableList = zplVariables;

		document.getElementById("templatePrint_btn").disabled=false;

	} else {
		// Pop up "Not a template" msg
		alert("It's not a template");
	}
}

// Replace the variables with the values from the corresponding input fields.
// Prepare the content to be sent to the printer.
function templatePrint() {

	// Get the variable values from the input fields for form a map
	var variableValueList = templateVariableList.map(v => document.getElementById(v).value);

	// Remove the download format command (^DF) if it is present to 
	// prevent the format from being stored on the printer.
	var pattDF = /\^DF[ERZ]\:.*\^FS/i;
	var zpl = templateZPL.replace(pattDF, "");

	// Replace the template variables with the values
	for (var i = 0; i < templateVariableList.length; i++) {

		zpl = zpl.split(templateVariableList[i]).join("^FD" + variableValueList[i] + "^FS");
		console.log(document.getElementById(templateVariableList[i]).value);
	}

    var serialNumbers = printerSNArray();
	apiKey = document.getElementById("apiKey").value;	
	tenant = document.getElementById("tenant").value;	

	sendZplToPrinter(apiKey, tenant, zpl, serialNumbers); // Print the populated zpl
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
