const exportExcel = document.getElementById("saveToExcel");
const userOutput = document.getElementById("userOutput");

let billingData = null;
let rosterData = null;

function processData(billingData, rosterData) {
  const duplicatesInBillingData = duplicatesInBilling(billingData);

  console.log(duplicatesInBillingData)

  const { duplicateBillingFromRoster } = duplicatesRosterToBilling(
    billingData,
    rosterData
  );

  const duplicates = [
    ...duplicatesInBillingData,
    ...duplicateBillingFromRoster,
  ];

  const { billingNotInRoster } = duplicatesRosterToBilling(
    billingData,
    rosterData
  );

  const newRoster = [...rosterData, ...billingNotInRoster];

  createNewWorkbook(duplicates, newRoster);
}

function uploadFiles(event, inputID) {
  const file = document.getElementById(inputID).files[0];
  const reader = new FileReader();

  reader.onload = function (e) {
    const arrayBuffer = e.target.result;
    const data = new Uint8Array(arrayBuffer);

    const workbook = XLSX.read(data, { type: "array" });

    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    const raw_data = XLSX.utils.sheet_to_json(worksheet);

    const cleanedData = normalizeHeaders(raw_data);

    if (inputID === "billing") {
      billingData = cleanedData;

      billDup = duplicatesInBilling(billingData);
    } else if (inputID === "roster") {
      rosterData = cleanedData;
    }

    if (billingData && rosterData) {
      userOutput.innerHTML =
        "both files are Uploaded<br>you can now download new file";
      processData(billingData, rosterData);
    }

    //duplicatesRosterToBilling(billingData, rosterData);
  };

  reader.readAsArrayBuffer(file);
}

function normalizeHeaders(raw_data) {
  return raw_data.map((row) => {
    const cleaned = {};
    Object.keys(row).forEach((key) => {
      const newKey = key
        .trim()
        .replace(/\s+/g, "_")
        .replace(/[^\w]/g, "")
        .toLowerCase();

      cleaned[newKey] = row[key];
    });
    return cleaned;
  });
}

// below function checks if their is any duplicates in billing file

function duplicatesInBilling(billingData) {
  const billingDuplicates = Object.groupBy(
    billingData,
    ({ date_of_service, patient_name }) => `${date_of_service}-${patient_name}`
  );

  const dup = [];

  for (const billingItem in billingDuplicates) {
    if (billingDuplicates[billingItem].length > 1) {
      dup.push(...billingDuplicates[billingItem]);
    }
  }
  return dup;
}

function duplicatesRosterToBilling(billingData, rosterData) {
  const rosterSet = new Set();
  const billingNotInRoster = [];
  const duplicateBillingFromRoster = [];

  // 1️⃣ Build a fast lookup for roster: "name|date"
  for (const row of rosterData) {
    rosterSet.add(`${row.patient_name}|${row.date_of_service}`);
  }

  // 2️⃣ Loop billing rows once and check against the set
  for (const row of billingData) {
    const key = `${row.patient_name}|${row.date_of_service}`;

    if (rosterSet.has(key)) {
      duplicateBillingFromRoster.push(row); // duplicate found
    } else {
      billingNotInRoster.push(row); // unique row
    }
  }
  return { billingNotInRoster, duplicateBillingFromRoster };
}
// after uploading the roster checks if their is duplicates in billing and roster;

// declaring both table1data, table2data empty arrays and pushing in later both table data's.

// need to see where to get the duplicates in billing

function createNewWorkbook(duplicates, newRoster) {
  const workbook = XLSX.utils.book_new();

  const sheet1 = XLSX.utils.json_to_sheet(newRoster);

  XLSX.utils.book_append_sheet(workbook, sheet1, "Roster");

  const sheet2 = XLSX.utils.json_to_sheet(duplicates);

  XLSX.utils.book_append_sheet(workbook, sheet2, "duplicates");

  XLSX.writeFile(workbook, `${Date.now()}_combined.xlsx`);
}
