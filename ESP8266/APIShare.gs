function doGet(e) {
  const moduleName = e.parameter.module;

  if (!moduleName) {
    return ContentService.createTextOutput(JSON.stringify({ error: 'Module name is required' }));
  }

  return ContentService.createTextOutput(fetchLatestDataForModule(moduleName)).setMimeType(ContentService.MimeType.JSON);
}

function fetchLatestDataForModule(moduleName) {
  const folder = getModuleFolder(moduleName);
  if (!folder) return JSON.stringify({ error: 'Module not found' });

  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  const expectedFileName = `${moduleName}-${todayStr}.csv`;

  const files = folder.getFilesByName(expectedFileName);
  if (!files.hasNext()) {
    return JSON.stringify({ error: `No file found for today's date (${todayStr}) in module ${moduleName}` });
  }

  const file = files.next();
  const fileData = parseCSVFile(file);

  if (fileData.length > 1) {
    const headers = fileData[0];  // First row as headers
    const dataRow = fileData[1];  // Second row as data

    let response = { module: moduleName };
    headers.forEach((header, index) => {
      if (header !== "Error Code") {
        response[header] = dataRow[index];
      }
    });

    return JSON.stringify(response);
  } else {
    return JSON.stringify({ module: moduleName, message: 'No data available in the file.' });
  }
}

function getModuleFolder(moduleName) {
  const parentFolderId = '1Wta8cSBBsFa8-qUa3xUbMeVNQp7Pcrm1';
  const parentFolder = DriveApp.getFolderById(parentFolderId);
  const subfolders = parentFolder.getFoldersByName(moduleName);
  if (subfolders.hasNext()) {
    return subfolders.next();
  }
  return null;
}

function parseCSVFile(file) {
  const content = file.getBlob().getDataAsString();
  const rows = Utilities.parseCsv(content);
  return rows;
}
