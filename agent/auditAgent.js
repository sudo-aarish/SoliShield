import path from "path";
import runSlither from "./slitherRunner.js";
import parseReport from "./reportParser.js";
import { analyzeWithGemini } from "./aiAnalyzer.js";

export async function audit(contractPath) {
    try{
        const slitherResult = await runSlither(contractPath);
        const findings = parseReport(slitherResult);

        let score = 100;
        score -= findings.length * 10;
        if (score < 0) score = 0;

        const aiAnalysis = await analyzeWithGemini(findings);

        return {
            contract: contractPath,
            vulnerabilities: findings,
            securityScore: score,
            aiAnalysis
        };
    }
    catch(error){
        console.error("Audit failed:", error);

        return {
            contract: contractPath,
            vulnerabilities: [],
            securityScore: 0,
            aiAnalysis: "AI analysis unavailable."
        };
    }
}