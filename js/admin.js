// Airtable Base A (Submissions + Comments)
const AIRTABLE_API_KEY_A = "patW07BoKoJG3dsef.c533e11a7b2005c7ff8a2a4c53f145aa97049a0bed00d0fd82e513f664bcefd9";
const BASE_A_ID = "appRplLVFnR1ZK8WH";
const TABLE_A_ID = "tblV1HOCtGjfyGk71";
const COMMENTS_TABLE_ID = "tblYCZpJ5PvOVaUww";

// ✅ Fetch ALL submissions
async function fetchAllRecords() {
  try {
    const url = `https://api.airtable.com/v0/${BASE_A_ID}/${TABLE_A_ID}?sort[0][field]=Date created&sort[0][direction]=desc&maxRecords=50`;

    console.log("📡 Fetching ALL submissions:", url);

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY_A}` }
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    console.log("✅ All Submissions:", data);

    const submissionIds = data.records.map(r => r.id);

    // Fetch related comments
    const comments = await fetchComments(submissionIds);
    displayAdminRecords(data.records, comments);

  } catch (err) {
    console.error("❌ fetchAllRecords failed:", err.message);
    document.getElementById("adminRecordsTableBody").innerHTML =
      "<tr><td colspan='7'>Error loading submissions.</td></tr>";
  }
}

// ✅ Fetch Comments (re-use existing logic)
async function fetchComments(submissionIds) {
  if (!submissionIds.length) return {};

  const url = `https://api.airtable.com/v0/${BASE_A_ID}/${COMMENTS_TABLE_ID}?maxRecords=100&sort[0][field]=Timestamp&sort[0][direction]=desc`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${AIRTABLE_API_KEY_A}` }
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const data = await response.json();

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

  return grouped;
}

// ✅ Display All Records
// ✅ Display All Records (with comment box)
function displayAdminRecords(records, commentsBySubmission) {
  const tableBody = document.getElementById("adminRecordsTableBody");
  tableBody.innerHTML = "";

  records.forEach((rec) => {
    const f = rec.fields;
    const date = f["Timestamp"] || rec.createdTime;
    const recordUrl = `https://airtable.com/${BASE_A_ID}/${TABLE_A_ID}/${rec.id}`;

    // Show existing comments
    const comments = (commentsBySubmission[rec.id] || []).map(c => {
      const user = c.fields.User || "Unknown";
      const text = c.fields.Comment || "";
      return `<p><strong>${user}:</strong> ${text}</p>`;
    }).join("") || "<p>No comments yet</p>";

    // Build row
    const row = document.createElement("tr");
    row.innerHTML = `
      <td data-label="Request Type">${f["Request type"] || ""}</td>
      <td data-label="Notes">${f["Notes From Submitter"] || ""}</td>
      <td data-label="Submitted By">${f["Submitted By"] || ""}</td>
      <td data-label="Email">${f["Submitter Email"] || ""}</td>
      <td data-label="Date">${new Date(date).toLocaleDateString()}</td>
      <td data-label="Comments">${comments}</td>
      <td data-label="New Comment">
        <textarea id="comment-${rec.id}" class="comment-box" placeholder="Write a comment..."></textarea>
        <button class="comment-btn" onclick="addAdminComment('${rec.id}')">💬 Comment</button>
      </td>
      <td data-label="Link"><a href="${recordUrl}" target="_blank">🔗 Open</a></td>
    `;
    tableBody.appendChild(row);
  });
}

// ✅ Add comment from admin
async function addAdminComment(submissionId) {
  const commentBox = document.getElementById(`comment-${submissionId}`);
  if (!commentBox) return;

  const newComment = commentBox.value.trim();
  if (!newComment) {
    alert("⚠️ Please enter a comment before posting.");
    return;
  }

  // Always show as Human Resources
  const userName = "Human Resources";

  const payload = {
    fields: {
      "Comment": newComment,
      "Submission": [submissionId],
      "User": userName
    }
  };

  try {
    const url = `https://api.airtable.com/v0/${BASE_A_ID}/${COMMENTS_TABLE_ID}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY_A}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    console.log("✅ Comment posted by Human Resources");
    commentBox.value = "";
    fetchAllRecords(); // 🔄 refresh table

  } catch (err) {
    console.error("❌ Error adding admin comment:", err);
    alert("Error adding comment. Please try again.");
  }
}

// Helper: Capitalize names
function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}


// Run on page load
document.addEventListener("DOMContentLoaded", fetchAllRecords);
