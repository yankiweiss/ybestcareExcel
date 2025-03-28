/* need to see how to make that if its being a roster again that the it should create a new Paid column*/

// below is Selecting the userOutput and displays dynamically the text that's appropriate for that Stage
// and passing in two params as the actual text and cssColor that are associate and a timeout of 2 Seconds
// and then disappearing.


function textDisappear(value, cssTxtColor) {
  let communicateWithUser = document.getElementById("userOutput");
  communicateWithUser.style.display = "block";
  communicateWithUser.innerHTML = value;
  communicateWithUser.style.color = cssTxtColor;
  setTimeout(() => {
    communicateWithUser.style.display = "none";
  }, 2500);
}

// declaring both table1data, table2data empty arrays and pushing in later both table data's.
let table1data = [];
let table2data = [];

// checking if the first table was uploaded already only then the second table can be processed.
let isBillingTableProcessed = false;

// function to process file uploads from xlsx or csv to Json
function uploadFiles(event, fileId) {
  let currentFileUpload = document.getElementById(fileId);

  if (
    currentFileUpload &&
    currentFileUpload.files &&
    currentFileUpload.files.length > 0
  ) {
    if (fileId === "billingFile") {
      const file = event.target.files[0];
      const reader = new FileReader();

      reader.onload = function (event) {
        const data = event.target.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        let rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        let firstRow = rawData[0] || [];
        let secondRow = rawData[1] || [];

        const ifFirstRowEmpty = firstRow.every(
          (cell) => cell === "" || cell === null
        );

        let headers = ifFirstRowEmpty ? secondRow : firstRow;

        headers = headers.map((header) => header.trim());

        let dataRows = rawData.slice(ifFirstRowEmpty ? 2 : 1);

        let allHeaders = headers;

        if (!allHeaders.includes("Paid")) {
          textDisappear(
            "Please Check if Correct File has been Uploaded",
            "red"
          );
          return;
        }

        table1data = dataRows
          .filter((row) => row.length > 0)
          .map((row) => {
            // creating a map on table1data
            let rowData = {};
            // declaring a Object rowData for later use,
            headers.forEach((header, index) => {
              let cleanHeader = header.trim().toLowerCase(); // Normalize header
              let cellValue = row[index];

              if (cleanHeader.includes("date")) {
                if (typeof cellValue === "string") {
                  let jsDate = new Date(cellValue); // Convert string to JS Date object
                  rowData[header] =
                    jsDate instanceof Date && !isNaN(jsDate)
                      ? (jsDate.getMonth() + 1).toString().padStart(2, "0") +
                      "/" +
                      jsDate.getDate().toString().padStart(2, "0") +
                      "/" +
                      jsDate.getFullYear()
                      : cellValue;
                } else if (typeof cellValue === "number") {
                  rowData[header] = excelDateToJSDate(cellValue);
                } else {
                  rowData[header] = cellValue;
                }
              }

              // Convert (125) to -125 for both string and number formats
              else if (
                typeof cellValue === "string" &&
                cellValue.match(/^\(\d+\)$/)
              ) {
                rowData[header] = -parseInt(
                  cellValue.replace(/\(|\)/g, ""),
                  10
                );
              } else if (typeof cellValue === "number") {
                rowData[header] = cellValue; // Keep number values as they are
              } else if (!isNaN(cellValue) && cellValue !== "") {
                rowData[header] = parseFloat(cellValue); // Convert valid numeric strings
              } else {
                rowData[header] = cellValue;
              }
            });

            return rowData;
          });

        isBillingTableProcessed = true;
        textDisappear(
          "Billing Data Successfully Processed!<br>Please upload Roster File",
          "rgba(1, 180, 1, 0.849)"
        );
      };
      reader.readAsBinaryString(file);
    } else if (fileId === "rosterFile") {
      if (!isBillingTableProcessed) {
        textDisappear("Please upload the Billing File first", "red");
        return;
      }
      const file = event.target.files[0];
      const reader = new FileReader();

      reader.onload = function (event) {
        const data = event.target.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        let rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        let firstRow = rawData[0] || [];
        let secondRow = rawData[1] || [];

        const ifFirstRowEmpty = firstRow.every(
          (cell) => cell === "" || cell === null
        );

        let headers = ifFirstRowEmpty ? secondRow : firstRow;

        headers = headers.map((header) => header.trim());

        let dataRows = rawData.slice(ifFirstRowEmpty ? 2 : 1);

        table2data = dataRows
          .filter((row) => row.length > 0)
          .map((row) => {
            let rowData = {};
            headers.forEach((header, index) => {
              let cleanHeader = header.trim().toLowerCase(); // Normalize header
              let cellValue = row[index];

              if (cleanHeader.includes("date")) {
                if (typeof cellValue === "string") {
                  let jsDate = new Date(cellValue); // Convert string to JS Date object
                  rowData[header] =
                    jsDate instanceof Date && !isNaN(jsDate)
                      ? (jsDate.getMonth() + 1).toString().padStart(2, "0") +
                      "/" +
                      jsDate.getDate().toString().padStart(2, "0") +
                      "/" +
                      jsDate.getFullYear()
                      : cellValue;
                } else if (typeof cellValue === "number") {
                  rowData[header] = excelDateToJSDate(cellValue);
                } else {
                  rowData[header] = cellValue;
                }
              }

              // Convert (125) to -125 for both string and number formats
              else if (
                typeof cellValue === "string" &&
                cellValue.match(/^\(\d+\)$/)
              ) {
                rowData[header] = -parseInt(
                  cellValue.replace(/\(|\)/g, ""),
                  10
                );
              } else if (typeof cellValue === "number") {
                rowData[header] = cellValue; // Keep number values as they are
              } else if (!isNaN(cellValue) && cellValue !== "") {
                rowData[header] = parseFloat(cellValue); // Convert valid numeric strings
              } else {
                rowData[header] = cellValue;
              }
            });

            return rowData;
          });
      };

      textDisappear(
        "Roster File Successfully Processed <br>Please add a Date of Report to run Comparisons",
        "rgba(1, 180, 1, 0.849)"
      );

      reader.readAsBinaryString(file);
    }
  }
}

