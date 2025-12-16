const fileInput = document.getElementById("csvFile");

fileInput.addEventListener("change", function (e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();

  reader.onload = function (event) {
    let text = event.target.result;
    let rows = text.split("\n").map((r) => r.split(","));
    
    // Remove empty rows
    rows = rows.filter(row => row.some(cell => cell && cell.trim() !== ""));
    
    const headerRow = rows[0];
    console.log("Header row:", headerRow);
    console.log("Looking for TrialNumber in:", headerRow.map(col => `"${col.trim()}"`));
    
    const trialNumberIndex = headerRow.findIndex(col => col.trim() === "TrialNumber");
    
    if (trialNumberIndex === -1) {
      alert(`TrialNumber column not found! Found columns: ${headerRow.join(", ")}`);
      return;
    }
    
    console.log(`TrialNumber found at index ${trialNumberIndex}`);

    // Find trial switch points (last row before trial number changes)
    let summaryRows = [headerRow]; // Start with header
    let currentTrial = null;
    let lastRowOfTrial = null;

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const trialNum = row[trialNumberIndex];
      
      // Check if trial number changed
      if (currentTrial !== null && trialNum !== currentTrial && lastRowOfTrial) {
        // Add the last row of the previous trial to summary
        summaryRows.push(lastRowOfTrial);
      }
      
      // Update tracking variables
      currentTrial = trialNum;
      lastRowOfTrial = row;
    }
    
    // Don't forget to add the last row of the final trial
    if (lastRowOfTrial) {
      summaryRows.push(lastRowOfTrial);
    }

    console.log(`Found ${summaryRows.length - 1} trial transitions`);

    // Create CSV output
    const csvContent = summaryRows.map((r) => r.join(",")).join("\n");
    
    const programName = document
      .getElementById("Text")
      .value.replace(/\s+/g, "");
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${programName || "Program"}_TrialSummary.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  reader.readAsText(file);
});