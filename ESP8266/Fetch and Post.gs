function fetchDataAndPost() {
  // First URL: Fetching data
  const firstUrl = "https://script.google.com/macros/s/AKfycbx4suwMYqgGeVUAXvaoAsXRcEQXnSS6QHcbktarPVCxEd0yCaewa9jUSqGHNSmDPGhn/exec?module=MODULE25";
  
  // Fetch data from the first URL
  const response = UrlFetchApp.fetch(firstUrl);
  
  // Parse the response to a JSON object
  const data = JSON.parse(response.getContentText());
  delete data.module;
  // Second URL: Posting data
  const secondUrl = "https://tandem.autodesk.com/api/v1/timeseries/models/urn:adsk.dtm:YZYTJvY8TiW7cBJ73evprQ/streams/AQAAACyAPh9tlETQj5pdbbZC-fcAAAAA";
  
  // Username and password (you can also store these securely)
  const username = "";
  const password = "-FLzELV1Rg-7DuMh8b8s7g"; // Use the correct password or leave it empty if none is required.
  
  // Encode username and password in base64
  const authHeader = "Basic " + Utilities.base64Encode(username + ":" + password);
  
  // Create options for the POST request
  const options = {
    "method": "post",
    "contentType": "application/json",
    "payload": JSON.stringify(data),
    "headers": {
      "Authorization": authHeader
    }
  };
  
  // Post the data to the second URL
  const postResponse = UrlFetchApp.fetch(secondUrl, options);
  
  // Log the response from the POST request
  Logger.log(postResponse.getContentText());
}
