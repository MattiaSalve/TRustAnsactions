const dropzone = document.getElementById("dropzone");
const fileInput = document.getElementById("fileInput");

// Clicking the box triggers the hidden input selector
dropzone.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", (e) =>
	handleFileUpload(e.target.files[0]),
);

// Visual indicators when dragging a file over the UI container
dropzone.addEventListener("dragover", (e) => {
	e.preventDefault();
	dropzone.classList.add("border-indigo-400", "bg-indigo-50/50");
});

dropzone.addEventListener("dragleave", () => {
	dropzone.classList.remove("border-indigo-400", "bg-indigo-50/50");
});

dropzone.addEventListener("drop", (e) => {
	e.preventDefault();
	dropzone.classList.remove("border-indigo-400", "bg-indigo-50/50");

	if (e.dataTransfer.files.length > 0) {
		handleFileUpload(e.dataTransfer.files[0]);
	}
});

// The core network transmitter
async function handleFileUpload(file) {
	if (!file || !file.name.endsWith(".csv")) {
		alert("Please upload a valid CSV file.");
		return;
	}

	// Wrap the file inside a standard HTML Multipart form container
	const formData = new FormData();
	formData.append("file", file);

	try {
		const response = await fetch("/api/transactions/upload", {
			method: "POST",
			body: formData, // Fetch sets content-type header automatically for FormData
		});

		if (response.ok) {
			console.log("File synced successfully!");
			// Refresh the dashboard metrics instantly to display the new data
			fetchDashboardData("transactions");
		} else {
			console.error("Server rejected the CSV statement.");
		}
	} catch (error) {
		console.error("Network error during sync pipeline execution:", error);
	}
}
