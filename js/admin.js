// === Inject minimal iMessage-like styles ===
(function injectStyles(){
  const css = `
    .comments-thread{display:flex;flex-direction:column;gap:8px}
    .bubble{max-width:520px;padding:10px 14px;border-radius:18px;line-height:1.35}
    .bubble .bubble-meta{font-size:.82em;opacity:.8;margin-bottom:4px}
    .bubble .bubble-text{white-space:pre-wrap;word-wrap:break-word}
    .bubble.user{align-self:flex-start;background:#e5e5ea;color:#111;
      border-top-left-radius:6px;border-top-right-radius:18px;border-bottom-right-radius:18px;border-bottom-left-radius:18px}
    .bubble.hr{align-self:flex-end;background:#0a84ff;color:#fff;
      border-top-right-radius:6px;border-top-left-radius:18px;border-bottom-left-radius:18px;border-bottom-right-radius:18px}
    /* Optional: table cell styling so bubbles don't feel cramped */
    td[data-label="Comments"]{vertical-align:top;min-width:360px}
    textarea.comment-box{width:100%;min-height:70px}
  `;
  const s=document.createElement("style");
  s.textContent=css;
  document.head.appendChild(s);
})();

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
      let url = `https://api.airtable.com/v0/${BASE_A_ID}/${TABLE_A_ID}?sort[0][field]=Date created&sort[0][direction]=desc&maxRecords=${maxPerPage}`;
      const filter = encodeURIComponent(`{Status} = "Pending"`);
      url += `&filterByFormula=${filter}`;
      if (offset) url += `&offset=${offset}`;

      console.log("📡 Fetching submissions page:", url);
      const response = await fetch(url, { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY_A}` } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      console.log("✅ Page records:", data);

      allRecords = allRecords.concat(data.records);
      offset = data.offset || null;
    } while (offset);

    console.log(`📦 Total matching records: ${allRecords.length}`);

    const submissionIds = allRecords.map(r => r.id);
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

// 🧼 Helper: escape HTML to prevent injection in bubble content
function escapeHTML(str){
  return String(str || "")
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&#39;");
}

// 🕒 Helper: Format timestamp
function formatTimestamp(ts) {
  if (!ts) return "";
  try { return new Date(ts).toLocaleString(); } catch { return String(ts); }
}

// ✅ Display All Records (with chat bubbles + timestamps)
function displayAdminRecords(records, commentsBySubmission) {
  const tableBody = document.getElementById("adminRecordsTableBody");
  if (!tableBody) return;
  tableBody.innerHTML = "";

  records.forEach((rec) => {
    const f = rec.fields;
    const date = f["Timestamp"] || rec.createdTime;
    const recordUrl = `https://airtable.com/${BASE_A_ID}/${TABLE_A_ID}/${rec.id}`;

    const thread = commentsBySubmission[rec.id] || [];
    // Oldest first (typical chat reading order)
    const sorted = [...thread].sort((a,b) => new Date(a.fields.Timestamp || a.createdTime) - new Date(b.fields.Timestamp || b.createdTime));

    const commentsHTML = sorted.length
      ? `<div class="comments-thread">
          ${sorted.map(c => {
            const user = c.fields.User || "Unknown";
            const text = c.fields.Comment || "";
            const ts = c.fields.Timestamp || c.createdTime;
            const when = formatTimestamp(ts);
            const isHR = (user || "").trim().toLowerCase() === "human resources";
            const roleClass = isHR ? "hr" : "user";
            return `
              <div class="bubble ${roleClass}">
                <div class="bubble-meta"><strong>${escapeHTML(user)}</strong> • <span class="bubble-time">${escapeHTML(when)}</span></div>
                <div class="bubble-text">${escapeHTML(text)}</div>
              </div>
            `;
          }).join("")}
        </div>`
      : "<p>No comments yet</p>";

    const row = document.createElement("tr");
    row.innerHTML = `
      <td data-label="Request Type">${escapeHTML(f["Request type"])}</td>
      <td data-label="Notes">${escapeHTML(f["Notes From Submitter"])}</td>
      <td data-label="Submitted By">${escapeHTML(f["Submitted By"])}</td>
      <td data-label="Email">${escapeHTML(f["Submitter Email"])}</td>
      <td data-label="Date created">${new Date(date).toLocaleDateString()}</td>
      <td data-label="Comments">${commentsHTML}</td>
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
    fetchAllRecords(); // refresh to render the new bubble with server-side timestamp

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
