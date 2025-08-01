(() => {

// Base A (Help Desk Submissions)
const AIRTABLE_API_KEY_A = "patW07BoKoJG3dsef.c533e11a7b2005c7ff8a2a4c53f145aa97049a0bed00d0fd82e513f664bcefd9"; 
const BASE_A_ID = "apphdFfbeJpVbfsCT";
const TABLE_A_ID = "tblIs8fZoorhIQajG";

// Base B (Branch/Location Lookup)
const AIRTABLE_API_KEY_B = "patokyvn0X2ejcRQi.5d7cfe93b49248f724efdd9a40a365e6c1844e77cdeace1dcd7454c5edf10d9a"; 
const BASE_B_ID = "appehs4OWDzGWYCrP";
const TABLE_B_ID = "tblwtpHlA3CYpa02W";


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

  // 🔹 Populate dropdowns from Airtable field options
  // Map element IDs in your HTML form to Airtable field names
const dropdownConfig = {
  department: "Department",                // Linked to Departments table
  itIssue: "IT Issue(s)",                  // Multi-select
  priority: "Priority",                    // Single-select
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

  // format Submitted By from email
  let submittedBy = "";
  if (submitterEmail.includes("@")) {
    const [first, lastWithDomain] = submitterEmail.split(".");
    const last = lastWithDomain.split("@")[0];
    submittedBy = `${capitalize(first)} ${capitalize(last)}`;
  }

  // collect form values
  const payloadFields = {
    "Department": document.getElementById("department").value,
    "IT Issue": document.getElementById("itIssue").value,
    "New Hire Setup": document.getElementById("newHireSetup").value,
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
    "Submitter Email": submitterEmail,
    "Submitted By": submittedBy
  };

  try {
    // Step 1: lookup Branch/Location from Base B
    const branchRecord = await fetchBranchFromBaseB(submitterEmail);
    let branchValue = branchRecord?.fields?.Branch || "";
    let locationId = null;

    if (branchValue) {
      locationId = await fetchBranchIdFromBaseA(branchValue);
    }

    if (locationId) {
      payloadFields["Location"] = [locationId];
    }

    // Step 2: submit record to Base A
    const url = `https://api.airtable.com/v0/${BASE_A_ID}/${TABLE_A_ID}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY_A}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ fields: payloadFields })
    });

    if (response.ok) {
      const successData = await response.json();
      console.log("✅ Help Desk submission success:", successData);
      document.getElementById("helpDeskMessage").innerHTML =
        "<p class='success'>✅ Help Desk request submitted successfully!</p>";
      document.getElementById("helpDeskForm").reset();

      // restore email field
      document.getElementById("submitterEmail").value = submitterEmail;

      // refresh user records
      fetchUserRecords(submitterEmail);
    } else {
      const errorData = await response.json();
      console.error("❌ Airtable error:", errorData);
      document.getElementById("helpDeskMessage").innerHTML =
        "<p class='error'>❌ Error submitting Help Desk request.</p>";
    }
  } catch (err) {
    console.error("💥 Help Desk network/branch error:", err);
    document.getElementById("helpDeskMessage").innerHTML =
      "<p class='error'>❌ Could not fetch Branch/Location.</p>";
  }
});


// ========================
// Fetch Dropdown Options from Airtable Schema
// ========================
async function populateDropdown(elementId, fieldName) {
  try {
    console.log(`🔹 [populateDropdown] Starting for field: ${fieldName}, elementId: ${elementId}`);

    const url = `https://api.airtable.com/v0/meta/bases/${BASE_A_ID}/tables`;
    console.log("🌐 Fetching schema from:", url);

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY_A}` }
    });

    console.log("📡 Response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Schema fetch failed for ${fieldName}. HTTP ${response.status}. Body:`, errorText);
      throw new Error(`Schema fetch failed: HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log("✅ Schema fetch success. Tables available:", data.tables.map(t => t.name));

    const table = data.tables.find(t => t.id === TABLE_A_ID);
    console.log("📑 Table fields:", table.fields.map(f => f.name));

    console.log("🔎 Matching table ID:", TABLE_A_ID, "-> Found table:", table ? table.name : "❌ not found");

    if (!table) return;

    const field = table.fields.find(f => f.name === fieldName);
    console.log("🔎 Looking for field:", fieldName, "-> Found:", field ? field.name : "❌ not found");

    if (!field || !field.options) {
      console.warn(`⚠️ Field ${fieldName} has no options or doesn’t exist in schema.`);
      return;
    }

    const selectEl = document.getElementById(elementId);
    if (!selectEl) {
      console.warn(`⚠️ Element with id "${elementId}" not found in DOM.`);
      return;
    }

    // clear + add default option
    selectEl.innerHTML = `<option value="">-- Select ${fieldName} --</option>`;

    console.log(`📋 Populating dropdown with ${field.options.choices.length} choices for ${fieldName}`);

    // loop over the schema’s predefined options
    field.options.choices.forEach(choice => {
      console.log("   ➕ Adding option:", choice.name);
      const opt = document.createElement("option");
      opt.value = choice.name;
      opt.textContent = choice.name;
      selectEl.appendChild(opt);
    });

    console.log(`✅ Finished populating dropdown for ${fieldName}`);

  } catch (err) {
    console.error(`❌ populateDropdown(${fieldName}) failed:`, err.message);
  }
}

// ========================
// Fetch Past Submissions
// ========================
async function fetchUserRecords(email) {
  try {
    const formula = `{Submitted By}="${email}"`;
    const url = `https://api.airtable.com/v0/${BASE_A_ID}/${TABLE_A_ID}?filterByFormula=${encodeURIComponent(formula)}&sort[0][field]=Date created&sort[0][direction]=desc`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY_A}` }
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    displayUserRecords(data.records);

  } catch (err) {
    console.error("❌ fetchUserRecords failed:", err.message);
    document.getElementById("helpDeskUserRecords").innerHTML =
      "<p class='error'> No Help Desk submissions in last 45 days.</p>";
  }
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
      <td>${f["Submitter Email"] || ""}</td>
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
async function fetchBranchFromBaseB(email) {
  try {
    const formula = `{Email}="${email}"`;
    const url = `https://api.airtable.com/v0/${BASE_B_ID}/${TABLE_B_ID}?filterByFormula=${encodeURIComponent(formula)}`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY_B}` }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return data.records?.[0] || null;
  } catch (err) {
    console.error("❌ fetchBranchFromBaseB failed:", err.message);
    return null;
  }
}

async function fetchBranchIdFromBaseA(branchValue) {
  try {
    const formula = `{Location}="${branchValue}"`;
    const url = `https://api.airtable.com/v0/${BASE_A_ID}/tblgJHu0LR0IyziG7?filterByFormula=${encodeURIComponent(formula)}`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY_A}` }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return data.records?.[0]?.id || null;
  } catch (err) {
    console.error("❌ fetchBranchIdFromBaseA failed:", err.message);
    return null;
  }
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



















})();