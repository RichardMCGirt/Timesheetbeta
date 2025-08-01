// Base A (Submissions)
const AIRTABLE_API_KEY_A = "patW07BoKoJG3dsef.c533e11a7b2005c7ff8a2a4c53f145aa97049a0bed00d0fd82e513f664bcefd9"; 
const BASE_A_ID = "appRplLVFnR1ZK8WH";
const TABLE_A_ID = "tblV1HOCtGjfyGk71";

// Base B (Branch/Location Lookup)
const AIRTABLE_API_KEY_B = "patokyvn0X2ejcRQi.5d7cfe93b49248f724efdd9a40a365e6c1844e77cdeace1dcd7454c5edf10d9a"; 
const BASE_B_ID = "appehs4OWDzGWYCrP";
const TABLE_B_ID = "tblwtpHlA3CYpa02W";

// Auto-fill Submitter Email from localStorage
document.addEventListener("DOMContentLoaded", () => {
  const email = localStorage.getItem("userEmail") || "";
  document.getElementById("submitterEmail").value = email;

  if (email) {
    fetchUserRecords(email); // ✅ fetch past submissions
  }
});

// Form submission
document.getElementById("airtableForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const requestType = document.getElementById("requestType").value;
  const submitterEmail = document.getElementById("submitterEmail").value;
  const notes = document.getElementById("notes").value;

  // Format Submitted By (firstname lastname from email)
  let submittedBy = "";
  if (submitterEmail.includes("@")) {
    const [first, lastWithDomain] = submitterEmail.split(".");
    const last = lastWithDomain.split("@")[0];
    submittedBy = `${capitalize(first)} ${capitalize(last)}`;
  }

  try {
    // 🔹 Step 1: Fetch Branch from Base B
    const branchRecord = await fetchBranchFromBaseB(submitterEmail);
    let branchValue = branchRecord?.fields?.Branch || "";
    let locationId = null;
    if (branchValue) {
      locationId = await fetchBranchIdFromBaseA(branchValue);
    }

    // 🔹 Step 2: Submit to Base A
    const payload = {
      fields: {
        "Request type": requestType,
        "Submitter Email": submitterEmail,
        "Notes From Submitter": notes,
        "Submitted By": submittedBy,
        "Location": locationId ? [locationId] : []
      }
    };

    const url = `https://api.airtable.com/v0/${BASE_A_ID}/${TABLE_A_ID}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY_A}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      const successData = await response.json();
      console.log("✅ Success Response:", successData);

      document.getElementById("message").innerHTML =
        "<p class='success'>✅ Request submitted successfully!</p>";
      document.getElementById("airtableForm").reset();
      document.getElementById("submitterEmail").value =
        localStorage.getItem("userEmail") || "";

      // 🔹 Refresh user records list
      fetchUserRecords(submitterEmail);

    } else {
      const errorData = await response.json();
      console.error("❌ Airtable Error Response:", errorData);
      document.getElementById("message").innerHTML =
        "<p class='error'>❌ Error submitting request.</p>";
    }
  } catch (err) {
    console.error("💥 Network/Branch Lookup Error:", err);
    document.getElementById("message").innerHTML =
      "<p class='error'>❌ Could not fetch Branch/Location.</p>";
  }
});

// 🔹 Fetch past submissions for this user
async function fetchUserRecords(email) {
  try {
    const formula = `{Submitter Email}="${email}"`;
const url = `https://api.airtable.com/v0/${BASE_A_ID}/${TABLE_A_ID}?filterByFormula=${encodeURIComponent(formula)}&sort[0][field]=Date created&sort[0][direction]=desc`;

    console.log("📡 Fetching User Records:", url);

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY_A}` }
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    displayUserRecords(data.records);

  } catch (err) {
    console.error("❌ fetchUserRecords failed:", err.message);
    document.getElementById("hrUserRecords").innerHTML =
      "<p class='error'> No previous submisions last 45 days.</p>";
  }
}

// 🔹 Display records in the page
function displayUserRecords(records) {
  const tableBody = document.getElementById("userRecordsTableBody");
  tableBody.innerHTML = "";

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 45); // 45 days ago

  records.forEach((rec) => {
    const f = rec.fields;
    const date = f["Date created"] || rec.createdTime;

    // ⛔ Skip if older than 45 days
    if (new Date(date) < cutoff) return;

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${f["Request type"] || ""}</td>
      <td>${f["Notes From Submitter"] || ""}</td>
      <td>${new Date(date).toLocaleDateString()}</td>
    `;
    tableBody.appendChild(row);
  });
}


// 🔹 Fetch Branch record from Base B
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

// 🔹 Fetch Branch record from Base A by branch name
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

// Helper: Capitalize names
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// 🔹 Auto-grow notes textarea
const notes = document.getElementById("notes");
notes.addEventListener("input", function() {
  this.style.height = "auto";
  this.style.height = this.scrollHeight + "px";
});
