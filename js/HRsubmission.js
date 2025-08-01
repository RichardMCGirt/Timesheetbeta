// Airtable Configs

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
});

// Form submission
document.getElementById("airtableForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const requestType = document.getElementById("requestType").value;
  const submitterEmail = document.getElementById("submitterEmail").value;
  const notes = document.getElementById("notes").value;

  console.log("📨 Form Values:", {
    requestType,
    submitterEmail,
    notes
  });

  // Format Submitted By (firstname lastname from email)
  let submittedBy = "";
  if (submitterEmail.includes("@")) {
    const [first, lastWithDomain] = submitterEmail.split(".");
    const last = lastWithDomain.split("@")[0];
    submittedBy = `${capitalize(first)} ${capitalize(last)}`;
  }
  console.log("👤 Submitted By:", submittedBy);

  try {
    // 🔹 Step 1: Fetch Branch from Base B using API_KEY_B
    console.log("🔎 Looking up Branch in Base B for email:", submitterEmail);
    const branchRecord = await fetchBranchFromBaseB(submitterEmail);

  let branchValue = branchRecord?.fields?.Branch || "";
let locationId = null;

if (branchValue) {
  locationId = await fetchBranchIdFromBaseA(branchValue);
}


    console.log("🏢 Branch Lookup Result:", {
      branchRecord,
      branchValue,
      locationId
    });

    // 🔹 Step 2: Submit data to Base A using API_KEY_A
    const payload = {
fields: {
  "Request type": requestType,
  "Submitter Email": submitterEmail,
  "Notes From Submitter": notes,
  "Submitted By": submittedBy,
  "Location": locationId ? [locationId] : []  // 👈 use the actual field name from Base A
}

};


    console.log("📦 Payload being sent to Airtable Base A:", JSON.stringify(payload, null, 2));

    const url = `https://api.airtable.com/v0/${BASE_A_ID}/${TABLE_A_ID}`;
    console.log("🌐 POST URL:", url);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY_A}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    console.log("📡 Response Status:", response.status, response.statusText);

    if (response.ok) {
      const successData = await response.json();
      console.log("✅ Success Response:", successData);

      document.getElementById("message").innerHTML =
        "<p class='success'>✅ Request submitted successfully!</p>";
      document.getElementById("airtableForm").reset();
      document.getElementById("submitterEmail").value =
        localStorage.getItem("userEmail") || "";
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


// 🔹 Helper: Fetch Branch record from Base B
async function fetchBranchFromBaseB(email) {
  try {
    const formula = `{Email}="${email}"`; // ✅ safer quotes
    const url = `https://api.airtable.com/v0/${BASE_B_ID}/${TABLE_B_ID}?filterByFormula=${encodeURIComponent(formula)}`;

    console.log("📡 Fetching Base B with:", { url, formula, BASE_B_ID, TABLE_B_ID });

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY_B}` }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status} – ${errorText}`);
    }

    const data = await response.json();

    if (!data.records || data.records.length === 0) {
      console.warn("⚠️ No records found in Base B for email:", email);
      return null;
    }

    console.log("✅ Found Branch record:", data.records[0]);
    return data.records[0];
  } catch (err) {
    console.error("❌ fetchBranchFromBaseB failed:", err.message);
    return null;
  }
}

// 🔹 Helper: Fetch Branch record from Base A by branch name
async function fetchBranchIdFromBaseA(branchValue) {
  try {
const formula = `{Location}="${branchValue}"`;
    const url = `https://api.airtable.com/v0/${BASE_A_ID}/tblgJHu0LR0IyziG7?filterByFormula=${encodeURIComponent(formula)}`;

    console.log("📡 Fetching Branch ID from Base A with:", { url, formula });

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY_A}` }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status} – ${errorText}`);
    }

    const data = await response.json();
    if (!data.records || data.records.length === 0) {
      console.warn("⚠️ No branch match found in Base A for:", branchValue);
      return null;
    }

    console.log("✅ Found Branch record in Base A:", data.records[0]);
    return data.records[0].id;
  } catch (err) {
    console.error("❌ fetchBranchIdFromBaseA failed:", err.message);
    return null;
  }
}

// Helper: Capitalize names
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
