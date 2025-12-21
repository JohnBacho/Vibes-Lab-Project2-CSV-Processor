const fileInput = document.getElementById("csvFile");
fileInput.addEventListener("change", function (e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (event) {
    let text = event.target.result;
    let rows = text.split("\n").map((r) => r.split(","));
    rows = rows.filter((row) => row.some((cell) => cell && cell.trim() !== ""));
    const headerRow = rows[0];
    console.log("Header row:", headerRow);

    const trialNumberIndex = headerRow.findIndex(
      (col) => col.trim() === "TrialNumber"
    );
    const gamblingTypeIndex = headerRow.findIndex(
      (col) => col.trim() === "GamblingType"
    );
    const programNameIndex = headerRow.findIndex(
      (col) => col.trim() === "ProgramName"
    );
    const DateIndex = headerRow.findIndex((col) => col.trim() === "Date");
    const TimeIndex = headerRow.findIndex((col) => col.trim() === "LocalTime");

    const walletIndex = headerRow.findIndex((col) => col.trim() === "Wallet");
    const phaseIndex = headerRow.findIndex((col) => col.trim() === "Phase");

    if (trialNumberIndex === -1) {
      alert(
        `TrialNumber column not found! Found columns: ${headerRow.join(", ")}`
      );
      return;
    }
    if (gamblingTypeIndex === -1) {
      alert(
        `GamblingType column not found! Found columns: ${headerRow.join(", ")}`
      );
      return;
    }
    if (walletIndex === -1) {
      alert(`Wallet column not found! Found columns: ${headerRow.join(", ")}`);
      return;
    }
    if (phaseIndex === -1) {
      alert(`Phase column not found! Found columns: ${headerRow.join(", ")}`);
      return;
    }

    console.log(
      `Columns found - Phase: ${phaseIndex}, TrialNumber: ${trialNumberIndex}, GamblingType: ${gamblingTypeIndex}, Wallet: ${walletIndex}`
    );

    let summaryRows = [headerRow];
    let effortTaskSummaries = [];
    let processedEffortTrials = new Set();
    let currentTrial = null;
    let lastRowOfTrial = null;
    let firstWalletInTrial = null;
    let maxWalletInTrial = null;
    let currentPhase = null;
    let currentGamblingType = null;
    let programNameFromCSV = "";
    let Date = "";
    let Time = "";

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const trialNum = row[trialNumberIndex];
      const gamblingType = row[gamblingTypeIndex]
        ? row[gamblingTypeIndex].trim()
        : "";
      const walletValue = parseFloat(row[walletIndex]) || 0;
      const phase = row[phaseIndex];
      if (!programNameFromCSV) {
        programNameFromCSV = row[programNameIndex];
        Date = row[DateIndex];
        Time = row[TimeIndex];
      }
      if (currentTrial !== trialNum) {
        if (currentTrial !== null && currentGamblingType === "EffortTask") {
          const trialKey = `${currentPhase}-${currentTrial}`;
          if (!processedEffortTrials.has(trialKey)) {
            const maxGained = maxWalletInTrial - firstWalletInTrial;
            effortTaskSummaries.push({
              phase: currentPhase,
              trialNumber: currentTrial,
              gamblingType: "EffortTask",
              maxGained: maxGained.toFixed(0),
            });
            processedEffortTrials.add(trialKey);
          }
        } else if (
          currentTrial !== null &&
          lastRowOfTrial &&
          currentGamblingType !== "EffortTask"
        ) {
          summaryRows.push(lastRowOfTrial);
        }

        currentTrial = trialNum;
        currentPhase = phase;
        currentGamblingType = gamblingType;
        firstWalletInTrial = walletValue;
        maxWalletInTrial = walletValue;
      } else {
        if (walletValue > maxWalletInTrial) {
          maxWalletInTrial = walletValue;
        }
      }

      lastRowOfTrial = row;
    }

    if (currentTrial !== null && currentGamblingType === "EffortTask") {
      const trialKey = `${currentPhase}-${currentTrial}`;
      if (!processedEffortTrials.has(trialKey)) {
        const maxGained = maxWalletInTrial - firstWalletInTrial;
        effortTaskSummaries.push({
          phase: currentPhase,
          trialNumber: currentTrial,
          gamblingType: "EffortTask",
          maxGained: maxGained.toFixed(0),
        });
      }
    } else if (lastRowOfTrial && currentGamblingType !== "EffortTask") {
      summaryRows.push(lastRowOfTrial);
    }

    console.log(`Found ${summaryRows.length - 1} trial transitions`);
    console.log(`Found ${effortTaskSummaries.length} EffortTask trials`);

    let csvContent = summaryRows.map((r) => r.join(",")).join("\n");

    if (effortTaskSummaries.length > 0) {
      csvContent += "\n\n";
      csvContent += "Phase,TrialNumber,GamblingType,Gained\n";
      effortTaskSummaries.forEach((summary) => {
        csvContent += `${summary.phase},${summary.trialNumber},${summary.gamblingType},${summary.maxGained}\n`;
      });
    }
    const [hourStr, minuteStr] = Time.split("_");
    const hour24 = parseInt(hourStr, 10);

    const period = hour24 >= 12 ? "PM" : "AM";
    const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
    Date = Date.replaceAll("_", "-");
    const americanTime = `${hour12}-${minuteStr}${period}`;
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${
      programNameFromCSV || "Program"
    }_${Date}_${americanTime}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  reader.readAsText(file);
});
