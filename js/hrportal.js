document.addEventListener("DOMContentLoaded", async () => {
    const userEmailElement = document.getElementById("user-email");
    const userEmail = userEmailElement?.textContent?.trim().toLowerCase();

    console.log("📧 Detected user email:", userEmail);

    if (!userEmail) {
        console.warn("⚠️ No user email found in #user-email span.");
        return;
    }

    const apiKey = 'pat6QyOfQCQ9InhK4.4b944a38ad4c503a6edd9361b2a6c1e7f02f216ff05605f7690d3adb12c94a3c';
    const baseId = 'appD3QeLneqfNdX12';
    const tableId = 'tbljmLpqXScwhiWTt';

    try {
        console.log("📡 Fetching full name from Airtable...");
        const filterFormula = `LOWER({Email})='${userEmail}'`;
        const response = await fetch(`https://api.airtable.com/v0/${baseId}/${tableId}?filterByFormula=${encodeURIComponent(filterFormula)}`, {
            headers: {
                Authorization: `Bearer ${apiKey}`
            }
        });

        const data = await response.json();
        console.log("✅ Airtable response:", data);

        const userRecord = data.records?.[0];
        if (!userRecord) {
            console.warn("❌ No record found in Airtable for user email.");
            return;
        }

        const fullName = userRecord.fields['Full Name'];
        console.log("🧍 Full Name retrieved:", fullName);

        if (!fullName) {
            console.warn("⚠️ Record found, but no Full Name field present.");
            return;
        }

        const encodedName = encodeURIComponent(fullName);
        const navbar = document.getElementById("navbar")?.querySelector("ul");

        if (navbar) {
            const li = document.createElement("li");
            li.innerHTML = `<a href="hraccess.html?name=${encodedName}">Edit Personal and vacation hours</a>`;
            navbar.appendChild(li);
            console.log(`✅ Navigation link added for ${fullName}: hraccess.html?name=${encodedName}`);
        } else {
            console.warn("❌ Navbar UL not found. Could not append link.");
        }

    } catch (error) {
        console.error("💥 Error fetching user info from Airtable:", error);
    }
});
