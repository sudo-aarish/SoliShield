const AUDIT_URL = "http://localhost:3000/audit";
const PAY_URL = "http://localhost:3000/pay";
const MINT_URL = "http://localhost:3000/mint-badge";

let lastReportData = null;
let lastAuditMeta = null;

// File name display
const fileInput = document.getElementById("contract-file");
const fileNameDisplay = document.getElementById("file-name");
fileInput.addEventListener("change", function () {
    if (this.files.length > 0) {
        fileNameDisplay.textContent = "Selected file: " + this.files[0].name;
    }
});

function formatVulnerabilities(vulns) {
    if (!vulns || vulns.length === 0) return "No vulnerabilities detected by Slither.";
    return vulns.map((v, i) =>
        `#${i + 1} ${v.vulnerability || "Unknown"}\n` +
        `  Impact: ${v.impact || "N/A"} | Confidence: ${v.confidence || "N/A"}\n` +
        `  Details: ${v.description || "No details provided."}`
    ).join("\n\n");
}

async function runAudit() {
    const networkSelect = document.getElementById("network");
    const statusBox = document.getElementById("status");
    const linksBox = document.getElementById("links");
    const downloadSection = document.getElementById("downloadSection");
    const btn = document.getElementById("audit-button");
    const selectedNetwork = networkSelect.value;

    if (!fileInput.files.length) return alert("Please select a .sol file");

    // Reset UI
    linksBox.innerHTML = "";
    downloadSection.style.display = "none";
    document.getElementById("badgeSection").style.display = "none";
    document.getElementById("badgeStatus").textContent = "";
    document.getElementById("slitherSection").style.display = "none";
    document.getElementById("aiSection").style.display = "none";
    document.getElementById("slitherResult").textContent = "";
    document.getElementById("aiResult").textContent = "";

    try {
        btn.disabled = true;
        statusBox.textContent = "Calculating price...";

        const checkForm = new FormData();
        checkForm.append("contract", fileInput.files[0]);

        let res = await fetch(AUDIT_URL, {
            method: "POST",
            headers: { "x-network": selectedNetwork },
            body: checkForm
        });

        if (res.status === 402) {
            const quote = await res.json();
            statusBox.textContent = `Sponsoring ${quote.amount} USDC on ${selectedNetwork}...`;

            const payRes = await fetch(PAY_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount: quote.amount, network: selectedNetwork })
            });

            if (!payRes.ok) {
                const error = await payRes.json();
                throw new Error(error.error || "Payment failed");
            }

            const paymentResult = await payRes.json();
            const paymentProof = btoa(JSON.stringify(paymentResult));

            statusBox.textContent = "Payment confirmed! Running AI audit...";

            const auditForm = new FormData();
            auditForm.append("contract", fileInput.files[0]);

            res = await fetch(AUDIT_URL, {
                method: "POST",
                headers: { "x-payment": paymentProof, "x-network": selectedNetwork },
                body: auditForm
            });
        }

        if (!res.ok) throw new Error("Audit request failed.");

        const data = await res.json();
        lastReportData = data;

        checkBadgeEligibility(data);

        statusBox.textContent = `Audit Complete! Stored on IPFS and ${selectedNetwork}.`;
        downloadSection.style.display = "block";

        if (data.ipfs?.url) addLink(linksBox, data.ipfs.url, "View on IPFS");
        if (data.blockchain?.explorerUrl) {
            const explorerLabel = selectedNetwork === "avalanche-fuji" ? "View on Snowtrace" : "View on Basescan";
            addLink(linksBox, data.blockchain.explorerUrl, explorerLabel);
        }

        const slitherText = data.report?.slitherAnalysis || formatVulnerabilities(data.report?.vulnerabilities);
        if (slitherText) {
            document.getElementById("slitherSection").style.display = "block";
            document.getElementById("slitherResult").textContent = slitherText;
        }

        const aiText = data.report?.aiAnalysis;
        if (aiText) {
            document.getElementById("aiSection").style.display = "block";
            document.getElementById("aiResult").textContent = aiText;
        }

        if (!slitherText && !aiText) {
            document.getElementById("aiSection").style.display = "block";
            document.getElementById("aiResult").textContent = JSON.stringify(data, null, 2);
        }

    } catch (err) {
        statusBox.textContent = "";
        document.getElementById("aiSection").style.display = "block";
        document.getElementById("aiResult").textContent = "Error: " + err.message;
    } finally {
        btn.disabled = false;
    }
}