// update all Paid columns in Table 2 Data to be Date of Report when Date is Selected;

const duplicates = [];

// formats date in right format as in 01/25/2025
function formatDate(inputDate) {
  const parts = inputDate.split("-"); // Assuming "YYYY-MM-DD" from input field
  const date = new Date(parts[0], parts[1] - 1, parts[2]); // Year,ring to Date object
  const month = (date.getMonth() + 1).toString().padStart(2, "0"); // Get month (0-based index, so add 1)
  const day = date.getDate().toString().padStart(2, "0"); // Get day
  const year = date.getFullYear(); // Get year

  return `${month}/${day}/${year}`;
}



function updatePaidColumnRoster(table1data, table2data) {

  // below is taking the date picker and putting in right format.

  const dateOfReport = document.getElementById('dateOfReport');

  const dateOfReportDate = dateOfReport.value;



  const dateSplit = dateOfReportDate.split('-')

  const convertedDate = `${dateSplit[1]}/${dateSplit[2]}/${dateSplit[0]}`;

  const paidColumnName = convertedDate;

  


  let matchTracker1 = {}; // Object to track occurrences of (Name, Date of Service)

  for (const row1 of table1data) {
    let key = `${row1.Name?.toLowerCase().trim()}|${row1['Date of Service']}`;


    if (matchTracker1[key] === undefined) {
      matchTracker1[key] = 0; // Start index at 1
    } else {
      matchTracker1[key]++; // Increment index for next occurrence
    }

    row1.index = matchTracker1[key]; // Assign index to the row
  }

  let matchTracker2 = {};

  for (const row2 of table2data) {
    let key = `${row2.Name?.toLowerCase().trim()}|${row2['Date of Service']}`;

    if (matchTracker2[key] === undefined) {
      matchTracker2[key] = 0; // Start index at 1
    } else {
      matchTracker2[key]++; // Increment index for next occurrence
    }

    row2.index = matchTracker2[key]; // Assign index to the row

    
  }

  let newRows = [];
  for (const row1 of table1data) {
    let foundMatch = false;
    for (const row2 of table2data) {
      if (row1.Name?.toLowerCase().trim() === row2.Name?.toLowerCase().trim() && row1['Date of Service'] === row2['Date of Service'] && row1.index === row2.index) {
        row2['Paid']= row1['Paid'];
        row2['Insurance(s)'] = row1['Insurance(s)']

        if(!row2['Date of Report']){
        row2['Date of Report'] = paidColumnName;
        }
        foundMatch = true;
      }
    }
    if (!foundMatch) {
      newRows.push({
        ...row1,
        ['Paid']: row1.Paid,
        ['Date of Report']: paidColumnName
      })
    }
  }

  table2data.push(...newRows)

  for (const row of table2data) {
    delete row.index;
  }
}









