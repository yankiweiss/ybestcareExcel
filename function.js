
const userOutput = document.getElementById("userOutput");

let billingData = null;
let rosterData = null;


function uploadFiles(inputID) {
  const file = document.getElementById(inputID).files[0];
  const reader = new FileReader();

  reader.onload = function (e) {
    const arrayBuffer = e.target.result;
    const data = new Uint8Array(arrayBuffer);

    const workbook = XLSX.read(data, { type: "array" });

    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    const raw_data = XLSX.utils.sheet_to_json(worksheet);

    const cleanedData = normalizeData(raw_data);

    if (inputID === "billing") {
      billingData = cleanedData;



    } else if (inputID === "roster") {
      rosterData = cleanedData;


    }

    if (billingData && rosterData) {
      userOutput.innerHTML =
        "both files are Uploaded<br>software is downloading your new file now";
      processData(billingData, rosterData);
    }

    //duplicatesRosterToBilling(billingData, rosterData);
  };

  reader.readAsArrayBuffer(file);
}

function processData(billingData, rosterData) {

  //const duplicatesInBillingData = duplicatesInBilling(billingData);


  const { alreadyBilled, notBilled } = checkIfAlreadyBilled(
    billingData,
    rosterData
  );

  const { notInRoster } = inBillingNotInRoster(
    rosterData, billingData
  )



  const rosterResult = [...alreadyBilled, ...notBilled];

  const billingNotInRoster = [...notInRoster]

  


  createNewWorkbook(rosterResult, billingNotInRoster);
}





function normalizeDate(value) {
  if (typeof value === "number") {
    const d = XLSX.SSF.parse_date_code(value);
    return `${String(d.m).padStart(2, "0")}/${String(d.d).padStart(2, "0")}/${d.y
      }`;
  }

  if (typeof value === "string") {
    const cleaned = value.trim();

    const mdy = cleaned.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);

    if (mdy) {

      let [, m, d, y] = mdy;

      if (y.length === 2) {
        y = Number(y) > 30 ? '19' + y : '20' + y;
      }
      return `${m.padStart(2, "0")}/${d.padStart(2, "0")}/${y
        }`;
    }
    return cleaned;
  }
  return value;
}

// QUIZ how to take all the values of both arrays and normalize the object VALUES
function normalizeData(raw_data) {
  return raw_data.map((row) => {
    const cleaned = {};

    // need to normalize the values as well
    Object.keys(row).forEach((key) => {
      const newKey = key
        .trim()
        .replace(/\s+/g, "_")
        .replace(/[^\w]/g, "")
        .toLowerCase();

      if (typeof row[key] === "string") {
        cleaned[newKey] = row[key].toLocaleLowerCase().trim();
      } else {
        cleaned[newKey] = row[key];
      }

      if (key.toLocaleLowerCase().includes("date")) {
        cleaned[newKey] = normalizeDate(row[key]);
      }

      //     if(key === 'patient_name'){
      //console.log(row[key])
      //     }
    });
    return cleaned;
  });
}

// below function checks if their is any duplicates in billing file

//function duplicatesInBilling(billingData) {
//  const billingDuplicates = Object.groupBy(
//    billingData,
//    ({date_of_service, patient_name, date_of_birth}) => `${date_of_service}-${patient_name}-${date_of_birth}`
//  );
//
//  
//
//  const dup = [];
//
//  for (const billingItem in billingDuplicates) {
//    if (billingDuplicates[billingItem].length > 1) {
//      dup.push(billingDuplicates[billingItem]);
//    }
//  }
//  return dup;
//}

const currentDate = new Date();
const year = currentDate.getFullYear();
const month = currentDate.getMonth() + 1;
const day = currentDate.getDate();



function checkIfAlreadyBilled(billingData, rosterData) {
  const billingSet = new Set();
  const alreadyBilled = [];
  const notBilled = [];

  for (const row of billingData) {
    billingSet.add(`${row.patient_name}|${row.date_of_service}|${row.date_of_birth}`)

  }
  for (const row of rosterData) {
    const key = `${row.patient_name}|${row.date_of_service}|${row.date_of_birth}`



    if (billingSet.has(key)) {
      const newColum = ({ ...row, paid: `yes - ${month}/${day}/${year}` })
      alreadyBilled.push(newColum); // duplicate found
    } else {
      notBilled.push(row)
    }
  }
  return { alreadyBilled, notBilled };
}


// would like to have a function that when their is one in billing and not in roster.

function inBillingNotInRoster(rosterData, billingData) {
  const notInRoster = [];
  const rosterSet = new Set();

  for (const row of rosterData) {
    rosterSet.add(`${row.patient_name}|${row.date_of_service}|${row.date_of_birth}`)
  }

  for (const row of billingData) {
    const key = `${row.patient_name}|${row.date_of_service}|${row.date_of_birth}`;

    if (!rosterSet.has(key)) {
     notInRoster.push(row)
    }
    
  }
  return { notInRoster }
}

// after uploading the roster checks if their is duplicates in billing and roster;

// declaring both table1data, table2data empty arrays and pushing in later both table data's.

// need to see where to get the duplicates in billing

function createNewWorkbook(rosterResult, billingNotInRoster) {
  const workbook = XLSX.utils.book_new();

  const sheet1 = XLSX.utils.json_to_sheet(rosterResult);

  XLSX.utils.book_append_sheet(workbook, sheet1, "Updated Roster");

  const sheet2 = XLSX.utils.json_to_sheet(billingNotInRoster);

  XLSX.utils.book_append_sheet(workbook, sheet2, "In Billing Not In Roster");



  XLSX.writeFile(workbook, `${month}/${day}/${year}_combined.xlsx`);
}