function checkBadgeEligibility(data) {
    const report = data.report;
    const score = report.securityScore;

    const hasHighOrCritical = report.vulnerabilities.some(v =>
        v.impact === "High" || v.impact === "Critical"
    );

    if (score >= 80 && !hasHighOrCritical) {
        document.getElementById("badgeSection").style.display = "block";
        document.getElementById("badgeScore").textContent = score;
        lastAuditMeta = {
            contractName: data.report.contract.split("/").pop().replace(/^\d+-/, ""),
            securityScore: score,
            ipfsCid: data.ipfs?.cid
        };
    }
}

async function mintBadge() {
    const btn = document.getElementById("mintBadgeBtn");
    const badgeStatus = document.getElementById("badgeStatus");
    const walletInput = document.getElementById("walletInput").value.trim();
    const linksBox = document.getElementById("links");

    if (!walletInput || !walletInput.startsWith("0x")) {
        return alert("Please enter a valid wallet address starting with 0x");
    }

    try {
        btn.disabled = true;
        badgeStatus.textContent = "Processing payment on Avalanche Fuji...";

        const payRes = await fetch(PAY_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ network: "avalanche-fuji" })
        });

        if (!payRes.ok) throw new Error("Payment failed");

        const paymentResult = await payRes.json();
        if (!paymentResult.success) throw new Error("Payment unsuccessful");

        badgeStatus.textContent = "Payment confirmed! Minting Soulbound Badge...";

        const paymentProof = btoa(JSON.stringify(paymentResult));

        const mintRes = await fetch(MINT_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-payment": paymentProof
            },
            body: JSON.stringify({
                recipientAddress: walletInput,
                contractName: lastAuditMeta.contractName,
                securityScore: lastAuditMeta.securityScore,
                ipfsCid: lastAuditMeta.ipfsCid
            })
        });

        if (!mintRes.ok) {
            const err = await mintRes.json();
            throw new Error(err.error);
        }

        const mintData = await mintRes.json();
        badgeStatus.textContent = `Badge minted! Token ID: #${mintData.badge.tokenId}`;
        
        const badgeBtn = document.createElement("button");
        badgeBtn.textContent = "View Badge Tx on Snowtrace";
        badgeBtn.onclick = () => window.open(mintData.badge.explorerUrl, "_blank");
        document.getElementById("badgeStatus").insertAdjacentElement("afterend", badgeBtn);

    } catch (err) {
        badgeStatus.textContent = "Error: " + err.message;
    } finally {
        btn.disabled = false;
    }
}

function addLink(box, url, text) {
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.textContent = text;
    a.style.cssText = "padding: 10px 18px; background: rgba(255,255,255,0.1); color: floralwhite; border-radius: 6px; text-decoration: none; font-size: 16px; border: 1px solid rgba(255,255,255,0.3); transition: 0.2s;";
    box.appendChild(a);
}

