const API_URL = window.APP_CONFIG.API_URL;

const statusElement = document.getElementById("backend-status");
const form = document.getElementById("item-form");
const titleInput = document.getElementById("title");
const itemsElement = document.getElementById("items");

async function checkBackend() {
    try {
        const response = await fetch(`${API_URL}/health`);
        const data = await response.json();

        if (data.status === "ok") {
            statusElement.textContent = "Connected ✅";
        } else {
            statusElement.textContent = "Problem connecting ❌";
        }
    } catch (error) {
        statusElement.textContent = "Backend unavailable ❌";
        console.error(error);
    }
}

async function loadItems() {
    try {
        const response = await fetch(`${API_URL}/items`);

        if (!response.ok) {
            throw new Error("Could not load items");
        }

        const items = await response.json();

        if (items.length === 0) {
            itemsElement.innerHTML = "<p>No items yet.</p>";
            return;
        }

        itemsElement.innerHTML = "";

        items.forEach((item) => {
            const itemElement = document.createElement("div");
            itemElement.className = "item";
            itemElement.textContent = item.title;

            itemsElement.appendChild(itemElement);
        });

    } catch (error) {
        itemsElement.textContent = "Could not load items.";
        console.error(error);
    }
}

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const title = titleInput.value;

    try {
        const response = await fetch(`${API_URL}/items`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                title: title
            })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.error || "Could not add item");
            return;
        }

        titleInput.value = "";

        await loadItems();

    } catch (error) {
        alert("Could not connect to backend.");
        console.error(error);
    }
});

checkBackend();
loadItems();