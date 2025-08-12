(() => {

// Base A (Help Desk Submissions)
const AIRTABLE_API_KEY_A = "patW07BoKoJG3dsef.c533e11a7b2005c7ff8a2a4c53f145aa97049a0bed00d0fd82e513f664bcefd9"; 
const BASE_A_ID = "apphdFfbeJpVbfsCT";
const TABLE_A_ID = "tblIs8fZoorhIQajG";
const baseIdA   = "apphdFfbeJpVbfsCT";  
const tableIdA  = "tblIs8fZoorhIQajG"; 
// Correct
const locationTableIdA = "tblyWUOD76Pw7Ay19"; 
const apiKeyA = "patW07BoKoJG3dsef.c533e11a7b2005c7ff8a2a4c53f145aa97049a0bed00d0fd82e513f664bcefd9"; 

// Base B (Branch/Location Lookup)
const apiKeyB = "patokyvn0X2ejcRQi.5d7cfe93b49248f724efdd9a40a365e6c1844e77cdeace1dcd7454c5edf10d9a"; 
const baseIdB   = "appehs4OWDzGWYCrP";  
const tableIdB  = "tblwtpHlA3CYpa02W";  

// Debug: Fetch schema for submissions table
(async () => {
  try {
    const url = `https://api.airtable.com/v0/meta/bases/${BASE_A_ID}/tables`;
    const resp = await fetch(url, {
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY_A}` }
    });
    const data = await resp.json();

    const table = data.tables.find(t => t.id === TABLE_A_ID);

    table.fields.forEach(f => {
    });

  } catch (err) {
    console.error("❌ Schema fetch failed:", err);
  }
})();

// ========================
// Init - Auto-fill email & populate dropdowns
// ========================
document.addEventListener("DOMContentLoaded", async () => {
  const email = localStorage.getItem("userEmail") || "";

  // Show email in HTML
  const emailDisplay = document.getElementById("emailDisplay");
  if (emailDisplay) emailDisplay.textContent = email;

  const emailInput = document.getElementById("submitterEmail");
  if (emailInput) emailInput.value = email;

  if (email) {
    fetchUserRecords(email); // fetch past submissions
  }

  // Map element IDs in your HTML form to Airtable field names
const dropdownConfig = {
  department: "Department",                // Linked to Departments table
  itIssue: "IT Issue(s)",                  // Multi-select
  priority: "Priority",   
  newHireSetup: "New Hire Setup",              
  location: "Location",                    // Linked to Locations table
  status: "Status",                        // Status field
  assignee: "Assignee",                    // Assignee
  apIssue: "AP Issue",                     // AP Issue
  apInvoiceIssue: "AP Invoice Number Issue", // AP Invoice #
  poIssue: "PO Number Issue",              // PO Issue
  arIssue: "AR Issue",                     // AR Issue
  creditCardIssue: "Credit Card Issue",    // Credit Card
  financialReportsIssue: "Financial Reports Issue", // Financial Reports
};

  for (const [elementId, fieldName] of Object.entries(dropdownConfig)) {
  await populateDropdown(elementId, fieldName);
}
});


// ========================
// Handle Help Desk Form Submit
// ========================
document.getElementById("helpDeskForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const submitterEmail = localStorage.getItem("userEmail") || "";
  const submittedBy = getNameFromEmail(submitterEmail);

  // collect form values
  const payloadFields = {
    "Department": document.getElementById("department").value,
    "IT Issue": document.getElementById("itIssue").value,
    "New Hire Setup": Array.from(document.getElementById("newHireSetup").selectedOptions)
      .map(opt => opt.value),
    "AP Issue": document.getElementById("apIssue").value,
    "AR Issue": document.getElementById("arIssue").value,
    "Credit Card Issue": document.getElementById("creditCardIssue").value,
    "Financial Report Issue": document.getElementById("financialReportIssue").value,
    "Month of Financial Issue": document.getElementById("monthOfFinancialIssue").value,
    "Priority": document.getElementById("priority").value,
    "Doclink Record ID": document.getElementById("doclinkId").value,
    "AP Invoice Number Issue": document.getElementById("apInvoiceNumber").value,
    "PO Number Issue": document.getElementById("poNumber").value,
    "Notes/Issue": document.getElementById("notesHelp").value,
    "Submitted by Email": submitterEmail,
    "Submitted By": submittedBy
  };

  try {
    // 🔹 Step 1: Get branch name from Base B using email
const locationMap = {
  "Charleston": "recYrZUXcTtDl07tO",
  "Charlotte": "rec4TJaTsEviZPq7A",
  "Columbia": "recaUPZvVqXrr2UoQ",
  "Corporate": "recbEMsGOeY7iPOOb",
  "Greensboro": "recPb1Ta6w2WtVXvS",
  "Greenville": "recFUn5HiDMuv8vq5",
  "Myrtle Beach": "recyWydYk1z5BYXpK",
  "Raleigh": "rec9MXDRah8gKkgO5",
  "Savannah": "recAXLYbHCKRz8eMb",
  "Wilmington": "rec4QOa6w2qIC5mqn"
};

// ... keep your branch lookup as-is ...
const branchValue = await fetchBranchFromBaseB(submitterEmail);
if (branchValue && locationMap[branchValue]) {
  payloadFields["Location"] = [locationMap[branchValue]]; // will normalize below
}

// Optional: override via lookup-by-name (your existing code)
if (branchValue) {
  const locationId = await fetchBranchIdFromBaseA(branchValue);
  if (locationId) {
    payloadFields["Location"] = [locationId]; // will normalize below
  } else {
    console.warn(`⚠️ No matching Location record found for branch: ${branchValue}`);
  }
}

// ✅ FINAL NORMALIZATION + DEEP LOG just before POST
payloadFields["Location"] = toLinkedRecordArray(payloadFields["Location"]);

if (!payloadFields["Location"]) {
  throw new Error("Location must be an array of record IDs or [{id:'rec...'}].");
}
const locField = await getFieldInfo(TABLE_A_ID, "Location");
if (!locField) throw new Error('Field "Location" not found in schema.');

if (["lookup", "rollup", "formula"].includes(locField.type)) {
  throw new Error('🛑 "Location" is not writable (lookup/rollup/formula). Write to the **source linked field** instead.');
}

if (!["multipleRecordLinks", "singleRecordLink"].includes(locField.type)) {
  throw new Error(`🛑 "Location" is type ${locField.type}. For this type, don’t send an array of record IDs.`);
}

// ---- POST with improved debug logging ----
const url = `https://api.airtable.com/v0/${baseIdA}/${tableIdA}`;

// Special check for Location field
if ("Location" in payloadFields) {
  console.log("   🔍 Location type:", Array.isArray(payloadFields["Location"]) ? "Array" : typeof payloadFields["Location"]);
  if (Array.isArray(payloadFields["Location"])) {
    console.log("   📋 Location length:", payloadFields["Location"].length);
    payloadFields["Location"].forEach((val, idx) => {
      console.log(`      [${idx}]`, val, typeof val);
    });
  } else {
    console.warn("   ⚠️ Location is not an array. May cause 422.");
  }
} else {
  console.warn("   ⚠️ No Location field present in payloadFields.");
}

let response, data;
try {
  response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKeyA}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ fields: payloadFields })
  });
} catch (networkErr) {
  console.error("💥 Network/Fetch failed before Airtable responded:", networkErr);
  throw networkErr;
}

// Log raw status before parsing body
console.log("📥 Airtable raw status:", response.status, response.statusText);

// Try reading body
let rawText;
try {
  rawText = await response.text();
} catch (readErr) {
  console.error("💥 Failed to read Airtable response body:", readErr);
  throw readErr;
}

// Try parsing JSON, fallback to text
try {
  data = JSON.parse(rawText);
} catch (_) {
  data = rawText;
}

console.log("📥 Airtable parsed body:", data);

if (!response.ok) {
  if (response.status === 422) {
    console.error("❌ 422: Airtable rejected submission.");
    console.error("   📜 Full Airtable error JSON:", JSON.stringify(data, null, 2));
    console.error("   💡 Troubleshooting tips:");
    console.error("     • Confirm field names exactly match your Airtable schema.");
    console.error("     • For linked fields like Location, send an array of record IDs (strings) — e.g., ['rec123...']");
    console.error("     • Ensure the record IDs exist in the linked table.");
    console.error("     • Ensure the field is a real link, not a lookup/rollup/formula.");
  }
  throw new Error(typeof data === "string" ? data : JSON.stringify(data));
}

console.log("✅ Submission success:", data);


  } catch (err) {
    console.error("💥 Help Desk submission failed:", err);
  }
});

