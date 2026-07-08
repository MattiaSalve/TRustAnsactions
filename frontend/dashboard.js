async function fetchDashboardData(endpointType = "transactions") {
	const startValue = document.getElementById("startDate").value;
	const endValue = document.getElementById("endDate").value;

	const apiUrl = `/api/${endpointType}?start=${startValue}&end=${endValue}`;

	try {
		const response = await fetch(apiUrl);
		if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

		const data = await response.json();

		initDashboard(data);
	} catch (error) {
		console.error(`Failed executing fetch request to ${endpointType}:`, error);
	}
}

let balanceChartInstance = null;
let categoryChartInstance = null;
let savingsChartInstance = null;

Chart.defaults.elements.point.pointRadius = 0;
Chart.defaults.elements.line.borderWidth = 1;
Chart.defaults.elements.arc.borderColor = "oklch(70.4% 0.04 256.788)";
Chart.defaults.elements.line.borderColor = "oklch(70.4% 0.04 256.788)";

const green = "rgba(119, 221, 118, 0.7)";
const red = "rgba(255, 105, 98, 0.7)";
const line_color = "rgba(155,246,255, 0.5)";
const pastelPalette = [
	"rgba(255,173,173, 0.7)",
	"rgba(255,214,165, 0.7)",
	"rgba(253,255,182, 0.7)",
	"rgba(202,255,191, 0.7)",
	"rgba(155,246,255, 0.7)",
	"rgba(160,196,255, 0.7)",
	"rgba(189,178,255, 0.7)",
	"rgba(255,198,255, 0.7)",
	"rgba(255,198,255, 0.7)",
];

function renderBalanceChart(data) {
	const ctx = document.getElementById("balanceChart");

	if (balanceChartInstance) {
		balanceChartInstance.destroy();
	}

	const dates = data.map((tx) => tx.date);
	const amounts = data.map((tx) => tx.balance);

	balanceChartInstance = new Chart(ctx, {
		type: "line",
		data: {
			labels: dates,
			datasets: [
				{
					label: "Balance (CHF)",
					data: amounts,
					tension: 0.5,
					fill: true,
					backgroundColor: line_color,
				},
			],
		},
		options: { responsive: true },
	});
}

function renderCategoryChart(data) {
	const ctx = document.getElementById("categoryChart");

	if (categoryChartInstance) {
		categoryChartInstance.destroy();
	}

	const categoryTotals = {};
	data.forEach((tx) => {
		if (tx.amount < 0) {
			const absAmount = Math.abs(tx.amount);
			if (categoryTotals[tx.category]) {
				categoryTotals[tx.category] += absAmount;
			} else {
				categoryTotals[tx.category] = absAmount;
			}
		}
	});

	const categoryLabels = Object.keys(categoryTotals);
	const categoryData = Object.values(categoryTotals);

	categoryChartInstance = new Chart(ctx, {
		type: "doughnut",
		data: {
			labels: categoryLabels,
			datasets: [
				{
					data: categoryData,
					backgroundColor: pastelPalette,
					borderWidth: 1,
				},
			],
		},
		options: { responsive: true },
	});
}

function renderSavingsByMonth(data) {
	const ctx = document.getElementById("savingsChart");

	if (savingsChartInstance) {
		savingsChartInstance.destroy();
	}

	const monthlyTotals = {};

	data.forEach((tx) => {
		const month = tx.date.substring(0, 7);
		if (!monthlyTotals[month]) {
			monthlyTotals[month] = { earnings: 0, spending: 0 };
		}
		if (tx.amount > 0) {
			monthlyTotals[month].earnings += tx.amount;
		} else {
			monthlyTotals[month].spending += Math.abs(tx.amount);
		}
	});

	const sortedMonths = Object.keys(monthlyTotals).sort();

	const labels = sortedMonths.map((month) => {
		const [year, monthNum] = month.split("-");
		const dateObj = new Date(year, parseInt(monthNum) - 1, 1);
		return dateObj.toLocaleDateString("en-US", {
			month: "short",
			year: "numeric",
		});
	});
	const earningsDataset = sortedMonths.map(
		(month) => monthlyTotals[month].earnings,
	);
	const spendingDataset = sortedMonths.map(
		(month) => monthlyTotals[month].spending,
	);

	savingsChartInstance = new Chart(ctx, {
		type: "bar",
		data: {
			labels: labels,
			datasets: [
				{
					label: "Earnings",
					data: earningsDataset,
					backgroundColor: green,
					borderRadius: 4,
				},
				{
					label: "Spending",
					data: spendingDataset,
					backgroundColor: red,
					borderRadius: 4,
				},
			],
		},
	});
}

function initDashboard(transactions) {
	try {
		renderCategoryChart(transactions);
		renderBalanceChart(transactions);
		renderSavingsByMonth(transactions);
	} catch (err) {
		console.error("Dashboard render failed:", err);
	}
}

fetchDashboardData();
