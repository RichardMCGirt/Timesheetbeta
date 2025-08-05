// Base A (Submissions)
const AIRTABLE_API_KEY_A = "patW07BoKoJG3dsef.c533e11a7b2005c7ff8a2a4c53f145aa97049a0bed00d0fd82e513f664bcefd9"; 
const BASE_A_ID = "appRplLVFnR1ZK8WH";
const TABLE_A_ID = "tblV1HOCtGjfyGk71";
const COMMENTS_TABLE_ID = "tblYCZpJ5PvOVaUww"; // Replace with your new Comments table ID

// Base B (Branch/Location Lookup)
const AIRTABLE_API_KEY_B = "patokyvn0X2ejcRQi.5d7cfe93b49248f724efdd9a40a365e6c1844e77cdeace1dcd7454c5edf10d9a"; 
const BASE_B_ID = "appehs4OWDzGWYCrP";
const TABLE_B_ID = "tblwtpHlA3CYpa02W";
const userEmail = document.getElementById("submitterEmail").value;
console.log("📧 Filtering comments for userEmail:", userEmail);

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

async function fetchUserComments(userEmail) {
  // Airtable lookup field in Comments table must be EXACT
  const formula = `{Submission Submitted By}="${userEmail}"`;

  const url = `https://api.airtable.com/v0/${BASE_A_ID}/${COMMENTS_TABLE_ID}?filterByFormula=${encodeURIComponent(formula)}&sort[0][field]=Timestamp&sort[0][direction]=desc`;

  console.log("📡 Fetching Comments filtered by email:", url);

  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY_A}` }
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    console.log("✅ Filtered Comments fetched:", data.records);

    return data.records;
  } catch (err) {
    console.error("💥 Error fetching user comments:", err);
    return [];
  }
}



// 🔹 Fetch past submissions for this user
async function fetchUserRecords(email) {
  try {
    console.log("🔎 fetchUserRecords called with email:", email);

    // Must match EXACT field name in Base A
    const formula = `{Submitter Email}="${email}"`;

    const url = `https://api.airtable.com/v0/${BASE_A_ID}/${TABLE_A_ID}?filterByFormula=${encodeURIComponent(formula)}&sort[0][field]=Date created&sort[0][direction]=desc&maxRecords=10&view=Grid%20view`;

    console.log("📡 Fetching User Records URL:", url);

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY_A}` }
    });

    console.log("📥 Response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Airtable fetch failed. Full response:", errorText);
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log("✅ Submissions fetched:", data);

    // ✅ Get all submission record IDs
    const submissionIds = data.records.map(r => r.id);
    console.log("📌 Submission IDs:", submissionIds);

    // ✅ Fetch related comments
    const comments = await fetchComments(submissionIds);
    console.log("💬 Related comments grouped by submission:", comments);

    // Pass both into renderer
    console.log("📤 Sending records + comments to displayUserRecords...");
    displayUserRecords(data.records, comments);

  } catch (err) {
    console.error("❌ fetchUserRecords failed:", err.message);
    document.getElementById("hrUserRecords").innerHTML =
      "<p class='error'> No previous submissions last 45 days.</p>";
  }
}

async function fetchComments(submissionIds) {
  if (!submissionIds.length) return {};

  const url = `https://api.airtable.com/v0/${BASE_A_ID}/${COMMENTS_TABLE_ID}?maxRecords=100&sort[0][field]=Timestamp&sort[0][direction]=desc`;

  console.log("📡 Fetching ALL recent comments from:", url);

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${AIRTABLE_API_KEY_A}` }
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("❌ Airtable comments fetch failed:", errorText);
    throw new Error(`HTTP ${response.status}`);
  }

  const data = await response.json();
  console.log("✅ Raw Comments Response:", data);

  const grouped = {};
  data.records.forEach(c => {
    const linkedIds = c.fields.Submission || [];
    linkedIds.forEach(id => {
      if (submissionIds.includes(id)) {
        if (!grouped[id]) grouped[id] = [];
        grouped[id].push(c);
      }
    });
  });

  console.log("📦 Grouped Comments:", grouped);
  return grouped;
}


function displayUserRecords(records, commentsBySubmission) {
  const tableBody = document.getElementById("userRecordsTableBody");
  tableBody.innerHTML = "";

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 45);

  const recentRecords = records.filter(
    rec => new Date(rec.fields["Timestamp"] || rec.createdTime) >= cutoff
  );

  if (!recentRecords.length) {
    tableBody.innerHTML = `<tr><td colspan="5">No submissions in the last 45 days.</td></tr>`;
    return;
  }

  recentRecords.forEach((rec) => {
    const f = rec.fields;
    const date = f["Timestamp"] || rec.createdTime;

    // Airtable record URL
    const recordUrl = `https://airtable.com/${BASE_A_ID}/${TABLE_A_ID}/${rec.id}`;

    const comments = Object.values(commentsBySubmission)
      .flat()
      .filter(c => (c.fields.Submission || []).includes(rec.id));

    let commentsHtml = comments.length
      ? comments.map(c => {
          const user =
            c.fields.User ||
            (c.fields["User"] && c.fields["User"][0]) ||
            c.fields.Thread ||
            "Unknown";
          const text = c.fields.Comment || "";
          return `<p><strong>${user}:</strong> ${text}</p>`;
        }).join("")
      : "<p>No comments yet</p>";

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${f["Request type"] || ""}</td>
      <td>${f["Notes From Submitter"] || ""}</td>
      <td>${new Date(date).toLocaleDateString()}</td>
      <td>
        ${commentsHtml}
        <textarea id="comment-${rec.id}" placeholder="Add a comment..."></textarea>
        <button onclick="addComment('${rec.id}')">💬 Add Comment</button>
      </td>
    `;
    tableBody.appendChild(row);
  });
}

    // <td><a href="${recordUrl}" target="_blank"> View in Airtable</a></td>


async function addComment(submissionId) {
  console.log("📝 addComment() called for submissionId:", submissionId);

  const commentBox = document.getElementById(`comment-${submissionId}`);
  if (!commentBox) {
    console.error("❌ No comment box found for ID:", `comment-${submissionId}`);
    return;
  }

  const newComment = commentBox.value.trim();
  console.log("💬 Raw comment value:", commentBox.value);
  console.log("✂️ Trimmed comment value:", newComment);

  if (!newComment) {
    console.warn("⚠️ No comment entered. Skipping submission.");
    return;
  }

  // Get user email/name
  const userEmail = localStorage.getItem("userEmail") || "Anonymous";
  console.log("📧 User email from localStorage:", userEmail);

  const [first, lastWithDomain] = userEmail.split(".");
  const last = lastWithDomain ? lastWithDomain.split("@")[0] : "";
  const userName = first ? `${capitalize(first)} ${capitalize(last)}` : userEmail;
  console.log("👤 Computed userName:", userName);

  const payload = {
    fields: {
      "Comment": newComment,
      "Submission": [submissionId],
      "User": userName   // ✅ Always track who wrote it
    }
  };
  console.log("📦 Final payload prepared:", JSON.stringify(payload, null, 2));

  try {
    const url = `https://api.airtable.com/v0/${BASE_A_ID}/${COMMENTS_TABLE_ID}`;
    console.log("🌐 Airtable POST URL:", url);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY_A}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    console.log("📡 Response status:", response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Airtable Error Response:", errorText);
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log("✅ Comment added successfully:", data);

    // Clear box + refresh records
    commentBox.value = "";
    console.log("🧹 Cleared comment box for submissionId:", submissionId);

    console.log("🔄 Refreshing user records for:", userEmail);
    fetchUserRecords(userEmail);
  } catch (err) {
    console.error("💥 Error adding comment:", err);
  }
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
