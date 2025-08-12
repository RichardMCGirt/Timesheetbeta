// Airtable Base A (Submissions + Comments)
const AIRTABLE_API_KEY_A = "patW07BoKoJG3dsef.c533e11a7b2005c7ff8a2a4c53f145aa97049a0bed00d0fd82e513f664bcefd9";
const BASE_A_ID = "appRplLVFnR1ZK8WH";
const TABLE_A_ID = "tblV1HOCtGjfyGk71";
const COMMENTS_TABLE_ID = "tblYCZpJ5PvOVaUww";

// ✅ Fetch ALL submissions
async function fetchAllRecords() {
  try {
    let allRecords = [];
    let offset = null;
    const maxPerPage = 50;

    do {
      // Build Airtable URL with sorting, filtering, and pagination
      let url = `https://api.airtable.com/v0/${BASE_A_ID}/${TABLE_A_ID}?sort[0][field]=Date created&sort[0][direction]=desc&maxRecords=${maxPerPage}`;

      // Filter for Status = "Pending"
      const filter = encodeURIComponent(`{Status} = "Pending"`);
      url += `&filterByFormula=${filter}`;

      // Add offset if continuing pagination
      if (offset) {
        url += `&offset=${offset}`;
      }

      console.log("📡 Fetching submissions page:", url);

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${AIRTABLE_API_KEY_A}` }
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      console.log("✅ Page records:", data);

      allRecords = allRecords.concat(data.records);
      offset = data.offset || null; // Prepare for next page if exists
    } while (offset);

    console.log(`📦 Total matching records: ${allRecords.length}`);

    // Get record IDs for comments
    const submissionIds = allRecords.map(r => r.id);

    // Fetch related comments
    const comments = await fetchComments(submissionIds);
    displayAdminRecords(allRecords, comments);

  } catch (err) {
    console.error("❌ fetchAllRecords failed:", err.message);
    const tbody = document.getElementById("adminRecordsTableBody");
    if (tbody) {
      tbody.innerHTML = "<tr><td colspan='8'>Error loading submissions.</td></tr>";
    }
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

// 🕒 Helper: Format timestamp
function formatTimestamp(ts) {
  if (!ts) return "";
  try {
    // Use local date+time; customize options if you want a specific format
    return new Date(ts).toLocaleString();
  } catch {
    return String(ts);
  }
}

// ✅ Display All Records (with comment box)
function displayAdminRecords(records, commentsBySubmission) {
  const tableBody = document.getElementById("adminRecordsTableBody");
  if (!tableBody) return;
  tableBody.innerHTML = "";

  records.forEach((rec) => {
    const f = rec.fields;
    const date = f["Timestamp"] || rec.createdTime;
    const recordUrl = `https://airtable.com/${BASE_A_ID}/${TABLE_A_ID}/${rec.id}`;

    // Show existing comments (now with timestamp)
    const comments = (commentsBySubmission[rec.id] || [])
      .map(c => {
        const user = c.fields.User || "Unknown";
        const text = c.fields.Comment || "";
        const ts = c.fields.Timestamp || c.createdTime; // prefer explicit field
        const when = formatTimestamp(ts);
        return `
          <div class="comment">
            <div class="comment-meta"><strong>${user}</strong> • <span class="comment-time">${when}</span></div>
            <div class="comment-text">${text}</div>
          </div>
        `;
      })
      .join("") || "<p>No comments yet</p>";

    // Build row
    const row = document.createElement("tr");
    row.innerHTML = `
      <td data-label="Request Type">${f["Request type"] || ""}</td>
      <td data-label="Notes">${f["Notes From Submitter"] || ""}</td>
      <td data-label="Submitted By">${f["Submitted By"] || ""}</td>
      <td data-label="Email">${f["Submitter Email"] || ""}</td>
      <td data-label="Date created">${new Date(date).toLocaleDateString()}</td>
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
      // If your Comments table has a Created time field named "Timestamp",
      // Airtable will populate it automatically on create—no need to send it.
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
    // 🔄 Refresh table so the new comment (with server-side timestamp) appears
    fetchAllRecords();

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
