function doPost(e) {
  try {
    const params = JSON.parse(e.postData.contents);
    const { command, module_name: moduleName, values: rawValues } = params;

    if (command !== 'insert_data') {
      return ContentService.createTextOutput('Invalid command');
    }

    const values = processValues(rawValues);
    const dateTimeString = values[0];
    const dateString = dateTimeString.split(' ')[0];

    const parentFolderId = '1kVuD697BMTczZGM44fVB-HHV2dk-DXOu';
    const historianFolder = getOrCreateFolder(parentFolderId, "Historian");
    const moduleFolder = getOrCreateFolder(historianFolder.getId(), moduleName);
    const fileName = `${moduleName}-${dateString}.csv`;
    const file = getOrCreateFile(moduleFolder, fileName, dateTimeString, values);

    const result = insertRow(file, values);
    updateGoogleSheet(historianFolder, moduleName, values);
    return ContentService.createTextOutput(result);
  } catch (error) {
    Logger.log('Error in doPost: ' + error.message);
    return ContentService.createTextOutput('Error: ' + error.message);
  }
}

function processValues(rawValues) {
  const values = rawValues.split(',');
  values[0] = adjustDateTimeString(values[0]);
  return values;
}

function adjustDateTimeString(dateTimeString) {
  const date = new Date(dateTimeString);
  const seconds = date.getSeconds();

  if (seconds >= 0 && seconds <= 15) {
    date.setSeconds(0);
  } else if (seconds >= 16 && seconds <= 45) {
    date.setSeconds(30);
  } else if (seconds >= 46 && seconds <= 59) {
    date.setSeconds(0);
    date.setMinutes(date.getMinutes() + 1);
  }

  return formatDate(date, 'yyyy-MM-dd HH:mm:ss');
}

function insertRow(file, values) {
  const content = file.getBlob().getDataAsString().trim();
  const timestamp = values[0];
  const header = 'Timestamp,Voltage,Current,Power,Energy,Frequency,Power Factor,Error Code';
  let newContent;

  if (!content) {
    newContent = `${header}\n${values.join(',')}`;
  } else {
    const lines = content.split('\n');
    const dataLines = lines.slice(1);
    let timestampExists = false;

    for (let i = 0; i < dataLines.length; i++) {
      if (dataLines[i].startsWith(timestamp)) {
        dataLines[i] = values.join(',');
        timestampExists = true;
        break;
      }
    }

    if (!timestampExists) {
      const lastTimestamp = dataLines.length ? dataLines[0].split(',')[0] : null;
      const newDataLines = generateDataWithIntervals(lastTimestamp, values);
      newContent = [header, ...newDataLines, ...dataLines].join('\n');
    } else {
      newContent = [header, ...dataLines].join('\n');
    }
  }

  file.setContent(newContent);
  return 'Data inserted successfully';
}

function getOrCreateFolder(parentFolderId, folderName) {
  const parentFolder = DriveApp.getFolderById(parentFolderId);
  const folders = parentFolder.getFoldersByName(folderName);
  return folders.hasNext() ? folders.next() : parentFolder.createFolder(folderName);
}

function getOrCreateFile(folder, fileName, dateTimeString, values) {
  const files = folder.getFilesByName(fileName);
  if (files.hasNext()) {
    return files.next();
  } else {
    const header = 'Timestamp,Voltage,Current,Power,Energy,Frequency,Power Factor,Error Code\n';
    const file = folder.createFile(fileName, header);

    const previousDateString = getPreviousDateString(dateTimeString.split(' ')[0]);
    const startOfDay = `${previousDateString} 23:59:30`; // Changed to 23:59:30
    const newDataLines = generateDataWithIntervals(startOfDay, values);
    const content = header + newDataLines.join('\n');

    file.setContent(content);
    return file;
  }
}

function generateDataWithIntervals(lastTimestamp, currentValues) {
  const interval = 30 * 1000; // Interval of 30 seconds in milliseconds
  const zeroValues = '0,0,0,0,0,0,1'; // Default values for missing data
  const dataLines = [];

  const lastTime = new Date(lastTimestamp);
  const currentTime = new Date(currentValues[0]);
  const missedIntervals = Math.floor((currentTime.getTime() - lastTime.getTime()) / interval);

  // Determine the values to use for missing intervals
  let valuesToUse = zeroValues;
  if (missedIntervals < 5) {
    valuesToUse = currentValues.slice(1).join(','); // Exclude timestamp from current values
  }

  for (let time = lastTime.getTime() + interval; time < currentTime.getTime(); time += interval) {
    const timeString = formatDate(new Date(time), 'yyyy-MM-dd HH:mm:ss');
    dataLines.push(`${timeString},${valuesToUse}`);
  }

  dataLines.push(currentValues.join(','));
  return dataLines.reverse();
}


function formatDate(date, format) {
  const pad = (number) => (number < 10 ? '0' : '') + number;
  return format
    .replace('yyyy', date.getFullYear())
    .replace('MM', pad(date.getMonth() + 1))
    .replace('dd', pad(date.getDate()))
    .replace('HH', pad(date.getHours()))
    .replace('mm', pad(date.getMinutes()))
    .replace('ss', pad(date.getSeconds()));
}

function getPreviousDateString(dateString) {
  const previousDate = new Date(dateString);
  previousDate.setDate(previousDate.getDate() - 1);
  return formatDate(previousDate, 'yyyy-MM-dd');
}

function updateGoogleSheet(historianFolder, moduleName, values) {
  const sheetFileName = 'DASHBOARD';
  const sheets = historianFolder.getFilesByName(sheetFileName);
  let sheetFile;
  let sheet;

  if (sheets.hasNext()) {
    sheetFile = SpreadsheetApp.open(sheets.next());
  } else {
    sheetFile = SpreadsheetApp.create(sheetFileName);
    const fileId = sheetFile.getId();
    const file = DriveApp.getFileById(fileId);
    historianFolder.addFile(file);
    DriveApp.getRootFolder().removeFile(file); // Optional: Remove from root folder
  }

  const sheetName = moduleName;
  sheet = sheetFile.getSheetByName(sheetName);

  if (!sheet) {
    sheet = sheetFile.insertSheet(sheetName);
    sheet.appendRow(['Timestamp', 'Voltage', 'Current', 'Power', 'Energy', 'Frequency', 'Power Factor', 'Error Code']);
  }

  // Add new data to the sheet
  const numRows = sheet.getLastRow();
  const header = ['Timestamp', 'Voltage', 'Current', 'Power', 'Energy', 'Frequency', 'Power Factor', 'Error Code'];

  if (numRows > 1) {
    const lastTimestamp = sheet.getRange(2, 1).getValue();
    const newDataLines = generateDataWithIntervals(lastTimestamp, values);

    newDataLines.reverse().forEach((line, index) => {
      const rowValues = line.split(',');
      sheet.insertRowAfter(1);
      sheet.getRange(2, 1, 1, rowValues.length).setValues([rowValues]);
    });
  } else {
    const rowValues = values;
    sheet.insertRowAfter(1);
    sheet.getRange(2, 1, 1, rowValues.length).setValues([rowValues]);
  }

  // Clear rows below the 10th row if necessary
  const totalRows = sheet.getMaxRows();
  if (totalRows > 2881) {
    sheet.deleteRows(2882, totalRows - 2881);
  }
}