// creates a table based on which tableButton was pressed

/*let existingBtn = document.getElementById('showNextPageBilling');
 
  existingBtn.style.visibility = 'visible';
    table.appendChild(existingBtn); // Append to the parent of the table (outside the table itself)
    */


// need to work on this
// user can input and search in both tables for that value
async function searchNames(event) {
  if (table1data.length < 1 || table2data.length < 1) {
    textDisappear("Please", "red");
    return;
  }

  if (event.key === "Enter") {
    const query = event.target.value.toLowerCase().trim();
    filterTables(query);
  }
}

async function filterTables(query) {
  const filterRow = (row) => {
    return Object.values(row).some(
      (value) => value && value.toString().toLowerCase().includes(query)
    );
  };

  const cleanTable1 = table1data.filter(filterRow);
  const cleanTable2 = table2data.filter(filterRow);

  tablePages = {};
  createTable("showBillingData", cleanTable1);
  console.log(cleanTable1);
  createTable("showRosterData", cleanTable2);
  console.log(cleanTable2);
}

function excelDateToJSDate(serial) {
  const epoch = new Date(1899, 11, 30);
  const jsDate = new Date(epoch.getTime() + serial * 86400000);

  // Extract date parts manually
  const day = jsDate.getDate().toString().padStart(2, "0");
  const month = (jsDate.getMonth() + 1).toString().padStart(2, "0");
  const year = jsDate.getFullYear();

  return `${month}/${day}/${year}`; // Returns MM/DD/YYYY format
}

// Function Save updated Table2data to Excel File.

function exportToCSV(data) {

  const dateOfReport = document.getElementById('dateOfReport');

  // Check if the date is set
  if (!dateOfReport || !dateOfReport.value) {
    alert("Please set the report date before exporting the file.");
    return;
  }


  if (data.length === 0) {
    textDisappear("No data available to export!", "red");
    return;
  }

  // Create a worksheet from the data
  const worksheet = XLSX.utils.json_to_sheet(data);

  // Convert the worksheet to CSV format
  const csv = XLSX.utils.sheet_to_csv(worksheet);

  // Create a Blob object for CSV content and create a download link
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");

  // Create a link to trigger the file download
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "Bulk Roster.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

// Example usage: export table2data when clicking a button

// Example usage: export table2data when clicking a button

function displayMatchingTable(data) {

  let table = document.getElementById('table');
  let thead = document.createElement('thead');
  let tr = document.createElement('tr');
  let tbody = document.createElement('tbody');

  const headers = ['Name', 'Date of Service', 'Paid / Date of Service']

  for (const header of headers) {
    let th = document.createElement('th');
    th.textContent = header;
    tr.appendChild(th);
    thead.appendChild(tr);
    table.appendChild(tr)
  }

  for (const row of data) {
    let tr = document.createElement('tr');

    for (const header of headers) {
      let td = document.createElement('td');
      td.textContent = row[header]
      tr.appendChild(td)
    }
    tbody.appendChild(tr)
  }

  table.appendChild(tbody)

}