function generatePDF() {
    if (!lastReportData || !lastReportData.report) return alert("No report data found!");

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const report = lastReportData.report;
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let y = 0;

    const fileName = fileInput.files[0]?.name || "contract.sol";
    const cleanFileName = fileName.replace(".sol", "");
    const network = lastReportData.network || document.getElementById("network").value;

    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 45, 'F');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.setTextColor(255, 255, 255);
    doc.text("SECURITY AUDIT", margin, 25);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(148, 163, 184);
    doc.text("AI-POWERED SMART CONTRACT ANALYSIS", margin, 32);

    y = 55;
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.setFont("helvetica", "bold");
    doc.text("CONTRACT:", margin, y);
    doc.setFont("helvetica", "normal");
    doc.text(fileName, margin + 25, y);
    doc.setFont("helvetica", "bold");
    doc.text("NETWORK:", margin, y + 5);
    doc.setFont("helvetica", "normal");
    doc.text(network.toUpperCase(), margin + 25, y + 5);
    doc.setFont("helvetica", "bold");
    doc.text("DATE:", margin + 100, y);
    doc.setFont("helvetica", "normal");
    doc.text(new Date().toLocaleDateString(), margin + 115, y);

    if (lastReportData.ipfs?.cid) {
        doc.setFont("helvetica", "bold");
        doc.text("IPFS CID:", margin, y + 10);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.text(lastReportData.ipfs.cid, margin + 25, y + 10);
        y += 5;
    }
    if (lastReportData.blockchain?.txHash) {
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text("TX HASH:", margin, y + 10);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.text(lastReportData.blockchain.txHash.substring(0, 30) + "...", margin + 25, y + 10);
    }

    y += 20;
    const score = report.securityScore || 0;
    let themeColor = [22, 163, 74];
    let riskLabel = "STABLE";
    if (score < 80) { themeColor = [234, 179, 8]; riskLabel = "MEDIUM RISK"; }
    if (score < 50) { themeColor = [220, 38, 38]; riskLabel = "CRITICAL RISK"; }

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, pageWidth - (margin * 2), 35, 3, 3, 'FD');
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text("SECURITY SCORE", margin + 10, y + 12);
    doc.setFontSize(32);
    doc.setTextColor(themeColor[0], themeColor[1], themeColor[2]);
    doc.text(`${score}`, margin + 10, y + 25);
    doc.setFontSize(12);
    doc.text("/ 100", margin + 32, y + 25);
    doc.setFillColor(themeColor[0], themeColor[1], themeColor[2]);
    doc.roundedRect(pageWidth - margin - 50, y + 10, 40, 15, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(riskLabel, pageWidth - margin - 46, y + 20, { align: 'left' });

    y += 50;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("EXECUTIVE SUMMARY", margin, y);
    doc.setDrawColor(themeColor[0], themeColor[1], themeColor[2]);
    doc.setLineWidth(1);
    doc.line(margin, y + 2, margin + 20, y + 2);
    y += 12;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(51, 65, 85);
    const summaryText = `This automated audit uses advanced AI patterns to detect vulnerabilities including Reentrancy, Integer Overflows, and Access Control flaws. Deployed on ${network}.`;
    const splitSummary = doc.splitTextToSize(summaryText, pageWidth - (margin * 2));
    doc.text(splitSummary, margin, y);

    y += splitSummary.length * 6 + 10;

    function renderPDFSection(sectionTitle, accentR, accentG, accentB, text) {
        if (!text) return;
        if (y > pageHeight - 40) {
            addFooter(doc, pageWidth, pageHeight, fileName);
            doc.addPage();
            y = 25;
        }
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(15, 23, 42);
        doc.text(sectionTitle, margin, y);
        doc.setDrawColor(accentR, accentG, accentB);
        doc.setLineWidth(1);
        doc.line(margin, y + 2, margin + 20, y + 2);
        y += 12;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(30, 30, 30);
        const lines = doc.splitTextToSize(text, pageWidth - (margin * 2));
        lines.forEach(line => {
            if (y > pageHeight - 25) {
                addFooter(doc, pageWidth, pageHeight, fileName);
                doc.addPage();
                y = 25;
                doc.setFont("helvetica", "normal");
                doc.setFontSize(10);
                doc.setTextColor(30, 30, 30);
            }
            doc.text(line, margin, y);
            y += 6;
        });
        y += 10;
    }

    const slitherText = report.slitherAnalysis || formatVulnerabilities(report.vulnerabilities);
    renderPDFSection("SLITHER STATIC ANALYSIS", 124, 58, 237, slitherText);
    renderPDFSection("AI ANALYSIS", 0, 82, 255, report.aiAnalysis || "No AI analysis data found.");

    addFooter(doc, pageWidth, pageHeight, fileName);
    doc.save(`${cleanFileName}_Security_Audit_${network}.pdf`);
}

function addFooter(doc, pageWidth, pageHeight, fileName) {
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`AI Auditor Registry ID: ${Math.random().toString(36).substr(2, 9).toUpperCase()}`, 20, pageHeight - 10);
    doc.text(`${fileName} - Page ${doc.internal.getCurrentPageInfo().pageNumber}`, pageWidth - 60, pageHeight - 10);
}

document.getElementById("audit-button").addEventListener("click", runAudit);
document.getElementById("downloadBtn").addEventListener("click", generatePDF);
document.getElementById("mintBadgeBtn").addEventListener("click", mintBadge);