// --- add this helper near the top (once) ---
function toLinkedRecordArray(value) {
  // Accept: "rec123", ["rec123"], [{id:"rec123"}]
  if (!value) return [];
  if (typeof value === "string") return [value];
  if (Array.isArray(value) && value.every(v => typeof v === "string")) return value;
  if (Array.isArray(value) && value.every(v => v && typeof v === "object" && typeof v.id === "string")) {
    return value.map(x => x.id);
  }
  console.error("❌ Not normalizable to array of record IDs (strings):", value);
  return null;
}

// ========================
// Fetch Dropdown Options from Airtable Schema
// ========================
async function populateDropdown(elementId, fieldName) {
  try {
    console.log(`🔹 [populateDropdown] Starting for field: ${fieldName}, elementId: ${elementId}`);

    // Fetch schema for all tables in this base
    const url = `https://api.airtable.com/v0/meta/bases/${BASE_A_ID}/tables`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY_A}` }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Schema fetch failed for ${fieldName}. HTTP ${response.status}`, errorText);
      return;
    }

    const data = await response.json();
    const table = data.tables.find(t => t.id === TABLE_A_ID);
    if (!table) return;

    const field = table.fields.find(f => f.name === fieldName);
    if (!field) {
      console.warn(`⚠️ Field ${fieldName} not found in schema`);
      return;
    }

    const selectEl = document.getElementById(elementId);
    if (!selectEl) return;

    // Reset options
    selectEl.innerHTML = `<option value="">-- Select ${fieldName} --</option>`;

    // Case 1: Single/Multi Select field
    if (field.options && field.options.choices) {
      field.options.choices.forEach(choice => {
        const opt = document.createElement("option");
        opt.value = choice.name;
        opt.textContent = choice.name;
        selectEl.appendChild(opt);
      });

      // Special case: New Hire Setup (multi‑select toggle without Ctrl)
      if (elementId === "newHireSetup") {
        selectEl.addEventListener("mousedown", function (e) {
          e.preventDefault(); // stop default Ctrl/Cmd behavior
          const option = e.target;
          if (option.tagName === "OPTION") {
            option.selected = !option.selected; // toggle like checkbox
          }
        });
      }
      return;
    }

    // Case 2: Linked Record field → fetch records from linked table
    if (field.type === "multipleRecordLinks" && field.options?.linkedTableId) {
      console.log(`🔗 Field ${fieldName} is linked to table ${field.options.linkedTableId}`);

      const linkedUrl = `https://api.airtable.com/v0/${BASE_A_ID}/${field.options.linkedTableId}`;
      const linkedResp = await fetch(linkedUrl, {
        headers: { Authorization: `Bearer ${AIRTABLE_API_KEY_A}` }
      });

      if (!linkedResp.ok) {
        console.error(`❌ Failed fetching linked table ${field.options.linkedTableId}`);
        return;
      }

      const linkedData = await linkedResp.json();
      linkedData.records.forEach(rec => {
        const opt = document.createElement("option");
        // Try both "Dept Name" and "Name"
        opt.value = rec.fields["Dept Name"] || rec.fields["Name"];
        opt.textContent = rec.fields["Dept Name"] || rec.fields["Name"];
        selectEl.appendChild(opt);
      });
    }

  } catch (err) {
    console.error(`❌ populateDropdown(${fieldName}) failed:`, err.message);
  }
}

// ========================
// Fetch Past Submissions
// ========================
async function fetchUserRecords(email) {
  try {
    if (!email) {
      console.warn("⚠️ fetchUserRecords called without an email.");
      document.getElementById("helpDeskUserRecords").innerHTML =
        "<p class='error'> No email found.</p>";
      return;
    }

    // Prefer filtering by the field that actually stores the email
    // If you want to filter by the Name instead, change filterField to "Submitted By"
    const filterField = "Submitted By Email"; // <-- matches what you POST
    const formula = `{${filterField}}="${email}"`;

    const url =
      `https://api.airtable.com/v0/${BASE_A_ID}/${TABLE_A_ID}` +
      `?filterByFormula=${encodeURIComponent(formula)}` +
      `&sort[0][field]=${encodeURIComponent("Date Created")}` + // ensure exact field name
      `&sort[0][direction]=desc`;

    console.log("📡 fetchUserRecords URL:", url);
    console.log("🔎 filterByFormula:", formula);

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY_A}` }
    });

    // Always try to read the body so we can show Airtable's 422 details
    let bodyText = "";
    let bodyJson = null;
    try {
      bodyText = await response.text();
      try {
        bodyJson = JSON.parse(bodyText);
      } catch (_) {
        // not JSON, keep text
      }
    } catch (e) {
      console.warn("⚠️ Could not read response body:", e);
    }

    console.log("📥 fetchUserRecords status:", response.status, response.statusText);
    if (bodyJson) {
      console.log("📥 fetchUserRecords body (json):", bodyJson);
    } else {
      console.log("📥 fetchUserRecords body (text):", bodyText);
    }

    if (!response.ok) {
      // Helpful hints for 422
      if (response.status === 422) {
        console.error(
          "❌ 422 Unprocessable Content.\n" +
          "   • Airtable’s error JSON usually says 'Unknown field names' or 'The formula for filterByFormula is invalid'."
        );
      }
      // Show Airtable’s error body verbatim for debugging
      throw new Error(bodyText || `HTTP ${response.status}`);
    }

    // If we got here, OK
    const data = bodyJson || JSON.parse(bodyText || "{}");
    displayUserRecords(data.records || []);

  } catch (err) {
    console.error("❌ fetchUserRecords failed:", err.message || err);
    const el = document.getElementById("helpDeskUserRecords");
    if (el) {
      el.innerHTML = "<p class='error'> No Help Desk submissions in last 45 days.</p>";
    }
  }
}
async function getFieldInfo(tableId, fieldName) {
  const url = `https://api.airtable.com/v0/meta/bases/${BASE_A_ID}/tables`;
  const resp = await fetch(url, { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY_A}` } });
  const data = await resp.json();
  const table = data.tables.find(t => t.id === tableId);
  const field = table?.fields?.find(f => f.name === fieldName);
  console.log(`🔎 Field info for "${fieldName}":`, field);
  return field;
}

// ========================
// Display Submissions
// ========================
function displayUserRecords(records) {
let container = document.getElementById("helpDeskUserRecords");
  container.innerHTML = "";

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 45);

  if (records.length === 0) {
    container.innerHTML = "<p>No recent submissions.</p>";
    return;
  }

  const table = document.createElement("table");
  table.innerHTML = `
    <thead>
      <tr>
        <th>Email</th>
        <th>Department</th>
        <th>Priority</th>
        <th>Notes/Issue</th>
        <th>Date Created</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;
  const tbody = table.querySelector("tbody");

  records.forEach((rec) => {
    const f = rec.fields;
    const date = f["Date created"] || rec.createdTime;

    if (new Date(date) < cutoff) return;

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${f["Submitted By Email"] || ""}</td>
      <td>${f["Department"] || ""}</td>
      <td>${f["Priority"] || ""}</td>
      <td>${f["Notes/Issue"] || ""}</td>
      <td>${new Date(date).toLocaleDateString()}</td>
    `;
    tbody.appendChild(row);
  });

  container.appendChild(table);
}

// ========================
// Branch Lookup Helpers
// ========================

function getNameFromEmail(email) {
  if (!email.includes("@")) return email;
  const [first, lastWithDomain] = email.split(".");
  const last = lastWithDomain.split("@")[0];
  return `${capitalize(first)} ${capitalize(last)}`;
}

// Capitalize helper
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
// Lookup branch from Base B using email
async function fetchBranchFromBaseB(email) {
  console.log("📡 Looking up branch for email:", email);
  const url = `https://api.airtable.com/v0/${baseIdB}/${tableIdB}?filterByFormula=${encodeURIComponent(`{Email}="${email}"`)}`;
  const resp = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKeyB}` }
  });
  const data = await resp.json();
  console.log("✅ Branch lookup result:", data);
  return data.records[0]?.fields?.Branch || null;
}

// Lookup Location record ID in Base A
async function fetchBranchIdFromBaseA(branchValue) {
  console.log("📡 Looking up Location record in Locations table for branch:", branchValue);

  // Use the exact field name from Locations table (check schema, probably "Location" or "Name")
  const formula = `{Location}="${branchValue}"`;

  const url = `https://api.airtable.com/v0/${baseIdA}/tblyWUOD76Pw7Ay19?filterByFormula=${encodeURIComponent(formula)}`;

  const resp = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKeyA}` }
  });

  if (!resp.ok) {
    const errorText = await resp.text();
    console.error("❌ Error fetching Location:", errorText);
    throw new Error(`Location lookup failed: ${resp.status}`);
  }

  const data = await resp.json();

  const recordId = data.records[0]?.id || null;

  if (recordId) {
    console.log(`🎯 Found Location recordId for ${branchValue}: ${recordId}`);
  } else {
    console.warn(`⚠️ No Location record found for: ${branchValue}`);
  }
  return recordId;
}

// ========================
// Utils
// ========================
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// auto-grow Help Desk notes
const notesHelp = document.getElementById("notesHelp");
if (notesHelp) {
  notesHelp.addEventListener("input", function () {
    this.style.height = "auto";
    this.style.height = this.scrollHeight + "px";
  });
}
document.addEventListener("DOMContentLoaded", () => {
  const departmentSelect = document.getElementById("department");

  // Department → which field groups to show
const departmentFieldMap = {
  "IT": ["itIssue", "newHireSetup"],
  "Accounts Payable": ["apIssue", "apInvoiceNumber", "doclinkId", "poNumber"], 
  "Accounts Receivable": ["arIssue"], 
  "Credit Cards": ["creditCardIssue"], 
  "Finance": ["apInvoiceNumber", "poNumber", "financialReportIssue", "monthOfFinancialIssue"],
  "Financial Reporting": ["financialReportIssue", "monthOfFinancialIssue"], 
  "Operations": ["poNumber"],
  "HR": ["newHireSetup"],
  "Other": ["notesHelp"]
};

  // all possible fields that may need hiding
  const allFieldIds = [
    "itIssue", "newHireSetup", "apIssue", "arIssue",
    "creditCardIssue", "financialReportIssue",
    "monthOfFinancialIssue",
    "apInvoiceNumber", "poNumber", "doclinkId",
    "notesHelp"
  ];

  function updateFieldVisibility() {
    const selectedDept = departmentSelect.value;
    const fieldsToShow = departmentFieldMap[selectedDept] || [];

    allFieldIds.forEach(id => {
      const wrapper = document.getElementById(`group-${id}`);
      if (!wrapper) {
        console.warn(`⚠️ No wrapper found for: group-${id}`);
        return;
      }

      // Always show Department + Priority
      if (id === "department" || id === "priority") {
        wrapper.style.display = "block";
      } else {
        if (fieldsToShow.includes(id)) {
          wrapper.style.display = "block";
        } else {
          wrapper.style.display = "none";
        }
      }
    });

    // Always keep Notes visible
    const notesWrapper = document.getElementById("group-notesHelp");
    if (notesWrapper) {
      notesWrapper.style.display = "block";
    }
  }

  // run on page load
  updateFieldVisibility();

  // run every time Department changes
  departmentSelect.addEventListener("change", updateFieldVisibility);
});

})();